# Data Model: Seller Shop Profile

## Entity: User (Extended)

**Collection**: `users` (existing, extended with Shop sub-document)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | PK, Auto | MongoDB primary key |
| `email` | string | Unique, Index, Email format | Login identifier |
| `passwordHash` | string | Required | bcrypt hash (12 rounds) |
| `fullName` | string | Required, 2-100 chars | Display name |
| `phone` | string | VN format `^(\+84\|0)[0-9]{9,10}$` | Required for shop setup |
| `address` | string | Optional | Delivery address |
| `role` | enum | `customer` \| `admin` | Default: `customer` |
| `isActive` | boolean | Default: `true` | `false` = banned |
| `refreshTokenHash` | string | SHA-256 of refresh token | For token rotation |
| `version` | number | Default: `0` | Optimistic locking |
| `shop` | sub-doc | See Shop schema | Nullable |
| `createdAt` | DateTime | Auto | |
| `updatedAt` | DateTime | Auto | |

**Indexes**:
- `email` (unique)
- `shop.shopSlug` (unique, sparse — only when shop exists)
- `role`
- `isActive`

---

## Entity: Shop (Sub-document on User)

**Embedded in**: `users.shop`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `shopName` | string | Required, 3-50 chars, trim | Display name (non-unique) |
| `shopSlug` | string | Required, Unique, URL-friendly | Auto-generated from shopName |
| `pickupAddress` | string | Required, min 10 chars, trim | Free-text pickup location |
| `joinedAt` | DateTime | Immutable, set on first setup | Shop activation timestamp |

**Validation Rules** (BR-SELL-001 to 005):
- `shopName`: `string().min(3).max(50).trim()`
- `pickupAddress`: `string().min(10).trim()`
- `phone` (on User): `string().matches(/^(\+84|0)[0-9]{9,10}$/)`
- All three fields required together for initial setup
- `shopSlug` generation: lowercase, spaces/special → `-`, trim multiple `-`, collision → append `-N`

---

## Entity: Product (Reference — Existing)

**Collection**: `products` (unchanged, used for productCount query)

**Relevant Fields for Shop**:
- `sellerId` (ObjectId, ref: User._id, Index)
- `isActive` (boolean, default: true)
- `isBlocked` (boolean, default: false)
- `blockReason` (string, enum: `seller_banned` \| `policy_violation` \| ...)

**Query for productCount** (BR-SELL-007):
```javascript
db.products.countDocuments({
  sellerId: sellerId,
  isActive: true,
  isBlocked: false
})
```

---

## Relationships

```
User (1) ───|| (1) Shop
User (1) ───o< (N) Product [sellerId]
Admin (User) ── Ban ──> User [isActive = false]
```

---

## State Machine: Shop Lifecycle

| State | Trigger | Next State |
|-------|---------|------------|
| `NoShop` (shop = null) | User submits valid shop setup | `ShopActive` |
| `ShopActive` | Admin bans user (isActive=false) | `ShopBlocked` |
| `ShopBlocked` | Admin unbans user (isActive=true) | `ShopActive` |
| `ShopActive` / `ShopBlocked` | User deletes account | `ShopDeleted` (cascade) |

---

## DTOs (Data Transfer Objects)

### GetProfileResponse
```typescript
interface GetProfileResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    address: string;
    role: 'customer' | 'admin';
    isActive: boolean;
    shop: ShopInfo | null;
  };
}

interface ShopInfo {
  shopName: string;
  shopSlug: string;
  pickupAddress: string;
  joinedAt: string; // ISO 8601
}
```

### UpdateProfileRequest
```typescript
interface UpdateProfileRequest {
  fullName?: string; // 2-100 chars
  phone?: string;    // VN format
  address?: string;
}
```

### SetupShopRequest
```typescript
interface SetupShopRequest {
  shopName: string;        // 3-50 chars
  pickupAddress: string;   // min 10 chars
  phone: string;           // VN format (also updates user.phone)
}
```

### PublicShopResponse
```typescript
interface PublicShopResponse {
  shopName: string;
  shopSlug: string;
  joinedAt: string;      // ISO 8601
  productCount: number;  // active & non-blocked only
}
```

---

## Error Responses

| Endpoint | Error Code | Condition |
|----------|------------|-----------|
| `GET /users/me` | 401 | Missing/invalid JWT |
| `GET /users/me` | 403 | User `isActive = false` |
| `PATCH /users/me` | 400 | Validation failed (field errors) |
| `PATCH /users/me` | 401 | Missing/invalid JWT |
| `PATCH /users/me` | 403 | User `isActive = false` |
| `PATCH /users/me/shop` | 400 | Validation failed (specific field errors) |
| `PATCH /users/me/shop` | 409 | Optimistic lock conflict (version mismatch) |
| `PATCH /users/me/shop` | 401 | Missing/invalid JWT |
| `PATCH /users/me/shop` | 403 | User `isActive = false` |
| `GET /shops/:sellerId` | 404 | No shopName OR seller `isActive = false` |
# Quickstart: Seller Shop Profile

## Prerequisites

- Node.js 20+
- pnpm 9+
- MongoDB (local or Atlas)
- Backend: `cd backend && pnpm install`
- Frontend: `cd frontend && pnpm install`

## Environment Variables

```bash
# Backend .env
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-secret
PORT=3000
```

## Run Backend

```bash
cd backend
pnpm run start:dev
# Server runs on http://localhost:3000
```

## Run Frontend

```bash
cd frontend
pnpm run dev
# App runs on http://localhost:5173
```

---

## Validation Scenarios

### 1. Register & Login (Prerequisite)
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@test.com","password":"Pass123!","fullName":"Test Seller"}'

# Login → get accessToken
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@test.com","password":"Pass123!"}'
```

### 2. Get Profile (No Shop Yet)
```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <accessToken>"
# Expected: 200, shop: null
```

### 3. Setup Shop (First Time)
```bash
curl -X PATCH http://localhost:3000/api/v1/users/me/shop \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "shopName": "My Awesome Shop",
    "pickupAddress": "123 Nguyen Van Linh, District 7, HCMC",
    "phone": "0901234567"
  }'
# Expected: 200, shop with shopSlug "my-awesome-shop", joinedAt set
```

### 4. Get Profile (With Shop)
```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <accessToken>"
# Expected: 200, shop populated with shopName, shopSlug, pickupAddress, joinedAt
```

### 5. Update Profile
```bash
curl -X PATCH http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Updated Name","phone":"0987654321"}'
# Expected: 200, updated fields
```

### 6. Update Shop
```bash
curl -X PATCH http://localhost:3000/api/v1/users/me/shop \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "shopName": "Renamed Shop",
    "pickupAddress": "456 Le Van Viet, Thu Duc, HCMC",
    "phone": "0987654321"
  }'
# Expected: 200, updated shopName, pickupAddress, phone
```

### 7. Public Shop View
```bash
curl -X GET http://localhost:3000/api/v1/shops/<sellerObjectId>
# Expected: 200, {shopName, shopSlug, joinedAt, productCount}
```

### 8. Validation Errors
```bash
# Short shopName
curl -X PATCH http://localhost:3000/api/v1/users/me/shop \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"shopName":"ab","pickupAddress":"1234567890","phone":"0901234567"}'
# Expected: 400, error on shopName

# Invalid phone
curl -X PATCH http://localhost:3000/api/v1/users/me/shop \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"shopName":"Valid Name","pickupAddress":"1234567890","phone":"123"}'
# Expected: 400, error on phone
```

### 9. Banned User Flow (Admin)
```bash
# Admin login → get admin token
# Ban user
curl -X PATCH http://localhost:3000/api/v1/admin/users/<sellerId>/ban \
  -H "Authorization: Bearer <adminToken>"

# Public shop should 404
curl -X GET http://localhost:3000/api/v1/shops/<sellerId>
# Expected: 404 "Không tìm thấy gian hàng"

# Unban
curl -X PATCH http://localhost:3000/api/v1/admin/users/<sellerId>/unban \
  -H "Authorization: Bearer <adminToken>"

# Public shop should 200 again
```

---

## Frontend Validation

1. Open http://localhost:5173/register → register → login
2. Click "Đăng bán" → should redirect to `/shop/setup`
3. Fill form with valid data → submit → redirect to `/products/create`
4. Visit `/profile` → see shop info
5. Visit `/shops/<sellerId>` → see public shop view
6. Test validation errors (empty fields, short name, invalid phone)

---

## Test Commands

```bash
# Backend unit tests
cd backend && pnpm test

# Frontend unit tests
cd frontend && pnpm test

# E2E tests
pnpm test:e2e
```

## Success Criteria Checklist

- [ ] All 4 API endpoints return 200 for valid requests
- [ ] Validation errors return 400 with field-specific messages
- [ ] Banned user gets 403 on profile, 404 on public shop
- [ ] shopSlug auto-generated, unique, collision-handled
- [ ] productCount only counts active & non-blocked products
- [ ] Frontend matches Stitch screens (pill buttons, two-canvas, ss03)
- [ ] WCAG 2.1 AA: labels, focus, ARIA live regions for errors
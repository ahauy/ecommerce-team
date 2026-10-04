# Data Model: US-AUTH-001 (auth-register-login)

## 1. Schema: `User` (`users` collection)

Mongoose Schema definition with TypeScript types:

```typescript
export enum UserRole {
  CUSTOMER = "customer",
  ADMIN = "admin",
}

export interface IUser {
  _id: Types.ObjectId;
  email: string; // Lowercase, trimmed, unique index
  password: string; // Bcrypt hash (rounds = 10), excluded from normal projections
  fullName: string; // Required
  phone?: string; // Optional, null until updated
  address?: string; // Optional, null until updated
  role: UserRole; // Default: 'customer'
  isActive: boolean; // Default: true, indexed
  refreshToken?: string; // SHA-256 hash of refresh token
  shopName?: string; // Optional, 3-50 chars
  pickupAddress?: string; // Optional
  createdAt: Date;
  updatedAt: Date;
}
```

### Database Indexes:

1. `email`: `{ email: 1 }` (unique: true)
2. `isActive`: `{ isActive: 1 }`
3. `role`: `{ role: 1 }`

---

## 2. JWT Payload Structures

### Access Token Payload (15m):

```typescript
export interface JwtPayload {
  sub: string; // user._id string
  email: string; // user.email
  role: UserRole; // user.role ('customer' | 'admin')
}
```

### Refresh Token Payload (7d):

```typescript
export interface JwtRefreshPayload {
  sub: string; // user._id string
  tokenVersion?: number;
}
```

---

## 3. Session Cookies

- **Cookie Name**: `refreshToken`
- **Options**:
  - `httpOnly: true` (prevents JavaScript/XSS access)
  - `sameSite: 'lax'`
  - `secure: process.env.NODE_ENV === 'production'`
  - `path: '/api/v1/auth'`
  - `maxAge: 7 * 24 * 60 * 60 * 1000` (7 days in ms)

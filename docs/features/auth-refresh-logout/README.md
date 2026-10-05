# Feature: JWT Refresh Token & Logout (`US-AUTH-002`)

> **User Story:** `US-AUTH-002: JWT Refresh Token & Đăng xuất`  
> **Slug:** `auth-refresh-logout`  
> **Epic:** `EPIC-01: Auth & User`  
> **Status:** Completed (`Done [x]`)

---

## 1. Overview & Business Value

Access Token tồn tại 15 phút. Khi hết hạn, hệ thống tự động xin token mới qua Refresh Token (7 ngày, lưu trong `httpOnly` cookie `Path=/api/v1/auth`) mà không cần người dùng đăng nhập lại. Khi đăng xuất, hash Refresh Token bị xóa khỏi MongoDB và cookie bị clear ngay lập tức.

---

## 2. API Endpoints

### 2.1. Làm mới Access Token

- **Method & Route:** `POST /api/v1/auth/refresh`
- **Auth:** `httpOnly` cookie `refreshToken` (JwtRefreshGuard — `passport-jwt` validates signature)
- **Request Body:** _(none)_
- **Responses:**
  - `200 OK`: `{ "success": true, "data": { "accessToken": "eyJ..." }, "message": "Thành công" }`
  - `401 Unauthorized`: Token không hợp lệ hoặc đã hết hạn

### 2.2. Đăng xuất

- **Method & Route:** `POST /api/v1/auth/logout`
- **Auth:** `Authorization: Bearer <accessToken>` (JwtAuthGuard)
- **Request Body:** _(none)_
- **Responses:**
  - `204 No Content`: Logout thành công; cookie `refreshToken` bị xóa; DB `users.refreshToken = null`
  - `401 Unauthorized`: Access token thiếu hoặc không hợp lệ

---

## 3. Security Design

| Concern               | Solution                                                                   |
| --------------------- | -------------------------------------------------------------------------- |
| Refresh token leak    | Stored as **SHA-256 hash** in MongoDB; raw token only in `httpOnly` cookie |
| Single active session | Each new login overwrites the hash, invalidating prior refresh tokens      |
| Banned user refresh   | `isActive` check in `AuthService.refresh()` → 401 if banned                |
| Cookie scope          | `Path=/api/v1/auth`, `SameSite=Lax`, `Secure=true` in production           |
| Infinite loop         | `isRefreshing` guard + `_retry` flag prevents recursive 401 loops          |

---

## 4. Frontend Integration

### 4.1. Auth Store (`stores/auth.store.ts`)

- `setAccessToken(token)` — updates only the access token (used by interceptor after refresh)
- `clearAuth()` — called on refresh failure → redirect to `/login`

### 4.2. API Client (`services/apiClient.ts`)

All non-auth API calls go through `apiClient`:

- **Request interceptor**: Injects `Authorization: Bearer <accessToken>` from Zustand store
- **Response interceptor** (Option A — `isRefreshing` guard):
  1. `401` received → set `isRefreshing = true`, call `POST /auth/refresh`
  2. Concurrent 401s are **queued** (not retried immediately)
  3. On success: update Zustand token, flush queue with new token, retry original request
  4. On failure: `clearAuth()` + `window.location.href = '/login'`

### 4.3. Logout Flow

```typescript
// In any component/hook:
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

const { clearAuth } = useAuthStore();
await authService.logout(); // calls POST /api/v1/auth/logout (sends accessToken via Authorization header)
clearAuth(); // clear Zustand state
navigate("/login");
```

---

## 5. Testing

### Backend Unit Tests

```bash
cd backend && npm test -- auth-refresh-logout.service.spec.ts
```

| Test   | Case                                                                           |
| ------ | ------------------------------------------------------------------------------ |
| TC-101 | `refresh()` with valid SHA-256 hash → returns `{ accessToken }`                |
| TC-102 | `refresh()` with unknown hash → `UnauthorizedException` (401)                  |
| TC-103 | `refresh()` for banned user (`isActive=false`) → `UnauthorizedException` (401) |
| TC-104 | `logout()` sets `refreshToken = null` in DB + calls `clearCookie()`            |

---

## 6. Files Changed

| File                                                  | Change                                                           |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `backend/src/auth/auth.service.ts`                    | Added `refresh()` + `logout()`; extracted `sha256()` helper      |
| `backend/src/auth/auth.controller.ts`                 | Added `POST /auth/refresh` + `POST /auth/logout` endpoints       |
| `backend/src/auth/strategies/jwt-refresh.strategy.ts` | New — JwtRefreshStrategy (cookie extractor, `passReqToCallback`) |
| `backend/src/auth/guards/jwt-refresh.guard.ts`        | New — `JwtRefreshGuard`                                          |
| `backend/src/auth/auth.module.ts`                     | Registered `JwtRefreshStrategy`                                  |
| `backend/src/users/users.service.ts`                  | Added `findByRefreshTokenHash()`                                 |
| `frontend/src/services/auth.service.ts`               | Added `refresh()` + `logout()`                                   |
| `frontend/src/services/apiClient.ts`                  | New — Axios instance with 401 interceptor + `isRefreshing` queue |
| `frontend/src/stores/auth.store.ts`                   | Added `setAccessToken()` action                                  |

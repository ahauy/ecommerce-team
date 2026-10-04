# 01 - Elicitation Interview Record: US-AUTH-001 (auth-register-login)

- **Feature ID:** `US-AUTH-001`
- **Feature Slug:** `auth-register-login`
- **Interview Conducted:** 2026-10-04
- **Method:** Interactive interview (`grilling` primitive / Stage 2 Elicitation Gate)

---

## 1. Confirmed Interview Decisions

### DEC-AUTH-01: Refresh Token Persistence

- **Decision:** Backend hashes `refreshToken` using SHA-256 and persists it into the `users` document under `refreshToken` field immediately upon successful `POST /api/v1/auth/login`.
- **Rationale:** Aligns with `BR-AUTH-010`. Ensures readiness for `US-AUTH-002` (refresh/logout) and ensures previous refresh tokens on other devices are invalidated upon new login.

### DEC-AUTH-02: Post-Registration User Experience

- **Decision:** After `POST /api/v1/auth/register` returns 201 Created with `{ success: true, data: { userId, email, fullName }, message: "Đăng ký thành công" }`, the client UI automatically redirects the user to `/login` displaying a success notification, requiring explicit login credentials.
- **Rationale:** Enforces clean separation between registration verification and credential-based session establishment.

### DEC-AUTH-03: Token Client Storage & Security Strategy

- **Decision:**
  - `accessToken` is stored in memory via Zustand (`authStore`) on the client.
  - `refreshToken` is set as an `httpOnly` secure cookie (`SameSite=Lax`, `Path=/api/v1/auth`) by the backend during login, preventing XSS access.
  - Backend also returns `accessToken` in the JSON response body.
  - Backend must configure `cookieParser()` and CORS `credentials: true`.

---

## 2. Explicit Assumptions Register (ASM)

- `ASM-AUTH-01`: Email format validation uses RFC 5322 regex / standard `class-validator` `@IsEmail()`. Email must be stored lowercase and trimmed.
- `ASM-AUTH-02`: Password must be at least 8 characters (per `BR-AUTH-008`). Bcrypt salt rounds = 10.
- `ASM-AUTH-03`: Public registration always assigns `role = 'customer'` and `isActive = true`. Role `admin` cannot be registered via API (reserved for seed script per `BR-AUTH-004`).
- `ASM-AUTH-04`: New accounts have `shopName = null`, `pickupAddress = null` until configured via `US-SELL-001`.

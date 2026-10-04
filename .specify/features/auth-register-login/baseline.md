# Domain Baseline: US-AUTH-001 (auth-register-login)

- **Status:** SIGNED-OFF v1.0
- **Feature Slug:** `auth-register-login`
- **Target User Story:** `US-AUTH-001: Đăng ký & Đăng nhập tài khoản`
- **Epic:** `EPIC-01: Auth & User`
- **Effort:** M | Context-budget: single-session | Priority: Must-Have (P0)

---

## 1. Executive Summary & Scope

`US-AUTH-001` implements the initial authentication foundation for the Ecommerce Team multi-seller platform:

- Public account registration (`POST /api/v1/auth/register`) creating active Customer accounts with bcrypt-hashed passwords.
- Secure credential login (`POST /api/v1/auth/login`) issuing short-lived Access Tokens (15m) and setting `httpOnly` secure cookies for Refresh Tokens (7d), while hashing the Refresh Token into MongoDB (SHA-256).
- Ban enforcement preventing banned accounts (`isActive = false`) from authenticating.
- Frontend registration & login UI with Formik/Yup validation and Zustand `authStore` management.

---

## 2. Confirmed Elicitation Decisions

1. **`DEC-AUTH-01` (Refresh Token Hash):** Backend stores SHA-256 hash of refresh token into `users.refreshToken` on each login; previous refresh tokens on other devices are invalidated.
2. **`DEC-AUTH-02` (Post-Register UX):** Registration returns 201 Created and directs user to `/login` with success banner.
3. **`DEC-AUTH-03` (Client Token Storage):** `accessToken` is held in Zustand memory; `refreshToken` is held in `httpOnly` cookie (`Path=/api/v1/auth`, `SameSite=Lax`).

---

## 3. Core Business Rules

- `BR-AUTH-001`: Email unique across users (409 Conflict if duplicate).
- `BR-AUTH-002`: Passwords hashed with bcrypt (cost factor 10). Plaintext never stored or returned.
- `BR-AUTH-003`: Access Token expires in 15m; Refresh Token expires in 7d.
- `BR-AUTH-004`: Public registration always assigns `role = 'customer'`. Admin account created only via seed script.
- `BR-AUTH-007`: Inactive/banned users (`isActive = false`) cannot log in (403 Forbidden).
- `BR-AUTH-008`: Password minimum length is 8 characters.
- `BR-AUTH-009`: Ban takes effect immediately on protected requests via DB check.
- `BR-AUTH-010`: Single active refresh token per user, stored as SHA-256 hash.

---

## 4. User Story Scenarios

- `US-AUTH-001.1`: Đăng ký tài khoản thành công (201 Created -> redirect /login)
- `US-AUTH-001.2`: Đăng ký với email trùng (409 Conflict)
- `US-AUTH-001.3`: Đăng nhập thành công (200 OK + JWT Access Token + httpOnly Refresh Cookie)
- `US-AUTH-001.4`: Đăng nhập sai mật khẩu (401 Unauthorized)
- `US-AUTH-001.5`: Đăng nhập khi tài khoản bị khóa (403 Forbidden)
- `US-AUTH-001.6`: Form validation phía Client (Formik/Yup) và Server (ValidationPipe -> 400 Bad Request)

---

## 5. Won't-Have Fence

- No social logins (Google/Facebook).
- No OTP/2FA via email/SMS.
- No public admin registration endpoint.
- No refresh token rotation / logout endpoint (deferred to `US-AUTH-002`).

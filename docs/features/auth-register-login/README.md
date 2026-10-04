# Feature: Auth Register & Login (`US-AUTH-001`)

> **User Story:** `US-AUTH-001: Đăng ký & Đăng nhập tài khoản`  
> **Slug:** `auth-register-login`  
> **Epic:** `EPIC-01: Auth & User`  
> **Status:** Completed (`Done [x]`)

---

## 1. Overview & Business Value

Tính năng xác thực người dùng cho phép khách vãng lai (Guest) đăng ký tài khoản thành viên (`customer`) và đăng nhập để nhận Access Token (15 phút) cùng Refresh Token (7 ngày) qua `httpOnly` cookie.

### Key Capabilities:

- **Đăng ký (`POST /api/v1/auth/register`)**: Nhận `email`, `password` (tối thiểu 8 ký tự), `fullName`. Mã hóa mật khẩu bằng `bcrypt` (10 rounds). Trả về `201 Created` và redirect sang trang đăng nhập.
- **Đăng nhập (`POST /api/v1/auth/login`)**: Xác thực email và mật khẩu. Trả về `accessToken` và thông tin user trong response body, đồng thời gắn `refreshToken` vào `httpOnly` cookie (`SameSite=Lax`, `Path=/api/v1/auth`).
- **Ngăn chặn tài khoản bị khóa**: Kiểm tra `isActive = true`. Nếu tài khoản bị Admin ban (`isActive = false`), từ chối đăng nhập với `403 Forbidden: "Tài khoản đã bị khóa"`.
- **Bảo mật tức thì (`BR-AUTH-009`)**: `JwtStrategy` kiểm tra trực tiếp trạng thái tài khoản trong MongoDB với mỗi request có Bearer token.
- **Lưu trữ Refresh Token an toàn (`BR-AUTH-010`)**: Chỉ lưu bản băm SHA-256 của refresh token trong MongoDB; mỗi lần đăng nhập mới sẽ vô hiệu hóa refresh token cũ.

---

## 2. API Endpoints

### 2.1. Đăng ký tài khoản

- **Method & Route:** `POST /api/v1/auth/register`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123",
    "fullName": "Nguyễn Văn A"
  }
  ```
- **Responses:**
  - `201 Created`: `{ "success": true, "data": { "userId": "...", "email": "...", "fullName": "..." }, "message": "Thành công" }`
  - `409 Conflict`: `{ "success": false, "message": "Email đã tồn tại trên hệ thống" }`
  - `400 Bad Request`: `{ "success": false, "message": "Validation failed", "errors": [...] }`

### 2.2. Đăng nhập

- **Method & Route:** `POST /api/v1/auth/login`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123"
  }
  ```
- **Responses:**
  - `200 OK`:
    - Header: `Set-Cookie: refreshToken=...; Path=/api/v1/auth; HttpOnly; SameSite=Lax`
    - Body:
      ```json
      {
        "success": true,
        "data": {
          "accessToken": "eyJ...",
          "user": {
            "id": "...",
            "email": "user@example.com",
            "fullName": "Nguyễn Văn A",
            "role": "customer",
            "shopName": null
          }
        },
        "message": "Thành công"
      }
      ```
  - `401 Unauthorized`: `{ "success": false, "message": "Email hoặc mật khẩu không chính xác" }`
  - `403 Forbidden`: `{ "success": false, "message": "Tài khoản đã bị khóa" }`

---

## 3. Frontend Integration

- **State Management**: Zustand `authStore` (`frontend/src/stores/auth.store.ts`) lưu `accessToken` và `user` trong bộ nhớ client.
- **Service Layer**: `authService` (`frontend/src/services/auth.service.ts`) gọi backend với `withCredentials: true`.
- **Pages**:
  - `Register` (`/register`): Formik + Yup validation, thông báo Toast, tự động điều hướng sang `/login`.
  - `Login` (`/login`): Formik + Yup validation, lưu auth state, liên kết "Đăng ký ngay".

---

## 4. Verification & Testing

### Backend Unit Tests

```bash
cd backend && npm test -- auth.service.spec.ts
```

- TC-001: Register user successfully (happy path)
- TC-002: Register duplicate email throws ConflictException (409)
- TC-003: Login with correct credentials issues tokens, hashes refresh token, sets cookie
- TC-004: Login with incorrect password / user not found throws UnauthorizedException (401)
- TC-005: Login with banned account throws ForbiddenException (403)

### Backend E2E Tests

```bash
cd backend && npm run test:e2e -- auth.e2e-spec.ts
```

- TC-010: POST /api/v1/auth/register creates user and returns 201
- TC-011: POST /api/v1/auth/login sets cookie and returns 200 with accessToken
- TC-012: POST /api/v1/auth/register fails validation on password < 8 chars (400)
- TC-013: POST /api/v1/auth/register with duplicate email returns 409 Conflict
- TC-014: POST /api/v1/auth/login with wrong password returns 401

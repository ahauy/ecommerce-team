# Specification — US-AUTH-002 (auth-refresh-logout)

## Business Requirements Document (BRD)

### BR-AUTH-007 — Access Token TTL
**Description:** Access tokens expire after 15 minutes.
**Derived from:** AC `accessToken` 15m expiry
**Priority:** Must Have

### BR-AUTH-008 — Refresh Token TTL
**Description:** Refresh tokens expire after 7 days.
**Derived from:** AC `refreshToken` 7d expiry
**Priority:** Must Have

### BR-AUTH-009 — Refresh Token Hashing
**Description:** Refresh tokens are stored as SHA-256 hashes in MongoDB, never in plain text.
**Derived from:** Security best practice + code implementation
**Priority:** Must Have

### BR-AUTH-010 — Cookie Transport
**Description:** Refresh tokens transported via httpOnly cookie scoped to `/api/v1/auth`.
**Derived from:** AC + security design
**Priority:** Must Have

### BR-AUTH-011 — Banned User Block on Refresh
**Description:** Users with `isActive=false` receive 401 on refresh attempts.
**Derived from:** AC login 403 + elicitation Q1
**Priority:** Must Have

### BR-AUTH-012 — Logout Clears State
**Description:** Logout clears refresh token hash in DB and removes httpOnly cookie.
**Derived from:** AC logout behavior
**Priority:** Must Have

### BR-AUTH-013 — Auto-Refresh on 401
**Description:** Frontend automatically retries failed requests after successful token refresh.
**Derived from:** AC Axios interceptor behavior
**Priority:** Must Have

### BR-AUTH-014 — Refresh Failure → Redirect Login
**Description:** Failed token refresh clears auth state and redirects to login page.
**Derived from:** AC refresh failure handling
**Priority:** Must Have

### BR-AUTH-015 — Single Active Session
**Description:** Each new login overwrites the previous refresh token hash, invalidating prior sessions.
**Derived from:** Elicitation Q3
**Priority:** Must Have

---

## Product Requirements Document (PRD)

### Feature: JWT Refresh Token & Logout
**Epic:** EPIC-01: Auth & User
**User Story:** US-AUTH-002
**Status:** Ready for Implementation (BA Baseline SIGNED-OFF)

### Functional Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-01 | POST /auth/refresh with valid cookie → 200 + new accessToken | BR-AUTH-007, BR-AUTH-009, BR-AUTH-010 |
| FR-02 | POST /auth/refresh with invalid/expired cookie → 401 | BR-AUTH-008, BR-AUTH-009 |
| FR-03 | POST /auth/refresh for banned user → 401 | BR-AUTH-011 |
| FR-04 | POST /auth/logout with valid accessToken → 204, clears cookie + DB hash | BR-AUTH-012 |
| FR-05 | Frontend interceptor catches 401 → calls refresh → retries original | BR-AUTH-013 |
| FR-06 | Refresh failure → clear Zustand auth + redirect /login | BR-AUTH-014 |
| FR-07 | New login overwrites existing refresh token hash | BR-AUTH-015 |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Refresh endpoint latency | < 100ms p99 |
| NFR-02 | No infinite refresh loops | Guarded by `_retry` + `isRefreshing` |
| NFR-03 | Secure cookie settings | httpOnly, Secure (prod), SameSite=Lax |
| NFR-04 | Token never in response body | Refresh token only in cookie |

---

## Software Requirements Specification (SRS)

### API Contracts

#### POST /api/v1/auth/refresh
- **Guard:** `JwtRefreshGuard` (cookie extractor)
- **Request:** None (reads `refreshToken` from cookie)
- **Success (200):**
```json
{
  "success": true,
  "data": { "accessToken": "eyJhbGciOiJIUzI1NiIs..." },
  "message": "Thành công"
}
```
- **Errors:**
  - 401: `{ "success": false, "message": "Refresh token không hợp lệ hoặc đã hết hạn" }`

#### POST /api/v1/auth/logout
- **Guard:** `JwtAuthGuard` (Bearer token)
- **Request:** None
- **Success (204):** No content
- **Errors:**
  - 401: `{ "success": false, "message": "Unauthorized" }`

### Data Model

**User Document (MongoDB):**
```typescript
interface UserDocument {
  _id: ObjectId;
  email: string;           // unique, lowercase
  password: string;        // bcrypt hash
  fullName: string;
  role: 'customer' | 'admin';
  isActive: boolean;       // default true
  refreshToken: string | null;  // SHA-256 hash
  shopName: string | null;
  pickupAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Frontend Components

| Component | Responsibility |
|-----------|----------------|
| `authService.refresh()` | Calls POST /auth/refresh |
| `authService.logout()` | Calls POST /auth/logout |
| `apiClient` (interceptor) | Injects Bearer token; handles 401 auto-refresh |
| `useAuthStore` (Zustand) | Holds `user`, `accessToken`, `isLogged`; actions: `setAuth`, `setAccessToken`, `clearAuth` |

---

## User Stories (Gherkin)

### US-AUTH-002: JWT Refresh Token & Đăng xuất

**Story:** Với tư cách là người dùng đã đăng nhập, tôi muốn access token tự động được làm mới khi hết hạn để tôi không phải đăng nhập lại liên tục.

#### Scenario 1: Happy Path — Token Refresh
```gherkin
Given tôi đã đăng nhập và có accessToken + refreshToken hợp lệ
And tôi đợi 15 phút cho accessToken hết hạn
When tôi gọi API bất kỳ (ví dụ GET /api/v1/users/me)
Then backend trả về 401 Unauthorized
And frontend interceptor tự động gọi POST /auth/refresh
And refresh thành công trả về accessToken mới
And request gốc được retry với accessToken mới
And tôi nhận được response thành công (200)
```

#### Scenario 2: Refresh Token Expired/Invalid
```gherkin
Given tôi có refreshToken đã hết hạn (quá 7 ngày) hoặc không hợp lệ
When frontend interceptor gọi POST /auth/refresh
Then backend trả về 401
And frontend xóa toàn bộ auth state (Zustand)
And frontend redirect về trang /login
```

#### Scenario 3: Banned User Cannot Refresh
```gherkin
Given tôi đã đăng nhập và có refreshToken hợp lệ
And admin set isActive = false cho tài khoản của tôi
When frontend interceptor gọi POST /auth/refresh
Then backend kiểm tra isActive=false và trả về 401
And frontend xóa auth state và redirect /login
```

#### Scenario 4: Logout Clears Session
```gherkin
Given tôi đang đăng nhập
When tôi bấm nút "Đăng xuất" (gọi POST /auth/logout)
Then backend xóa refreshToken hash trong DB
And backend clear cookie refreshToken
And frontend xóa Zustand auth state
And tôi được redirect về /login
```

#### Scenario 5: New Login Invalidates Old Session
```gherkin
Given tôi đăng nhập trên thiết bị A (có refreshToken A)
When tôi đăng nhập trên thiết bị B (login thành công)
Then thiết bị A không còn refresh được token (hash đã bị ghi đè)
And thiết bị A accessToken hết hạn sau 15 phút sẽ bị buộc logout
```

---

## Traceability Matrix

| Business Goal | BR ID | FR ID | US Scenario | Test Case |
|---------------|-------|-------|-------------|-----------|
| Seamless session | BR-AUTH-007,008 | FR-01 | Scenario 1 | TC-101 |
| Security: token protection | BR-AUTH-009,010 | FR-01 | Scenario 1 | TC-101 |
| Banned user enforcement | BR-AUTH-011 | FR-03 | Scenario 3 | TC-103 |
| Explicit logout | BR-AUTH-012 | FR-04 | Scenario 4 | TC-104 |
| UX: no manual re-login | BR-AUTH-013 | FR-05 | Scenario 1 | E2E |
| UX: failed refresh → login | BR-AUTH-014 | FR-06 | Scenario 2 | E2E |
| Single session | BR-AUTH-015 | FR-07 | Scenario 5 | E2E |

---

## Test Plan Reference

See `test-plan.md` for detailed test cases mapping (TC-101..104 + E2E scenarios).

## Next Stage
Proceed to **spec-validator** (Stage 7)
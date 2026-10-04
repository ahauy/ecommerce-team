# Test Plan: US-AUTH-001 (auth-register-login)

**Feature slug**: `auth-register-login`  
**Baseline version**: 1.0 (SIGNED-OFF)  
**Traces to**: `.specify/features/auth-register-login/spec/user-stories.md`

---

## Unit Tests

### `AuthService` (`backend/src/auth/auth.service.spec.ts`)

#### TC-001: Register user successfully (Happy Path)

```gherkin
Given a valid registration payload with email "new@example.com", password "Pass12345", fullName "Test User"
When  authService.register(dto) is called
Then  it hashes password with bcrypt
  And saves user with role="customer" and isActive=true
  And returns { userId, email, fullName } without password
```

- **Priority**: P1 (Must-Have)
- **Traces to**: `US-AUTH-001.1`

#### TC-002: Register with existing email throws ConflictException (409)

```gherkin
Given an email that already exists in database
When  authService.register(dto) is called
Then  it throws ConflictException with message "Email đã tồn tại trên hệ thống"
```

- **Priority**: P1 (Must-Have)
- **Traces to**: `US-AUTH-001.2`

#### TC-003: Login with correct credentials issues tokens and hashes refresh token (Happy Path)

```gherkin
Given a user with email "user@example.com", valid password "Pass12345", isActive=true
When  authService.login(dto, res) is called
Then  it validates password with bcrypt.compare
  And signs access token (15m) and refresh token (7d)
  And hashes refresh token with SHA-256 and updates user in DB
  And sets httpOnly cookie on response
  And returns { accessToken, user }
```

- **Priority**: P1 (Must-Have)
- **Traces to**: `US-AUTH-001.3`

#### TC-004: Login with incorrect password throws UnauthorizedException (401)

```gherkin
Given an existing user but invalid password
When  authService.login(dto, res) is called
Then  it throws UnauthorizedException with message "Email hoặc mật khẩu không chính xác"
```

- **Priority**: P1 (Must-Have)
- **Traces to**: `US-AUTH-001.4`

#### TC-005: Login with banned account throws ForbiddenException (403)

```gherkin
Given an existing user with isActive=false
When  authService.login(dto, res) is called
Then  it throws ForbiddenException with message "Tài khoản đã bị khóa"
```

- **Priority**: P1 (Must-Have)
- **Traces to**: `US-AUTH-001.5`

---

## Integration / E2E Tests (`backend/test/auth.e2e-spec.ts`)

#### TC-010: POST /api/v1/auth/register creates user and returns 201

```gherkin
Given NestJS app is initialized with MongoDB Atlas
When  POST /api/v1/auth/register is sent with valid payload
Then  HTTP status is 201
  And response has { success: true, data: { userId, email, fullName }, message: "Đăng ký thành công" }
```

- **Priority**: P1
- **Traces to**: `US-AUTH-001.1`

#### TC-011: POST /api/v1/auth/login sets cookie and returns 200 with accessToken

```gherkin
Given a registered user exists
When  POST /api/v1/auth/login is sent with valid credentials
Then  HTTP status is 200
  And response body contains accessToken and user details
  And Set-Cookie header contains "refreshToken=...; HttpOnly"
```

- **Priority**: P1
- **Traces to**: `US-AUTH-001.3`

#### TC-012: POST /api/v1/auth/register fails validation on short password (400)

```gherkin
Given registration payload with password < 8 characters
When  POST /api/v1/auth/register is sent
Then  HTTP status is 400
  And response has { success: false, message: "Validation failed", errors: [...] }
```

- **Priority**: P1
- **Traces to**: `US-AUTH-001.6`

---

## Test Coverage Checklist

- [x] US-AUTH-001.1 (Register happy path) -> TC-001, TC-010
- [x] US-AUTH-001.2 (Register conflict 409) -> TC-002
- [x] US-AUTH-001.3 (Login happy path) -> TC-003, TC-011
- [x] US-AUTH-001.4 (Login wrong password 401) -> TC-004
- [x] US-AUTH-001.5 (Login banned 403) -> TC-005
- [x] US-AUTH-001.6 (Validation 400) -> TC-012

# Feature Specification: US-AUTH-001 (auth-register-login)

**Feature Branch**: `feat/auth-register-login`  
**Created**: 2026-10-04  
**Status**: Approved Domain Baseline (`SIGNED-OFF v1.0`)  
**Input**: [baseline.md](file:///Users/vutuanhau/Documents/PROJECT/ecommerce-team/.specify/features/auth-register-login/baseline.md)

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Public Registration (Priority: P1) 🎯 MVP

As a new visitor (Guest), I want to create an account with my email, password, and full name so that I can participate in the marketplace as a Customer.

- **Why this priority**: Required for any authenticated activity (buying, setting up shop, selling).
- **Independent Test**: Call `POST /api/v1/auth/register` with valid payload, verify 201 Created and user document in MongoDB with hashed password.

**Acceptance Scenarios**:

1. **Given** a new email `test@example.com` and password `Password123`, **When** submitting the registration form or endpoint, **Then** return 201 Created with `{ success: true, data: { userId, email, fullName }, message: "Đăng ký thành công" }`.
2. **Given** an existing email, **When** submitting registration with that email, **Then** return 409 Conflict with `{ success: false, message: "Email đã tồn tại trên hệ thống" }`.
3. **Given** an invalid payload (missing fields or password < 8 characters), **When** submitting, **Then** return 400 Bad Request with validation errors.

---

### User Story 2 - User Login & Token Issuance (Priority: P1) 🎯 MVP

As a registered Customer or Admin, I want to authenticate with email and password so that I receive credentials to make authenticated requests.

- **Why this priority**: Core security boundary providing Access Token and Refresh Token session.
- **Independent Test**: Call `POST /api/v1/auth/login` with correct credentials, verify 200 OK with `accessToken`, `user` object in body, `httpOnly` cookie set for `refreshToken`, and SHA-256 hash persisted in database.

**Acceptance Scenarios**:

1. **Given** valid credentials for an active account, **When** submitting `POST /api/v1/auth/login`, **Then** return 200 OK with `accessToken`, `user` (`id`, `email`, `fullName`, `role`, `shopName`), set `refreshToken` in `httpOnly` cookie, and update `users.refreshToken` in DB.
2. **Given** wrong password or non-existent email, **When** submitting login, **Then** return 401 Unauthorized with `{ success: false, message: "Email hoặc mật khẩu không chính xác" }`.
3. **Given** an account where `isActive = false` (banned), **When** attempting login, **Then** return 403 Forbidden with `{ success: false, message: "Tài khoản đã bị khóa" }`.

---

### User Story 3 - Client Authentication State & Forms (Priority: P2)

As a frontend user, I want clear registration and login pages with immediate validation feedback and proper session management.

- **Why this priority**: Essential user experience for web access to the marketplace.
- **Independent Test**: Access `/register` and `/login` in browser, submit valid/invalid data, observe form errors and successful redirection.

**Acceptance Scenarios**:

1. **Given** the `/register` page, **When** user enters valid details and registers, **Then** redirect to `/login` with success alert.
2. **Given** the `/login` page, **When** user logs in successfully, **Then** save `accessToken` in Zustand `authStore` memory and navigate to home `/`.

---

## Edge Cases

- **Concurrent Duplicate Registration**: Handled via MongoDB unique index on `email` catching error code 11000 and converting to 409 Conflict.
- **Banned User Token Revocation**: `JwtStrategy` performs database lookup on each authenticated request to ensure `isActive: true`.
- **Cross-Site Cookie Handling**: Local development uses `SameSite=Lax`, `Secure=false`, with NestJS CORS `credentials: true`.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide `POST /api/v1/auth/register` accepting `email`, `password`, `fullName`.
- **FR-002**: System MUST hash passwords using bcrypt (rounds = 10) before persisting in MongoDB.
- **FR-003**: System MUST provide `POST /api/v1/auth/login` returning 15-minute Access Token and setting 7-day Refresh Token `httpOnly` cookie.
- **FR-004**: System MUST store SHA-256 hash of the current refresh token in `users.refreshToken` (BR-AUTH-010).
- **FR-005**: System MUST forbid login for banned accounts (`isActive: false`) with 403 Forbidden.
- **FR-006**: System MUST enforce minimum 8 characters for password and standard email formatting.
- **FR-007**: Frontend MUST implement `/register` and `/login` pages using Formik + Yup and Tailwind / shadcn/ui.
- **FR-008**: Frontend MUST provide `authStore` (Zustand) managing in-memory `accessToken` and user object.

---

## Success Criteria _(mandatory)_

- **SC-001**: Unit test coverage for AuthService > 90% covering all acceptance scenarios.
- **SC-002**: End-to-end API test verifying register -> login flow returns valid JWT and expected headers/cookies.
- **SC-003**: Frontend builds cleanly with zero TypeScript errors and form validation displays for invalid inputs.

# Tasks: US-AUTH-001 (auth-register-login)

**Feature**: `US-AUTH-001: Đăng ký & Đăng nhập tài khoản`  
**Prerequisites**: [spec.md](file:///Users/vutuanhau/Documents/PROJECT/ecommerce-team/.specify/features/auth-register-login/spec.md), [plan.md](file:///Users/vutuanhau/Documents/PROJECT/ecommerce-team/.specify/features/auth-register-login/plan.md), [data-model.md](file:///Users/vutuanhau/Documents/PROJECT/ecommerce-team/.specify/features/auth-register-login/data-model.md)

---

## Phase 1: Foundational Setup

- [x] T001 Install auth & cookie dependencies in backend (`@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcryptjs`, `@types/bcryptjs`, `@types/passport-jwt`, `cookie-parser`, `@types/cookie-parser`)
- [x] T002 Configure `cookie-parser` middleware in `backend/src/main.ts`

---

## Phase 2: User Schema & UsersModule (Data Seam)

- [x] T003 [P] Implement `User` Mongoose schema in `backend/src/users/schemas/user.schema.ts` (with unique `email`, indexed `isActive`, `refreshToken` hash)
- [x] T004 Implement `UsersService` in `backend/src/users/users.service.ts` (`findByEmail`, `create`, `findById`, `updateRefreshToken`)
- [x] T005 Implement and export `UsersModule` in `backend/src/users/users.module.ts`

---

## Phase 3: Backend Auth API & TDD (US1: Register, US2: Login)

- [x] T006 [P] Create DTOs with `class-validator`: `RegisterDto` and `LoginDto` in `backend/src/auth/dto/`
- [x] T007 [US1, US2] Write unit tests for `AuthService` in `backend/src/auth/auth.service.spec.ts` (Red: register, duplicate email 409, login valid, login invalid 401, login banned 403)
- [x] T008 [US1, US2] Implement `AuthService` in `backend/src/auth/auth.service.ts` (bcrypt hashing, JWT access token, SHA-256 refresh hashing, cookie attachment)
- [x] T009 [US1, US2] Implement `JwtStrategy` in `backend/src/auth/strategies/jwt.strategy.ts` (extracting token, validating `isActive` in DB) and `JwtAuthGuard`
- [x] T010 [US1, US2] Implement `AuthController` in `backend/src/auth/auth.controller.ts` with `POST /register` (201) and `POST /login` (200 + cookie)
- [x] T011 Register `AuthModule` and `UsersModule` in `backend/src/app.module.ts`
- [x] T012 Write integration/E2E test suite in `backend/test/auth.e2e-spec.ts`

---

## Phase 4: Frontend Auth Pages & State (US3)

- [x] T013 [P] Implement `authStore` (Zustand) in `frontend/src/stores/auth.store.ts` for managing `accessToken` and user state
- [x] T014 [P] Implement `authService` in `frontend/src/services/auth.service.ts` using Axios with `withCredentials: true`
- [x] T015 Implement `RegisterPage` with Formik/Yup in `frontend/src/pages/Register.tsx`
- [x] T016 Implement `LoginPage` with Formik/Yup in `frontend/src/pages/Login.tsx`
- [x] T017 Register auth routes (`/login`, `/register`) in `frontend/src/App.tsx`

---

## Phase 5: Verification & Polish

- [x] T018 Run backend unit & E2E tests (`npm test`, `npm run test:e2e`)
- [x] T019 Run lint & format across backend and frontend

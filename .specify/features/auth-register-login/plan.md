# Implementation Plan: US-AUTH-001 (auth-register-login)

**Branch**: `feat/auth-register-login` | **Date**: 2026-10-04 | **Spec**: [spec.md](file:///Users/vutuanhau/Documents/PROJECT/ecommerce-team/.specify/features/auth-register-login/spec.md)

---

## 1. Summary

Implement public registration and authentication for `US-AUTH-001`:

1. **Backend**:
   - Install required packages: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcryptjs`, `cookie-parser`, and corresponding types.
   - Configure `cookie-parser` in `main.ts`.
   - Implement `User` Mongoose Schema (`backend/src/users/schemas/user.schema.ts`).
   - Implement `UsersModule` and `UsersService` for database operations.
   - Implement `AuthModule`, `AuthService`, and `AuthController`:
     - `POST /api/v1/auth/register` (validate DTO, hash password with bcrypt, persist user, return 201).
     - `POST /api/v1/auth/login` (validate credentials, verify `isActive`, issue JWT access token, issue refresh token, hash SHA-256 into DB, attach `httpOnly` cookie, return 200).
     - `JwtStrategy` checking token validity and active status in MongoDB.
2. **Frontend**:
   - `authStore` (Zustand) managing in-memory `accessToken` and user object.
   - Axios client configuration supporting `withCredentials: true` and `Authorization: Bearer <token>`.
   - `/register` page with Formik + Yup validation.
   - `/login` page with Formik + Yup validation.

---

## 2. Technical Context

- **Language**: TypeScript 5.7+ (Strict Mode)
- **Backend Framework**: NestJS 11 + Mongoose 11
- **Frontend Framework**: React 18 + Vite + Tailwind CSS + shadcn/ui + Zustand + Axios + Formik + Yup
- **Database**: MongoDB (Atlas / local replica set)
- **Token Specifications**:
  - Access Token: 15 minutes, RS256 or HS256 (HS256 with `JWT_ACCESS_SECRET`)
  - Refresh Token: 7 days, HS256 with `JWT_REFRESH_SECRET`, SHA-256 hash stored in DB
- **Testing**: Jest unit tests for `AuthService` and `UsersService`, E2E tests for `/auth/register` and `/auth/login`.

---

## 3. Project Structure & File Layout

```text
backend/src/
├── users/
│   ├── schemas/user.schema.ts
│   ├── users.module.ts
│   └── users.service.ts
└── auth/
    ├── dto/
    │   ├── register.dto.ts
    │   └── login.dto.ts
    ├── strategies/
    │   └── jwt.strategy.ts
    ├── guards/
    │   └── jwt-auth.guard.ts
    ├── auth.controller.ts
    ├── auth.service.ts
    └── auth.module.ts

frontend/src/
├── stores/
│   └── auth.store.ts
├── services/
│   └── auth.service.ts
└── pages/
    ├── RegisterPage.tsx
    └── LoginPage.tsx
```

---

## 4. Seam Discipline & Architecture Principles (Ousterhout Deep Modules)

- **Deep AuthService**: Encapsulates bcrypt hashing, token generation, SHA-256 refresh hashing, and cookie attachment behind simple interfaces (`register(dto)`, `login(dto, res)`).
- **UsersService Data Seam**: Hides raw MongoDB Mongoose queries behind repository-style methods (`findByEmail`, `create`, `findById`, `updateRefreshToken`).
- **Zero Leaky Password**: Mongoose schema uses `select: false` or DTO serialization to ensure password hash is never exposed to controllers or clients.

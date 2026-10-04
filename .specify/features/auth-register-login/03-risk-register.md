# 03 - Risk Register & MoSCoW Scope: US-AUTH-001 (auth-register-login)

## 1. Risk Register

| Risk ID          | Description                                                                         | Severity | Likelihood | Mitigation Strategy                                                                                                                         |
| :--------------- | :---------------------------------------------------------------------------------- | :------: | :--------: | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **RISK-AUTH-01** | Duplicate email race condition during simultaneous registration requests            |  Medium  |    Low     | Unique sparse/regular index on `users.email` in MongoDB + handle Mongo error code 11000 in service/exception filter to return 409 Conflict. |
| **RISK-AUTH-02** | Plaintext password leak in logging or response serialization                        |   High   |    Low     | Explicitly exclude `password` from User schema default queries / projections, or sanitize in DTO response mapping.                          |
| **RISK-AUTH-03** | Cookie SameSite / CORS issues across local frontend (`:5173`) and backend (`:3000`) |  Medium  |   Medium   | Set CORS `credentials: true` and cookie `sameSite: 'lax'`, `secure: false` in development mode.                                             |
| **RISK-AUTH-04** | User locked/banned while keeping valid Access Token                                 |   High   |    Low     | Enforce DB status lookup in `JwtStrategy` (BR-AUTH-009) to ensure instant ban effectiveness.                                                |

---

## 2. MoSCoW Scope Lock

### Must-Have (MVP for US-AUTH-001)

- [x] Schema `User` with Mongoose with unique index on `email`, bcrypt hashed `password`.
- [x] Endpoint `POST /api/v1/auth/register` returning 201 Created and user info (without password).
- [x] Endpoint `POST /api/v1/auth/login` returning 200 OK with `accessToken`, `user` object, setting `httpOnly` cookie for `refreshToken`, and storing SHA-256 hash in DB.
- [x] Proper HTTP error statuses: 409 (duplicate email), 400 (validation fail), 401 (invalid credentials), 403 (inactive/banned account).
- [x] Frontend form validation on `/register` and `/login` (Yup/Formik schema, error displays).
- [x] Zustand `authStore` maintaining `accessToken` in memory and user profile state.

### Won't-Have (Explicitly Out of Scope for US-AUTH-001)

- ❌ Role assignment endpoint (admin created only via seed).
- ❌ Social Login (Google, Facebook, GitHub).
- ❌ Multi-factor Authentication (2FA/OTP via SMS/Email).
- ❌ Email verification links / activation emails.
- ❌ Password reset / forgot password flow.
- ❌ Token refresh and logout endpoints (deferred to `US-AUTH-002`).

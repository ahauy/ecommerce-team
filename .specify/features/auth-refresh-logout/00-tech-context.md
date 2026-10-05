# Tech Context — US-AUTH-002

**Source:** `docs/PRODUCT_BACKLOG_ROADMAP.md` (schema-version 1.3)

## Tech Stack

| Layer        | Technology                                                                                     |
| :----------- | :--------------------------------------------------------------------------------------------- |
| Language     | TypeScript                                                                                     |
| Backend      | NestJS + Mongoose ODM                                                                          |
| Frontend     | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Zustand + TanStack Query + React Router v6 + Axios + Formik/Yup |
| Database     | MongoDB                                                                                        |
| Infra        | Local dev (MongoDB local / Atlas) + Cloudinary + VNPay Sandbox                                 |
| Test         | Jest (unit) + Playwright (E2E)                                                                 |

## Git Mode

- `team` — standard branching with PR reviews

## Feature Context

- **US ID:** `US-AUTH-002`
- **Slug:** `auth-refresh-logout`
- **Effort:** S (Small)
- **Context-budget:** single-session
- **Priority:** Must-Have (P0)
- **Depends-on:** `US-AUTH-001` (completed)
- **Blocks:** _(none)_

## Architecture Notes

- Backend: NestJS modular architecture with Guards, Strategies, Interceptors
- Auth: JWT access (15m) + Refresh token (7d, httpOnly cookie, SHA-256 hashed in DB)
- Frontend: Axios interceptor with `isRefreshing` queue for auto-refresh on 401
- State: Zustand for auth token management
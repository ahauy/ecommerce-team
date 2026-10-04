# Intake Classification — US-AUTH-001: Đăng ký & Đăng nhập tài khoản

- **Feature ID:** `US-AUTH-001`
- **Feature Slug:** `auth-register-login`
- **Title:** Đăng ký & Đăng nhập tài khoản
- **Effort:** M
- **Context-budget:** single-session
- **Priority:** Must-Have (P0)
- **Depends-on:** (none)
- **Blocks:** `US-AUTH-002`, `US-SELL-001`, `US-CAT-001`, `US-PRD-001`, `US-CART-001`, `US-ORD-001`, `US-ADM-001`

---

## 1. Classification Rationale

- **Classification:** `Bounded Task`
- **Signals:**
  - Touches 2 primary endpoints: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`.
  - Introduces `users` collection schema in Mongoose with bcrypt hashing and JWT generation.
  - Requires frontend auth form components (`RegisterPage`, `LoginPage`) and token storage (`authStore`).
  - Scoped to single session, well-defined domain boundaries in `docs/project-ecommerce/`.

## 2. BA Pipeline Routing

- **Stage 1 (Intake Classifier):** Complete.
- **Stage 2 (Elicitation Interview Gate):** Interactive grilling (1 batch: 2–3 questions on touched domain pillars).
- **Stage 3 (Gap Analysis):** SKIPPED (Bounded Task protocol per AGENTS.md).
- **Stage 4 (Domain Modeling & Light Spec):** Light pass (RBAC, User State Machine, Business Rules, ERD).
- **Stage 5 (Risk & Contradiction Scanner):** Light risk register & MoSCoW lock.
- **Stage 6 (Spec Writer):** User stories with Given-When-Then scenarios.
- **Stage 7 (Spec Validator):** IEEE 29148 checks.
- **Stage 8 (Handover):** Compile `baseline.md` -> Confirmation Gate 1.

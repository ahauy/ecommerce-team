# Domain Decision Baseline — US-AUTH-002 (auth-refresh-logout)

**Version:** 1.0
**Status:** SIGNED-OFF v1.0
**Date:** 2026-10-05
**Author:** Business Analyst (AI)
**Approved by:** Stakeholder (User)

---

## Scope Summary

**Feature:** JWT Refresh Token & Logout
**User Story:** US-AUTH-002
**Epic:** EPIC-01: Auth & User
**Effort:** S (Small) | **Context-budget:** single-session
**Protocol:** Fast-Track / Bounded Task (stages 1→2→4→5→6→7→8; skipped Stage 3 gap-analysis)

---

## Signed-Off Business Rules (BR-)

| ID | Rule | Description |
|----|------|-------------|
| BR-AUTH-007 | Access Token TTL | 15 minutes |
| BR-AUTH-008 | Refresh Token TTL | 7 days |
| BR-AUTH-009 | Refresh Token Hashing | SHA-256 hash in MongoDB |
| BR-AUTH-010 | Cookie Transport | httpOnly, Path=/api/v1/auth, SameSite=Lax, Secure=prod |
| BR-AUTH-011 | Banned User Block | `isActive=false` → 401 on refresh |
| BR-AUTH-012 | Logout Clears State | DB hash = null + clear cookie |
| BR-AUTH-013 | Auto-Refresh on 401 | Axios interceptor with `isRefreshing` queue |
| BR-AUTH-014 | Refresh Failure → Login | Clear Zustand + redirect /login |
| BR-AUTH-015 | Single Active Session | New login overwrites refresh hash |

---

## Assumptions (ASM-)

| ID | Assumption | Validated |
|----|------------|-----------|
| ASM-AUTH-002-001 | Banned user → 401 on refresh | ✅ Interview |
| ASM-AUTH-002-002 | Logout only via access token | ✅ Interview |
| ASM-AUTH-002-003 | Single session model | ✅ Interview |

---

## Won't-Have (Explicit Scope Fence)

- Refresh token rotation (new hash per refresh)
- Logout all devices / revoke all sessions endpoint
- Logout via refresh token
- Device fingerprinting / session management UI
- Refresh token family / theft detection

---

## Risk Register Summary

| ID | Risk | Mitigation |
|----|------|------------|
| RISK-AUTH-001 | Refresh token leak (XSS) | httpOnly + Secure + short TTL |
| RISK-AUTH-002 | DB hash leak | SHA-256 non-reversible |
| RISK-AUTH-003 | Concurrent refresh race | `isRefreshing` queue guard |
| RISK-AUTH-004 | Banned user stale access (15m) | Short TTL; admin uses fresh token |
| RISK-AUTH-005 | Infinite refresh loop | `_retry` flag + queue drain |

---

## Technical Constraints

- **Backend:** NestJS + Mongoose, Guards + Strategies + Interceptors
- **Frontend:** React 18 + Vite + Zustand + Axios
- **Database:** MongoDB (User document with `refreshToken` hash field)
- **Auth:** JWT (access 15m) + Refresh (7d, cookie, SHA-256 hash)

---

## Deliverables Checklist

- [x] `00-tech-context.md` — Tech stack reference
- [x] `00-intake.md` — Complexity classification
- [x] `01-elicitation.md` — Interview record (3 Q&A)
- [x] `02-domain-model.md` — RBAC, State Machine, BRs, ERD, NFRs
- [x] `03-risk-register.md` — Contradiction scan, risks, MoSCoW
- [x] `spec.md` — BRD/PRD/SRS/User Stories/Traceability
- [x] `test-plan.md` — TC-101..104 + E2E mapping
- [x] `04-spec-validation.md` — IEEE 29148 pass

---

## Handover Brief for Development

**Implementation Status:** **Already Complete** — Backend + Frontend implemented and unit-tested.

**What Development Needs to Do:**
1. Run Speckit pipeline (`speckit-specify` → `speckit-plan` → `speckit-tasks`) to generate technical artifacts
2. Verify existing implementation matches spec (it does)
3. Run E2E tests (TC-E2E-1, TC-E2E-3 minimum)
4. Mark story `[x]` in roadmap after verification

**Key Files Already Implemented:**

| Layer | Files |
|-------|-------|
| Backend | `auth.service.ts` (refresh, logout), `auth.controller.ts`, `jwt-refresh.strategy.ts`, `jwt-refresh.guard.ts`, `users.service.ts` (findByRefreshTokenHash, updateRefreshToken) |
| Backend Tests | `auth-refresh-logout.service.spec.ts` (TC-101..104) |
| Frontend | `auth.service.ts` (refresh, logout), `apiClient.ts` (interceptor), `auth.store.ts` (setAccessToken, clearAuth) |

**No new code required** — this is a spec catch-up for an already-delivered feature.

---

## Sign-Off

```
✅ BASELINE SIGNED-OFF v1.0
All business rules, assumptions, risks, and scope locked.
Ready for Speckit technical planning and verification.
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-10-05 | Initial baseline — all stages complete |
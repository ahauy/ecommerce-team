# Risk & Contradiction Scan — US-AUTH-002 (auth-refresh-logout)

## Logic Contradiction Check

| Check | Result | Notes |
|-------|--------|-------|
| Refresh requires `isActive=true` but login returns 403 for banned | ✅ Consistent | Login: 403 (explicit banned message), Refresh: 401 (generic invalid token) |
| Logout clears cookie but refresh endpoint reads cookie | ✅ Consistent | `clearCookie()` removes cookie; subsequent refresh finds no cookie → 401 |
| New login overwrites refresh token but old access tokens still valid until expiry | ✅ Acceptable | Access tokens are stateless; short TTL (15m) limits window |
| Auto-refresh on 401 could loop if refresh also returns 401 | ✅ Guarded | `_retry` flag + `isRefreshing` queue prevent infinite loops |

## State Deadlock Analysis

| State | Risk | Mitigation |
|-------|------|------------|
| User has valid refresh token, gets banned | Refresh fails with 401 → frontend clears state + redirects login | Correct behavior per BR-AUTH-011 |
| Network partition during refresh | Queued requests wait; refresh succeeds or fails cleanly | `isRefreshing` queue + Promise-based resolution |
| Clock skew between client/server | JWT `exp` validated by server; client doesn't validate | Server is authority; short TTL limits impact |

## Backward Compatibility

| Concern | Assessment |
|---------|------------|
| Existing users with old refresh tokens | Hash format unchanged (SHA-256); compatible |
| Cookie path change | Fixed at `/api/v1/auth` since implementation; no migration needed |
| API response format | Wrapped in `{ success, data, message }` via ResponseInterceptor |

## Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| RISK-AUTH-001 | Refresh token leaked from cookie (XSS) | Low | High | httpOnly + Secure + SameSite=Lax; short TTL |
| RISK-AUTH-002 | Refresh token leaked from DB | Low | High | Stored as SHA-256 hash; not reversible |
| RISK-AUTH-003 | Race condition: concurrent refresh calls | Medium | Medium | `isRefreshing` queue + `_retry` flag |
| RISK-AUTH-004 | Banned user accesses via stale access token (15m window) | Medium | Medium | Short TTL; admin actions use fresh token check |
| RISK-AUTH-005 | Infinite refresh loop on persistent 401 | Low | High | `_retry` flag + queue drain on failure |

## MoSCoW Scope Lock

| Priority | Items | Status |
|----------|-------|--------|
| **Must Have** | BR-AUTH-007..015, ASM-AUTH-002-001..003 | ✅ Implemented |
| **Should Have** | Refresh token rotation (new hash on each refresh) | ❌ Won't-Have (MVP) |
| **Could Have** | Logout all devices endpoint | ❌ Won't-Have (ASM-AUTH-002-003) |
| **Won't Have** | Refresh token family / theft detection | ❌ Won't-Have |
| **Won't Have** | Device fingerprinting / session management UI | ❌ Won't-Have |

## Assumptions Log (Consolidated)

| ID | Assumption | Validated |
|----|------------|-----------|
| ASM-AUTH-002-001 | Banned user → 401 on refresh | ✅ Interview |
| ASM-AUTH-002-002 | Logout only via access token | ✅ Interview |
| ASM-AUTH-002-003 | Single session model (login overwrites) | ✅ Interview |
| ASM-AUTH-002-004 | 15m access / 7d refresh TTL from env | ✅ .env config |

## Next Stage
Proceed to **spec-writer** (Stage 6)
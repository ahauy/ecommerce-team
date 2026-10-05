# Elicitation Record — US-AUTH-002 (auth-refresh-logout)

## Interview Summary
Fast-Track interview (1 batch, 3 questions) conducted with stakeholder. All current implementation behaviors confirmed.

## Questions & Answers

### Q1: Banned user refresh behavior
**Question:** Khi user bị ban (isActive=false) mà vẫn còn refresh token hợp lệ — refresh endpoint có trả 401 ngay không?
**Answer:** **Yes, 401 ngay (current)** — Implementation already checks `isActive` in `AuthService.refresh()` and throws `UnauthorizedException`.

**Recorded as:** `ASM-AUTH-002-001` — Banned users cannot refresh tokens; immediate 401 on any refresh attempt.

### Q2: Logout via refresh token
**Question:** Logout hiện tại chỉ dùng access token (JwtAuthGuard). Cần hỗ trợ logout bằng refresh token không?
**Answer:** **Không cần (current)** — Single endpoint `POST /auth/logout` with access token is sufficient for MVP.

**Recorded as:** `ASM-AUTH-002-002` — Logout only via access token; no refresh-token-based logout endpoint.

### Q3: Logout all devices / revoke all sessions
**Question:** Có yêu cầu 'logout tất cả thiết bị' (revoke all sessions) không?
**Answer:** **Không cần (current)** — Each new login overwrites the refresh token hash, naturally invalidating prior sessions.

**Recorded as:** `ASM-AUTH-002-003` — Single active session model; new login revokes previous session automatically.

## Confirmed Business Rules (from AC + Interview)

| ID | Rule | Source |
|----|------|--------|
| BR-AUTH-007 | Access Token TTL = 15 minutes | AC |
| BR-AUTH-008 | Refresh Token TTL = 7 days | AC |
| BR-AUTH-009 | Refresh token stored as SHA-256 hash in DB | AC + Code |
| BR-AUTH-010 | Refresh token transported in httpOnly cookie (Path=/api/v1/auth) | AC + Code |
| BR-AUTH-011 | Banned user (isActive=false) → 401 on refresh | AC + Q1 |
| BR-AUTH-012 | Logout clears refreshToken hash in DB + clears cookie | AC |
| BR-AUTH-013 | Auto-refresh on 401 with queue guard (isRefreshing) | AC |
| BR-AUTH-014 | Refresh failure → clear auth state + redirect /login | AC |
| BR-AUTH-015 | New login overwrites existing refresh token (single session) | Q3 |

## Domain Pillars Covered
- **RBAC**: ✅ Customer/Admin roles enforced via guards
- **State Machine**: ✅ Token lifecycle (valid → expired → refreshed / revoked)
- **Business Rules**: ✅ 9 rules documented above
- **Workflows/Edge Cases**: ✅ Concurrent refresh, banned user, logout flow
- **Data/Privacy**: ✅ SHA-256 hash storage, httpOnly cookie
- **UX/NFR**: ✅ Seamless refresh, no user-visible interruption

## Next Stage
Proceed to **domain-modeling** (Stage 4 — Bounded Task skips Stage 3 gap-analysis)
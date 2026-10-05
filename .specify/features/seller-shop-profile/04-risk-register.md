# Risk Register: Profile & Thiết lập gian hàng (US-SELL-001)

## Contradiction Scan

**Findings: None found.**

All 10 business rules (BR-SELL-001 to BR-SELL-010) are internally consistent. State machine has valid transitions from every state. No backward-compatibility risks with existing schema (User document extension is additive — new optional fields).

## Risk Register

| ID | Risk | Prob. | Impact | Mitigation |
|---|---|---|---|---|
| RISK-SELL-001 | Shop slug collision under high concurrency | Low | Med | Atomic find-or-create with retry (max 3) using MongoDB unique index on `shop.shopSlug` |
| RISK-SELL-002 | Banned user's products not properly hidden from public catalog | Low | High | Cascade block on user ban (BR-SELL-010) + existing product query filters (`isBlocked = false`) |
| RISK-SELL-003 | Phone validation too strict (rejects valid VN numbers) | Low | Med | Regex `^(\+84|0)[0-9]{9,10}$` covers all current VN mobile prefixes; unit tests for edge cases |
| RISK-SELL-004 | Public shop endpoint leaks seller PII | Low | High | Response only includes `shopName`, `joinedAt`, `productCount` — no email, phone, address |
| RISK-SELL-005 | Race condition on concurrent shop setup | Low | Med | Optimistic locking via `version` field on User; 409 Conflict triggers FE retry |
| RISK-SELL-006 | Admin unban doesn't restore products blocked for other reasons | Low | Low | Unban logic only clears `blockReason = seller_banned`; other block reasons preserved |

## Assumptions & Constraints (Consolidated)

- ASM-SELL-001: `shopSlug` is the unique identifier for public shop URLs
- ASM-SELL-002: `pickupAddress` free text + `phone` separate required field
- ASM-SELL-003: Public shop view 404 on no shop or banned user
- ASM-SELL-004: Single shop per user
- ASM-SELL-005: Product count filters to active & non-blocked
- **Constraint**: Must use existing User collection (extend with Shop sub-document) — no new collection
- **Constraint**: API versioning `/api/v1/` mandatory
- **Constraint**: Stitch MCP screens must be queried for FE implementation
- **Constraint**: DESIGN.md tokens mandatory (pill buttons, two-canvas, ss03 typography)

## MoSCoW Scope Table

### Must-Have (P0)
- `GET /api/v1/users/me` — profile + shop info
- `PATCH /api/v1/users/me` — update fullName, phone, address
- `PATCH /api/v1/users/me/shop` — setup/update shop (shopName, pickupAddress, phone)
- `GET /api/v1/shops/:sellerId` — public shop view (shopName, joinedAt, productCount)
- FE: ProfilePage, ShopSetupPage with Stitch fidelity
- Shop slug auto-generation + uniqueness
- Ban cascade (user ban → shop hidden + products blocked)

### Should-Have (P1)
- Shop setup rate limiting (max 5 changes/day)
- Optimistic concurrency on User document (version field)
- FE: Toast notifications for success/error states

### Could-Have (P2)
- Shop avatar/logo upload (Cloudinary)
- Shop description/bio field
- Public shop page with product grid (deferred to US-PRD-002)

### Won't-Have (Out of Scope)
- Multi-shop per user
- Shop KYC / verification badge
- Seller dashboard analytics
- Shop categories / tags
- Shop SEO meta fields
- Internationalization (i18n) — only Vietnamese
- Guest checkout (explicitly Won't-Have in roadmap)
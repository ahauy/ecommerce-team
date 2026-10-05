# Domain Decision Baseline: Profile & Thiết lập gian hàng (US-SELL-001)

**Status**: SIGNED-OFF
**Version**: 1.0
**Signed off by**: User, 2026-10-05

This document is compiled incrementally by every stage of the Universal BA
Pipeline. Do not hand-edit sections owned by another skill.

## Stage 0 — Intake

See `00-intake.md`.

## Stage 2 — Elicitation Interview

See `01-elicitation.md`.

### Key Decisions

- **Shop identity**: `shopName` (display, non-unique) + `shopSlug` (unique, URL-friendly, auto-generated)
- **Shop setup fields**: `shopName` (3–50 chars), `pickupAddress` (free text, min 10 chars), `phone` (VN format, required)
- **Public shop view**: 404 if no `shopName` OR user `isActive = false`
- **Product count**: Only `isActive = true` AND `isBlocked = false` products
- **1:1 User:Shop**: Each user has at most one shop

### Assumptions (ASM-)

- ASM-SELL-001: `shopSlug` is the unique identifier for public shop URLs
- ASM-SELL-002: `pickupAddress` free text + `phone` separate required field
- ASM-SELL-003: Public shop view 404 on no shop or banned user
- ASM-SELL-004: Single shop per user
- ASM-SELL-005: Product count filters to active & non-blocked

## Stage 4 — Domain Modeling

See `03-domain-model.md`.

### RBAC Matrix Summary
- Customer: own profile/shop CRUD
- Admin: view any, ban/unban user (cascades to shop)
- Guest: public shop view only

### State Machine
`NoShop` → `ShopSetupPending` → `ShopActive` ↔ `ShopBlocked` (admin ban/unban) → `ShopDeleted`

### Business Rules (10 rules)
- BR-SELL-001 to BR-SELL-010 covering: shopName length, shopSlug generation, pickupAddress min length, phone VN format, all-fields-required setup, public shop 404 rules, productCount filter, 1:1 user:shop, joinedAt immutable, ban cascade

### Entities
- User (extended with Shop sub-document)
- ShopSlug unique index on User.shop.shopSlug

### NFRs
- P95 < 200ms, WCAG 2.1 AA, Vietnamese only, observability logging

## Stage 5 — Risk & Contradiction Scan

See `04-risk-register.md`.

### Contradictions
- None found

### Risk Register (6 risks)
- RISK-SELL-001: Shop slug collision (Low/Med) — atomic find-or-create
- RISK-SELL-002: Banned user products leak (Low/High) — cascade block + query filters
- RISK-SELL-003: Phone validation edge cases (Low/Med) — comprehensive unit tests
- RISK-SELL-004: PII leak in public shop (Low/High) — response excludes sensitive fields
- RISK-SELL-005: Concurrent setup race (Low/Med) — optimistic locking
- RISK-SELL-006: Unban restores wrong products (Low/Low) — only clears seller_banned reason

### MoSCoW
- **Must-Have**: All 4 API endpoints + 2 FE pages + slug gen + ban cascade
- **Should-Have**: Rate limiting, optimistic concurrency, FE toasts
- **Could-Have**: Shop avatar, description, public product grid
- **Won't-Have**: Multi-shop, KYC, analytics, SEO, i18n

## Stage 6 — Spec Writing

See `user-stories.md`.

### Requirements (5 REQ-)
- REQ-SELL-001: Get Current User Profile
- REQ-SELL-002: Update User Profile
- REQ-SELL-003: Setup or Update Shop
- REQ-SELL-004: Public Shop View
- REQ-SELL-005: Ban Cascade to Shop

### User Stories (5 US-)
- US-SELL-001: View Profile & Shop Info (3 scenarios)
- US-SELL-002: Update Profile (3 scenarios)
- US-SELL-003: Setup Shop (7 scenarios incl. slug collision, update)
- US-SELL-004: View Public Shop (4 scenarios)
- US-SELL-005: Shop Hidden When Seller Banned (3 scenarios)

**Traceability**: Every REQ cites Derived from BR-/ASM-; every US traces to REQ; every edge case from domain model §4 covered in scenarios.

## Stage 7 — Spec Validation

See `validation-report.md` and `traceability-matrix.md`.

### IEEE 29148 Checklist
- **Result**: PASS (all 80 checks across 10 items × 8 criteria)
- **Traceability matrix**: Complete — no gaps (5 REQ → 5 US → 20 AC scenarios)

### Accepted Gaps
- None
# Elicitation Record: Profile & Thiết lập gian hàng (US-SELL-001)

## Stage 1 — Business Value

- **Problem**: Logged-in users need a profile page to manage personal info and a shop setup page to configure `shopName` and `pickupAddress` before they can list products. Without this, sellers cannot onboard to the marketplace.
- **Personas**: Customer/User (buyer + seller in one account), Admin (oversight)
- **Success metrics**: 100% of registered users can complete shop setup within 2 minutes; zero blocked listings due to missing shop info

## Pillar 1 — Personas, Actors & RBAC

**Q1: Shop name uniqueness** → **Decision**: Option C — Auto-generate unique `shopSlug` from `shopName` (e.g., "shop-abc-2"), keep display `shopName` non-unique. Seller can change `shopName` but `shopSlug` remains stable or can be changed with availability check.

**Q2: Pickup address validation** → **Decision**: Option C — Free text `pickupAddress` (min 10 chars) + separate required `phone` field (VN format: `^(\+84|0)[0-9]{9,10}$`). Phone stored on User profile, not shop.

## Assumptions confirmed

- ASM-SELL-001: `shopName` is display-only; `shopSlug` is the unique identifier for public shop URLs (`/shops/{shopSlug}`)
- ASM-SELL-002: `pickupAddress` is free text with minimum length; `phone` is a separate required field validated as VN mobile format
- ASM-SELL-003: Public shop view (`GET /api/v1/shops/:sellerId`) returns 404 if user has no `shopName` OR user `isActive = false` (banned)
- ASM-SELL-004: Seller can only have one shop (1:1 User:Shop); no multi-shop support
- ASM-SELL-005: `productCount` in public shop view counts only `isActive = true` AND `isBlocked = false` products

## Open questions (not yet answered)

- None blocking — AC covers remaining details

## New terminology for CONTEXT.md

- `shopSlug`: Auto-generated unique URL-friendly identifier derived from `shopName` (e.g., "my-shop-2")
- `pickupAddress`: Free-text pickup location for seller's orders
- `VN phone format`: Regex `^(\+84|0)[0-9]{9,10}$` for Vietnamese mobile numbers
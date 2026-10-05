# Specification: Seller Shop Profile

**Feature**: seller-shop-profile  
**Version**: 1.0  
**Status**: Approved for Planning  
**Created**: 2026-10-05

---

## Executive Summary

Enable logged-in users to manage their personal profile and set up a seller shop with name, pickup address, and phone number before listing products. The shop gets an auto-generated unique slug for public discovery. Admin bans cascade to hide the shop and block all associated products.

---

## User Scenarios & Testing

### Primary User: Customer (Buyer/Seller)

**Scenario 1: First-time shop setup**
- Given a newly registered user with no shop
- When they navigate to "Đăng bán" (Sell)
- Then they are redirected to Shop Setup page
- When they enter valid shopName (3-50 chars), pickupAddress (≥10 chars), phone (VN format)
- Then shop is created with auto-generated shopSlug, joinedAt timestamp
- And they are redirected to product creation

**Scenario 2: View own profile with active shop**
- Given a logged-in user with completed shop setup
- When they visit Profile page
- Then they see fullName, phone, address, shopName, shopSlug, pickupAddress, joinedAt

**Scenario 3: Update profile info**
- Given a logged-in user
- When they update fullName, phone (VN format), address
- Then changes are saved and reflected immediately

### Secondary User: Guest / Any User (Shop Discovery)

**Scenario 4: View public shop**
- Given a seller with active shop and products
- When any user visits `/shops/{sellerId}`
- Then they see shopName, shopSlug, joinedAt, productCount (active & non-blocked only)

**Scenario 5: Banned seller shop hidden**
- Given a seller banned by admin
- When any user visits `/shops/{sellerId}`
- Then they receive 404 "Không tìm thấy gian hàng"

### Admin User

**Scenario 6: Ban seller cascades to shop**
- Given a seller with active shop and products
- When admin bans the user
- Then user cannot login (403), shop returns 404, all products blocked with reason "seller_banned"

**Scenario 7: Unban restores shop selectively**
- Given a banned seller with products blocked for "seller_banned" and "policy_violation"
- When admin unbans the user
- Then shop restored, "seller_banned" products unblocked, "policy_violation" products remain blocked

---

## Functional Requirements

### FR-001: Get Current User Profile
- **Endpoint**: `GET /api/v1/users/me`
- **Auth**: Required (JWT)
- **Response**: User profile + shop info (shopName, shopSlug, pickupAddress, joinedAt, phone) or null fields if no shop
- **Error**: 401 if unauthenticated, 403 if banned (isActive = false)

### FR-002: Update User Profile
- **Endpoint**: `PATCH /api/v1/users/me`
- **Auth**: Required (JWT)
- **Body**: fullName (string, 2-100), phone (VN format: `^(\+84\|0)[0-9]{9,10}$`), address (string, optional)
- **Response**: Updated user profile
- **Error**: 400 for validation failures, 401 unauthenticated, 403 banned

### FR-003: Setup or Update Shop
- **Endpoint**: `PATCH /api/v1/users/me/shop`
- **Auth**: Required (JWT)
- **Body**: shopName (3-50 chars), pickupAddress (min 10 chars), phone (VN format)
- **Behavior**: 
  - First setup: creates shop, generates unique shopSlug, sets joinedAt
  - Update: modifies shopName, pickupAddress; shopSlug optionally changes if available
  - All three fields required in single request
- **Response**: Updated user profile with shop
- **Error**: 400 for validation failures (specific field errors), 401 unauthenticated, 403 banned
- **Uniqueness**: shopSlug unique via MongoDB index; collisions auto-suffixed (-2, -3, etc.)

### FR-004: Public Shop View
- **Endpoint**: `GET /api/v1/shops/:sellerId`
- **Auth**: None (public)
- **Response**: shopName, shopSlug, joinedAt, productCount
- **productCount**: Count of products where sellerId = :sellerId AND isActive = true AND isBlocked = false
- **Error**: 404 if no shopName OR seller isActive = false

### FR-005: Admin Ban Cascade
- **Trigger**: Admin calls `PATCH /api/v1/admin/users/:id/ban`
- **Effect**: 
  - User isActive = false
  - Shop hidden from public (404 on /shops/:sellerId)
  - All seller's products: isBlocked = true, blockReason = "seller_banned"
- **Unban** (`PATCH /api/v1/admin/users/:id/unban`):
  - User isActive = true
  - Shop restored if shopName exists
  - Products with blockReason = "seller_banned" unblocked
  - Other block reasons preserved

---

## Key Entities

### User (Extended)
| Field | Type | Constraints |
|-------|------|-------------|
| _id | ObjectId | PK |
| email | string | Unique, email format |
| passwordHash | string | bcrypt |
| fullName | string | 2-100 chars |
| phone | string | VN format, required for shop |
| address | string | Optional |
| role | enum | customer \| admin |
| isActive | boolean | Default true |
| refreshTokenHash | string | SHA-256 |
| version | number | Optimistic locking |
| shop | sub-doc | See Shop |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Shop (Sub-document on User)
| Field | Type | Constraints |
|-------|------|-------------|
| shopName | string | 3-50 chars, display only |
| shopSlug | string | Unique, URL-friendly, auto-generated |
| pickupAddress | string | Min 10 chars, free text |
| joinedAt | DateTime | Immutable, set on first setup |

### Product (Reference - existing)
- Query filter for productCount: `sellerId = :sellerId AND isActive = true AND isBlocked = false`

---

## Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | P95 < 200ms for all 4 endpoints |
| Security | JWT required for mutations; input sanitization; no PII in public shop response |
| Accessibility | WCAG 2.1 AA (semantic HTML, labels, focus management, ARIA live regions) |
| Localization | Vietnamese only (per Won't-Have) |
| Observability | Log shop setup completion (userId, shopSlug); log public shop 404s |
| Concurrency | Optimistic locking via version field on User; 409 Conflict on collision |
| Rate Limiting | Shop setup changes max 5/day per user (Should-Have) |

---

## Success Criteria

1. **Onboarding completion**: 100% of registered users can complete shop setup within 2 minutes
2. **Shop discovery**: Public shop view loads in < 200ms P95
3. **Data integrity**: Zero duplicate shopSlugs; zero PII leakage in public endpoints
4. **Moderation effectiveness**: Banned seller shops inaccessible within 1 second of ban
5. **User satisfaction**: Zero critical bugs in profile/shop flows at launch

---

## Assumptions

- ASM-SELL-001: shopSlug is the unique identifier for public shop URLs
- ASM-SELL-002: pickupAddress free text + phone separate required field
- ASM-SELL-003: Public shop view 404 on no shop or banned user
- ASM-SELL-004: Single shop per user (1:1)
- ASM-SELL-005: Product count filters to active & non-blocked

---

## Constraints

- Must extend existing User collection (add Shop sub-document) — no new collection
- API versioning `/api/v1/` mandatory
- Frontend must query Stitch MCP screens for UI fidelity
- DESIGN.md tokens mandatory: pill buttons (rounded-full), two-canvas polarity, ss03 typography
- Vietnamese only (no i18n)
- Uses existing JWT auth (15m access, 7d refresh)

---

## Out of Scope (Won't-Have)

- Multi-shop per user
- Shop KYC / verification badge
- Seller dashboard analytics
- Shop categories / tags / SEO meta fields
- Shop avatar/logo upload
- Internationalization (i18n)
- Guest checkout
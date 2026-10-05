# Test Plan: Seller Shop Profile (US-SELL-001)

**Feature**: seller-shop-profile  
**Generated from**: user-stories.md (20 AC scenarios)  
**Template**: .specify/templates/test-plan.md  
**Total Test Cases**: 20

---

## Traceability Matrix

| User Story | AC Scenario | Test Case ID | Type | Priority |
|------------|-------------|--------------|------|----------|
| US-SELL-001 | Happy path - shop active | TC-SELL-001 | Unit (BE) + E2E | P0 |
| US-SELL-001 | No shop yet | TC-SELL-002 | Unit (BE) + E2E | P0 |
| US-SELL-001 | Shop blocked - user banned | TC-SELL-003 | Unit (BE) + E2E | P0 |
| US-SELL-002 | Happy path - valid update | TC-SELL-004 | Unit (BE) + E2E | P0 |
| US-SELL-002 | Invalid phone format | TC-SELL-005 | Unit (BE) + E2E | P0 |
| US-SELL-002 | Empty fullName | TC-SELL-006 | Unit (BE) + E2E | P0 |
| US-SELL-003 | Happy path - first setup | TC-SELL-007 | Unit (BE) + E2E | P0 |
| US-SELL-003 | ShopName too short | TC-SELL-008 | Unit (BE) + E2E | P0 |
| US-SELL-003 | ShopName too long | TC-SELL-009 | Unit (BE) + E2E | P0 |
| US-SELL-003 | PickupAddress too short | TC-SELL-010 | Unit (BE) + E2E | P0 |
| US-SELL-003 | Invalid phone | TC-SELL-011 | Unit (BE) + E2E | P0 |
| US-SELL-003 | ShopSlug collision - auto-suffix | TC-SELL-012 | Unit (BE) | P0 |
| US-SELL-003 | Update existing shop | TC-SELL-013 | Unit (BE) + E2E | P0 |
| US-SELL-004 | Happy path - active shop | TC-SELL-014 | Unit (BE) + E2E | P0 |
| US-SELL-004 | Seller banned | TC-SELL-015 | Unit (BE) + E2E | P0 |
| US-SELL-004 | Seller has no shop | TC-SELL-016 | Unit (BE) + E2E | P0 |
| US-SELL-004 | Product count accuracy | TC-SELL-017 | Unit (BE) | P0 |
| US-SELL-005 | Ban cascade | TC-SELL-018 | Unit (BE) + E2E | P0 |
| US-SELL-005 | Unban restores | TC-SELL-019 | Unit (BE) + E2E | P0 |
| US-SELL-005 | Unban preserves other blocks | TC-SELL-020 | Unit (BE) | P0 |

---

## Test Case Details

### TC-SELL-001: Get Profile - Shop Active
**User Story**: US-SELL-001, Scenario 1  
**Type**: Unit (Backend) + E2E  
**Precondition**: User exists, logged in, has shop with shopName="Test Shop"  
**Action**: `GET /api/v1/users/me` with valid JWT  
**Expected**: 200 OK, response includes `shop.shopName="Test Shop"`, `shop.shopSlug`, `shop.pickupAddress`, `shop.joinedAt`

### TC-SELL-002: Get Profile - No Shop
**User Story**: US-SELL-001, Scenario 2  
**Type**: Unit (Backend) + E2E  
**Precondition**: User exists, logged in, shopName = null  
**Action**: `GET /api/v1/users/me` with valid JWT  
**Expected**: 200 OK, response includes `shop: null`

### TC-SELL-003: Get Profile - Banned User
**User Story**: US-SELL-001, Scenario 3  
**Type**: Unit (Backend) + E2E  
**Precondition**: User exists, `isActive = false`  
**Action**: `GET /api/v1/users/me` with valid JWT  
**Expected**: 403 Forbidden, message "Tài khoản đã bị khóa"

### TC-SELL-004: Update Profile - Valid
**User Story**: US-SELL-002, Scenario 1  
**Type**: Unit (Backend) + E2E  
**Precondition**: User exists, logged in  
**Action**: `PATCH /api/v1/users/me` with `{fullName: "New Name", phone: "0987654321", address: "New Address"}`  
**Expected**: 200 OK, response reflects updated fields

### TC-SELL-005: Update Profile - Invalid Phone
**User Story**: US-SELL-002, Scenario 2  
**Type**: Unit (Backend) + E2E  
**Precondition**: User exists, logged in  
**Action**: `PATCH /api/v1/users/me` with `{phone: "123"}`  
**Expected**: 400 Bad Request, error on `phone` field "Số điện thoại không hợp lệ"

### TC-SELL-006: Update Profile - Empty fullName
**User Story**: US-SELL-002, Scenario 3  
**Type**: Unit (Backend) + E2E  
**Precondition**: User exists, logged in  
**Action**: `PATCH /api/v1/users/me` with `{fullName: "a"}`  
**Expected**: 400 Bad Request, error on `fullName` field

### TC-SELL-007: Setup Shop - First Time Valid
**User Story**: US-SELL-003, Scenario 1  
**Type**: Unit (Backend) + E2E  
**Precondition**: User exists, logged in, shopName = null  
**Action**: `PATCH /api/v1/users/me/shop` with `{shopName: "My Awesome Shop", pickupAddress: "123 Nguyen Van Linh, District 7, HCMC", phone: "0901234567"}`  
**Expected**: 200 OK, response includes `shop.shopSlug="my-awesome-shop"`, `shop.joinedAt` set

### TC-SELL-008: Setup Shop - ShopName Too Short
**User Story**: US-SELL-003, Scenario 2  
**Type**: Unit (Backend) + E2E  
**Precondition**: User exists, logged in  
**Action**: `PATCH /api/v1/users/me/shop` with `{shopName: "ab", pickupAddress: "1234567890", phone: "0901234567"}`  
**Expected**: 400 Bad Request, error on `shopName` "Tên gian hàng phải từ 3-50 ký tự"

### TC-SELL-009: Setup Shop - ShopName Too Long
**User Story**: US-SELL-003, Scenario 3  
**Type**: Unit (Backend) + E2E  
**Precondition**: User exists, logged in  
**Action**: `PATCH /api/v1/users/me/shop` with `{shopName: "a".repeat(51), pickupAddress: "1234567890", phone: "0901234567"}`  
**Expected**: 400 Bad Request, error on `shopName`

### TC-SELL-010: Setup Shop - PickupAddress Too Short
**User Story**: US-SELL-003, Scenario 4  
**Type**: Unit (Backend) + E2E  
**Precondition**: User exists, logged in  
**Action**: `PATCH /api/v1/users/me/shop` with `{shopName: "Valid Name", pickupAddress: "123", phone: "0901234567"}`  
**Expected**: 400 Bad Request, error on `pickupAddress` "Địa chỉ lấy hàng tối thiểu 10 ký tự"

### TC-SELL-011: Setup Shop - Invalid Phone
**User Story**: US-SELL-003, Scenario 5  
**Type**: Unit (Backend) + E2E  
**Precondition**: User exists, logged in  
**Action**: `PATCH /api/v1/users/me/shop` with `{shopName: "Valid Name", pickupAddress: "1234567890", phone: "123"}`  
**Expected**: 400 Bad Request, error on `phone` "Số điện thoại không hợp lệ"

### TC-SELL-012: Setup Shop - ShopSlug Collision Auto-Suffix
**User Story**: US-SELL-003, Scenario 6  
**Type**: Unit (Backend)  
**Precondition**: User A has shopSlug="my-shop"  
**Action**: User B calls `PATCH /api/v1/users/me/shop` with `{shopName: "My Shop", pickupAddress: "1234567890", phone: "0901234567"}`  
**Expected**: 200 OK, User B gets `shopSlug="my-shop-2"`

### TC-SELL-013: Setup Shop - Update Existing
**User Story**: US-SELL-003, Scenario 7  
**Type**: Unit (Backend) + E2E  
**Precondition**: User exists, logged in, has existing shop  
**Action**: `PATCH /api/v1/users/me/shop` with `{shopName: "Renamed Shop", pickupAddress: "New Address", phone: "0987654321"}`  
**Expected**: 200 OK, shopName updated, shopSlug optionally changed if available

### TC-SELL-014: Public Shop - Active Shop
**User Story**: US-SELL-004, Scenario 1  
**Type**: Unit (Backend) + E2E  
**Precondition**: Seller exists, has active shop, 3 active products  
**Action**: `GET /api/v1/shops/:sellerId` (no auth)  
**Expected**: 200 OK, response includes `shopName`, `shopSlug`, `joinedAt`, `productCount: 3`

### TC-SELL-015: Public Shop - Seller Banned
**User Story**: US-SELL-004, Scenario 2  
**Type**: Unit (Backend) + E2E  
**Precondition**: Seller exists, `isActive = false`  
**Action**: `GET /api/v1/shops/:sellerId`  
**Expected**: 404 Not Found, message "Không tìm thấy gian hàng"

### TC-SELL-016: Public Shop - Seller No Shop
**User Story**: US-SELL-004, Scenario 3  
**Type**: Unit (Backend) + E2E  
**Precondition**: Seller exists, shopName = null  
**Action**: `GET /api/v1/shops/:sellerId`  
**Expected**: 404 Not Found, message "Không tìm thấy gian hàng"

### TC-SELL-017: Public Shop - Product Count Accuracy
**User Story**: US-SELL-004, Scenario 4  
**Type**: Unit (Backend)  
**Precondition**: Seller has 5 products: 3 active, 1 inactive, 1 blocked  
**Action**: `GET /api/v1/shops/:sellerId`  
**Expected**: 200 OK, `productCount: 3` (only active & non-blocked)

### TC-SELL-018: Admin Ban - Cascade to Shop & Products
**User Story**: US-SELL-005, Scenario 1  
**Type**: Unit (Backend) + E2E  
**Precondition**: Seller has active shop, 3 products  
**Action**: Admin calls `PATCH /api/v1/admin/users/:id/ban`  
**Expected**: 
- User `isActive = false`
- `GET /shops/:sellerId` → 404
- All 3 products: `isBlocked = true`, `blockReason = "seller_banned"`

### TC-SELL-019: Admin Unban - Restore Shop & Products
**User Story**: US-SELL-005, Scenario 2  
**Type**: Unit (Backend) + E2E  
**Precondition**: Banned seller, shop hidden, products blocked with "seller_banned"  
**Action**: Admin calls `PATCH /api/v1/admin/users/:id/unban`  
**Expected**: 
- User `isActive = true`
- `GET /shops/:sellerId` → 200 with shop info
- Products with "seller_banned" unblocked

### TC-SELL-020: Admin Unban - Preserve Other Blocks
**User Story**: US-SELL-005, Scenario 3  
**Type**: Unit (Backend)  
**Precondition**: Banned seller, Product A blocked "seller_banned", Product B blocked "policy_violation"  
**Action**: Admin calls `PATCH /api/v1/admin/users/:id/unban`  
**Expected**: 
- Product A unblocked
- Product B remains blocked (`blockReason = "policy_violation"`)

---

## Test Execution Strategy

### Backend Unit Tests (Jest)
- Run: `cd backend && pnpm test`
- Coverage target: 80%+ on new code (services, controllers, DTOs)
- Focus: TC-SELL-001 to TC-SELL-020 (backend logic)

### Frontend Unit Tests (Jest + React Testing Library)
- Run: `cd frontend && pnpm test`
- Coverage: Form validation, TanStack Query mutations, component rendering
- Focus: TC-SELL-001 to TC-SELL-013, TC-SELL-014 (FE components)

### E2E Tests (Playwright)
- Run: `pnpm test:e2e`
- Scenarios: TC-SELL-001, TC-SELL-002, TC-SELL-003, TC-SELL-004, TC-SELL-007, TC-SELL-014, TC-SELL-018, TC-SELL-019
- Browsers: Chromium, Firefox, WebKit

### Stitch MCP Fidelity Check
- Visual regression: Compare rendered pages vs Stitch screenshots
- Pages: ProfilePage (5 screens), ShopSetupPage (5 screens), PublicShopPage (1 screen)
- Total: 11 screens

### DESIGN.md Compliance Check
- Automated: Tailwind class audit for `rounded-full`, two-canvas colors, `font-feature-settings: "ss03"`
- Manual: Visual review of hairlines, shadows, spacing

### WCAG 2.1 AA Audit
- Tool: axe-core + manual keyboard/screen reader testing
- Focus: Form labels, ARIA live regions, focus order, color contrast

---

## Test Data Requirements

| Test Case | Test Data Needed |
|-----------|------------------|
| TC-SELL-001, 002, 003 | User fixtures: with-shop, no-shop, banned |
| TC-SELL-007-013 | Clean user per test (shopName = null) |
| TC-SELL-012 | Pre-existing user with shopSlug="my-shop" |
| TC-SELL-014, 017 | Seller with mixed product states |
| TC-SELL-015, 016 | Banned user, user with no shop |
| TC-SELL-018-020 | Admin user, seller with products in various block states |

---

## Exit Criteria

- [ ] All 20 test cases implemented and passing
- [ ] Backend coverage ≥ 80% on new files
- [ ] Frontend coverage ≥ 70% on new components
- [ ] E2E tests pass on all 3 browsers
- [ ] Stitch MCP visual fidelity verified (11 screens)
- [ ] DESIGN.md token compliance verified
- [ ] WCAG 2.1 AA audit passes
- [ ] Zero Critical bugs
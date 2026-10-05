# User Stories: Profile & Thiết lập gian hàng (US-SELL-001)

## REQ-SELL-001: Get Current User Profile
**Category**: Profile Management
**Priority**: Must-Have
**Status**: Draft
**Description**: Authenticated user retrieves their profile including shop info (shopName, shopSlug, pickupAddress, joinedAt) or null if shop not set up.
**Derived from**: BR-SELL-008, ASM-SELL-001, ASM-SELL-003
**Business Rules**: BR-SELL-006, BR-SELL-008
**Non-Functional Requirements**: P95 < 200ms
**Dependencies**: US-AUTH-001 (JWT auth)

## REQ-SELL-002: Update User Profile
**Category**: Profile Management
**Priority**: Must-Have
**Status**: Draft
**Description**: Authenticated user updates their fullName, phone, address. Phone must be VN format.
**Derived from**: BR-SELL-004, ASM-SELL-002
**Business Rules**: BR-SELL-004
**Non-Functional Requirements**: P95 < 200ms
**Dependencies**: US-AUTH-001

## REQ-SELL-003: Setup or Update Shop
**Category**: Shop Management
**Priority**: Must-Have
**Status**: Draft
**Description**: Authenticated user creates or updates their shop with shopName (3-50 chars), pickupAddress (min 10 chars), and phone (VN format). Auto-generates unique shopSlug. Returns 400 for validation failures.
**Derived from**: BR-SELL-001, BR-SELL-002, BR-SELL-003, BR-SELL-004, BR-SELL-005, ASM-SELL-001, ASM-SELL-004
**Business Rules**: BR-SELL-001, BR-SELL-002, BR-SELL-003, BR-SELL-004, BR-SELL-005
**Non-Functional Requirements**: P95 < 200ms; unique index on shopSlug
**Dependencies**: US-AUTH-001, REQ-SELL-002 (phone)

## REQ-SELL-004: Public Shop View
**Category**: Shop Discovery
**Priority**: Must-Have
**Status**: Draft
**Description**: Any user (including Guest) views public shop info by sellerId: shopName, shopSlug, joinedAt, productCount (active & non-blocked only). Returns 404 if no shop or seller banned.
**Derived from**: BR-SELL-006, BR-SELL-007, BR-SELL-010, ASM-SELL-003, ASM-SELL-005
**Business Rules**: BR-SELL-006, BR-SELL-007, BR-SELL-010
**Non-Functional Requirements**: P95 < 200ms; no PII in response
**Dependencies**: US-PRD-001 (products exist)

## REQ-SELL-005: Ban Cascade to Shop
**Category**: Admin Moderation
**Priority**: Must-Have
**Status**: Draft
**Description**: When Admin bans user (isActive = false), user's shop is hidden from public (404 on /shops/:sellerId) and all their products are blocked with blockReason = "seller_banned".
**Derived from**: BR-SELL-010
**Business Rules**: BR-SELL-010
**Non-Functional Requirements**: Atomic within user ban transaction
**Dependencies**: US-ADM-001 (admin ban endpoint)

---

### US-SELL-001: View Profile & Shop Info
**As a** Customer (logged-in user)
**I want to** view my profile and shop information
**So that** I can verify my details and see my shop status before listing products
**Traces to**: REQ-SELL-001

**Acceptance Criteria**:
- **Scenario 1 (happy path — shop active)**
  - Given user is logged in and has completed shop setup (shopName set)
  - When user calls `GET /api/v1/users/me`
  - Then response 200 with user profile including shopName, shopSlug, pickupAddress, joinedAt, phone
- **Scenario 2 (no shop yet)**
  - Given user is logged in but has not set up shop (shopName = null)
  - When user calls `GET /api/v1/users/me`
  - Then response 200 with user profile and shop fields null
- **Scenario 3 (shop blocked — user banned)**
  - Given user is logged in but account is banned (isActive = false)
  - When user calls `GET /api/v1/users/me`
  - Then response 403 "Tài khoản đã bị khóa" (per existing BR-AUTH-011)

---

### US-SELL-002: Update Profile
**As a** Customer
**I want to** update my fullName, phone, and address
**So that** my checkout and shop info stay current
**Traces to**: REQ-SELL-002

**Acceptance Criteria**:
- **Scenario 1 (happy path)**
  - Given user is logged in
  - When user calls `PATCH /api/v1/users/me` with valid fullName, phone (VN format), address
  - Then response 200 with updated profile
- **Scenario 2 (invalid phone format)**
  - Given user is logged in
  - When user calls `PATCH /api/v1/users/me` with phone not matching `^(\+84|0)[0-9]{9,10}$`
  - Then response 400 with field error "Số điện thoại không hợp lệ"
- **Scenario 3 (empty fullName)**
  - Given user is logged in
  - When user calls `PATCH /api/v1/users/me` with fullName < 2 chars
  - Then response 400 with field error

---

### US-SELL-003: Setup Shop
**As a** Customer
**I want to** set up my shop with shopName, pickupAddress, and phone
**So that** I can start listing products for sale
**Traces to**: REQ-SELL-003

**Acceptance Criteria**:
- **Scenario 1 (happy path — first setup)**
  - Given user is logged in, has no shop (shopName = null)
  - When user calls `PATCH /api/v1/users/me/shop` with shopName (3-50 chars), pickupAddress (≥10 chars), phone (VN format)
  - Then response 200 with updated profile including generated shopSlug and joinedAt timestamp
- **Scenario 2 (shopName too short)**
  - Given user is logged in
  - When user calls `PATCH /api/v1/users/me/shop` with shopName = "ab"
  - Then response 400 with field error "Tên gian hàng phải từ 3-50 ký tự"
- **Scenario 3 (shopName too long)**
  - Given user is logged in
  - When user calls `PATCH /api/v1/users/me/shop` with shopName = 51 chars
  - Then response 400 with field error
- **Scenario 4 (pickupAddress too short)**
  - Given user is logged in
  - When user calls `PATCH /api/v1/users/me/shop` with pickupAddress = "123"
  - Then response 400 with field error "Địa chỉ lấy hàng tối thiểu 10 ký tự"
- **Scenario 5 (invalid phone)**
  - Given user is logged in
  - When user calls `PATCH /api/v1/users/me/shop` with phone = "123"
  - Then response 400 with field error "Số điện thoại không hợp lệ"
- **Scenario 6 (shopSlug collision — auto-suffix)**
  - Given user A has shopSlug "my-shop"
  - When user B sets up shop with shopName "My Shop"
  - Then user B gets shopSlug "my-shop-2"
- **Scenario 7 (update existing shop)**
  - Given user has existing shop
  - When user calls `PATCH /api/v1/users/me/shop` with new shopName
  - Then response 200 with updated shopName (shopSlug may optionally change if available)

---

### US-SELL-004: View Public Shop
**As a** Guest or Customer
**I want to** view a seller's public shop page
**So that** I can see their shop name, when they joined, and how many products they have
**Traces to**: REQ-SELL-004

**Acceptance Criteria**:
- **Scenario 1 (happy path — active shop)**
  - Given seller has active shop (shopName set, isActive = true)
  - When user calls `GET /api/v1/shops/:sellerId`
  - Then response 200 with shopName, shopSlug, joinedAt, productCount (only active & non-blocked)
- **Scenario 2 (seller banned)**
  - Given seller is banned (isActive = false)
  - When user calls `GET /api/v1/shops/:sellerId`
  - Then response 404 "Không tìm thấy gian hàng"
- **Scenario 3 (seller has no shop)**
  - Given seller never set up shop (shopName = null)
  - When user calls `GET /api/v1/shops/:sellerId`
  - Then response 404 "Không tìm thấy gian hàng"
- **Scenario 4 (product count accuracy)**
  - Given seller has 5 products: 3 active, 1 inactive, 1 blocked
  - When user calls `GET /api/v1/shops/:sellerId`
  - Then productCount = 3

---

### US-SELL-005: Shop Hidden When Seller Banned
**As a** Admin
**I want to** ban a user and have their shop automatically hidden
**So that** buyers cannot access banned sellers' shops
**Traces to**: REQ-SELL-005

**Acceptance Criteria**:
- **Scenario 1 (ban cascade)**
  - Given seller has active shop with products
  - When admin bans user (PATCH /api/v1/admin/users/:id/ban)
  - Then user isActive = false, shop hidden (404 on /shops/:sellerId), all products blocked with blockReason = "seller_banned"
- **Scenario 2 (unban restores)**
  - Given banned seller with products blocked for seller_banned
  - When admin unbans user (PATCH /api/v1/admin/users/:id/unban)
  - Then user isActive = true, shop restored, products with blockReason = "seller_banned" unblocked
- **Scenario 3 (unban preserves other blocks)**
  - Given banned seller with product blocked for "policy_violation" (not seller_banned)
  - When admin unbans user
  - Then product with "policy_violation" remains blocked
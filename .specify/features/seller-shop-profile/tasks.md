# Tasks: Seller Shop Profile

**Feature**: seller-shop-profile  
**Generated from**: plan.md, spec.md, data-model.md, contracts/api.yaml, quickstart.md  
**Total Tasks**: 34

---

## Phase 1: Setup (Project Initialization)

- [ ] T001 Create feature branch `feat/seller-shop-profile` from `main`
- [ ] T002 Verify backend dependencies: `@nestjs/mongoose`, `class-validator`, `class-transformer` installed
- [ ] T003 Verify frontend dependencies: `formik`, `yup`, `@tanstack/react-query`, `zustand`, `axios` installed
- [ ] T004 Ensure MongoDB replica set running (required for transactions in future features)

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T005 [P] Extend User Mongoose schema with Shop sub-document in `backend/src/users/schemas/user.schema.ts`
  - Add `shop` sub-document with `shopName`, `shopSlug`, `pickupAddress`, `joinedAt`
  - Add `version` field for optimistic locking
  - Add unique sparse index on `shop.shopSlug`
- [ ] T006 [P] Create DTOs in `backend/src/users/dto/`
  - `get-profile.dto.ts` (response shape)
  - `update-profile.dto.ts` (fullName, phone, address with class-validator)
  - `setup-shop.dto.ts` (shopName, pickupAddress, phone with class-validator)
- [ ] T007 [P] Create Shop DTO in `backend/src/shops/dto/public-shop.dto.ts` for GET `/shops/:sellerId` response
- [ ] T008 [P] Update `backend/src/auth/guards/jwt-auth.guard.ts` to check `user.isActive` and throw 403 if banned
- [ ] T009 [P] Create `backend/src/common/pipes/validation.pipe.ts` for consistent validation error format (if not exists)

---

## Phase 3: User Story 1 — View Profile & Shop Info (US-SELL-001)

**Goal**: Authenticated user retrieves their profile including shop info (or null)

- [ ] T010 [US1] Implement `UsersService.getProfile(userId)` in `backend/src/users/users.service.ts`
  - Query user by ID, populate shop sub-document
  - Return profile + shop (or null)
- [ ] T011 [US1] Implement `UsersController.getProfile()` in `backend/src/users/users.controller.ts`
  - GET `/users/me` with `JwtAuthGuard`
  - Return 403 if `user.isActive = false`
- [ ] T012 [US1] Create `userService.ts` in `frontend/src/services/user.service.ts`
  - `getProfile()` using TanStack Query
  - Cache key: `['user', 'profile']`
- [ ] T013 [US1] Build `ProfilePage` in `frontend/src/pages/ProfilePage.tsx`
  - Query Stitch MCP: `projects/6249429078653284294/screens/9050b988ae13463ca6d2c730b07b15b4` through `eafa6ea3a27449b1bcb52ea9328b4e48` (5 screens)
  - Display profile fields + shop info (if exists)
  - "Đăng bán" button → redirects to `/shop/setup` if no shop
- [ ] T014 [US1] Apply DESIGN.md tokens: pill buttons (`rounded-full`), two-canvas light, ss03 typography, 1px hairlines
- [ ] T015 [US1] Add WCAG 2.1 AA: semantic HTML, label/input pairing, focus management

---

## Phase 4: User Story 2 — Update Profile (US-SELL-002)

**Goal**: Authenticated user updates fullName, phone (VN format), address

- [ ] T016 [US2] Implement `UsersService.updateProfile(userId, dto)` in `backend/src/users/users.service.ts`
  - Validate phone with VN regex `^(\+84|0)[0-9]{9,10}$`
  - Optimistic lock: check `version`, increment on save
  - Throw 409 on version mismatch
- [ ] T017 [US2] Implement `UsersController.updateProfile()` in `backend/src/users/users.controller.ts`
  - PATCH `/users/me` with `JwtAuthGuard`
  - Use `UpdateProfileDto` validation
- [ ] T018 [US2] Add `updateProfile()` to `frontend/src/services/user.service.ts`
  - TanStack Query mutation with cache invalidation
- [ ] T019 [US2] Build `ProfileForm` component in `frontend/src/components/ProfileForm.tsx`
  - Formik + Yup validation matching backend DTO
  - Phone field with VN format validation
  - Toast on success/error
- [ ] T020 [US2] Integrate `ProfileForm` into `ProfilePage`
- [ ] T021 [US2] Add ARIA live regions for validation errors

---

## Phase 5: User Story 3 — Setup Shop (US-SELL-003)

**Goal**: User sets up shop with shopName, pickupAddress, phone; auto-generates unique shopSlug

- [ ] T022 [US3] Implement `UsersService.setupShop(userId, dto)` in `backend/src/users/users.service.ts`
  - Validate all 3 fields required
  - Generate `shopSlug`: lowercase, spaces→`-`, trim multi-`-`, collision→append `-N`
  - Set `joinedAt` on first setup (immutable)
  - Optimistic lock with `version`
- [ ] T023 [US3] Implement `UsersController.setupShop()` in `backend/src/users/users.controller.ts`
  - PATCH `/users/me/shop` with `JwtAuthGuard`
  - Use `SetupShopDto` validation
- [ ] T024 [US3] Update `AdminUsersController.banUser()` in `backend/src/admin/admin-users.controller.ts`
  - On ban: set `isActive=false`, cascade to products (blockReason="seller_banned")
  - Use MongoDB transaction for atomicity
- [ ] T025 [US3] Update `AdminUsersController.unbanUser()` in `backend/src/admin/admin-users.controller.ts`
  - On unban: set `isActive=true`, restore shop if exists
  - Unblock products with `blockReason="seller_banned"` only
- [ ] T026 [US3] Add `setupShop()` to `frontend/src/services/user.service.ts`
  - TanStack Query mutation, invalidate `['user', 'profile']`
- [ ] T027 [US3] Build `ShopSetupPage` in `frontend/src/pages/ShopSetupPage.tsx`
  - Query Stitch MCP: `projects/6249429078653284294/screens/83f84aab39b040cfbf1b4b8dd51895ea` through `31f0c44e07ff4c0dac56e269b5a3c287` (5 screens)
  - Formik + Yup validation (shopName 3-50, pickupAddress min 10, phone VN)
  - Redirect to `/products/create` on success
- [ ] T028 [US3] Build `ShopSetupForm` component in `frontend/src/components/ShopSetupForm.tsx`
- [ ] T029 [US3] Add "Đăng bán" button in header/nav → redirects to `/shop/setup` if `shopName` null
- [ ] T030 [US3] Apply DESIGN.md tokens, WCAG 2.1 AA, toast notifications

---

## Phase 6: User Story 4 — Public Shop View (US-SELL-004)

**Goal**: Anyone views public shop info (shopName, shopSlug, joinedAt, productCount)

- [ ] T031 [US4] Implement `ShopsService.getPublicShop(sellerId)` in `backend/src/shops/shops.service.ts`
  - Find user by sellerId
  - Return 404 if no shopName OR `isActive=false`
  - Query `productCount`: `sellerId` + `isActive=true` + `isBlocked=false`
- [ ] T032 [US4] Implement `ShopsController.getPublicShop()` in `backend/src/shops/shops.controller.ts`
  - GET `/shops/:sellerId` (no auth)
  - Param validation: MongoDB ObjectId
- [ ] T033 [US4] Create `shopService.ts` in `frontend/src/services/shop.service.ts`
  - `getPublicShop(sellerId)` with TanStack Query
- [ ] T034 [US4] Build `PublicShopPage` in `frontend/src/pages/PublicShopPage.tsx`
  - Query Stitch MCP: `projects/6249429078653284294/screens/e1730c574a0543949db609de5e978b55` (Gian hàng #1)
  - Display shopName, shopSlug, joinedAt, productCount
  - Link to product listing (deferred to US-PRD-002)

---

## Phase 7: Polish & Cross-Cutting

- [ ] T035 Run backend unit tests: `cd backend && pnpm test`
- [ ] T036 Run frontend unit tests: `cd frontend && pnpm test`
- [ ] T037 Run Playwright E2E tests for all 4 user stories
- [ ] T038 Verify Stitch MCP fidelity: all 11 screens matched
- [ ] T039 Verify DESIGN.md compliance: pill buttons, two-canvas, ss03, hairlines
- [ ] T040 Verify WCAG 2.1 AA: axe-core audit, keyboard navigation, screen reader
- [ ] T041 Update `docs/features/seller-shop-profile/README.md` with API docs + FE guide
- [ ] T042 Create `test-plan.md` mapping 20 AC scenarios to test cases (TC-SELL-001 to TC-SELL-020)

---

## Dependency Graph

```
T001-T009 (Setup/Foundational)
    │
    ├── T010-T015 (US1) ──────────────┐
    ├── T016-T021 (US2) ──────────────┤  → T035-T042 (Polish)
    ├── T022-T030 (US3) ──────────────┤       (depends on US1-US4)
    └── T031-T034 (US4) ──────────────┘
```

## Parallel Opportunities

- **Backend**: T010, T016, T022, T031 (all services) can run in parallel
- **Frontend**: T013, T019, T027, T034 (all pages) can run in parallel
- **DTOs/Schemas**: T005-T007 all independent
- **Admin cascade**: T024-T025 can run with US3 backend

## MVP Scope (User Story 1 only)

If time-constrained, deliver **US1 (View Profile)** first:
- T001-T015 → gives users profile view + shop status check
- Enables "Đăng bán" redirect logic
- Blocks US-PRD-001 (product management)

## Implementation Strategy

1. **TDD per story**: Write failing test → implement → verify
2. **Vertical slices**: Each US = complete backend + frontend
3. **Stitch-first FE**: Query MCP screens before writing components
4. **Ponytail**: Use stdlib (native Date, regex), reuse existing guards/services, avoid new abstractions
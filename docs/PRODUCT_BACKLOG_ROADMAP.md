---
project: "Ecommerce Team Project"
tech-stack:
  language: "TypeScript"
  backend: "NestJS + Mongoose ODM"
  frontend: "React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Zustand + TanStack Query + React Router v6 + Axios + Formik/Yup"
  database: "MongoDB"
  infra: "Local dev (MongoDB local / Atlas) + Cloudinary + PayOS"
  test: "Jest (unit) + Playwright (E2E)"
git-mode: "team"
schema-version: "1.3"
---

# 🗺️ Product Backlog & Execution Roadmap

> **Sản phẩm:** `Ecommerce Team Project` — Sàn thương mại điện tử **nhiều người bán** (kiểu Shopee thu gọn): user vừa **đăng bán** vừa **mua** SP vật lý. Luồng: đăng bán SP → xem SP → giỏ hàng → checkout (tách đơn theo người bán) → thanh toán PayOS → người bán xử lý đơn.  
> **Cập nhật lần cuối:** `2026-10-06`  
> **Trạng thái tài liệu:** Living Document — Quản lý tiến độ và đồng bộ với `/command-continue-project` (hoặc `/command-continue-frontend` cho Frontend)
>
> **Ký hiệu trạng thái:**
>
> - `[x]` **Hoàn thành (Done)** — Đã hoàn thiện code, test pass và tài liệu kỹ thuật/hướng dẫn đầy đủ.
> - `[/]` **Đang triển khai (In Progress)** — `/continue` sẽ ưu tiên tiếp tục xử lý cho xong.
> - `[ ]` **Chưa triển khai (To Do / Backlog)** — Đã có đặc tả, sẵn sàng bốc theo thứ tự từ trên xuống.
> - `[!]` **Bị chặn / Cần làm rõ (Blocked / Review Needed)** — Cần quyết định kiến trúc hoặc phụ thuộc module khác.
> - `[~]` **Dự kiến dài hạn (Deferred / Future Phase)** — Tính năng đã ghi nhận nhưng chủ động hoãn lại sang phiên bản sau.

<!-- ASM-BACKLOG-01: Phân công feature cụ thể (ai làm US nào) chưa được xác định — team tự điền vào mục Tasks sau. -->
<!-- ASM-BACKLOG-02: Hosting/deployment target chưa xác định — chỉ cần chạy local trong deadline 1 tuần. -->

---

## 🎨 Stitch MCP Design System & Screen Mock Reference

> **Stitch Project:** `Shopify Vietnam Marketplace Design System`  
> **Project Resource ID:** `projects/6249429078653284294` (Project ID: `6249429078653284294`)  
> **MCP Server:** `StitchMCP` / `stitch` (kết nối qua endpoint `https://stitch.googleapis.com/mcp`)  
> **Design Tokens Authority:** [frontend/DESIGN.md](file:///Users/vutuanhau/Documents/PROJECT/ecommerce-team/frontend/DESIGN.md) (Single Source of Truth)
>
> **MANDATORY FRONTEND WORKFLOW (Khi chạy `/continue-project` hoặc vẽ/triển khai UI):**
>
> 1. Mỗi User Story có danh mục `Stitch Screens` tương ứng bên dưới.
> 2. Trước khi viết hoặc sửa component/page frontend, agent (hoặc `frontend-developer`) **BẮT BUỘC** gọi tool Stitch MCP:
>    `call_mcp_tool(ServerName: 'StitchMCP', ToolName: 'get_screen', Arguments: {name: 'projects/6249429078653284294/screens/<screenId>'})`
> 3. Lấy mã HTML chuẩn từ `htmlCode.downloadUrl` và hình ảnh preview từ `screenshot.downloadUrl`.
> 4. Triển khai giao diện React / Vite bám sát 100% cấu trúc DOM, Tailwind CSS classes và layout từ Stitch screen mock, kết hợp các token chuẩn trong [frontend/DESIGN.md](file:///Users/vutuanhau/Documents/PROJECT/ecommerce-team/frontend/DESIGN.md) (nút pill `rounded-full`, 2-canvas polarity, `ss03` font, 1px hairlines).

---

## 🚫 Explicitly Out of Scope — Won't-Have for MVP

> **CRITICAL:** Đây là "scope fence" bắt buộc — bất kỳ ai (người hay AI) muốn thêm item dưới đây phải mở PR thảo luận trước.

- **NO** mobile native app (iOS/Android) — Web-only.
- **NO** Review / Rating sản phẩm.
- **NO** Voucher / Coupon / Discount code.
- **NO** Role `seller` riêng / đăng ký shop có KYC (CCCD, thuế) — dùng chung 1 tài khoản, bán = có `shopName`.
- **NO** Duyệt SP trước khi hiển thị — Admin kiểm duyệt sau bằng block.
- **NO** Biến thể SP (màu/size), thương hiệu, video SP.
- **NO** Tính phí / chọn đơn vị vận chuyển.
- **NO** Chia tiền / đối soát / rút tiền cho người bán — tiền về tài khoản ngân hàng của sàn (qua PayOS), hoàn tiền Admin chuyển khoản thủ công.
- **NO** Người mua tự hủy đơn / bấm "Đã nhận hàng"; **NO** chat người mua – người bán.
- **NO** Realtime notification (Socket.io / WebSocket).
- **NO** Email transactional (order confirmation email gửi tự động).
- **NO** Analytics / Report dashboard (doanh thu, biểu đồ...).
- **NO** Export PDF / Excel đơn hàng.
- **NO** Offline mode / PWA.
- **NO** Internationalization (i18n) — chỉ Tiếng Việt / VNĐ.
- **NO** Billing / Subscription — đây là bài test, không có plan trả phí.

---

## 📊 Bảng Ma Trận Ưu Tiên MoSCoW & RICE Score

| Mã Epic     | Nghiệp vụ / Tính năng                                                     | Phân loại MoSCoW | RICE Score |    Mức ưu tiên    | Sprint khuyến nghị |
| :---------- | :------------------------------------------------------------------------ | :--------------: | :--------: | :---------------: | :----------------: |
| **EPIC-01** | Auth & User (Đăng ký / Đăng nhập / JWT)                                   |  **Must Have**   |    9.5     | **P0 (Critical)** |      Sprint 1      |
| **EPIC-02** | Category (Admin) & Product (Seller đăng bán + Search/Filter + Upload)     |  **Must Have**   |    9.0     | **P0 (Core USP)** |      Sprint 1      |
| **EPIC-03** | Cart (Guest localStorage + Customer DB + Merge)                           |  **Must Have**   |    8.5     | **P0 (Core USP)** |      Sprint 1      |
| **EPIC-04** | Order & Checkout (Customer · tách đơn theo người bán · Inventory)        |  **Must Have**   |    8.5     | **P0 (Critical)** |      Sprint 2      |
| **EPIC-05** | Payment PayOS theo Checkout (Webhook + đồng bộ + Rollback)                     |  **Must Have**   |    8.0     | **P0 (Critical)** |      Sprint 2      |
| **EPIC-06** | Admin Dashboard (User · Category · Product block · Order)                 |  **Must Have**   |    7.5     |   **P1 (High)**   |      Sprint 2      |
| **EPIC-07** | Go-Live & Production Hardening                                            |  **Must Have**   |    7.0     | **P0 (Blocker)**  |      Sprint 3      |
| **EPIC-08** | Seller (Gian hàng · Đăng bán · Xử lý đơn bán)                             |  **Must Have**   |    9.0     | **P0 (Core USP)** |    Sprint 1 + 2    |

---

## 🗺️ Lộ Trình Phát Hành (Release Roadmap)

```text
[ Sprint 0 - Setup & Architecture ] ──► [ DONE ✅ ]
  ├── SETUP-001: Khởi tạo repo, cấu hình NestJS project + Mongoose
  ├── SETUP-002: Cấu hình global pipes, filters, interceptors (response wrapper)
  └── SETUP-003: Viết .env.example + hướng dẫn setup Cloudinary / MongoDB / PayOS

[ Sprint 1 - Core Foundation (MVP Base) ] ──► [ IN PROGRESS 🔧 ]
  ├── [x] US-AUTH-001: Đăng ký & Đăng nhập
  ├── [x] US-AUTH-002: JWT Refresh Token & Logout
  ├── [x] US-SELL-001: Profile & Thiết lập gian hàng (/users/me, shop)
  ├── [x] US-CAT-001:  Quản lý Category (Admin CRUD)
  ├── US-PRD-001:  Đăng bán & quản lý Product (Seller own / Admin all + Cloudinary Upload)
  ├── US-PRD-002:  Tìm kiếm & Lọc sản phẩm (Public)
  └── US-CART-001: Giỏ hàng Guest (localStorage) + Customer (DB) + Merge

[ Sprint 2 - Commerce Core ] ──► [ TO DO 📋 ]
  ├── US-ORD-001:  Tạo Checkout & đơn hàng (tách đơn theo người bán)
  ├── US-PAY-001:  Tích hợp PayOS theo Checkout + Webhook/đồng bộ + Rollback stock
  ├── US-ORD-002:  Lịch sử đơn mua (Customer) · Xem mọi đơn (Admin)
  ├── US-SELL-002: Đơn bán — Seller xử lý đơn của mình (Seller + Admin cập nhật trạng thái)
  └── US-ADM-001:  Admin Dashboard (User ban/unban + block SP · Product block)

[ Sprint 3 - Production Hardening & Go-Live ] ──► [ GO-LIVE 🚀 ]
  ├── US-DEPLOY-01: Security Hardening (Pre-Deploy)
  ├── US-DEPLOY-02: Database Setup & Migration
  ├── US-DEPLOY-03: Backend API Deployment & Health Check
  ├── US-DEPLOY-04: Frontend Deployment & Routing Fallback
  └── US-DEPLOY-05: End-to-End Smoke Test (Playwright)
```

---

## ⚙️ Sprint 0: Project Setup & Architecture

> Sprint 0 là công việc setup một lần, không cần BA pipeline.  
> Dùng Micro-Task Fast-Track: Setup → Verify → Commit.

- [x] **SETUP-001**: Khởi tạo NestJS project, cấu hình Mongoose, kết nối MongoDB
- [x] **SETUP-002**: Cấu hình global: `ValidationPipe`, `GlobalExceptionFilter`, `ResponseInterceptor` (wrap `{ success, data, message }`)
- [x] **SETUP-003**: Viết `.env.example` đầy đủ + hướng dẫn lấy credentials (MongoDB Atlas, Cloudinary, VNPay sandbox)
- [x] **SETUP-004**: Cấu hình CORS (cho phép `FRONTEND_URL`), setup Git branches (`main` / `dev` / `feature/*`)

---

## 🎯 Sprint 1: Core Foundation — Auth, Catalog & Cart

> **Mục tiêu Sprint:** Người dùng có thể đăng ký, đăng nhập, thiết lập gian hàng và đăng bán sản phẩm, xem sản phẩm theo danh mục, tìm kiếm, và quản lý giỏ hàng (nhóm theo người bán).

---

- [x] **US-AUTH-001**: Đăng ký & Đăng nhập tài khoản
  - **Slug:** `auth-register-login`
  - **Effort:** M
  - **Context-budget:** single-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** _(none)_
  - **Blocks:** `US-AUTH-002`, `US-SELL-001`, `US-CAT-001`, `US-PRD-001`, `US-CART-001`, `US-ORD-001`, `US-ADM-001`
  - **Mô tả:** Người dùng có thể tạo tài khoản mới bằng email & mật khẩu, và đăng nhập để nhận JWT token.
  - **Acceptance Criteria (AC):**
    - [x] `POST /api/v1/auth/register` với email/password/fullName hợp lệ → trả về 201 và thông tin user (không có password).
    - [x] `POST /api/v1/auth/register` với email đã tồn tại → trả về 409 Conflict.
    - [x] `POST /api/v1/auth/login` với đúng credentials → trả về `accessToken` + `refreshToken` + thông tin user.
    - [x] `POST /api/v1/auth/login` với sai password → trả về 401 Unauthorized.
    - [x] `POST /api/v1/auth/login` với tài khoản `isActive = false` → trả về 403 "Tài khoản đã bị khóa".
    - [x] Password được lưu dưới dạng bcrypt hash, không bao giờ trả về plain text.
    - [x] FE: Form đăng ký / đăng nhập hiển thị đúng validation errors (email format, password min length).
  - **Tasks:**
    - [x] **Backend:** `User schema (email unique, password bcrypt, role enum, isActive, refreshToken)` · `POST /auth/register DTO + Service` · `POST /auth/login + JwtStrategy (access 15m)`
    - [x] **Frontend:** `Trang /register + /login` · `Axios instance với Authorization header` · `Lưu token vào localStorage/cookie`
  - **Stitch Screens (`projects/6249429078653284294`):**
    - `projects/6249429078653284294/screens/02985eddb2fb4abc9abbbacc958c5125` ("Đăng ký #1")
    - `projects/6249429078653284294/screens/8aef4bda458748e3965b9ff87dea6d9e` ("Đăng nhập #1")
    - `projects/6249429078653284294/screens/09105e18166d40c78a373db2fec4e69a` ("Đăng nhập #2")
    - `projects/6249429078653284294/screens/768be101e7204ff781a68f919732ceb9` ("Đăng nhập #3")
  - **Deliverables khi [x]:**
    - `.specify/features/auth-register-login/baseline.md` (SIGNED-OFF)
    - `docs/features/auth-register-login/README.md`

---

- [x] **US-AUTH-002**: JWT Refresh Token & Đăng xuất
  - **Slug:** `auth-refresh-logout`
  - **Effort:** S
  - **Context-budget:** single-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-AUTH-001`
  - **Blocks:** _(none)_
  - **Mô tả:** Access Token hết hạn sau 15 phút; hệ thống tự động làm mới bằng Refresh Token mà không cần người dùng đăng nhập lại.
  - **Acceptance Criteria (AC):**
    - [x] `POST /api/v1/auth/refresh` với Refresh Token hợp lệ → trả về `accessToken` mới.
    - [x] `POST /api/v1/auth/refresh` với Refresh Token hết hạn / không hợp lệ → trả về 401.
    - [x] `POST /api/v1/auth/logout` → xóa refreshToken trong DB; token cũ không dùng được nữa.
    - [x] FE: Axios interceptor tự động gọi `/auth/refresh` khi nhận 401, retry request gốc.
    - [x] FE: Nếu refresh thất bại → redirect về trang đăng nhập.
  - **Tasks:**
    - [x] **Backend:** `JwtRefreshStrategy` · `POST /auth/refresh` · `POST /auth/logout (xóa refreshToken field)`
    - [x] **Frontend:** `Axios response interceptor retry logic` · `Auth store (Zustand/Pinia/Redux) quản lý token state`
  - **Stitch Screens (`projects/6249429078653284294`):**
    - `projects/6249429078653284294/screens/8aef4bda458748e3965b9ff87dea6d9e` ("Đăng nhập #1 - Logout state")
  - **Deliverables khi [x]:**
    - `.specify/features/auth-refresh-logout/baseline.md` (SIGNED-OFF)
    - `docs/features/auth-refresh-logout/README.md`

---

- [x] **US-SELL-001**: Profile & Thiết lập gian hàng
  - **Slug:** `seller-shop-profile`
  - **Effort:** S
  - **Context-budget:** single-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-AUTH-001`
  - **Blocks:** `US-PRD-001`
  - **Mô tả:** Mọi user đã đăng nhập có profile (dùng prefill checkout) và có thể thiết lập gian hàng (`shopName`, `pickupAddress`) để đủ điều kiện đăng bán. Không có role seller riêng, không KYC, không duyệt.
  - **Acceptance Criteria (AC):**
    - [x] `GET /api/v1/users/me` → trả profile + `shopName`/`pickupAddress` (null nếu chưa có).
    - [x] `PATCH /api/v1/users/me` → cập nhật `fullName`, `phone`, `address`.
    - [x] `PATCH /api/v1/users/me/shop` với `shopName` (3–50 ký tự) + `pickupAddress` hợp lệ → 200; thiếu hoặc sai độ dài → 400.
    - [x] `GET /api/v1/shops/:sellerId` (public) → `shopName`, `joinedAt`, `productCount`; 404 nếu user chưa có shop hoặc đang bị ban.
    - [x] FE: `ProfilePage`, `ShopSetupPage`; nút "Đăng bán" dẫn tới ShopSetup nếu `shopName = null`.
  - **Tasks:**
    - [x] **Backend:** `UsersController (/users/me, /users/me/shop)` · `DTO validate` · `ShopsController GET /shops/:sellerId`
    - [x] **Frontend:** `ProfilePage` · `ShopSetupPage` · `user.service.ts`, `shop.service.ts`
  - **Stitch Screens (`projects/6249429078653284294`):**
    - `projects/6249429078653284294/screens/9050b988ae13463ca6d2c730b07b15b4` ("Hồ sơ cá nhân #1")
    - `projects/6249429078653284294/screens/a21dfd8e75df43268fa2d00b6cd6b893` ("Hồ sơ cá nhân #2")
    - `projects/6249429078653284294/screens/ddd931344629411ea3eacc05c0af060d` ("Hồ sơ cá nhân #3")
    - `projects/6249429078653284294/screens/395c3ba87bc74b328bd1789b50b81cb5` ("Hồ sơ cá nhân #4")
    - `projects/6249429078653284294/screens/eafa6ea3a27449b1bcb52ea9328b4e48` ("Hồ sơ cá nhân #5")
    - `projects/6249429078653284294/screens/83f84aab39b040cfbf1b4b8dd51895ea` ("Thiết lập gian hàng #1")
    - `projects/6249429078653284294/screens/7e5b80bb13924e8cb1514e86b79b166a` ("Thiết lập gian hàng #2")
    - `projects/6249429078653284294/screens/51af699cf89848f38ac24486deda345c` ("Thiết lập gian hàng #3")
    - `projects/6249429078653284294/screens/f3b0cfacde2943db858d1c14d3aef36c` ("Thiết lập gian hàng #4")
    - `projects/6249429078653284294/screens/31f0c44e07ff4c0dac56e269b5a3c287` ("Thiết lập gian hàng #5")
    - `projects/6249429078653284294/screens/e1730c574a0543949db609de5e978b55` ("Gian hàng #1")
  - **Deliverables khi [x]:**
    - `.specify/features/seller-shop-profile/baseline.md` (SIGNED-OFF)
    - `docs/features/seller-shop-profile/README.md`

---

- [x] **US-CAT-001**: Quản lý Category (Admin CRUD)
  - **Slug:** `category-management`
  - **Effort:** M
  - **Context-budget:** single-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-AUTH-001`
  - **Blocks:** `US-PRD-001`
  - **Mô tả:** Admin có thể tạo, sửa, xóa danh mục sản phẩm (danh mục dùng chung toàn sàn — người bán chỉ chọn). Người dùng có thể xem danh sách danh mục để lọc sản phẩm.
  - **Acceptance Criteria (AC):**
    - [x] `GET /api/v1/categories` (public) → trả về danh sách category đang active.
    - [x] `POST /api/v1/categories` (Admin) → tạo category mới, `slug` tự động từ `name`.
    - [x] `POST /api/v1/categories` với tên trùng → trả về 409 Conflict.
    - [x] `PATCH /api/v1/categories/:id` (Admin) → cập nhật tên/mô tả/ảnh.
    - [x] `DELETE /api/v1/categories/:id` khi còn sản phẩm (của bất kỳ shop nào) đang dùng → trả về 400 với thông báo rõ ràng.
    - [x] FE Admin: Màn hình danh sách category, form tạo/sửa, nút xóa với confirm.
    - [x] FE Public: Danh mục hiển thị trên sidebar/nav để lọc sản phẩm.
  - **Tasks:**
    - [x] **Backend:** `Category schema (name unique, slug, description, imageUrl, isActive)` · `CRUD endpoints` · `Validate no-delete khi có product` · `RolesGuard`
    - [x] **Frontend:** `Admin: CategoryList, CategoryForm components` · `Public: CategoryNav/Sidebar`
  - **Stitch Screens (`projects/6249429078653284294`):**
    - `projects/6249429078653284294/screens/920a53a998bd4e8e8b0b16ec16a08793` ("Admin danh mục #1")
    - `projects/6249429078653284294/screens/4ff01870d2a9498b8f48f72196b0383c` ("Admin danh mục #2")
    - `projects/6249429078653284294/screens/b3ff9a13af8b42c7b154bc1730ab9471` ("Admin danh mục #3")
  - **Deliverables khi [x]:**
    - `.specify/features/category-management/baseline.md` (SIGNED-OFF)
    - `docs/features/category-management/README.md`

---

- [x] **US-PRD-001**: Đăng bán & quản lý Product (Seller sở hữu / Admin) + Upload ảnh Cloudinary
  - **Slug:** `product-management`
  - **Effort:** L
  - **Context-budget:** multi-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-CAT-001`, `US-SELL-001`
  - **Blocks:** `US-PRD-002`, `US-CART-001`
  - **Mô tả:** User đã thiết lập gian hàng đăng bán sản phẩm (giá, stock, ảnh Cloudinary, category) và chỉ quản lý được SP **của mình**. Admin thao tác được trên mọi SP.
  - **Acceptance Criteria (AC):**
    - [x] `POST /api/v1/products` (✅ Login) → tạo SP; `sellerId` gán từ token (bỏ qua `sellerId` trong body).
    - [x] `POST /products` khi chưa thiết lập gian hàng → 403 "Vui lòng thiết lập thông tin gian hàng trước khi đăng bán".
    - [x] `name` tối đa 120 ký tự; tối đa 5 ảnh / SP — vượt quá → 400.
    - [x] `POST /api/v1/upload/image` (✅ Login) → upload Cloudinary, trả URL; chỉ jpg/png/webp, ≤5MB.
    - [x] `GET /api/v1/products/my` → danh sách SP của mình, gồm cả ẩn / bị block (kèm `blockReason`).
    - [x] `PATCH /api/v1/products/:id` bởi chủ SP → 200; bởi user khác → 403; bởi Admin → 200.
    - [x] `DELETE /api/v1/products/:id` → soft delete (`isActive = false`), cùng quy tắc quyền như PATCH.
    - [x] Seller tắt `isActive` thì SP biến khỏi danh sách công khai; bật lại được **trừ khi** `isBlocked = true`.
    - [x] `stock` không thể lưu giá trị âm — validation ở DTO level; `sellerId` không đổi được sau khi tạo.
    - [x] FE Seller: `MyProductsPage`, `ProductFormPage` với preview ảnh, chọn category từ dropdown, nút "Lưu & Hiển thị".
  - **Tasks:**
    - [x] **Backend:** `Product schema (sellerId, name, slug, description, price, stock, images[], categoryId, isActive, isBlocked, blockReason)` · `Indexes (text, sellerId, categoryId, price)` · `Upload service (Cloudinary SDK)` · `CRUD endpoints + assertOwnerOrAdmin`
    - [x] **Frontend:** `Seller: MyProductsPage, ProductFormPage (image uploader)` · `Cloudinary upload helper`
  - **Stitch Screens (`projects/6249429078653284294`):**
    - `projects/6249429078653284294/screens/83cc94525dd147f7940b903c7d0c2c0e` ("Sản phẩm Seller #1")
    - `projects/6249429078653284294/screens/5d142b4a1b0b4fa4a44dec4eb8a0f663` ("Sản phẩm Seller #2")
    - `projects/6249429078653284294/screens/7a36342acde64677b81cae2e5ce5a869` ("Sản phẩm Seller #3")
    - `projects/6249429078653284294/screens/f168b81425464e61b9921f046afe846c` ("Sửa sản phẩm #1")
    - `projects/6249429078653284294/screens/5ec23849249240a0b66d803a5ee74208` ("Sửa sản phẩm #2")
    - `projects/6249429078653284294/screens/21d590e68a854cf2972fdb21fdc22db5` ("Sửa sản phẩm #3")
    - `projects/6249429078653284294/screens/bb1664e79d6c4819ad248a781219cc70` ("Sửa sản phẩm #4")
  - **Deliverables khi [x]:**
    - `.specify/features/product-management/baseline.md` (SIGNED-OFF)
    - `docs/features/product-management/README.md`

---

- [x] **US-PRD-002**: Xem & Tìm kiếm sản phẩm (Public)
  - **Slug:** `product-catalog-search`
  - **Effort:** M
  - **Context-budget:** single-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-PRD-001`
  - **Blocks:** `US-CART-001`
  - **Mô tả:** Người dùng (Guest & Customer) có thể xem danh sách sản phẩm, tìm kiếm theo tên, lọc theo danh mục và khoảng giá.
  - **Acceptance Criteria (AC):**
    - [x] `GET /api/v1/products` → danh sách phân trang (page, limit) chỉ hiện sản phẩm `isActive = true` **và** `isBlocked = false`.
    - [x] Query param `?search=iphone` → lọc theo tên (text search MongoDB).
    - [x] Query param `?categoryId=xxx` → lọc theo danh mục.
    - [x] Query param `?sellerId=xxx` → lọc theo người bán (trang shop).
    - [x] Query param `?minPrice=100000&maxPrice=5000000` → lọc theo khoảng giá.
    - [x] Query param `?sortBy=price&order=asc` → sắp xếp đúng.
    - [x] Sản phẩm `stock = 0` hiển thị badge "Hết hàng" — không thể thêm vào giỏ.
    - [x] `GET /api/v1/products/:id` → chi tiết sản phẩm (ảnh, giá, mô tả, stock, category name, `seller.shopName`); SP ẩn/bị block → 404 trừ Owner/Admin.
    - [x] FE: Trang danh sách SP (ProductGrid) + trang chi tiết SP (ProductDetail).
  - **Tasks:**
    - [x] **Backend:** `GET /products với query builder (search, filter, sort, paginate, sellerId)` · `GET /products/:id populate category + seller (OptionalJwtAuthGuard)`
    - [x] **Frontend:** `ProductGrid, ProductCard, ProductDetail components` · `FilterSidebar, SearchBar` · `Pagination component`
  - **Stitch Screens (`projects/6249429078653284294`):**
    - `projects/6249429078653284294/screens/afed4199f8c8486ea1a1904e7a12d153` ("Trang chủ & Danh mục Sản phẩm")
    - `projects/6249429078653284294/screens/8413ebf43e9d47b494683ca906fa588b` ("Trang chi tiết sản phẩm - còn hàng - chưa đăng nhập")
    - `projects/6249429078653284294/screens/4c756c2b30054366b14cd2fd91a18fd8` ("Trang chi tiết sản phẩm - còn hàng - đã đăng nhập")
    - `projects/6249429078653284294/screens/081b2700c87241cfbef33163c7e4c7a1` ("Trang chi tiết sản phẩm - hết hàng")
    - `projects/6249429078653284294/screens/a802c43fb1634c28a481531f4921da36` ("Trang chi tiết sản phẩm - chủ shop")
    - `projects/6249429078653284294/screens/1341ece6fb2b44368a32940c3b5938cc` ("Trang chi tiết sản phẩm - chủ shop - sản phẩm bị cấm")
  - **Deliverables khi [x]:**
    - `.specify/features/product-catalog-search/baseline.md` (SIGNED-OFF)
    - `docs/features/product-catalog-search/README.md`

---

- [ ] **US-CART-001**: Giỏ hàng (Guest localStorage + Customer DB + Merge khi đăng nhập)
  - **Slug:** `cart-management`
  - **Effort:** L
  - **Context-budget:** multi-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-PRD-002`, `US-AUTH-001`
  - **Blocks:** `US-ORD-001`
  - **Mô tả:** Guest có giỏ hàng lưu localStorage; Customer có giỏ hàng lưu DB. Khi đăng nhập, giỏ localStorage được merge vào giỏ DB. Admin không mua nên không có giỏ. Giỏ luôn hiện giá hiện tại; SP hết hàng / ngừng bán / vượt tồn kho vẫn nằm trong giỏ kèm trạng thái để người mua tự xử lý.
  - **Acceptance Criteria (AC):**
    - [ ] Guest bấm "Thêm giỏ" → lưu localStorage (`productId`, `quantity`); bấm "Đặt hàng" → FE chuyển sang trang đăng nhập. Mọi endpoint `/api/v1/cart/*` yêu cầu JWT (thiếu token → 401).
    - [ ] Sau đăng nhập: `POST /api/v1/cart/merge` gộp giỏ localStorage vào DB (cộng dồn, cap ở stock, tự bỏ SP của mình / ngừng bán / hết hàng), FE xóa localStorage.
    - [ ] Admin gọi bất kỳ endpoint `/api/v1/cart/*` → 403 (Admin chỉ kiểm duyệt, không mua).
    - [ ] Customer: `GET /api/v1/cart` → giỏ từ DB, **nhóm theo người bán** (`groups[].seller`, `subtotal`) + `totalAmount`; mỗi item có `status` (`available` / `exceeds_stock` / `out_of_stock` / `unavailable`) và giá hiện tại; chỉ item `available` được cộng tiền.
    - [ ] Customer: `POST /api/v1/cart/items` → thêm item (đã có thì cộng dồn), validate stock; **SP của chính mình → 400**; tối đa 100 SP khác nhau.
    - [ ] Customer: `PATCH /api/v1/cart/items/:productId` → đặt lại quantity (≤ stock).
    - [ ] Customer: `DELETE /api/v1/cart/items/:productId` → xóa item; `DELETE /api/v1/cart` → xóa toàn bộ.
    - [ ] SP hết hàng / bị ẩn / bị block **vẫn giữ trong giỏ** kèm trạng thái, không mua được; stock giảm dưới số lượng → giữ nguyên số lượng, đánh dấu `exceeds_stock`.
    - [ ] FE: Trang giỏ hàng (CartPage) hiển thị items **theo từng shop** (subtotal mỗi shop), badge trạng thái, tổng tiền VNĐ, nút checkout.
  - **Tasks:**
    - [ ] **Backend:** `Cart schema (userId unique, items[{productId, quantity}])` · `Cart service: add/update/remove/clear/merge + group by sellerId + item status khi GET` · `Guard: JwtAuthGuard + RolesGuard (Admin → 403)`
    - [ ] **Frontend:** `cartStore (localStorage cho Guest, API cho Customer)` · `CartPage, CartItem components` · `Merge cart on login action`
  - **Stitch Screens (`projects/6249429078653284294`):**
    - `projects/6249429078653284294/screens/1d4ed0d033504890b15319f87737841e` ("Giỏ hàng #1")
    - `projects/6249429078653284294/screens/a75d371cbb2348d88d117ee45c31a744` ("Giỏ hàng #2")
  - **Deliverables khi [x]:**
    - `.specify/features/cart-management/baseline.md` (SIGNED-OFF)
    - `docs/features/cart-management/README.md`

---

## 🛒 Sprint 2: Commerce Core — Order, Payment & Admin

> **Mục tiêu Sprint:** Luồng mua – bán hoàn chỉnh: checkout nhiều shop → thanh toán PayOS một lần → người bán xử lý đơn của mình → admin giám sát.

---

- [ ] **US-ORD-001**: Tạo Checkout & đơn hàng (tách đơn theo người bán)
  - **Slug:** `order-checkout`
  - **Effort:** L
  - **Context-budget:** multi-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-CART-001`
  - **Blocks:** `US-PAY-001`, `US-ORD-002`, `US-SELL-002`
  - **Mô tả:** Người mua đã đăng nhập (Customer; Admin không mua) tạo đơn từ giỏ hàng. Hệ thống nhóm item theo người bán, tạo **1 Checkout + N Order** (mỗi shop 1 Order), thanh toán một lần qua PayOS (1 payment link).
  - **Acceptance Criteria (AC):**
    - [ ] `POST /api/v1/orders` (🔒 yêu cầu đăng nhập — không có Guest checkout; Admin → 403) → tạo Checkout + các Order, trừ stock ngay.
    - [ ] Giỏ có SP của 2 shop → tạo đúng 2 Order, mỗi Order có `sellerId` và `totalAmount` riêng; `Checkout.totalAmount` = tổng.
    - [ ] Giá và tên SP lấy từ DB, bỏ qua `price` do client gửi.
    - [ ] `recipient` tự lấy từ profile, cho phép override address; profile thiếu `phone`/`address` mà body không bổ sung → 400 (BR-CHK-008).
    - [ ] Có bất kỳ SP nào `stock < quantity` (hoặc SP ẩn/block) → 400 kèm danh sách SP thiếu hàng, **transaction abort: không tạo Checkout/Order nào, stock không đổi**.
    - [ ] Customer mua SP của chính mình → 400.
    - [ ] Trừ stock nguyên tử (`stock >= qty`); 2 người mua SP cuối cùng cùng lúc → chỉ 1 người thành công.
    - [ ] Tạo Checkout (trừ stock + Checkout + N Order) chạy trong **1 MongoDB transaction** (`session.withTransaction`, BR-CHK-010); lỗi giữa chừng → không còn stock bị giữ mà không có Order.
    - [ ] Response trả `checkoutId`, `checkoutCode`, `totalAmount`, `expiresAt`, `orders[]`, `paymentUrl` (trang thanh toán PayOS). Mọi Order mặc định `pending`.
    - [ ] FE: Trang Checkout (form recipient) → "Thanh toán" → redirect sang trang thanh toán PayOS; trang kết quả `/checkout/result` liệt kê các đơn.
  - **Tasks:**
    - [ ] **Backend:** `Checkout schema + Order schema (checkoutId, sellerId, sellerShopName, userId, recipient, items snapshot, totalAmount, status, paymentStatus)` · `POST /orders: group by seller, atomic decrement, session.withTransaction (all-or-nothing), tạo payment link PayOS sau commit (lỗi → Checkout failed + restockAndCancel)` · `orderCode/checkoutCode generator` · `restockAndCancel() dùng chung`
    - [ ] **Frontend:** `CheckoutPage (prefill recipient từ profile)` · `CheckoutResultPage (success/fail)`
  - **Stitch Screens (`projects/6249429078653284294`):**
    - `projects/6249429078653284294/screens/a9f65d6cc9de44bbb27efeec4e04885e` ("Thanh toán #1")
    - `projects/6249429078653284294/screens/dcd5e43670f04767b433a747184b9d53` ("Thanh toán #2")
  - **Deliverables khi [x]:**
    - `.specify/features/order-checkout/baseline.md` (SIGNED-OFF)
    - `docs/features/order-checkout/README.md`

---

- [ ] **US-PAY-001**: Tích hợp PayOS theo Checkout — Webhook + đồng bộ trạng thái + Rollback Stock
  - **Slug:** `payment-payos`
  - **Effort:** L
  - **Context-budget:** multi-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-ORD-001`
  - **Blocks:** `US-ORD-002`, `US-SELL-002`
  - **Mô tả:** Một payment link PayOS cho cả Checkout. Thành công → mọi Order con `confirmed`; người mua hủy / hết hạn → mọi Order con `cancelled` và rollback stock.
  - **Acceptance Criteria (AC):**
    - [ ] Tạo payment link sau khi commit: `orderCode = payosOrderCode` (số nguyên unique), `amount = totalAmount`, `description` ≤ 9 ký tự, `returnUrl` / `cancelUrl` = `FRONTEND_URL/checkout/result?checkoutCode=...`, `expiredAt = expiresAt`, `signature` HMAC-SHA256 đúng. Tạo link lỗi → Checkout `failed`, hoàn stock, trả 502.
    - [ ] `POST /api/v1/payments/payos/webhook` → verify `signature` (HMAC-SHA256 trên `data`) + `orderCode` + số tiền; sai chữ ký → 400, còn lại luôn 200.
    - [ ] Thanh toán thành công → Checkout `paid`; **tất cả** Order con `pending → confirmed`, `paymentStatus = paid`.
    - [ ] Người mua hủy trên trang PayOS (link `CANCELLED`) → Checkout `failed`; **tất cả** Order con `cancelled` (`cancelledBy = system`), rollback stock từng item.
    - [ ] `GET /api/v1/checkouts/:checkoutCode` khi Checkout còn `pending` → tra cứu PayOS và gọi **cùng hàm xử lý idempotent** với webhook (chạy được trên localhost không cần webhook).
    - [ ] Webhook / đồng bộ / cron đến trùng hoặc cùng lúc → chỉ xử lý 1 lần (idempotency theo trạng thái Checkout).
    - [ ] Mọi webhook (kể cả sai chữ ký) và mọi lần đồng bộ lưu vào collection `payments`.
    - [ ] `@Cron` mỗi phút: Checkout `pending` quá `expiresAt` (30 phút) → tra cứu PayOS; chưa trả → hủy link PayOS → `expired`, hủy Order `pending`, rollback stock.
    - [ ] Thanh toán thành công đến **sau** khi Checkout `expired` / `failed` → ghi `payments.note = late_success_after_expiry`, không mở lại đơn; Admin chuyển khoản hoàn tiền thủ công.
  - **Tasks:**
    - [ ] **Backend:** `PayOS service (tạo link, tra cứu, hủy link, verify signature) — SDK @payos/node hoặc REST` · `payosOrderCode generator` · `processPaymentResult() idempotent` · `POST /payments/payos/webhook` · `đồng bộ trong GET /checkouts/:checkoutCode` · `Payment schema` · `Scheduled job (@Cron) checkout expiry`
    - [ ] **Frontend:** `CheckoutResultPage (chỉ đọc checkoutCode, bỏ qua query của PayOS; poll GET /checkouts/:checkoutCode khi còn pending)`
  - **Stitch Screens (`projects/6249429078653284294`):**
    - `projects/6249429078653284294/screens/8ae6276570db4feab1d1900f086080a7` ("Đặt hàng thành công #1")
    - `projects/6249429078653284294/screens/e86a9d6dc00e46b08a2c1b0eb4c64195` ("Đặt hàng thành công #2")
    - `projects/6249429078653284294/screens/77f9ff7b7697478f87b763edda743499` ("Đặt hàng thành công #3")
    - `projects/6249429078653284294/screens/a752f82e0965438d80e3d2d0b2e5952f` ("Đặt hàng thành công #4")
  - **Deliverables khi [x]:**
    - `.specify/features/payment-payos/baseline.md` (SIGNED-OFF)
    - `docs/features/payment-payos/README.md`

---

- [ ] **US-ORD-002**: Lịch sử đơn mua (Customer) & Xem mọi đơn (Admin)
  - **Slug:** `order-management`
  - **Effort:** M
  - **Context-budget:** single-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-PAY-001`
  - **Blocks:** `US-ADM-001`
  - **Mô tả:** Người mua xem lịch sử đơn **đã mua** của mình (mỗi đơn gắn một shop). Admin xem tất cả đơn của mọi shop. Việc **cập nhật trạng thái** nằm ở `US-SELL-002`.
  - **Acceptance Criteria (AC):**
    - [ ] `GET /api/v1/orders/my` (✅ Login) → đơn mình đã mua (phân trang, mới nhất trước), mỗi đơn có `seller.shopName`, `checkoutCode`.
    - [ ] `GET /api/v1/orders/my/:id` → chi tiết (items snapshot, recipient, status, totalAmount); đơn của người khác → 404.
    - [ ] `GET /api/v1/orders` (Admin) → tất cả đơn, lọc `status`, `sellerId`, `userId`.
    - [ ] `GET /api/v1/orders/:id` (Admin) → chi tiết đơn bất kỳ.
    - [ ] FE Customer: Trang lịch sử đơn + chi tiết đơn với badge trạng thái; đơn cùng `checkoutCode` được nhóm hiển thị.
    - [ ] FE Admin: Bảng quản lý đơn hàng.
  - **Tasks:**
    - [ ] **Backend:** `GET /orders/my, GET /orders/my/:id (lọc theo userId)` · `GET /orders, GET /orders/:id (Admin guard)` · `Route order: /my, /selling trước /:id`
    - [ ] **Frontend:** `OrderHistoryPage, OrderDetailPage (Customer)` · `Admin: OrderTable`
  - **Stitch Screens (`projects/6249429078653284294`):**
    - `projects/6249429078653284294/screens/abc4f7ce9a6d47d18fd4da7b1b795f7f` ("Đơn mua #1")
    - `projects/6249429078653284294/screens/85f7cc5578444927b949f7c172d5a3d5` ("Đơn mua #2")
    - `projects/6249429078653284294/screens/1f1b19fb62d94d6a87b8e088d9204470` ("Đơn mua #3")
    - `projects/6249429078653284294/screens/bb27c32c915444449dd7422d34dbe10f` ("Đơn mua #4")
  - **Deliverables khi [x]:**
    - `.specify/features/order-management/baseline.md` (SIGNED-OFF)
    - `docs/features/order-management/README.md`

---

- [ ] **US-SELL-002**: Đơn bán — Seller xử lý đơn của mình (Seller + Admin cập nhật trạng thái)
  - **Slug:** `seller-order-fulfillment`
  - **Effort:** M
  - **Context-budget:** single-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-PAY-001`
  - **Blocks:** `US-ADM-001`
  - **Mô tả:** Người bán xem các đơn chứa SP của mình và đẩy trạng thái giao hàng. Admin cập nhật được mọi đơn. Người mua chỉ xem.
  - **Acceptance Criteria (AC):**
    - [ ] `GET /api/v1/orders/selling` → chỉ đơn có `sellerId` = mình, lọc theo `status`, phân trang.
    - [ ] `GET /api/v1/orders/selling/:id` → chi tiết; đơn của shop khác → 404.
    - [ ] `PATCH /api/v1/orders/:id/status` bởi Seller của đơn: `confirmed→shipping`, `shipping→delivered`, `confirmed→cancelled` (kèm `reason` bắt buộc) → 200.
    - [ ] Seller không phải chủ đơn → 403; Seller đặt `refunded` → 403.
    - [ ] Admin: ngoài các chuyển trên còn `cancelled→refunded` (chỉ khi `paymentStatus = paid`).
    - [ ] Không ai đặt tay `confirmed` / `pending` qua API → 400 (`confirmed` chỉ do PayOS).
    - [ ] Chuyển sai chiều (vd `delivered→shipping`) → 400 với thông báo rõ ràng.
    - [ ] Hủy đơn → hoàn stock đúng 1 lần; gọi hủy 2 lần không hoàn trùng.
    - [ ] Hai đơn con của cùng Checkout có trạng thái độc lập.
    - [ ] FE Seller: `SellerOrdersPage` — lọc trạng thái, nút Giao hàng / Đã giao / Hủy (dialog nhập lý do).
  - **Tasks:**
    - [ ] **Backend:** `GET /orders/selling (+/:id)` · `PATCH /orders/:id/status (state machine + phân quyền Seller/Admin)` · `Dùng restockAndCancel()`
    - [ ] **Frontend:** `Seller: SellerOrdersPage, StatusActionButtons, CancelReasonDialog`
  - **Stitch Screens (`projects/6249429078653284294`):**
    - `projects/6249429078653284294/screens/b30d797401a6417ea8867c848a24aae9` ("Đơn bán #1")
    - `projects/6249429078653284294/screens/f341d2143d594f55936b40b371e28bfc` ("Đơn bán #2")
    - `projects/6249429078653284294/screens/72383f62c34e4e628c0aaea30c9c6a88` ("Đơn bán #3")
    - `projects/6249429078653284294/screens/2a049bb3254142ff9b1d5a109ba58e81` ("Đơn bán #4")
    - `projects/6249429078653284294/screens/578e8e3373c64989ac9d43b04ca8ec63` ("Đơn bán #5")
  - **Deliverables khi [x]:**
    - `.specify/features/seller-order-fulfillment/baseline.md` (SIGNED-OFF)
    - `docs/features/seller-order-fulfillment/README.md`

---

- [ ] **US-ADM-001**: Admin Dashboard — Quản lý User & kiểm duyệt SP
  - **Slug:** `admin-user-management`
  - **Effort:** M
  - **Context-budget:** single-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-ORD-002`, `US-SELL-002`
  - **Blocks:** _(none)_
  - **Mô tả:** Admin xem danh sách user, ban/unban tài khoản vi phạm (kéo theo block SP của người bán đó) và block/unblock từng sản phẩm vi phạm.
  - **Acceptance Criteria (AC):**
    - [ ] `GET /api/v1/admin/users` (Admin) → danh sách user, lọc `role`/`isActive`/`search`, phân trang.
    - [ ] `PATCH /api/v1/admin/users/:id/ban` → set `isActive = false`; user bị ban không đăng nhập được; **toàn bộ SP của user bị block** (`blockReason = seller_banned`).
    - [ ] `PATCH /api/v1/admin/users/:id/unban` → set `isActive = true`; chỉ mở lại SP có `blockReason = seller_banned`.
    - [ ] `GET /api/v1/admin/products` → mọi SP kể cả ẩn/bị block, lọc `isBlocked`, `sellerId`.
    - [ ] `PATCH /api/v1/admin/products/:id/block` với `reason` bắt buộc → SP biến khỏi danh sách công khai, Seller vẫn thấy kèm lý do và không tự mở lại được.
    - [ ] `PATCH /api/v1/admin/products/:id/unblock` → SP hiển thị lại (nếu `isActive = true`).
    - [ ] Admin không thể ban chính mình → trả về 400.
    - [ ] Login với tài khoản `isActive = false` → trả về 403 "Tài khoản đã bị khóa".
    - [ ] FE Admin: Trang danh sách user với nút Ban/Unban, badge trạng thái Active/Banned; trang `AdminProducts` với nút Block/Unblock.
  - **Tasks:**
    - [ ] **Backend:** `GET /admin/users` · `PATCH /admin/users/:id/ban|unban (cascade block SP)` · `GET /admin/products` · `PATCH /admin/products/:id/block|unblock` · `Kiểm tra isActive trong Login service`
    - [ ] **Frontend:** `Admin: UserTable, BanConfirmDialog` · `Admin: AdminProducts (BlockDialog nhập lý do)`
  - **Stitch Screens (`projects/6249429078653284294`):**
    - `projects/6249429078653284294/screens/882346455a944424a5acdec0db64b694` ("Admin người dùng #1")
    - `projects/6249429078653284294/screens/d665514709ad40a3be1507afa6df2591` ("Admin người dùng #2")
    - `projects/6249429078653284294/screens/c4a639ff41c0469485df88e0bb39fe59` ("Admin người dùng #3")
    - `projects/6249429078653284294/screens/622bb67cebe444f1926f2eac85381281` ("Admin người dùng #4")
    - `projects/6249429078653284294/screens/87c65644d1de4c54b1ff120678a4596a` ("Admin sản phẩm #1")
    - `projects/6249429078653284294/screens/849ea875dd5e4146832832bacd738dc9` ("Admin sản phẩm #2")
    - `projects/6249429078653284294/screens/d824e21dffad4deb9cdc14482a542806` ("Admin đơn hàng #1")
    - `projects/6249429078653284294/screens/d64dfcec7caf4709a0212debe1cac939` ("Admin đơn hàng #2")
    - `projects/6249429078653284294/screens/c0dfe3dabd8e403b8b42088b4ddb17f6` ("Admin đơn hàng #3")
  - **Deliverables khi [x]:**
    - `.specify/features/admin-user-management/baseline.md` (SIGNED-OFF)
    - `docs/features/admin-user-management/README.md`

---

## 🔮 Backlog Dự Kiến — Future Horizons (V2.0+)

> Các ý tưởng chưa được ưu tiên — ghi nhận nhưng không cam kết trong 1 tuần.

- [~] **US-FUTURE-001**: Review & Rating sản phẩm (Customer đã mua mới được đánh giá)
- [~] **US-FUTURE-002**: Voucher / Coupon / Discount code
- [~] **US-FUTURE-003**: Email transactional (xác nhận đơn, cập nhật trạng thái ship)
- [~] **US-FUTURE-004**: Analytics Dashboard (doanh thu, SP bán chạy, biểu đồ)
- [~] **US-FUTURE-005**: Realtime Order Tracking (Socket.io)
- [~] **US-FUTURE-006**: Seller payout / đối soát / rút tiền & KYC gian hàng
- [~] **US-FUTURE-007**: Export đơn hàng sang Excel/PDF

---

## 🏁 Quy Chuẩn Định Nghĩa Hoàn Thành (Definition of Done - DoD)

Một User Story chỉ được chuyển từ `[/]` sang `[x]` khi:

1. **Nghiệp vụ:** Đạt 100% Acceptance Criteria.
2. **Kiểm thử:**
   - Backend: Unit test cho Service logic (stock validation, tách đơn theo seller, state machine + phân quyền, ownership check).
   - Frontend: Không có console.error, form validation hoạt động đúng.
3. **Code Quality:**
   - File < 300 dòng, Function < 50 dòng (khớp `07-tech-conventions.md`).
   - Không có `any` type trong TypeScript.
   - DTO đầy đủ `class-validator`.
4. **Zero Critical Bugs:** Không có lỗi Blocker/Critical.
5. **PR reviewed:** Ít nhất 1 teammate review & approve.
6. **Tài liệu:** `docs/features/<slug>/README.md` đã cập nhật.

---

## 🚀 Kế Hoạch Phát Hành Production (Go-Live Plan)

### 1. Pre-Deploy Checklist (Bắt buộc trước Go-Live)

#### 🔴 Critical — Blockers tuyệt đối

- [ ] **SEC-01**: Không có credentials / secrets hardcoded trong code; toàn bộ qua `.env`.
- [ ] **SEC-02**: JWT Secrets sinh bằng `openssl rand -hex 64` (không dùng `"secret"` mặc định).
- [ ] **SEC-03**: CORS whitelist chỉ cho phép đúng domain Frontend (`FRONTEND_URL`) — không dùng `*` trên production.
- [ ] **SEC-04**: Verify `signature` webhook PayOS (HMAC-SHA256) bắt buộc trước khi xử lý; không bao giờ cập nhật đơn từ query của Return / Cancel URL.

#### 🟡 Important — Hoàn thành trước khi demo

- [ ] **DB-01**: MongoDB Atlas cluster sẵn sàng; connection string dùng `?authSource=admin&ssl=true`.
- [ ] **API-01**: Backend `npm run build` thành công, không có TypeScript error.
- [ ] **TEST-01**: Chạy Playwright smoke test: đăng ký 2 user → user A thiết lập shop & đăng bán → user B thêm giỏ → checkout → tới trang thanh toán PayOS (bước trả tiền thật làm tay, số tiền nhỏ — PayOS không có sandbox) → A giao hàng.

#### 🟢 Nice-to-have

- [ ] **OBS-01**: Console logging đủ để debug production issues (Winston hoặc NestJS built-in logger).

### 2. Biến Môi Trường Production Mẫu

```bash
# ── Backend ──────────────────────────────────────────────────
NODE_ENV=production
PORT=3000
MONGODB_URI="mongodb+srv://<user>:<pass>@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority"

JWT_ACCESS_SECRET="<openssl rand -hex 64>"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="<openssl rand -hex 64>"
JWT_REFRESH_EXPIRES_IN="7d"

CLOUDINARY_CLOUD_NAME="<your_cloud_name>"
CLOUDINARY_API_KEY="<your_api_key>"
CLOUDINARY_API_SECRET="<your_api_secret>"

PAYOS_CLIENT_ID="<your_client_id>"
PAYOS_API_KEY="<your_api_key>"
PAYOS_CHECKSUM_KEY="<your_checksum_key>"
# Webhook URL khai báo trong trang quản lý PayOS: https://<your-domain>/api/v1/payments/payos/webhook
CHECKOUT_EXPIRE_MINUTES="30"

FRONTEND_URL="https://<your-frontend-domain>"
```

### 3. Sprint Go-Live Tracking

- [ ] **US-DEPLOY-01**: Security Hardening & Secret Audit (Pre-Deploy SEC-01 → SEC-04)
- [ ] **US-DEPLOY-02**: MongoDB Atlas provisioning & seed dữ liệu test
- [ ] **US-DEPLOY-03**: Backend deployment & health check `GET /api/v1/categories` trả về 200
- [ ] **US-DEPLOY-04**: Frontend deployment & kiểm tra routing (F5 không bị 404)
- [ ] **US-DEPLOY-05**: Playwright smoke test toàn bộ happy path trên URL production

---

## 📝 Ghi Chú Quan Trọng Cho AI

> AI đọc phần này để hiểu ngữ cảnh và quy tắc của file. Không xóa.

### Quy tắc quét của `/command-continue-project`:

1. **Step 1**: Đọc `tech-stack` từ YAML frontmatter → paste vào system prompt của mọi subagent.
2. **Step 2**: Tìm story `[/]` trước (ưu tiên tuyệt đối), sau đó `[ ]` đầu tiên từ trên xuống.
3. **Step 3 (Blocked Gate)**: Nếu story tiếp theo mang nhãn `[!]`: DỪNG LẠI, cảnh báo về vướng mắc, đề xuất `grilling` để gỡ block.
4. **Step 4 (Dependency Gate)**: Kiểm tra `Depends-on` — nếu dependency chưa `[x]`, từ chối làm story này.
5. **Step 5 (Effort & Budget Routing)**:
   - `Effort: S` + `single-session` → Fast-Track BA (2–3 câu, skip gap-analysis).
   - `Effort: M` + `single-session` → Bounded Task BA (stages 1→2→4→5→6→7→8).
   - `Effort: L|XL` + `multi-session` → Full Feature BA (all 8 stages) + invoke `wayfinder`.
6. **Step 6**: Trong Phase 5, phân rã từ `Tasks: Backend / Frontend` cho `backend-developer` và `frontend-developer`.
7. **Step 7**: Với `US-DEPLOY-###`, thực thi Pre-Deploy Verification & Smoke Test (không chạy BA pipeline).
8. **Step 8**: Chỉ đánh `[x]` sau khi `e2e-runner` pass và hoàn thành Phase 6 (Review & Verification).

### Tài liệu tham chiếu (đọc trước khi implement):

- `docs/project-ecommerce/03-requirements.md` — Business Rules `BR-XXX`
- `docs/project-ecommerce/05-database-erd.md` — MongoDB schemas
- `docs/project-ecommerce/06-api-contract.md` — API endpoints & response format
- `docs/project-ecommerce/07-tech-conventions.md` — Folder structure & naming

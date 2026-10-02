---
project: "Ecommerce Team Project"
tech-stack:
  language: "TypeScript"
  backend: "NestJS + Mongoose ODM"
  frontend: "React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Zustand + TanStack Query + React Router v6 + Axios + Formik/Yup"
  database: "MongoDB"
  infra: "Local dev (MongoDB local / Atlas) + Cloudinary + VNPay Sandbox"
  test: "Jest (unit) + Playwright (E2E)"
git-mode: "team"
schema-version: "1.3"
---

# 🗺️ Product Backlog & Execution Roadmap

> **Sản phẩm:** `Ecommerce Team Project` — Sàn thương mại điện tử **nhiều người bán** (kiểu Shopee thu gọn): user vừa **đăng bán** vừa **mua** SP vật lý. Luồng: đăng bán SP → xem SP → giỏ hàng → checkout (tách đơn theo người bán) → thanh toán VNPay → người bán xử lý đơn.  
> **Cập nhật lần cuối:** `2026-10-02`  
> **Trạng thái tài liệu:** Living Document — Quản lý tiến độ và đồng bộ với `/command-continue-project`
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

## 🚫 Explicitly Out of Scope — Won't-Have for MVP

> **CRITICAL:** Đây là "scope fence" bắt buộc — bất kỳ ai (người hay AI) muốn thêm item dưới đây phải mở PR thảo luận trước.

- **NO** mobile native app (iOS/Android) — Web-only.
- **NO** Review / Rating sản phẩm.
- **NO** Voucher / Coupon / Discount code.
- **NO** Role `seller` riêng / đăng ký shop có KYC (CCCD, thuế) — dùng chung 1 tài khoản, bán = có `shopName`.
- **NO** Duyệt SP trước khi hiển thị — Admin kiểm duyệt sau bằng block.
- **NO** Biến thể SP (màu/size), thương hiệu, video SP.
- **NO** Tính phí / chọn đơn vị vận chuyển.
- **NO** Chia tiền / đối soát / rút tiền cho người bán — tiền về tài khoản VNPay của sàn, hoàn tiền Admin làm thủ công.
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

| Mã Epic     | Nghiệp vụ / Tính năng                                | Phân loại MoSCoW | RICE Score |    Mức ưu tiên    | Sprint khuyến nghị |
| :---------- | :--------------------------------------------------- | :--------------: | :--------: | :---------------: | :----------------: |
| **EPIC-01** | Auth & User (Đăng ký / Đăng nhập / JWT)              |  **Must Have**   |    9.5     | **P0 (Critical)** |      Sprint 1      |
| **EPIC-02** | Category (Admin) & Product (Seller đăng bán + Search/Filter + Upload) |  **Must Have**   |    9.0     | **P0 (Core USP)** |      Sprint 1      |
| **EPIC-03** | Cart (Guest localStorage + Customer DB + Merge)      |  **Must Have**   |    8.5     | **P0 (Core USP)** |      Sprint 1      |
| **EPIC-04** | Order & Checkout (Guest + Customer · tách đơn theo người bán · Inventory) |  **Must Have**   |    8.5     | **P0 (Critical)** |      Sprint 2      |
| **EPIC-05** | Payment VNPay theo Checkout (IPN + Return + Rollback) |  **Must Have**   |    8.0     | **P0 (Critical)** |      Sprint 2      |
| **EPIC-06** | Admin Dashboard (User · Category · Product block · Order) |  **Must Have**   |    7.5     |   **P1 (High)**   |      Sprint 2      |
| **EPIC-07** | Go-Live & Production Hardening                       |  **Must Have**   |    7.0     | **P0 (Blocker)**  |      Sprint 3      |
| **EPIC-08** | Seller (Gian hàng · Đăng bán · Xử lý đơn bán)        |  **Must Have**   |    9.0     | **P0 (Core USP)** |   Sprint 1 + 2     |

---

## 🗺️ Lộ Trình Phát Hành (Release Roadmap)

```text
[ Sprint 0 - Setup & Architecture ] ──► [ COMPLETED ✅ ]
  ├── SETUP-001: Khởi tạo repo, cấu hình NestJS project + Mongoose
  ├── SETUP-002: Cấu hình global pipes, filters, interceptors (response wrapper)
  └── SETUP-003: Viết .env.example + hướng dẫn setup Cloudinary / MongoDB / VNPay

[ Sprint 1 - Core Foundation (MVP Base) ] ──► [ TO DO 📋 ]
  ├── US-AUTH-001: Đăng ký & Đăng nhập
  ├── US-AUTH-002: JWT Refresh Token & Logout
  ├── US-SELL-001: Profile & Thiết lập gian hàng (/users/me, shop)
  ├── US-CAT-001:  Quản lý Category (Admin CRUD)
  ├── US-PRD-001:  Đăng bán & quản lý Product (Seller own / Admin all + Cloudinary Upload)
  ├── US-PRD-002:  Tìm kiếm & Lọc sản phẩm (Public)
  └── US-CART-001: Giỏ hàng Guest (localStorage) + Customer (DB) + Merge

[ Sprint 2 - Commerce Core ] ──► [ TO DO 📋 ]
  ├── US-ORD-001:  Tạo Checkout & đơn hàng (tách đơn theo người bán)
  ├── US-PAY-001:  Tích hợp VNPay theo Checkout + IPN/Return + Rollback stock
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

- [ ] **SETUP-001**: Khởi tạo NestJS project, cấu hình Mongoose, kết nối MongoDB
- [ ] **SETUP-002**: Cấu hình global: `ValidationPipe`, `GlobalExceptionFilter`, `ResponseInterceptor` (wrap `{ success, data, message }`)
- [ ] **SETUP-003**: Viết `.env.example` đầy đủ + hướng dẫn lấy credentials (MongoDB Atlas, Cloudinary, VNPay sandbox)
- [ ] **SETUP-004**: Cấu hình CORS (cho phép `FRONTEND_URL`), setup Git branches (`main` / `dev` / `feature/*`)

---

## 🎯 Sprint 1: Core Foundation — Auth, Catalog & Cart

> **Mục tiêu Sprint:** Người dùng có thể đăng ký, đăng nhập, thiết lập gian hàng và đăng bán sản phẩm, xem sản phẩm theo danh mục, tìm kiếm, và quản lý giỏ hàng (nhóm theo người bán).

---

- [ ] **US-AUTH-001**: Đăng ký & Đăng nhập tài khoản
  - **Slug:** `auth-register-login`
  - **Effort:** M
  - **Context-budget:** single-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** _(none)_
  - **Blocks:** `US-AUTH-002`, `US-SELL-001`, `US-CAT-001`, `US-PRD-001`, `US-CART-001`, `US-ORD-001`, `US-ADM-001`
  - **Mô tả:** Người dùng có thể tạo tài khoản mới bằng email & mật khẩu, và đăng nhập để nhận JWT token.
  - **Acceptance Criteria (AC):**
    - [ ] `POST /api/v1/auth/register` với email/password/fullName hợp lệ → trả về 201 và thông tin user (không có password).`
    - [ ] `POST /api/v1/auth/register` với email đã tồn tại → trả về 409 Conflict.`
    - [ ] `POST /api/v1/auth/login` với đúng credentials → trả về `accessToken` + `refreshToken` + thông tin user.`
    - [ ] `POST /api/v1/auth/login` với sai password → trả về 401 Unauthorized.`
    - [ ] `POST /api/v1/auth/login` với tài khoản `isActive = false` → trả về 403 "Tài khoản đã bị khóa".`
    - [ ] Password được lưu dưới dạng bcrypt hash, không bao giờ trả về plain text.`
    - [ ] FE: Form đăng ký / đăng nhập hiển thị đúng validation errors (email format, password min length).`
  - **Tasks:**
    - [ ] **Backend:** `User schema (email unique, password bcrypt, role enum, isActive, refreshToken)` · `POST /auth/register DTO + Service` · `POST /auth/login + JwtStrategy (access 15m)`
    - [ ] **Frontend:** `Trang /register + /login` · `Axios instance với Authorization header` · `Lưu token vào localStorage/cookie`
  - **Deliverables khi [x]:**
    - `.specify/features/auth-register-login/baseline.md` (SIGNED-OFF)
    - `docs/features/auth-register-login/README.md`

---

- [ ] **US-AUTH-002**: JWT Refresh Token & Đăng xuất
  - **Slug:** `auth-refresh-logout`
  - **Effort:** S
  - **Context-budget:** single-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-AUTH-001`
  - **Blocks:** _(none)_
  - **Mô tả:** Access Token hết hạn sau 15 phút; hệ thống tự động làm mới bằng Refresh Token mà không cần người dùng đăng nhập lại.
  - **Acceptance Criteria (AC):**
    - [ ] `POST /api/v1/auth/refresh` với Refresh Token hợp lệ → trả về `accessToken` mới.`
    - [ ] `POST /api/v1/auth/refresh` với Refresh Token hết hạn / không hợp lệ → trả về 401.`
    - [ ] `POST /api/v1/auth/logout` → xóa refreshToken trong DB; token cũ không dùng được nữa.`
    - [ ] FE: Axios interceptor tự động gọi `/auth/refresh` khi nhận 401, retry request gốc.`
    - [ ] FE: Nếu refresh thất bại → redirect về trang đăng nhập.`
  - **Tasks:**
    - [ ] **Backend:** `JwtRefreshStrategy` · `POST /auth/refresh` · `POST /auth/logout (xóa refreshToken field)`
    - [ ] **Frontend:** `Axios response interceptor retry logic` · `Auth store (Zustand/Pinia/Redux) quản lý token state`
  - **Deliverables khi [x]:**
    - `.specify/features/auth-refresh-logout/baseline.md` (SIGNED-OFF)
    - `docs/features/auth-refresh-logout/README.md`

---

- [ ] **US-SELL-001**: Profile & Thiết lập gian hàng
  - **Slug:** `seller-shop-profile`
  - **Effort:** S
  - **Context-budget:** single-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-AUTH-001`
  - **Blocks:** `US-PRD-001`
  - **Mô tả:** Mọi user đã đăng nhập có profile (dùng prefill checkout) và có thể thiết lập gian hàng (`shopName`, `pickupAddress`) để đủ điều kiện đăng bán. Không có role seller riêng, không KYC, không duyệt.
  - **Acceptance Criteria (AC):**
    - [ ] `GET /api/v1/users/me` → trả profile + `shopName`/`pickupAddress` (null nếu chưa có).`
    - [ ] `PATCH /api/v1/users/me` → cập nhật `fullName`, `phone`, `address`.`
    - [ ] `PATCH /api/v1/users/me/shop` với `shopName` (3–50 ký tự) + `pickupAddress` hợp lệ → 200; thiếu hoặc sai độ dài → 400.`
    - [ ] `GET /api/v1/shops/:sellerId` (public) → `shopName`, `joinedAt`, `productCount`; 404 nếu user chưa có shop hoặc đang bị ban.`
    - [ ] FE: `ProfilePage`, `ShopSetupPage`; nút "Đăng bán" dẫn tới ShopSetup nếu `shopName = null`.`
  - **Tasks:**
    - [ ] **Backend:** `UsersController (/users/me, /users/me/shop)` · `DTO validate` · `ShopsController GET /shops/:sellerId`
    - [ ] **Frontend:** `ProfilePage` · `ShopSetupPage` · `user.service.ts`, `shop.service.ts`
  - **Deliverables khi [x]:**
    - `.specify/features/seller-shop-profile/baseline.md` (SIGNED-OFF)
    - `docs/features/seller-shop-profile/README.md`

---

- [ ] **US-CAT-001**: Quản lý Category (Admin CRUD)
  - **Slug:** `category-management`
  - **Effort:** M
  - **Context-budget:** single-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-AUTH-001`
  - **Blocks:** `US-PRD-001`
  - **Mô tả:** Admin có thể tạo, sửa, xóa danh mục sản phẩm (danh mục dùng chung toàn sàn — người bán chỉ chọn). Người dùng có thể xem danh sách danh mục để lọc sản phẩm.
  - **Acceptance Criteria (AC):**
    - [ ] `GET /api/v1/categories` (public) → trả về danh sách category đang active.`
    - [ ] `POST /api/v1/categories` (Admin) → tạo category mới, `slug` tự động từ `name`.`
    - [ ] `POST /api/v1/categories` với tên trùng → trả về 409 Conflict.`
    - [ ] `PATCH /api/v1/categories/:id` (Admin) → cập nhật tên/mô tả/ảnh.`
    - [ ] `DELETE /api/v1/categories/:id` khi còn sản phẩm (của bất kỳ shop nào) đang dùng → trả về 400 với thông báo rõ ràng.`
    - [ ] FE Admin: Màn hình danh sách category, form tạo/sửa, nút xóa với confirm.`
    - [ ] FE Public: Danh mục hiển thị trên sidebar/nav để lọc sản phẩm.`
  - **Tasks:**
    - [ ] **Backend:** `Category schema (name unique, slug, description, imageUrl, isActive)` · `CRUD endpoints` · `Validate no-delete khi có product` · `RolesGuard`
    - [ ] **Frontend:** `Admin: CategoryList, CategoryForm components` · `Public: CategoryNav/Sidebar`
  - **Deliverables khi [x]:**
    - `.specify/features/category-management/baseline.md` (SIGNED-OFF)
    - `docs/features/category-management/README.md`

---

- [ ] **US-PRD-001**: Đăng bán & quản lý Product (Seller sở hữu / Admin) + Upload ảnh Cloudinary
  - **Slug:** `product-management`
  - **Effort:** L
  - **Context-budget:** multi-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-CAT-001`, `US-SELL-001`
  - **Blocks:** `US-PRD-002`, `US-CART-001`
  - **Mô tả:** User đã thiết lập gian hàng đăng bán sản phẩm (giá, stock, ảnh Cloudinary, category) và chỉ quản lý được SP **của mình**. Admin thao tác được trên mọi SP.
  - **Acceptance Criteria (AC):**
    - [ ] `POST /api/v1/products` (✅ Login) → tạo SP; `sellerId` gán từ token (bỏ qua `sellerId` trong body).`
    - [ ] `POST /products` khi chưa thiết lập gian hàng → 403 "Vui lòng thiết lập thông tin gian hàng trước khi đăng bán".`
    - [ ] `name` tối đa 120 ký tự; tối đa 5 ảnh / SP — vượt quá → 400.`
    - [ ] `POST /api/v1/upload/image` (✅ Login) → upload Cloudinary, trả URL; chỉ jpg/png/webp, ≤5MB.`
    - [ ] `GET /api/v1/products/my` → danh sách SP của mình, gồm cả ẩn / bị block (kèm `blockReason`).`
    - [ ] `PATCH /api/v1/products/:id` bởi chủ SP → 200; bởi user khác → 403; bởi Admin → 200.`
    - [ ] `DELETE /api/v1/products/:id` → soft delete (`isActive = false`), cùng quy tắc quyền như PATCH.`
    - [ ] Seller tắt `isActive` thì SP biến khỏi danh sách công khai; bật lại được **trừ khi** `isBlocked = true`.`
    - [ ] `stock` không thể lưu giá trị âm — validation ở DTO level; `sellerId` không đổi được sau khi tạo.`
    - [ ] FE Seller: `MyProductsPage`, `ProductFormPage` với preview ảnh, chọn category từ dropdown, nút "Lưu & Hiển thị".`
  - **Tasks:**
    - [ ] **Backend:** `Product schema (sellerId, name, slug, description, price, stock, images[], categoryId, isActive, isBlocked, blockReason)` · `Indexes (text, sellerId, categoryId, price)` · `Upload service (Cloudinary SDK)` · `CRUD endpoints + assertOwnerOrAdmin`
    - [ ] **Frontend:** `Seller: MyProductsPage, ProductFormPage (image uploader)` · `Cloudinary upload helper`
  - **Deliverables khi [x]:**
    - `.specify/features/product-management/baseline.md` (SIGNED-OFF)
    - `docs/features/product-management/README.md`

---

- [ ] **US-PRD-002**: Xem & Tìm kiếm sản phẩm (Public)
  - **Slug:** `product-catalog-search`
  - **Effort:** M
  - **Context-budget:** single-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-PRD-001`
  - **Blocks:** `US-CART-001`
  - **Mô tả:** Người dùng (Guest & Customer) có thể xem danh sách sản phẩm, tìm kiếm theo tên, lọc theo danh mục và khoảng giá.
  - **Acceptance Criteria (AC):**
    - [ ] `GET /api/v1/products` → danh sách phân trang (page, limit) chỉ hiện sản phẩm `isActive = true` **và** `isBlocked = false`.`
    - [ ] Query param `?search=iphone` → lọc theo tên (text search MongoDB).`
    - [ ] Query param `?categoryId=xxx` → lọc theo danh mục.`
    - [ ] Query param `?sellerId=xxx` → lọc theo người bán (trang shop).`
    - [ ] Query param `?minPrice=100000&maxPrice=5000000` → lọc theo khoảng giá.`
    - [ ] Query param `?sortBy=price&order=asc` → sắp xếp đúng.`
    - [ ] Sản phẩm `stock = 0` hiển thị badge "Hết hàng" — không thể thêm vào giỏ.`
    - [ ] `GET /api/v1/products/:id` → chi tiết sản phẩm (ảnh, giá, mô tả, stock, category name, `seller.shopName`); SP ẩn/bị block → 404 trừ Owner/Admin.`
    - [ ] FE: Trang danh sách SP (ProductGrid) + trang chi tiết SP (ProductDetail).`
  - **Tasks:**
    - [ ] **Backend:** `GET /products với query builder (search, filter, sort, paginate, sellerId)` · `GET /products/:id populate category + seller (OptionalJwtAuthGuard)`
    - [ ] **Frontend:** `ProductGrid, ProductCard, ProductDetail components` · `FilterSidebar, SearchBar` · `Pagination component`
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
  - **Mô tả:** Guest quản lý giỏ hàng trên trình duyệt (localStorage). Khi đăng nhập, giỏ hàng tự động merge vào DB. Customer xem/sửa giỏ hàng từ DB.
  - **Acceptance Criteria (AC):**
    - [ ] Guest: Thêm SP vào giỏ → lưu localStorage; refresh trang không mất dữ liệu.`
    - [ ] Guest: Số lượng trong giỏ không vượt quá stock hiện tại — nếu vượt → báo lỗi client-side.`
    - [ ] Customer: `GET /api/v1/cart` → trả về giỏ hàng từ DB, **nhóm theo người bán** (`groups[].seller`, `subtotal`) + `totalAmount`.`
    - [ ] Customer: `POST /api/v1/cart/items` → thêm item, validate stock; **SP của chính mình → 400**.`
    - [ ] Customer: `PATCH /api/v1/cart/items/:productId` → cập nhật quantity.`
    - [ ] Customer: `DELETE /api/v1/cart/items/:productId` → xóa item.`
    - [ ] Customer: `POST /api/v1/cart/merge` (ngay sau đăng nhập) → merge localStorage items vào DB cart, quantity không vượt stock; **tự lọc bỏ SP của chính mình**.`
    - [ ] Item có `stock = 0` hoặc SP ẩn/bị block bị loại khỏi giỏ khi tải lại.`
    - [ ] FE: Trang giỏ hàng (CartPage) hiển thị items **theo từng shop** (subtotal mỗi shop), tổng tiền VNĐ, nút checkout.`
  - **Tasks:**
    - [ ] **Backend:** `Cart schema (userId unique, items[])` · `Cart CRUD service + group by sellerId khi GET` · `Merge logic (cộng quantity, cap ở stock, lọc SP của mình)` · `Guard: JwtAuthGuard`
    - [ ] **Frontend:** `cartStore (localStorage cho Guest, API cho Customer)` · `CartPage, CartItem components` · `Merge cart on login action`
  - **Deliverables khi [x]:**
    - `.specify/features/cart-management/baseline.md` (SIGNED-OFF)
    - `docs/features/cart-management/README.md`

---

## 🛒 Sprint 2: Commerce Core — Order, Payment & Admin

> **Mục tiêu Sprint:** Luồng mua – bán hoàn chỉnh: checkout nhiều shop → thanh toán VNPay một lần → người bán xử lý đơn của mình → admin giám sát.

---

- [ ] **US-ORD-001**: Tạo Checkout & đơn hàng (tách đơn theo người bán)
  - **Slug:** `order-checkout`
  - **Effort:** L
  - **Context-budget:** multi-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-CART-001`
  - **Blocks:** `US-PAY-001`, `US-ORD-002`, `US-SELL-002`
  - **Mô tả:** Guest và Customer tạo đơn từ giỏ hàng. Hệ thống nhóm item theo người bán, tạo **1 Checkout + N Order** (mỗi shop 1 Order), thanh toán một lần qua VNPay.
  - **Acceptance Criteria (AC):**
    - [ ] `POST /api/v1/orders` (⚪ Optional auth — Guest + Customer dùng chung) → tạo Checkout + các Order, trừ stock ngay.`
    - [ ] Giỏ có SP của 2 shop → tạo đúng 2 Order, mỗi Order có `sellerId` và `totalAmount` riêng; `Checkout.totalAmount` = tổng.`
    - [ ] Giá và tên SP lấy từ DB, bỏ qua `price` do client gửi.`
    - [ ] Guest: bắt buộc cung cấp `recipient` (fullName, phone, email, address).`
    - [ ] Customer: auto-fill từ profile, cho phép override address.`
    - [ ] Có bất kỳ SP nào `stock < quantity` (hoặc SP ẩn/block) → 400 kèm danh sách SP thiếu hàng, **không tạo Checkout/Order nào và stock đã trừ được hoàn lại**.`
    - [ ] Customer mua SP của chính mình → 400.`
    - [ ] Trừ stock nguyên tử (`stock >= qty`); 2 người mua SP cuối cùng cùng lúc → chỉ 1 người thành công.`
    - [ ] Response trả `checkoutId`, `checkoutCode`, `totalAmount`, `expiresAt`, `orders[]`, `vnpayUrl`. Mọi Order mặc định `pending`.`
    - [ ] FE: Trang Checkout (form recipient) → "Thanh toán" → redirect VNPay; trang kết quả `/checkout/result` liệt kê các đơn.`
  - **Tasks:**
    - [ ] **Backend:** `Checkout schema + Order schema (checkoutId, sellerId, sellerShopName, userId nullable, recipient, items snapshot, totalAmount, status, paymentStatus)` · `POST /orders: group by seller, atomic decrement, all-or-nothing rollback, generate VNPay URL` · `orderCode/checkoutCode generator` · `restockAndCancel() dùng chung`
    - [ ] **Frontend:** `CheckoutPage (Guest form / Customer prefill)` · `CheckoutResultPage (success/fail)`
  - **Deliverables khi [x]:**
    - `.specify/features/order-checkout/baseline.md` (SIGNED-OFF)
    - `docs/features/order-checkout/README.md`

---

- [ ] **US-PAY-001**: Tích hợp VNPay theo Checkout — IPN/Return + Rollback Stock
  - **Slug:** `payment-vnpay`
  - **Effort:** L
  - **Context-budget:** multi-session
  - **Priority:** Must-Have (P0)
  - **Depends-on:** `US-ORD-001`
  - **Blocks:** `US-ORD-002`, `US-SELL-002`
  - **Mô tả:** Một giao dịch VNPay cho cả Checkout. Thành công → mọi Order con `confirmed`; thất bại / hết hạn → mọi Order con `cancelled` và rollback stock.
  - **Acceptance Criteria (AC):**
    - [ ] `vnp_TxnRef = checkoutCode`, `vnp_Amount = totalAmount × 100`.`
    - [ ] `GET /api/v1/payments/vnpay/ipn` (VNPay gọi bằng GET) → verify HMAC-SHA512 + số tiền, trả `RspCode`/`Message` đúng (00, 01, 02, 04, 97, 99).`
    - [ ] Thanh toán thành công → Checkout `paid`; **tất cả** Order con `pending → confirmed`, `paymentStatus = paid`.`
    - [ ] Thanh toán thất bại → Checkout `failed`; **tất cả** Order con `cancelled` (`cancelledBy = system`), rollback stock từng item.`
    - [ ] `GET /api/v1/payments/vnpay/return` → verify, gọi **cùng hàm xử lý idempotent** với IPN, rồi redirect FE `/checkout/result?checkoutCode=...&status=...`.`
    - [ ] IPN/Return đến trùng hoặc cùng lúc → chỉ xử lý 1 lần (idempotency theo trạng thái Checkout).`
    - [ ] Mọi callback (kể cả sai chữ ký) lưu vào collection `payments`.`
    - [ ] `@Cron` mỗi phút: Checkout `pending` quá `expiresAt` (30 phút) → `expired`, hủy Order `pending`, rollback stock.`
    - [ ] Thanh toán thành công đến **sau** khi Checkout `expired` → ghi `payments.note = late_success_after_expiry`, trả `02`.`
  - **Tasks:**
    - [ ] **Backend:** `VNPay service (tạo URL, verify checksum)` · `processPaymentResult() idempotent` · `GET /payments/vnpay/ipn` · `GET /payments/vnpay/return` · `Payment schema` · `Scheduled job (@Cron) checkout expiry`
    - [ ] **Frontend:** `CheckoutResultPage (đọc checkoutCode từ query param)`
  - **Deliverables khi [x]:**
    - `.specify/features/payment-vnpay/baseline.md` (SIGNED-OFF)
    - `docs/features/payment-vnpay/README.md`

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
    - [ ] `GET /api/v1/orders/my` (✅ Login) → đơn mình đã mua (phân trang, mới nhất trước), mỗi đơn có `seller.shopName`, `checkoutCode`.`
    - [ ] `GET /api/v1/orders/my/:id` → chi tiết (items snapshot, recipient, status, totalAmount); đơn của người khác → 404.`
    - [ ] `GET /api/v1/orders` (Admin) → tất cả đơn, lọc `status`, `sellerId`, `userId`.`
    - [ ] `GET /api/v1/orders/:id` (Admin) → chi tiết đơn bất kỳ.`
    - [ ] FE Customer: Trang lịch sử đơn + chi tiết đơn với badge trạng thái; đơn cùng `checkoutCode` được nhóm hiển thị.`
    - [ ] FE Admin: Bảng quản lý đơn hàng.`
  - **Tasks:**
    - [ ] **Backend:** `GET /orders/my, GET /orders/my/:id (lọc theo userId)` · `GET /orders, GET /orders/:id (Admin guard)` · `Route order: /my, /selling trước /:id`
    - [ ] **Frontend:** `OrderHistoryPage, OrderDetailPage (Customer)` · `Admin: OrderTable`
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
    - [ ] `GET /api/v1/orders/selling` → chỉ đơn có `sellerId` = mình, lọc theo `status`, phân trang.`
    - [ ] `GET /api/v1/orders/selling/:id` → chi tiết; đơn của shop khác → 404.`
    - [ ] `PATCH /api/v1/orders/:id/status` bởi Seller của đơn: `confirmed→shipping`, `shipping→delivered`, `confirmed→cancelled` (kèm `reason` bắt buộc) → 200.`
    - [ ] Seller không phải chủ đơn → 403; Seller đặt `refunded` → 403.`
    - [ ] Admin: ngoài các chuyển trên còn `pending→cancelled` và `cancelled→refunded` (chỉ khi `paymentStatus = paid`).`
    - [ ] Không ai đặt tay `confirmed` / `pending` qua API → 400 (`confirmed` chỉ do VNPay).`
    - [ ] Chuyển sai chiều (vd `delivered→shipping`) → 400 với thông báo rõ ràng.`
    - [ ] Hủy đơn → hoàn stock đúng 1 lần; gọi hủy 2 lần không hoàn trùng.`
    - [ ] Hai đơn con của cùng Checkout có trạng thái độc lập.`
    - [ ] FE Seller: `SellerOrdersPage` — lọc trạng thái, nút Giao hàng / Đã giao / Hủy (dialog nhập lý do).`
  - **Tasks:**
    - [ ] **Backend:** `GET /orders/selling (+/:id)` · `PATCH /orders/:id/status (state machine + phân quyền Seller/Admin)` · `Dùng restockAndCancel()`
    - [ ] **Frontend:** `Seller: SellerOrdersPage, StatusActionButtons, CancelReasonDialog`
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
    - [ ] `GET /api/v1/admin/users` (Admin) → danh sách user, lọc `role`/`isActive`/`search`, phân trang.`
    - [ ] `PATCH /api/v1/admin/users/:id/ban` → set `isActive = false`; user bị ban không đăng nhập được; **toàn bộ SP của user bị block** (`blockReason = seller_banned`).`
    - [ ] `PATCH /api/v1/admin/users/:id/unban` → set `isActive = true`; chỉ mở lại SP có `blockReason = seller_banned`.`
    - [ ] `GET /api/v1/admin/products` → mọi SP kể cả ẩn/bị block, lọc `isBlocked`, `sellerId`.`
    - [ ] `PATCH /api/v1/admin/products/:id/block` với `reason` bắt buộc → SP biến khỏi danh sách công khai, Seller vẫn thấy kèm lý do và không tự mở lại được.`
    - [ ] `PATCH /api/v1/admin/products/:id/unblock` → SP hiển thị lại (nếu `isActive = true`).`
    - [ ] Admin không thể ban chính mình → trả về 400.`
    - [ ] Login với tài khoản `isActive = false` → trả về 403 "Tài khoản đã bị khóa".`
    - [ ] FE Admin: Trang danh sách user với nút Ban/Unban, badge trạng thái Active/Banned; trang `AdminProducts` với nút Block/Unblock.`
  - **Tasks:**
    - [ ] **Backend:** `GET /admin/users` · `PATCH /admin/users/:id/ban|unban (cascade block SP)` · `GET /admin/products` · `PATCH /admin/products/:id/block|unblock` · `Kiểm tra isActive trong Login service`
    - [ ] **Frontend:** `Admin: UserTable, BanConfirmDialog` · `Admin: AdminProducts (BlockDialog nhập lý do)`
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
   - File < 800 dòng, Function < 50 dòng.
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
- [ ] **SEC-04**: VNPay checksum verify bắt buộc trước khi xử lý mọi callback.

#### 🟡 Important — Hoàn thành trước khi demo

- [ ] **DB-01**: MongoDB Atlas cluster sẵn sàng; connection string dùng `?authSource=admin&ssl=true`.
- [ ] **API-01**: Backend `npm run build` thành công, không có TypeScript error.
- [ ] **TEST-01**: Chạy Playwright smoke test: đăng ký 2 user → user A thiết lập shop & đăng bán → user B thêm giỏ → checkout → VNPay sandbox → A giao hàng.

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

VNPAY_TMN_CODE="<your_tmn_code>"
VNPAY_HASH_SECRET="<your_hash_secret>"
VNPAY_URL="https://pay.vnpay.vn/vpcpay.html"   # Production URL
VNPAY_RETURN_URL="https://<your-domain>/api/v1/payments/vnpay/return"
VNPAY_IPN_URL="https://<your-domain>/api/v1/payments/vnpay/ipn"
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
8. **Step 8**: Chỉ đánh `[x]` sau khi `e2e-runner` pass, `tech-doc-architect` xong, `user-guide-creator` đã lưu ảnh Playwright thật.

### Tài liệu tham chiếu (đọc trước khi implement):

- `docs/project-ecommerce/03-requirements.md` — Business Rules `BR-XXX`
- `docs/project-ecommerce/05-database-erd.md` — MongoDB schemas
- `docs/project-ecommerce/06-api-contract.md` — API endpoints & response format
- `docs/project-ecommerce/07-tech-conventions.md` — Folder structure & naming

# 08 — Task Breakdown & Dependency

## Tổng quan phân công

Mỗi người nhận 1 hoặc nhiều feature, thực hiện **từ BE đến FE** (fullstack per feature).  
Danh sách dưới đây là gợi ý — team tự phân công feature cụ thể sau.

> **Phân công thực tế**: điền vào cột "Người thực hiện" sau khi team thống nhất.

> ⚠️ **Lưu ý khối lượng:** mô hình sàn nhiều người bán làm Module 3 (ownership), 5 (tách đơn theo seller) và 8 (Seller Center) nặng hơn mô hình shop một chủ. Xem mục **Đường cắt** ở cuối nếu thiếu thời gian.

---

## Dependency Map

```
[1] Auth & User (+ profile, shop setup)
    │
    ├──► [2] Category (cần auth Admin)
    │         │
    │         └──► [3] Product (cần categoryId + sellerId, ownership)
    │                   │
    │         ┌─────────┘
    │         │
    ├──► [4] Cart (cần Product + Auth; nhóm theo seller)
    │         │
    │         └──► [5] Order & Checkout (cần Cart + Product; tách Order theo seller)
    │                   │
    │                   ├──► [6] Payment VNPay (cần Checkout)
    │                   │
    │                   └──► [8] Seller Center — đơn bán (cần Order; xác nhận lại sau Payment)
    │
    └──► [7] Admin Dashboard (cần tất cả module trên)
```

**Quy tắc**: không bắt đầu feature phụ thuộc khi feature cha chưa xong phần BE API.

---

## Chi tiết Tasks

### Module 1: Auth & User

**Người thực hiện:** `_______________`

| #   | Task                                                                | Loại | Độ ưu tiên  |
| --- | ------------------------------------------------------------------- | ---- | ----------- |
| 1.1 | Setup NestJS project + Mongoose + global pipes/filters/interceptors | BE   | 🔴 Critical |
| 1.2 | User schema (gồm `shopName`, `pickupAddress`) + CRUD service        | BE   | 🔴 Critical |
| 1.3 | `POST /auth/register` + `POST /auth/login` (chặn user bị ban → 403) | BE   | 🔴 Critical |
| 1.4 | JWT Strategy (access + refresh) + `JwtAuthGuard`, `OptionalJwtAuthGuard`, `RolesGuard` | BE | 🔴 Critical |
| 1.5 | `POST /auth/refresh` + `POST /auth/logout`                          | BE   | 🔴 Critical |
| 1.6 | `GET/PATCH /users/me` + `PATCH /users/me/shop`                      | BE   | 🟡 High     |
| 1.7 | UI: Form Đăng ký / Đăng nhập                                        | FE   | 🟡 High     |
| 1.8 | FE: Lưu token, axios interceptor tự refresh                         | FE   | 🟡 High     |
| 1.9 | UI: Trang Profile                                                   | FE   | 🟢 Normal   |
| 1.10 | Seed script: Admin (từ `ADMIN_EMAIL`/`ADMIN_PASSWORD`, không có gian hàng), vài category, 2 seller + SP demo, 1 buyer (dùng cho demo & test) | BE   | 🟡 High     |

---

### Module 2: Category

**Người thực hiện:** `_______________`

> Phụ thuộc: Module 1 (Admin guard)

| #   | Task                                             | Loại | Độ ưu tiên  |
| --- | ------------------------------------------------ | ---- | ----------- |
| 2.1 | Category schema                                  | BE   | 🔴 Critical |
| 2.2 | CRUD API `/api/v1/categories`                    | BE   | 🔴 Critical |
| 2.3 | Validate: không xóa category còn SP (mọi shop)   | BE   | 🟡 High     |
| 2.4 | Admin UI: Danh sách & CRUD category              | FE   | 🟡 High     |
| 2.5 | Public UI: Hiện danh sách category (sidebar/nav) | FE   | 🟡 High     |

---

### Module 3: Product (có ownership)

**Người thực hiện:** `_______________`

> Phụ thuộc: Module 1 (auth + shop setup), Module 2 (categoryId)

| #    | Task                                                                                         | Loại | Độ ưu tiên  |
| ---- | -------------------------------------------------------------------------------------------- | ---- | ----------- |
| 3.1  | Product schema (`sellerId`, `isActive`, `isBlocked`, `blockReason`) + index                  | BE   | 🔴 Critical |
| 3.2  | `POST /products` (yêu cầu có shop, gán `sellerId` từ token) + `GET /products/my`             | BE   | 🔴 Critical |
| 3.3  | `PATCH/DELETE /products/:id` + helper `assertOwnerOrAdmin` (403 sai chủ, Admin bypass)       | BE   | 🔴 Critical |
| 3.4  | `GET /products` (chỉ SP hiển thị) + Search & Filter (text, category, price, `sellerId`)      | BE   | 🔴 Critical |
| 3.5  | `GET /products/:id` (`OptionalJwtAuthGuard`; SP ẩn/block chỉ Owner/Admin xem được)           | BE   | 🟡 High     |
| 3.6  | Cloudinary upload service + `POST /upload/image` (✅ Login, ≤5MB, jpg/png/webp)              | BE   | 🟡 High     |
| 3.7  | `GET /shops/:sellerId`                                                                       | BE   | 🟢 Normal   |
| 3.8  | Public UI: Danh sách SP + filter (+ hiện tên shop)                                           | FE   | 🔴 Critical |
| 3.9  | Public UI: Chi tiết sản phẩm (+ link sang trang shop)                                        | FE   | 🔴 Critical |
| 3.10 | Seller UI: `ShopSetupPage`, `MyProductsPage`, `ProductFormPage` (upload ≤5 ảnh)             | FE   | 🔴 Critical |
| 3.11 | Public UI: `ShopPage`                                                                        | FE   | 🟢 Normal   |

---

### Module 4: Cart

**Người thực hiện:** `_______________`

> Phụ thuộc: Module 1 (auth), Module 3 (product)

| #   | Task                                                                     | Loại | Độ ưu tiên  |
| --- | ------------------------------------------------------------------------ | ---- | ----------- |
| 4.1 | Cart schema                                                              | BE   | 🔴 Critical |
| 4.2 | Cart API (GET **nhóm theo seller**, add, update, delete, merge)          | BE   | 🔴 Critical |
| 4.3 | Validate: quantity ≤ stock · chặn SP của chính mình · loại SP ẩn/block   | BE   | 🔴 Critical |
| 4.4 | FE: Guest cart — localStorage util                                       | FE   | 🔴 Critical |
| 4.5 | FE: UI giỏ hàng (Guest + Customer), **hiển thị theo từng shop**          | FE   | 🔴 Critical |
| 4.6 | FE: Merge cart khi đăng nhập                                             | FE   | 🟡 High     |

---

### Module 5: Order & Checkout (tách đơn theo người bán)

**Người thực hiện:** `_______________`

> Phụ thuộc: Module 4 (cart), Module 3 (stock)

| #   | Task                                                                                                  | Loại | Độ ưu tiên  |
| --- | ----------------------------------------------------------------------------------------------------- | ---- | ----------- |
| 5.1 | Schemas: `Checkout` + `Order` (`checkoutId`, `sellerId`, `sellerShopName`, `cancelReason`, `cancelledBy`) | BE | 🔴 Critical |
| 5.2 | `POST /orders`: nhóm theo seller → trừ stock nguyên tử (all-or-nothing) → tạo N Order + 1 Checkout → tạo VNPay URL | BE | 🔴 Critical |
| 5.3 | Chặn mua SP của chính mình; tính giá từ DB (không tin client)                                         | BE   | 🔴 Critical |
| 5.4 | Service `restockAndCancel(order)` dùng chung (cập nhật có điều kiện, hoàn stock đúng 1 lần)           | BE   | 🔴 Critical |
| 5.5 | `GET /orders/my` + `GET /orders/my/:id`                                                               | BE   | 🟡 High     |
| 5.6 | `GET /orders` + `GET /orders/:id` (Admin)                                                             | BE   | 🟡 High     |
| 5.7 | FE: Trang Checkout (form người nhận, prefill từ `/users/me`; yêu cầu đăng nhập)                       | FE   | 🔴 Critical |
| 5.8 | FE: Trang kết quả `/checkout/result` (liệt kê các đơn của checkout, success/fail)                     | FE   | 🔴 Critical |
| 5.9 | FE: Customer — Lịch sử đơn mua (hiện shop, trạng thái từng đơn)                                       | FE   | 🟡 High     |
| 5.10 | `GET /checkouts/:checkoutCode` (Login + Owner, thông tin tối thiểu) — nguồn dữ liệu cho trang kết quả                                | BE   | 🔴 Critical |
| 5.11 | Transaction (BR-CHK-010): `createCheckout` và `restockAndCancel` chạy trong `session.withTransaction()`; unit test: 1 item hết hàng → toàn bộ abort, stock không đổi | BE   | 🔴 Critical |

---

### Module 6: Payment — VNPay

**Người thực hiện:** `_______________`

> Phụ thuộc: Module 5 (checkout)

| #   | Task                                                                                           | Loại | Độ ưu tiên  |
| --- | ---------------------------------------------------------------------------------------------- | ---- | ----------- |
| 6.1 | Tích hợp VNPay SDK / manual HMAC signing (`vnp_TxnRef = checkoutCode`, amount × 100)           | BE   | 🔴 Critical |
| 6.2 | Hàm xử lý kết quả **idempotent**: verify checksum + số tiền → cập nhật Checkout & mọi Order con | BE   | 🔴 Critical |
| 6.3 | `GET /payments/vnpay/return` — gọi hàm 6.2 rồi redirect FE                                     | BE   | 🔴 Critical |
| 6.4 | `GET /payments/vnpay/ipn` — gọi hàm 6.2, trả `RspCode`                                         | BE   | 🔴 Critical |
| 6.5 | Logic: success → mọi Order `confirmed` + `paid`; fail → mọi Order `cancelled` + hoàn stock     | BE   | 🔴 Critical |
| 6.6 | `@Cron` mỗi phút: Checkout `pending` quá `expiresAt` → `expired` + hủy Order + hoàn stock      | BE   | 🟡 High     |
| 6.7 | Payment schema (lưu raw VNPay data, kể cả callback sai chữ ký / thanh toán muộn)               | BE   | 🟢 Normal   |
| 6.8 | FE: Trang redirect sau VNPay (success/fail UI)                                                 | FE   | 🟡 High     |
| 6.9 | Khi Checkout `paid`: xóa item đã mua khỏi cart DB (BR-CHK-007); Checkout `failed`/`expired` giữ giỏ                             | BE   | 🟡 High     |
| 6.10 | Deploy BE lên Render (làm sớm, ~cuối Ngày 4, để IPN VNPay gọi được URL public) — theo `10-deployment.md` | BE   | 🟡 High     |
| 6.11 | Deploy FE lên Vercel (+ `vercel.json` rewrite SPA), cập nhật `FRONTEND_URL` / Return URL / IPN URL, smoke test luồng mua trên URL thật | FE   | 🟡 High     |

---

### Module 7: Admin Dashboard

**Người thực hiện:** `_______________`

> Phụ thuộc: tất cả module trên

| #   | Task                                                                                  | Loại | Độ ưu tiên  |
| --- | ------------------------------------------------------------------------------------- | ---- | ----------- |
| 7.1 | `GET /admin/users` + ban/unban **kéo theo block/unblock SP** (`seller_banned`)        | BE   | 🟡 High     |
| 7.2 | `GET /admin/products` + `PATCH /admin/products/:id/block` (reason) / `unblock`        | BE   | 🟡 High     |
| 7.3 | Admin UI: Tổng quan dashboard (số liệu cơ bản)                                        | FE   | 🟢 Normal   |
| 7.4 | Admin UI: Quản lý User                                                                | FE   | 🟡 High     |
| 7.5 | Admin UI: Quản lý Order + cập nhật trạng thái (kể cả hủy `pending`, refund)           | FE   | 🔴 Critical |
| 7.6 | Admin UI: Quản lý Category + Product (xem mọi shop, block/unblock)                    | FE   | 🟡 High     |

---

### Module 8: Seller Center — Đơn bán

**Người thực hiện:** `_______________`

> Phụ thuộc: Module 5 (order), Module 6 (để đơn lên `confirmed`)

| #   | Task                                                                                                        | Loại | Độ ưu tiên  |
| --- | ----------------------------------------------------------------------------------------------------------- | ---- | ----------- |
| 8.1 | `GET /orders/selling` + `GET /orders/selling/:id` (lọc theo `order.sellerId`, 404 nếu không phải của mình)  | BE   | 🔴 Critical |
| 8.2 | `PATCH /orders/:id/status`: state machine + phân quyền (Seller của đơn / Admin; `refunded` chỉ Admin)       | BE   | 🔴 Critical |
| 8.3 | Hủy `confirmed → cancelled` (bắt buộc `reason`) → gọi `restockAndCancel`                                    | BE   | 🟡 High     |
| 8.4 | Seller UI: `SellerOrdersPage` — lọc trạng thái, nút Giao hàng / Đã giao / Hủy (dialog nhập lý do)           | FE   | 🔴 Critical |

---

## Timeline Gợi ý (1 tuần)

| Ngày       | Mục tiêu                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------- |
| **Ngày 0** | (trước khi code) Đăng ký VNPay sandbox (có thể chờ email), Cloudinary, MongoDB Atlas · chốt phân công 2 người · tạo `main`/`dev` + bảo vệ branch · cả hai pair 2–3 giờ dựng nền: global pipes/filters/interceptor, **toàn bộ Mongoose schema**, guards |
| **Ngày 1** | Setup project · Module 1 BE hoàn tất (gồm `/users/me`, shop setup) · Module 2 & 3 BE bắt đầu     |
| **Ngày 2** | Module 2 & 3 BE hoàn tất (ownership) · Module 4 BE · FE Auth xong                               |
| **Ngày 3** | Module 4 & 5 BE (tách đơn theo seller) · FE Product + Seller form + Cart                        |
| **Ngày 4** | Module 6 (VNPay theo Checkout) · Module 8 BE · FE Checkout                                      |
| **Ngày 5** | Module 7 Admin · Module 8 FE · FE Order history · Integration test                              |
| **Ngày 6** | Bug fix · Polish UI · Test E2E luồng chính (mua nhiều shop + bán + xử lý đơn) trên bản đã deploy (Vercel + Render) |
| **Ngày 7** | Buffer — fix critical bugs · Demo chuẩn bị                                                      |

> **Điểm quyết định cuối Ngày 3:** nếu `POST /orders` (5.2) + `restockAndCancel` (5.4) chưa chạy ổn → cắt ngay các mục trong "Đường cắt" bên dưới, đừng chờ tới Ngày 5. VNPay (Module 6) là rủi ro lớn nhất (phụ thuộc bên ngoài) — nên làm spike URL + verify chữ ký từ Ngày 2.

> **Deploy (đã chốt: chỉ cần Vercel + Render, đơn giản):** deploy BE sớm (~cuối Ngày 4) rồi dùng URL đó để test IPN VNPay và CORS; không cần CI/CD, Docker, domain riêng. Chi tiết: `10-deployment.md`.

### ✂️ Đường cắt (nếu trễ tiến độ — cắt từ dưới lên)

| Thứ tự cắt | Hạng mục                                           | Hậu quả                              |
| ---------- | -------------------------------------------------- | ------------------------------------ |
| 1          | `GET /shops/:sellerId` + `ShopPage` (3.7, 3.11)    | Không có trang shop; vẫn lọc `?sellerId=` |
| 2          | Admin dashboard số liệu (7.3), Profile UI (1.9)    | Không ảnh hưởng luồng chính          |
| 3          | Admin block SP (7.2, phần UI của 7.6)              | Mất kiểm duyệt SP, vẫn ban user được |
| 4          | Seller hủy đơn (8.3) — chỉ giữ Giao hàng / Đã giao | Hủy đơn chỉ do Admin                 |

> **Không được cắt:** tách đơn theo seller (5.2), ownership check (3.3), `restockAndCancel` (5.4), xử lý idempotent VNPay (6.2) — đây là lõi của yêu cầu "User đăng bán và mua".

---

## Definition of Done (DoD)

Mỗi task hoàn thành khi:

- [ ] BE API hoạt động đúng theo API Contract
- [ ] Validate input (DTO) đầy đủ
- [ ] FE gọi API thành công + hiển thị đúng UI
- [ ] Không có console.error / unhandled exception
- [ ] Với endpoint có ownership: đã test **sai chủ → 403/404**, **Admin bypass → OK**
- [ ] PR đã được teammate review

# 08 — Task Breakdown & Dependency

## Tổng quan phân công

Mỗi người nhận 1 hoặc nhiều feature, thực hiện **từ BE đến FE** (fullstack per feature).  
Danh sách dưới đây là gợi ý — team tự phân công feature cụ thể sau.

> **Phân công thực tế**: điền vào cột "Người thực hiện" sau khi team thống nhất.

---

## Dependency Map

```
[1] Auth & User
    │
    ├──► [2] Category (cần auth Admin)
    │         │
    │         └──► [3] Product (cần categoryId)
    │                   │
    │         ┌─────────┘
    │         │
    ├──► [4] Cart (cần Product + Auth Customer)
    │         │
    │         └──► [5] Order & Checkout (cần Cart + Product)
    │                   │
    │                   └──► [6] Payment VNPay (cần Order)
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
| 1.2 | User schema + CRUD service (internal)                               | BE   | 🔴 Critical |
| 1.3 | `POST /auth/register` + `POST /auth/login`                          | BE   | 🔴 Critical |
| 1.4 | JWT Strategy (access + refresh) + Guards                            | BE   | 🔴 Critical |
| 1.5 | `POST /auth/refresh` + `POST /auth/logout`                          | BE   | 🔴 Critical |
| 1.6 | UI: Form Đăng ký / Đăng nhập                                        | FE   | 🟡 High     |
| 1.7 | FE: Lưu token, axios interceptor tự refresh                         | FE   | 🟡 High     |

---

### Module 2: Category

**Người thực hiện:** `_______________`

> Phụ thuộc: Module 1 (Admin guard)

| #   | Task                                             | Loại | Độ ưu tiên  |
| --- | ------------------------------------------------ | ---- | ----------- |
| 2.1 | Category schema                                  | BE   | 🔴 Critical |
| 2.2 | CRUD API `/api/v1/categories`                    | BE   | 🔴 Critical |
| 2.3 | Validate: không xóa category còn SP              | BE   | 🟡 High     |
| 2.4 | Admin UI: Danh sách & CRUD category              | FE   | 🟡 High     |
| 2.5 | Public UI: Hiện danh sách category (sidebar/nav) | FE   | 🟡 High     |

---

### Module 3: Product

**Người thực hiện:** `_______________`

> Phụ thuộc: Module 1 (Admin guard), Module 2 (categoryId)

| #   | Task                                                 | Loại | Độ ưu tiên  |
| --- | ---------------------------------------------------- | ---- | ----------- |
| 3.1 | Product schema + index                               | BE   | 🔴 Critical |
| 3.2 | CRUD API `/api/v1/products`                          | BE   | 🔴 Critical |
| 3.3 | Search & Filter (text search, category, price range) | BE   | 🔴 Critical |
| 3.4 | Cloudinary upload service                            | BE   | 🟡 High     |
| 3.5 | `POST /upload/image` endpoint                        | BE   | 🟡 High     |
| 3.6 | Public UI: Danh sách SP + filter                     | FE   | 🔴 Critical |
| 3.7 | Public UI: Chi tiết sản phẩm                         | FE   | 🔴 Critical |
| 3.8 | Admin UI: CRUD sản phẩm + upload ảnh                 | FE   | 🟡 High     |

---

### Module 4: Cart

**Người thực hiện:** `_______________`

> Phụ thuộc: Module 1 (auth), Module 3 (product)

| #   | Task                                       | Loại | Độ ưu tiên  |
| --- | ------------------------------------------ | ---- | ----------- |
| 4.1 | Cart schema                                | BE   | 🔴 Critical |
| 4.2 | Cart API (GET, add, update, delete, merge) | BE   | 🔴 Critical |
| 4.3 | Validate quantity không vượt stock         | BE   | 🔴 Critical |
| 4.4 | FE: Guest cart — localStorage util         | FE   | 🔴 Critical |
| 4.5 | FE: UI giỏ hàng (Guest + Customer)         | FE   | 🔴 Critical |
| 4.6 | FE: Merge cart khi đăng nhập               | FE   | 🟡 High     |

---

### Module 5: Order & Checkout

**Người thực hiện:** `_______________`

> Phụ thuộc: Module 4 (cart), Module 3 (stock)

| #   | Task                                               | Loại | Độ ưu tiên  |
| --- | -------------------------------------------------- | ---- | ----------- |
| 5.1 | Order schema (embed items, recipient)              | BE   | 🔴 Critical |
| 5.2 | `POST /orders` — tạo đơn, trừ stock, tạo VNPay URL | BE   | 🔴 Critical |
| 5.3 | `GET /orders/my` + `GET /orders/my/:id`            | BE   | 🟡 High     |
| 5.4 | `GET /orders` + `PATCH /orders/:id/status` (Admin) | BE   | 🟡 High     |
| 5.5 | FE: Trang Checkout (Guest form + Customer prefill) | FE   | 🔴 Critical |
| 5.6 | FE: Trang xác nhận đơn hàng (success/fail)         | FE   | 🔴 Critical |
| 5.7 | FE: Customer — Lịch sử đơn hàng                    | FE   | 🟡 High     |

---

### Module 6: Payment — VNPay

**Người thực hiện:** `_______________`

> Phụ thuộc: Module 5 (order)

| #   | Task                                                          | Loại | Độ ưu tiên  |
| --- | ------------------------------------------------------------- | ---- | ----------- |
| 6.1 | Tích hợp VNPay SDK / manual HMAC signing                      | BE   | 🔴 Critical |
| 6.2 | `GET /payments/vnpay/return` — redirect handler               | BE   | 🔴 Critical |
| 6.3 | `POST /payments/vnpay/ipn` — webhook + verify checksum        | BE   | 🔴 Critical |
| 6.4 | Logic: success → confirmed, fail → cancelled + rollback stock | BE   | 🔴 Critical |
| 6.5 | Payment schema (lưu raw VNPay data)                           | BE   | 🟢 Normal   |
| 6.6 | FE: Trang redirect sau VNPay (success/fail UI)                | FE   | 🟡 High     |

---

### Module 7: Admin Dashboard

**Người thực hiện:** `_______________`

> Phụ thuộc: tất cả module trên

| #   | Task                                                       | Loại | Độ ưu tiên  |
| --- | ---------------------------------------------------------- | ---- | ----------- |
| 7.1 | Admin User management API (`GET /admin/users`, ban/unban)  | BE   | 🟡 High     |
| 7.2 | Admin UI: Tổng quan dashboard (số liệu cơ bản)             | FE   | 🟢 Normal   |
| 7.3 | Admin UI: Quản lý User                                     | FE   | 🟡 High     |
| 7.4 | Admin UI: Quản lý Order + cập nhật trạng thái              | FE   | 🔴 Critical |
| 7.5 | Admin UI: Quản lý Category + Product (nếu chưa làm ở trên) | FE   | 🟡 High     |

---

## Timeline Gợi ý (1 tuần)

| Ngày       | Mục tiêu                                                       |
| ---------- | -------------------------------------------------------------- |
| **Ngày 1** | Setup project · Module 1 BE hoàn tất · Module 2 & 3 BE bắt đầu |
| **Ngày 2** | Module 2 & 3 BE hoàn tất · Module 4 BE · FE Auth xong          |
| **Ngày 3** | Module 4 & 5 BE hoàn tất · FE Product + Cart                   |
| **Ngày 4** | Module 6 (VNPay) · FE Checkout                                 |
| **Ngày 5** | Module 7 Admin · FE Order history · Integration test           |
| **Ngày 6** | Bug fix · Polish UI · Test E2E luồng chính                     |
| **Ngày 7** | Buffer — fix critical bugs · Demo chuẩn bị                     |

---

## Definition of Done (DoD)

Mỗi task hoàn thành khi:

- [ ] BE API hoạt động đúng theo API Contract
- [ ] Validate input (DTO) đầy đủ
- [ ] FE gọi API thành công + hiển thị đúng UI
- [ ] Không có console.error / unhandled exception
- [ ] PR đã được teammate review

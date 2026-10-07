# 06 — API Contract

## Quy ước chung

### Base URL

```
/api/v1
```

### Response Format thống nhất

```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Thành công"
}

// Paginated List
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}

// Error
{
  "success": false,
  "message": "Mô tả lỗi",
  "errors": [ ... ]   // optional, validation errors
}
```

### HTTP Status Codes

| Code | Ý nghĩa                                                    |
| ---- | ---------------------------------------------------------- |
| 200  | OK                                                         |
| 201  | Created                                                    |
| 400  | Bad Request (validation lỗi, chuyển trạng thái sai, hết hàng) |
| 401  | Unauthorized (chưa đăng nhập / token hết hạn)              |
| 403  | Forbidden (không đủ quyền / không phải chủ sở hữu)         |
| 404  | Not Found                                                  |
| 409  | Conflict (email trùng, ...)                                |
| 500  | Internal Server Error                                      |

### Auth Header

```
Authorization: Bearer <access_token>
```

### Chú giải cột Auth

| Ký hiệu               | Ý nghĩa                                                                                          | Guard                     |
| --------------------- | ------------------------------------------------------------------------------------------------ | ------------------------- |
| ❌                    | Public, không cần token                                                                          | —                         |
| ⚪ Optional           | Token không bắt buộc: có token → xử lý như Customer, không có → Guest                            | `OptionalJwtAuthGuard`    |
| ✅ Login              | Mọi user đã đăng nhập (Customer hoặc Admin)                                                      | `JwtAuthGuard`            |
| ✅ Login + Owner      | Phải là chủ sở hữu tài nguyên (SP / đơn bán). Sai chủ → **403**. **Admin được bypass**           | `JwtAuthGuard` + check ở service |
| ✅ Admin              | Chỉ `role = admin`                                                                               | `JwtAuthGuard` + `RolesGuard` |

> **Quy ước lỗi quyền sở hữu:**
> - Endpoint **đọc** theo "của tôi" (`/orders/my/:id`, `/orders/selling/:id`) lọc theo owner trong query → không phải của mình trả **404** (không lộ sự tồn tại).
> - Endpoint **ghi** lên tài nguyên có thật nhưng sai chủ (`PATCH /products/:id`...) trả **403**.

---

## Auth — `/api/v1/auth`

| Method | Endpoint         | Auth      | Mô tả                         |
| ------ | ---------------- | --------- | ----------------------------- |
| POST   | `/auth/register` | ❌        | Đăng ký tài khoản             |
| POST   | `/auth/login`    | ❌        | Đăng nhập                     |
| POST   | `/auth/refresh`  | ❌        | Làm mới Access Token          |
| POST   | `/auth/logout`   | ✅ Login  | Đăng xuất (xóa refresh token) |

#### POST `/auth/register`

```json
// Request Body
{
  "email": "user@example.com",
  "password": "Abc@12345",
  "fullName": "Nguyễn Văn A"
}

// Response 201
{
  "success": true,
  "data": { "userId": "...", "email": "...", "fullName": "..." },
  "message": "Đăng ký thành công"
}
```

#### POST `/auth/login`

```json
// Request Body
{
  "email": "user@example.com",
  "password": "Abc@12345"
}

// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "...",
      "email": "...",
      "fullName": "...",
      "role": "customer",
      "shopName": null          // null = chưa thiết lập gian hàng
    }
  }
}
// 403 nếu tài khoản bị ban: { "success": false, "message": "Tài khoản đã bị khóa" }
```

#### POST `/auth/refresh`

```json
// Request Body
{ "refreshToken": "eyJ..." }

// Response 200
{ "success": true, "data": { "accessToken": "eyJ..." } }
```

---

## User & Gian hàng — `/api/v1/users`, `/api/v1/shops`

| Method | Endpoint            | Auth      | Mô tả                                                    |
| ------ | ------------------- | --------- | -------------------------------------------------------- |
| GET    | `/users/me`         | ✅ Login  | Lấy profile + thông tin gian hàng của mình               |
| PATCH  | `/users/me`         | ✅ Login  | Cập nhật `fullName`, `phone`, `address` (dùng prefill checkout) |
| PATCH  | `/users/me/shop`    | ✅ Login  | Thiết lập / sửa gian hàng: `shopName`, `pickupAddress`   |
| GET    | `/shops/:sellerId`  | ❌        | Thông tin công khai của một gian hàng                    |

#### GET `/users/me`

```json
// Response 200
{
  "success": true,
  "data": {
    "id": "...",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "phone": "0901234567",
    "address": "123 Nguyễn Huệ, Q1, TP.HCM",
    "role": "customer",
    "shopName": "Shop của A",
    "pickupAddress": "45 Lê Lợi, Q1, TP.HCM"
  }
}
```

#### PATCH `/users/me/shop`

```json
// Request Body
{
  "shopName": "Shop của A",             // 3–50 ký tự
  "pickupAddress": "45 Lê Lợi, Q1, TP.HCM"
}
```

#### GET `/shops/:sellerId`

```json
// Response 200 — chỉ trả public info; 404 nếu user chưa có shopName hoặc đang bị ban
{
  "success": true,
  "data": {
    "sellerId": "...",
    "shopName": "Shop của A",
    "joinedAt": "2026-10-01T00:00:00.000Z",
    "productCount": 12
  }
}
// Danh sách SP của shop: GET /products?sellerId=...
```

---

## Category — `/api/v1/categories`

| Method | Endpoint          | Auth     | Mô tả                           |
| ------ | ----------------- | -------- | ------------------------------- |
| GET    | `/categories`     | ❌       | Lấy danh sách category (public) |
| GET    | `/categories/:id` | ❌       | Lấy chi tiết category           |
| POST   | `/categories`     | ✅ Admin | Tạo category                    |
| PATCH  | `/categories/:id` | ✅ Admin | Cập nhật category               |
| DELETE | `/categories/:id` | ✅ Admin | Xóa category                    |

#### GET `/categories`

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Điện thoại",
      "slug": "dien-thoai",
      "imageUrl": "..."
    }
  ]
}
```

#### POST `/categories`

```json
// Request Body (multipart/form-data hoặc JSON + Cloudinary URL)
{
  "name": "Điện thoại",
  "description": "Các loại điện thoại thông minh",
  "imageUrl": "https://res.cloudinary.com/..." // optional
}
```

---

## Product — `/api/v1/products`

| Method | Endpoint               | Auth                  | Mô tả                                                                   |
| ------ | ---------------------- | --------------------- | ----------------------------------------------------------------------- |
| GET    | `/products`            | ❌                    | Danh sách SP **đang hiển thị** (filter, search, phân trang)             |
| GET    | `/products/my`         | ✅ Login              | Danh sách SP **của mình** (gồm cả ẩn / bị block)                        |
| GET    | `/products/:id`        | ⚪ Optional           | Chi tiết SP. SP ẩn/bị block: chỉ Owner/Admin xem được, người khác 404   |
| POST   | `/products`            | ✅ Login              | Đăng bán SP mới (yêu cầu đã thiết lập gian hàng) — `sellerId` = mình    |
| PATCH  | `/products/:id`        | ✅ Login + Owner      | Cập nhật SP (gồm `price`, `stock`, `isActive`)                          |
| DELETE | `/products/:id`        | ✅ Login + Owner      | Ẩn sản phẩm (soft delete, `isActive = false`)                           |

> Route `/products/my` phải khai báo **trước** `/products/:id` trong controller NestJS.
>
> Upload ảnh: gọi `POST /upload/image` (✅ Login) lấy URL Cloudinary, rồi gửi mảng URL trong `images[]` của `POST/PATCH /products` (không có endpoint upload riêng theo SP). Server chỉ nhận URL thuộc cloud của app (BR-PRD-012).

#### GET `/products` — Query Params

```
?page=1&limit=20
&search=iphone           // tìm theo tên
&categoryId=xxx          // lọc theo category
&sellerId=xxx            // lọc theo người bán (trang shop)
&minPrice=100000         // lọc giá tối thiểu
&maxPrice=5000000        // lọc giá tối đa
&sortBy=price            // price | createdAt | name
&order=asc               // asc | desc
                         // limit tối đa 100 (mặc định 20)
```

> Chỉ trả SP có `isActive = true` **và** `isBlocked = false`.

#### GET `/products/:id` — Response

```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "iPhone 15 Pro",
    "price": 29990000,
    "stock": 50,
    "images": ["https://res.cloudinary.com/..."],
    "category": { "id": "...", "name": "Điện thoại" },
    "seller": { "id": "...", "shopName": "Shop của A" },
    "isActive": true,
    "isBlocked": false,
    "blockReason": null
  }
}
// isBlocked / blockReason chỉ trả về cho Owner và Admin
```

#### POST `/products`

```json
{
  "name": "iPhone 15 Pro",              // tối đa 120 ký tự
  "description": "Mô tả sản phẩm...",
  "price": 29990000,
  "stock": 50,
  "categoryId": "ObjectId...",
  "images": ["https://res.cloudinary.com/..."]  // tối đa 5
}
// 201 — data.sellerId tự gán từ token, KHÔNG nhận sellerId từ body
// 403 nếu chưa thiết lập gian hàng: "Vui lòng thiết lập thông tin gian hàng trước khi đăng bán"
```

---

## Cart — `/api/v1/cart`

> **Guest** giữ giỏ ở localStorage (chỉ `productId` + `quantity`, BR-CART-001) — không gọi các endpoint này.
> Ngay sau khi đăng nhập, FE gọi `POST /cart/merge` rồi xóa localStorage (BR-CART-002).
> Mọi endpoint yêu cầu đăng nhập (thiếu token → 401); **Admin → 403** (BR-AUTH-011).
> Mọi endpoint (kể cả ghi) đều trả về **toàn bộ giỏ** theo cùng định dạng `GET /cart`.

| Method | Endpoint                 | Auth                  | Mô tả                                                     |
| ------ | ------------------------ | --------------------- | --------------------------------------------------------- |
| GET    | `/cart`                  | ✅ Login (Customer)   | Lấy giỏ hàng (đã **nhóm theo người bán**)                  |
| POST   | `/cart/items`            | ✅ Login (Customer)   | Thêm SP vào giỏ (đã có thì **cộng dồn**) — 201            |
| PATCH  | `/cart/items/:productId` | ✅ Login (Customer)   | Đặt lại số lượng                                          |
| DELETE | `/cart/items/:productId` | ✅ Login (Customer)   | Xóa SP khỏi giỏ (idempotent: không có trong giỏ vẫn 200)  |
| DELETE | `/cart`                  | ✅ Login (Customer)   | Xóa toàn bộ giỏ hàng                                      |
| POST   | `/cart/merge`            | ✅ Login (Customer)   | Merge giỏ localStorage sau đăng nhập — 200                |

#### GET `/cart` — Response

```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "seller": { "id": "...", "shopName": "Shop của A" },
        "items": [
          {
            "product": {
              "id": "...",
              "name": "Áo thun",
              "slug": "ao-thun-k3f9a1",
              "imageUrl": "https://res.cloudinary.com/...",
              "price": 100000,
              "stock": 10
            },
            "quantity": 2,
            "status": "available",
            "lineTotal": 200000
          },
          {
            "product": { "id": "...", "name": "Quần jean", "slug": "quan-jean-8b2c0d", "imageUrl": null, "price": 300000, "stock": 1 },
            "quantity": 3,
            "status": "exceeds_stock",
            "lineTotal": 900000
          }
        ],
        "subtotal": 200000
      }
    ],
    "totalAmount": 200000
  }
}
```

| `status`        | Điều kiện                                    | Mua được | FE hiển thị                          |
| --------------- | -------------------------------------------- | -------- | ------------------------------------ |
| `available`     | Đang bán, `quantity <= stock`                | ✅       | Bình thường                          |
| `exceeds_stock` | Đang bán, `0 < stock < quantity`             | ❌       | "Chỉ còn {stock} sản phẩm" — yêu cầu giảm số lượng |
| `out_of_stock`  | Đang bán, `stock = 0`                        | ❌       | "Hết hàng"                           |
| `unavailable`   | `isActive = false` hoặc `isBlocked = true`   | ❌       | "Sản phẩm ngừng bán"                 |

> - `price` luôn là giá **hiện tại** (BR-CART-007). `lineTotal = price × quantity`.
> - `subtotal` / `totalAmount` chỉ cộng các item `available`.
> - Thứ tự: SP thêm gần nhất nằm đầu; nhóm theo thứ tự xuất hiện của item đầu tiên của mỗi shop.
> - SP không còn tồn tại trong DB tự bị loại khỏi giỏ (BR-CART-004).

#### POST `/cart/items`

```json
{ "productId": "...", "quantity": 2 }
```

| Lỗi | Khi nào |
| --- | ------- |
| 400 `Sản phẩm không tồn tại hoặc đã ngừng bán` | SP không có / bị ẩn / bị block |
| 400 `Bạn không thể mua sản phẩm của chính mình` | BR-CART-006 |
| 400 `Sản phẩm đã hết hàng` | `stock = 0` |
| 400 `Số lượng vượt quá tồn kho (còn {stock} sản phẩm)` | số lượng đang có + thêm > `stock` |
| 400 `Giỏ hàng tối đa 100 sản phẩm` | BR-CART-009 |

#### PATCH `/cart/items/:productId`

```json
{ "quantity": 1 }
```

> 404 `Sản phẩm không có trong giỏ hàng`; các lỗi 400 như `POST /cart/items` (trừ giới hạn 100 SP).

#### POST `/cart/merge`

```json
{
  "items": [
    { "productId": "...", "quantity": 1 },
    { "productId": "...", "quantity": 3 }
  ]
}
// tối đa 100 phần tử; quantity là số nguyên >= 1
```

> Theo BR-CART-008: gộp trùng `productId`, cộng dồn với số lượng đang có và cap ở `stock` (không làm giảm số lượng đang có); SP không tồn tại / ngừng bán / hết hàng / của chính mình **bị bỏ qua, không báo lỗi**.

> **409** `Giỏ hàng vừa được cập nhật ở nơi khác, vui lòng thử lại` — hai thao tác ghi cùng lúc trên cùng giỏ (vd 2 tab); FE tải lại giỏ rồi thử lại.

---

## Order & Checkout — `/api/v1/orders`

> Một lần checkout có thể chứa SP của nhiều người bán → hệ thống tạo **1 Checkout + N Order** (mỗi người bán một Order), thanh toán **một lần** qua VNPay.

| Method | Endpoint                  | Auth                       | Mô tả                                                      |
| ------ | ------------------------- | -------------------------- | ---------------------------------------------------------- |
| POST   | `/orders`                 | ⚪ Optional (Guest + Customer) | Tạo checkout + các order, trừ stock, khởi tạo VNPay    |
| GET    | `/orders/my`              | ✅ Login                   | Lịch sử đơn **đã mua** của mình                            |
| GET    | `/orders/my/:id`          | ✅ Login                   | Chi tiết 1 đơn mua của mình                                |
| GET    | `/orders/selling`         | ✅ Login                   | Đơn hàng khách đặt mua SP **của mình** (đơn bán)           |
| GET    | `/orders/selling/:id`     | ✅ Login                   | Chi tiết 1 đơn bán của mình                                |
| GET    | `/orders`                 | ✅ Admin                   | Tất cả đơn hàng (lọc `status`, `sellerId`, `userId`)       |
| GET    | `/orders/:id`             | ✅ Admin                   | Chi tiết đơn bất kỳ                                        |
| PATCH  | `/orders/:id/status`      | ✅ Login + Owner (Seller của đơn) hoặc Admin | Cập nhật trạng thái đơn        |
| GET    | `/checkouts/:checkoutCode` | ✅ Login + Owner (chủ Checkout) | Trạng thái 1 lần thanh toán + các đơn con — cho trang `/checkout/result` |

> `/orders/my` và `/orders/selling` phải khai báo **trước** `/orders/:id` trong controller NestJS.

#### POST `/orders` — Tạo checkout

```json
// Request Body — Guest: recipient bắt buộc. Customer: có thể bỏ trống để dùng profile
{
  "recipient": {
    "fullName": "Nguyễn Văn A",
    "phone": "0901234567",
    "email": "a@example.com",
    "address": "123 Nguyễn Huệ, Q1, TP.HCM"
  },
  "items": [
    { "productId": "...", "quantity": 2 },
    { "productId": "...", "quantity": 1 }
  ]
}
// KHÔNG nhận price / sellerId từ client — server lấy từ DB.

// Response 201
{
  "success": true,
  "data": {
    "checkoutId": "...",
    "checkoutCode": "CHK-20261002-7F3K9QX2AB",
    "totalAmount": 59980000,
    "expiresAt": "2026-10-02T10:30:00.000Z",
    "orders": [
      {
        "orderId": "...",
        "orderCode": "ORD-20261002-4M8TQ2ZP6C",
        "seller": { "id": "...", "shopName": "Shop A" },
        "totalAmount": 29990000
      },
      {
        "orderId": "...",
        "orderCode": "ORD-20261002-9H2WD5LR7E",
        "seller": { "id": "...", "shopName": "Shop B" },
        "totalAmount": 29990000
      }
    ],
    "vnpayUrl": "https://sandbox.vnpayment.vn/paymentv2/..."
  }
}
```

Lỗi thường gặp:

```json
// 400 — thiếu hàng (không tạo gì cả, BR-CHK-002)
{
  "success": false,
  "message": "Một số sản phẩm không đủ tồn kho",
  "errors": [{ "productId": "...", "name": "iPhone 15 Pro", "available": 1, "requested": 3 }]
}

// 400 — mua SP của chính mình (BR-SELL-002)
{ "success": false, "message": "Bạn không thể mua sản phẩm của chính mình" }
```

#### GET `/checkouts/:checkoutCode` — trang kết quả thanh toán

```json
// Response 200 — thông tin tối thiểu, KHÔNG trả recipient / items
{
  "success": true,
  "data": {
    "checkoutCode": "CHK-20261002-7F3K9QX2AB",
    "status": "paid",              // pending | paid | failed | expired
    "totalAmount": 59980000,
    "orders": [
      { "orderCode": "ORD-20261002-4M8TQ2ZP6C", "shopName": "Shop A", "totalAmount": 29990000, "status": "confirmed" }
    ]
  }
}
// 404 nếu không tồn tại hoặc không phải checkout của mình. FE dùng endpoint này thay vì tin query ?status=... trên URL redirect.
```

#### GET `/orders/my` — mỗi phần tử

```json
{
  "id": "...",
  "orderCode": "ORD-20261002-4M8TQ2ZP6C",
  "checkoutCode": "CHK-20261002-7F3K9QX2AB",
  "seller": { "id": "...", "shopName": "Shop A" },
  "items": [ { "name": "...", "imageUrl": "...", "price": 100000, "quantity": 2 } ],
  "totalAmount": 200000,
  "status": "confirmed",
  "paymentStatus": "paid",
  "createdAt": "..."
}
```

#### PATCH `/orders/:id/status`

```json
// Seller của đơn hoặc Admin
{ "status": "shipping" }                       // confirmed → shipping
{ "status": "delivered" }                      // shipping → delivered
{ "status": "cancelled", "reason": "Hết hàng thực tế" }   // confirmed → cancelled (reason bắt buộc)
{ "status": "refunded" }                       // cancelled → refunded — CHỈ Admin, đơn đã paid
```

| Tình huống                                   | Response |
| -------------------------------------------- | -------- |
| Chuyển sai chiều (vd `delivered → shipping`) | 400      |
| `status = pending` / `confirmed` từ API      | 400 (`confirmed` chỉ do hệ thống qua VNPay) |
| Thiếu `reason` khi `cancelled`               | 400      |
| Seller không phải chủ đơn                    | 403      |
| Seller đặt `refunded`                        | 403      |

---

## Payment — `/api/v1/payments`

| Method | Endpoint                 | Auth | Mô tả                                              |
| ------ | ------------------------ | ---- | -------------------------------------------------- |
| GET    | `/payments/vnpay/return` | ❌   | VNPay redirect user về sau thanh toán              |
| GET    | `/payments/vnpay/ipn`    | ❌   | VNPay IPN (server-to-server, **method GET**)       |

> **Thanh toán theo Checkout:** `vnp_TxnRef = checkoutCode`, `vnp_Amount = totalAmount × 100`, `vnp_CreateDate` theo giờ Việt Nam (GMT+7).
>
> `vnpay/return` và `vnpay/ipn` đều: verify checksum HMAC-SHA512 → gọi **chung** hàm xử lý idempotent (BR-PAY-006) → khác nhau ở phần response:
> - `return`: redirect trình duyệt về FE `FRONTEND_URL/checkout/result?checkoutCode=...&status=success|failed`.
> - `ipn`: trả JSON cho VNPay.
> - FE **không tin** `status` trên URL redirect — gọi `GET /checkouts/:checkoutCode` để lấy trạng thái thật.
> - Tạo URL VNPay kèm `vnp_ExpireDate = expiresAt` (BR-PAY-010).
> - Khi deploy (Render): Return URL và IPN URL trỏ về backend public → IPN gọi được thật; vẫn giữ Return URL cập nhật đơn như dự phòng (xem `10-deployment.md`).
>
> Lý do dùng chung: khi chạy `localhost`, VNPay **không gọi được IPN** (trừ khi dùng ngrok/cloudflared), nên Return URL phải đủ sức cập nhật đơn.

#### IPN response cho VNPay

```json
{ "RspCode": "00", "Message": "Confirm Success" }
```

| RspCode | Khi nào                                                      |
| ------- | ------------------------------------------------------------ |
| `00`    | Xử lý thành công (kể cả thanh toán thất bại đã ghi nhận)     |
| `01`    | Không tìm thấy `vnp_TxnRef`                                  |
| `02`    | Checkout đã xử lý trước đó (idempotent)                      |
| `04`    | Số tiền không khớp                                           |
| `97`    | Sai chữ ký                                                   |
| `99`    | Lỗi không xác định                                           |

---

## Upload — `/api/v1/upload`

| Method | Endpoint        | Auth      | Mô tả                                 |
| ------ | --------------- | --------- | ------------------------------------- |
| POST   | `/upload/image` | ✅ Login  | Upload ảnh lên Cloudinary, trả về URL |

```json
// Request: multipart/form-data, field: "file"
// Giới hạn: image/jpeg · image/png · image/webp, tối đa 5MB
// Response 201
{
  "success": true,
  "data": { "url": "https://res.cloudinary.com/..." }
}
```

---

## Admin — `/api/v1/admin`

| Method | Endpoint                       | Auth     | Mô tả                                                          |
| ------ | ------------------------------ | -------- | -------------------------------------------------------------- |
| GET    | `/admin/users`                 | ✅ Admin | Danh sách user (lọc `role`, `isActive`, `search`)              |
| PATCH  | `/admin/users/:id/ban`         | ✅ Admin | Ban user **và block toàn bộ SP của user đó**                   |
| PATCH  | `/admin/users/:id/unban`       | ✅ Admin | Unban user và mở lại SP có `blockReason = "seller_banned"`     |
| GET    | `/admin/products`              | ✅ Admin | Tất cả SP (kể cả ẩn / bị block); lọc `isBlocked`, `sellerId`   |
| PATCH  | `/admin/products/:id/block`    | ✅ Admin | Gỡ SP vi phạm — body `{ "reason": "..." }` bắt buộc            |
| PATCH  | `/admin/products/:id/unblock`  | ✅ Admin | Mở lại SP bị block                                             |

> Admin không thể ban chính mình → 400.
> Xóa / sửa Category và quản lý Order dùng các endpoint ở các mục trên.

---

## Error Examples

```json
// 400 - Validation
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    { "field": "email", "message": "Email không đúng định dạng" },
    { "field": "password", "message": "Mật khẩu phải có ít nhất 8 ký tự" }
  ]
}

// 401 - Unauthorized
{ "success": false, "message": "Vui lòng đăng nhập để tiếp tục" }

// 403 - Forbidden (chung)
{ "success": false, "message": "Bạn không có quyền thực hiện thao tác này" }

// 403 - Sửa SP của người khác
{ "success": false, "message": "Bạn chỉ có thể chỉnh sửa sản phẩm của chính mình" }

// 403 - Chưa có gian hàng
{ "success": false, "message": "Vui lòng thiết lập thông tin gian hàng trước khi đăng bán" }

// 404 - Not Found
{ "success": false, "message": "Không tìm thấy sản phẩm" }
```

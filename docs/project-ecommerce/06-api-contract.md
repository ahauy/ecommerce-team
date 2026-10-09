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

> Một lần checkout có thể chứa SP của nhiều người bán → hệ thống tạo **1 Checkout + N Order** (mỗi người bán một Order), thanh toán **một lần** qua PayOS (1 payment link).

| Method | Endpoint                  | Auth                       | Mô tả                                                      |
| ------ | ------------------------- | -------------------------- | ---------------------------------------------------------- |
| POST   | `/orders`                 | ✅ Login (Customer; Admin → 403) | Tạo checkout + các order, trừ stock, tạo payment link PayOS |
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
// Request Body — chỉ Customer đã đăng nhập (không có Guest checkout). recipient có thể bỏ trống để dùng profile (BR-CHK-008)
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
    "paymentUrl": "https://pay.payos.vn/web/..."   // checkoutUrl của PayOS — FE redirect tới
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

// 502 — PayOS lỗi khi tạo payment link: Checkout chuyển failed, mọi Order con cancelled + hoàn stock (BR-CHK-010)
{ "success": false, "message": "Không tạo được liên kết thanh toán, vui lòng thử lại" }
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
    "expiresAt": "2026-10-02T10:30:00.000Z",
    "paymentUrl": null,            // còn pending → link PayOS để thanh toán tiếp; đã kết thúc → null
    "orders": [
      { "orderCode": "ORD-20261002-4M8TQ2ZP6C", "shopName": "Shop A", "totalAmount": 29990000, "status": "confirmed" }
    ]
  }
}
// 404 nếu không tồn tại hoặc không phải checkout của mình. FE dùng endpoint này thay vì tin query trên URL redirect của PayOS.
// Checkout còn pending → backend tra cứu PayOS (GET /v2/payment-requests/{payosOrderCode}) và xử lý idempotent trước khi trả (BR-PAY-006).
// Nhờ vậy trạng thái vẫn đúng khi chạy localhost (webhook không gọi tới được). FE poll endpoint này vài giây/lần khi còn pending;
// backend chỉ gọi PayOS tối đa 1 lần / 10 giây cho mỗi Checkout (các lần poll khác trả trạng thái đang lưu).
```

#### Danh sách & chi tiết đơn — `GET /orders/my`, `/orders/selling`, `/orders` (Admin)

```
?page=1&limit=10        // limit tối đa 100 (mặc định 10)
&status=confirmed       // pending | confirmed | shipping | delivered | cancelled | refunded
&sellerId=...&userId=... // CHỈ GET /orders (Admin)
// Sắp xếp: mới nhất trước
```

```json
// Response 200 — danh sách (phân trang)
{ "items": [ /* Order */ ], "total": 25, "page": 1, "limit": 10, "totalPages": 3 }

// Order — mỗi phần tử danh sách, và cũng là response của GET /orders/my/:id, /orders/selling/:id, /orders/:id
{
  "id": "...",
  "orderCode": "ORD-20261002-4M8TQ2ZP6C",
  "checkoutCode": "CHK-20261002-7F3K9QX2AB",
  "buyerId": "...",
  "seller": { "id": "...", "shopName": "Shop A" },
  "items": [ { "productId": "...", "name": "...", "imageUrl": "...", "price": 100000, "quantity": 2 } ],
  "totalAmount": 200000,
  "status": "confirmed",
  "paymentStatus": "paid",
  "paymentMethod": "payos",
  "recipient": { "fullName": "...", "phone": "...", "email": "...", "address": "..." },
  "cancelReason": null,
  "cancelledBy": null,            // system | seller | admin
  "createdAt": "...",
  "updatedAt": "..."
}
```

> - `/orders/my*` lọc theo người mua trong token, `/orders/selling*` lọc theo người bán trong token → đơn không thuộc mình trả **404** (không lộ sự tồn tại). Admin gọi `/orders/my*` / `/orders/selling*` → 403.
> - `GET /orders`, `GET /orders/:id`: chỉ Admin.
> - `:id` sai định dạng ObjectId → 400 `Mã đơn hàng không hợp lệ`.

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
| `status = pending` / `confirmed` từ API      | 400 (`confirmed` chỉ do hệ thống qua PayOS) |
| Thiếu `reason` khi `cancelled`               | 400      |
| Seller không phải chủ đơn                    | 403      |
| Seller đặt `refunded`                        | 403      |
| Admin hoàn tiền đơn chưa thanh toán (`paymentStatus` ≠ `paid`) | 400 |
| Trạng thái đơn vừa bị thay đổi bởi request khác (vd hủy 2 lần cùng lúc) | 409 — không hoàn kho lần 2 |

> Response 200: đơn sau khi cập nhật (cùng định dạng Order ở trên). Hủy đơn (`confirmed → cancelled`) hoàn stock đúng 1 lần, `cancelledBy` = `seller` hoặc `admin`. Hoàn tiền (`cancelled → refunded`) đặt luôn `paymentStatus = refunded`; tiền Admin chuyển khoản thủ công.

---

## Payment — `/api/v1/payments`

| Method | Endpoint                  | Auth                       | Mô tả                                           |
| ------ | ------------------------- | -------------------------- | ----------------------------------------------- |
| POST   | `/payments/payos/webhook` | ❌ (xác thực bằng chữ ký)  | PayOS gọi server-to-server khi nhận được tiền   |

### Tạo payment link (bên trong `POST /orders`, sau khi commit transaction)

Gọi PayOS `POST https://api-merchant.payos.vn/v2/payment-requests`, header `x-client-id`, `x-api-key`:

```json
{
  "orderCode": 1791277078123,        // payosOrderCode — số nguyên (BR-PAY-007)
  "amount": 59980000,                // = totalAmount, VNĐ, không nhân 100
  "description": "7F3K9QX2A",        // ≤ 9 ký tự: 9 ký tự cuối của checkoutCode
  "returnUrl": "<FRONTEND_URL>/checkout/result?checkoutCode=CHK-20261002-7F3K9QX2AB",
  "cancelUrl": "<FRONTEND_URL>/checkout/result?checkoutCode=CHK-20261002-7F3K9QX2AB",
  "expiredAt": 1791278878,           // = expiresAt, Unix timestamp (giây) — BR-PAY-010
  "signature": "..."
}
```

> - `signature` = HMAC-SHA256 của `amount=$amount&cancelUrl=$cancelUrl&description=$description&orderCode=$orderCode&returnUrl=$returnUrl` (key theo alphabet) với `PAYOS_CHECKSUM_KEY`.
> - Lưu `paymentLinkId`, `checkoutUrl` vào Checkout; trả `checkoutUrl` cho FE dưới tên `paymentUrl`.
> - Có thể dùng SDK chính thức `@payos/node` thay cho tự ký và gọi REST.
> - **Return URL / Cancel URL trỏ thẳng về FE.** PayOS gắn thêm query `code`, `id`, `cancel`, `status`, `orderCode` nhưng **không có chữ ký** → FE bỏ qua, chỉ đọc `checkoutCode` rồi gọi `GET /checkouts/:checkoutCode` (BR-PAY-006).

### POST `/payments/payos/webhook`

```json
// Request từ PayOS
{
  "code": "00",
  "desc": "success",
  "success": true,
  "data": {
    "orderCode": 1791277078123,
    "amount": 59980000,
    "description": "7F3K9QX2A",
    "accountNumber": "...",
    "reference": "FT26275...",
    "transactionDateTime": "2026-10-02 10:05:12",
    "currency": "VND",
    "paymentLinkId": "2e4acf1083304877bf1a8c108b30cccd",
    "code": "00",
    "desc": "success"
  },
  "signature": "..."
}
```

Xử lý: verify `signature` trên `data` (BR-PAY-003) → ghi `payments` → tìm Checkout theo `payosOrderCode` → kiểm tra `amount` → gọi hàm xử lý idempotent dùng chung (BR-PAY-006, BR-PAY-011).

| HTTP                      | Khi nào |
| ------------------------- | ------- |
| 200 `{ "success": true }` | Chữ ký hợp lệ — kể cả không tìm thấy `orderCode` (vd request thử khi đăng ký webhook), đã xử lý trước đó, sai số tiền, thanh toán muộn (chỉ ghi `payments`) |
| 400                       | Sai chữ ký — không xử lý gì, chỉ ghi `payments` |

> Webhook cần URL public HTTPS. Khi chạy `localhost`: dùng ngrok/cloudflared, hoặc dựa vào đồng bộ chủ động qua `GET /checkouts/:checkoutCode` và cron hết hạn (BR-PAY-006, BR-PAY-009). Khi deploy: khai báo `https://<backend>/api/v1/payments/payos/webhook` trong trang quản lý PayOS (xem `10-deployment.md`).

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

#### GET `/admin/users`

```
?page=1&limit=20       // limit tối đa 100 (mặc định 20)
&role=customer         // customer | admin
&isActive=false        // true = đang hoạt động, false = bị khóa
&search=shop a         // tìm theo email, họ tên hoặc tên shop (không phân biệt hoa thường)
// Sắp xếp: mới tham gia trước
```

```json
// Response 200
{
  "items": [
    {
      "id": "...",
      "email": "seller@example.com",
      "fullName": "Nguyễn Văn A",
      "phone": "0901234567",
      "role": "customer",
      "isActive": true,
      "shop": { "shopName": "Shop A", "shopSlug": "shop-a" },   // null nếu chưa thiết lập gian hàng
      "productCount": 12,                                      // tổng SP của user (kể cả ẩn / bị block)
      "createdAt": "..."
    }
  ],
  "total": 45, "page": 1, "limit": 20, "totalPages": 3
}
```

#### PATCH `/admin/users/:id/ban` · `/admin/users/:id/unban`

```json
// Response 200
{ "message": "Đã khóa tài khoản và chặn gian hàng/sản phẩm" }
```

| Tình huống                         | Response                                   |
| ---------------------------------- | ------------------------------------------ |
| Không phải Admin                   | 403                                        |
| Admin tự khóa chính mình           | 400 `Bạn không thể khóa chính tài khoản của mình` |
| `:id` sai định dạng                | 400 `Mã người dùng không hợp lệ`           |
| User không tồn tại                 | 404                                        |

#### GET `/admin/products`

```
?page=1&limit=20       // limit tối đa 100 (mặc định 20)
&isBlocked=true        // true = đang bị chặn, false = không bị chặn
&sellerId=...          // lọc theo người bán
&search=áo thun        // tìm theo tên sản phẩm (không phân biệt hoa thường)
// Trả MỌI sản phẩm, kể cả bị ẩn (isActive = false) và bị chặn. Sắp xếp: mới nhất trước
```

```json
// Response 200 — mỗi phần tử (PATCH block / unblock cũng trả đúng định dạng này cho SP vừa cập nhật)
{
  "id": "...",
  "name": "Áo thun",
  "slug": "ao-thun-k3f9a1",
  "price": 100000,
  "stock": 5,
  "imageUrl": "https://res.cloudinary.com/...",
  "isActive": true,
  "isBlocked": true,
  "blockReason": "Hàng giả",          // "seller_banned" nếu bị chặn do khóa người bán
  "category": { "id": "...", "name": "Thời trang" },
  "seller": { "id": "...", "fullName": "...", "email": "...", "shopName": "Shop A", "isActive": true },
  "createdAt": "..."
}
// Danh sách: { "items": [...], "total": 41, "page": 1, "limit": 20, "totalPages": 3 }
```

#### PATCH `/admin/products/:id/block`

```json
{ "reason": "Hàng giả, vi phạm chính sách sàn" }   // bắt buộc, 5–500 ký tự (đã trim)
```

| Tình huống | Response |
| ---------- | -------- |
| Thiếu / lý do < 5 ký tự | 400 |
| Lý do đúng bằng `seller_banned` (dành riêng cho hệ thống) | 400 |
| SP đã bị chặn | 400 `Sản phẩm đã bị chặn` |
| SP không tồn tại | 404 |

#### PATCH `/admin/products/:id/unblock`

| Tình huống | Response |
| ---------- | -------- |
| SP không bị chặn | 400 `Sản phẩm không bị chặn` |
| SP bị chặn do khóa người bán (`seller_banned`) mà người bán **vẫn đang bị khóa** | 400 — mở khóa người bán trước |
| SP không tồn tại | 404 |

> Mở chặn chỉ gỡ `isBlocked`. SP mà Seller đã tự ẩn (`isActive = false`) vẫn ẩn sau khi mở chặn.
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

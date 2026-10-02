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

| Code | Ý nghĩa                                       |
| ---- | --------------------------------------------- |
| 200  | OK                                            |
| 201  | Created                                       |
| 400  | Bad Request (validation lỗi)                  |
| 401  | Unauthorized (chưa đăng nhập / token hết hạn) |
| 403  | Forbidden (không đủ quyền)                    |
| 404  | Not Found                                     |
| 409  | Conflict (email trùng, ...)                   |
| 500  | Internal Server Error                         |

### Auth Header

```
Authorization: Bearer <access_token>
```

---

## Auth — `/api/v1/auth`

| Method | Endpoint         | Auth        | Mô tả                         |
| ------ | ---------------- | ----------- | ----------------------------- |
| POST   | `/auth/register` | ❌          | Đăng ký tài khoản             |
| POST   | `/auth/login`    | ❌          | Đăng nhập                     |
| POST   | `/auth/refresh`  | ❌          | Làm mới Access Token          |
| POST   | `/auth/logout`   | ✅ Customer | Đăng xuất (xóa refresh token) |

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
    "user": { "id": "...", "email": "...", "fullName": "...", "role": "customer" }
  }
}
```

#### POST `/auth/refresh`

```json
// Request Body
{ "refreshToken": "eyJ..." }

// Response 200
{ "success": true, "data": { "accessToken": "eyJ..." } }
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

| Method | Endpoint               | Auth     | Mô tả                                           |
| ------ | ---------------------- | -------- | ----------------------------------------------- |
| GET    | `/products`            | ❌       | Danh sách sản phẩm (filter, search, phân trang) |
| GET    | `/products/:id`        | ❌       | Chi tiết sản phẩm                               |
| POST   | `/products`            | ✅ Admin | Tạo sản phẩm                                    |
| PATCH  | `/products/:id`        | ✅ Admin | Cập nhật sản phẩm                               |
| DELETE | `/products/:id`        | ✅ Admin | Ẩn sản phẩm (soft delete)                       |
| POST   | `/products/:id/images` | ✅ Admin | Upload ảnh (Cloudinary)                         |

#### GET `/products` — Query Params

```
?page=1&limit=20
&search=iphone           // tìm theo tên
&categoryId=xxx          // lọc theo category
&minPrice=100000         // lọc giá tối thiểu
&maxPrice=5000000        // lọc giá tối đa
&sortBy=price            // price | createdAt | name
&order=asc               // asc | desc
```

#### POST `/products`

```json
{
  "name": "iPhone 15 Pro",
  "description": "Mô tả sản phẩm...",
  "price": 29990000,
  "stock": 50,
  "categoryId": "ObjectId...",
  "images": ["https://res.cloudinary.com/..."]
}
```

---

## Cart — `/api/v1/cart`

> **Lưu ý:** Guest quản lý cart phía client (localStorage). Các endpoint này chỉ dành cho Customer đã đăng nhập.

| Method | Endpoint                 | Auth        | Mô tả                                 |
| ------ | ------------------------ | ----------- | ------------------------------------- |
| GET    | `/cart`                  | ✅ Customer | Lấy giỏ hàng                          |
| POST   | `/cart/items`            | ✅ Customer | Thêm sản phẩm vào giỏ                 |
| PATCH  | `/cart/items/:productId` | ✅ Customer | Cập nhật số lượng                     |
| DELETE | `/cart/items/:productId` | ✅ Customer | Xóa sản phẩm khỏi giỏ                 |
| DELETE | `/cart`                  | ✅ Customer | Xóa toàn bộ giỏ hàng                  |
| POST   | `/cart/merge`            | ✅ Customer | Merge cart localStorage sau đăng nhập |

#### POST `/cart/items`

```json
{ "productId": "...", "quantity": 2 }
```

#### POST `/cart/merge`

```json
{
  "items": [
    { "productId": "...", "quantity": 1 },
    { "productId": "...", "quantity": 3 }
  ]
}
```

---

## Order & Checkout — `/api/v1/orders`

| Method | Endpoint             | Auth                  | Mô tả                         |
| ------ | -------------------- | --------------------- | ----------------------------- |
| POST   | `/orders`            | ❌ (Guest + Customer) | Tạo đơn hàng & khởi tạo VNPay |
| GET    | `/orders/my`         | ✅ Customer           | Lịch sử đơn hàng của mình     |
| GET    | `/orders/my/:id`     | ✅ Customer           | Chi tiết 1 đơn của mình       |
| GET    | `/orders`            | ✅ Admin              | Tất cả đơn hàng               |
| GET    | `/orders/:id`        | ✅ Admin              | Chi tiết đơn bất kỳ           |
| PATCH  | `/orders/:id/status` | ✅ Admin              | Cập nhật trạng thái đơn       |

#### POST `/orders` — Tạo đơn hàng

```json
// Request Body
{
  "recipient": {
    "fullName": "Nguyễn Văn A",
    "phone": "0901234567",
    "email": "a@example.com",
    "address": "123 Nguyễn Huệ, Q1, TP.HCM"
  },
  "items": [
    { "productId": "...", "quantity": 2 }
  ]
}

// Response 201
{
  "success": true,
  "data": {
    "orderId": "...",
    "orderCode": "ORD-20241002-ABCD",
    "totalAmount": 59980000,
    "vnpayUrl": "https://sandbox.vnpayment.vn/paymentv2/..."
  }
}
```

#### PATCH `/orders/:id/status`

```json
{ "status": "shipping" } // confirmed | shipping | delivered | cancelled | refunded
```

---

## Payment — `/api/v1/payments`

| Method | Endpoint                 | Auth | Mô tả                                         |
| ------ | ------------------------ | ---- | --------------------------------------------- |
| GET    | `/payments/vnpay/return` | ❌   | VNPay redirect sau thanh toán (user redirect) |
| POST   | `/payments/vnpay/ipn`    | ❌   | VNPay IPN webhook (server-to-server)          |

> `vnpay/return`: Redirect user về FE với kết quả (success/fail)  
> `vnpay/ipn`: Webhook server-to-server — xử lý thực tế, verify checksum, cập nhật Order

---

## Upload — `/api/v1/upload`

| Method | Endpoint        | Auth     | Mô tả                                 |
| ------ | --------------- | -------- | ------------------------------------- |
| POST   | `/upload/image` | ✅ Admin | Upload ảnh lên Cloudinary, trả về URL |

```json
// Request: multipart/form-data, field: "file"
// Response 201
{
  "success": true,
  "data": { "url": "https://res.cloudinary.com/..." }
}
```

---

## Admin — `/api/v1/admin`

| Method | Endpoint                 | Auth     | Mô tả          |
| ------ | ------------------------ | -------- | -------------- |
| GET    | `/admin/users`           | ✅ Admin | Danh sách user |
| PATCH  | `/admin/users/:id/ban`   | ✅ Admin | Ban user       |
| PATCH  | `/admin/users/:id/unban` | ✅ Admin | Unban user     |

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

// 403 - Forbidden
{ "success": false, "message": "Bạn không có quyền thực hiện thao tác này" }

// 404 - Not Found
{ "success": false, "message": "Không tìm thấy sản phẩm" }
```

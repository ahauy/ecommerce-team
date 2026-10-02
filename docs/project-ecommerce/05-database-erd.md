# 05 — Database ERD

## Tổng quan Collections

MongoDB sử dụng các collection sau:

```
users
categories
products
carts          (chỉ cho Customer đã đăng nhập)
orders
order_items    (embedded trong orders)
payments
```

---

## Schema Chi tiết

### `users`

```js
{
  _id: ObjectId,
  email: String,          // unique, required
  password: String,       // bcrypt hashed
  fullName: String,       // required
  phone: String,          // optional
  address: String,        // optional — dùng cho checkout nhanh
  role: String,           // enum: ['customer', 'admin'], default: 'customer'
  isActive: Boolean,      // default: true — false khi bị ban
  refreshToken: String,   // lưu refresh token hiện tại (hash hoặc raw)
  createdAt: Date,
  updatedAt: Date
}
```

### `categories`

```js
{
  _id: ObjectId,
  name: String,           // unique, required
  slug: String,           // unique, tạo tự động từ name (dùng để filter URL)
  description: String,    // optional
  imageUrl: String,       // optional — Cloudinary URL
  isActive: Boolean,      // default: true
  createdAt: Date,
  updatedAt: Date
}
```

### `products`

```js
{
  _id: ObjectId,
  name: String,           // required
  slug: String,           // unique, tạo tự động từ name
  description: String,    // required
  price: Number,          // VNĐ, integer, > 0
  stock: Number,          // integer, >= 0
  images: [String],       // Cloudinary URLs, max 5
  categoryId: ObjectId,   // ref: 'categories', required
  isActive: Boolean,      // default: true (false = ẩn SP, không xóa)
  createdAt: Date,
  updatedAt: Date
}
```

### `carts`

> Chỉ tồn tại cho Customer đăng nhập. Guest dùng localStorage.

```js
{
  _id: ObjectId,
  userId: ObjectId,       // ref: 'users', unique (1 user 1 cart)
  items: [
    {
      productId: ObjectId,  // ref: 'products'
      quantity: Number,     // >= 1
      price: Number         // snapshot giá tại thời điểm thêm vào giỏ
    }
  ],
  updatedAt: Date
}
```

### `orders`

> `orderItems` được embed trực tiếp trong order (không tách collection riêng)

```js
{
  _id: ObjectId,
  orderCode: String,       // unique, tự generate (e.g. "ORD-20241002-XXXX")
  userId: ObjectId,        // ref: 'users' — null nếu là Guest

  // Thông tin người nhận (snapshot tại thời điểm đặt hàng)
  recipient: {
    fullName: String,      // required
    phone: String,         // required
    email: String,         // required
    address: String        // required
  },

  items: [
    {
      productId: ObjectId, // ref: 'products'
      name: String,        // snapshot tên SP
      imageUrl: String,    // snapshot ảnh đầu tiên
      price: Number,       // snapshot giá
      quantity: Number
    }
  ],

  totalAmount: Number,     // VNĐ — tổng tại thời điểm đặt
  status: String,          // enum: ['pending','confirmed','shipping','delivered','cancelled','refunded']

  // Payment
  paymentMethod: String,   // 'vnpay'
  paymentStatus: String,   // enum: ['unpaid', 'paid', 'refunded']
  vnpayTransactionId: String, // từ VNPay callback

  createdAt: Date,
  updatedAt: Date
}
```

### `payments`

> Lưu raw data từ VNPay để audit/debug

```js
{
  _id: ObjectId,
  orderId: ObjectId,       // ref: 'orders'
  vnpayData: Object,       // toàn bộ query params từ VNPay callback
  isSuccess: Boolean,
  createdAt: Date
}
```

---

## ERD — Quan hệ giữa các Collections

```
users ──────────────────────────── carts
  │  (1)                    (1)    │
  │                                │
  │  (1)                    (n)    │
  └────────────────────────── orders
                                   │
                           embed   │
                           items──►│ (products snapshot)

categories ──── (1 to n) ──── products
                                   │
                           orderItems (snapshot, không ref)
```

**Ghi chú quan trọng:**

- `orders.items` chứa **snapshot** (tên, giá, ảnh tại thời điểm đặt) — không phải ObjectId reference thuần túy, tránh bị ảnh hưởng khi admin sửa sản phẩm sau.
- `orders.userId = null` khi là Guest checkout.
- `carts` chỉ tồn tại cho Customer — Guest không có document trong collection này.

---

## Index đề xuất

```js
// users
users.email: unique index
users.role: index

// categories
categories.slug: unique index

// products
products.slug: unique index
products.categoryId: index
products.name: text index  // cho full-text search
products.price: index      // cho range filter
products.isActive: index

// orders
orders.userId: index
orders.status: index
orders.orderCode: unique index
orders.createdAt: index    // sort by date
```

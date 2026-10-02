# 05 — Database ERD

## Tổng quan Collections

MongoDB sử dụng các collection sau:

```
users          (vừa là người mua, vừa là người bán — có thông tin gian hàng)
categories
products       (mỗi SP thuộc 1 người bán: sellerId)
carts          (chỉ cho user đã đăng nhập)
checkouts      (1 lần bấm "Đặt hàng" = 1 checkout = 1 giao dịch VNPay)
orders         (mỗi người bán 1 order trong 1 checkout)
order_items    (embedded trong orders)
payments       (raw log callback VNPay)
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

  // ── Gian hàng (null cho tới khi user thiết lập để đăng bán) ──
  shopName: String,       // optional, 3–50 ký tự — bắt buộc có mới được đăng SP
  pickupAddress: String,  // optional — địa chỉ lấy hàng, bắt buộc có mới được đăng SP

  createdAt: Date,
  updatedAt: Date
}
```

> Không có role `seller`. User có `shopName` + `pickupAddress` là đủ điều kiện đăng bán.

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
  sellerId: ObjectId,     // ref: 'users', required, BẤT BIẾN — chủ sở hữu SP
  name: String,           // required, max 120 ký tự
  slug: String,           // unique, tạo tự động từ name
  description: String,    // required
  price: Number,          // VNĐ, integer, > 0
  stock: Number,          // integer, >= 0
  images: [String],       // Cloudinary URLs, max 5 — ảnh đầu là ảnh bìa
  categoryId: ObjectId,   // ref: 'categories', required

  isActive: Boolean,      // default: true — SELLER ẩn/hiện SP (false = ẩn, không xóa)
  isBlocked: Boolean,     // default: false — ADMIN gỡ SP vi phạm / seller bị ban
  blockReason: String,    // lý do block; = "seller_banned" khi block do ban user

  createdAt: Date,
  updatedAt: Date
}
```

> **Hiển thị công khai** khi `isActive = true` **và** `isBlocked = false`.
> Hai cờ tách riêng để seller không thể tự mở lại SP đã bị Admin block.

### `carts`

> Chỉ tồn tại cho user đăng nhập. Guest dùng localStorage.

```js
{
  _id: ObjectId,
  userId: ObjectId,       // ref: 'users', unique (1 user 1 cart)
  items: [
    {
      productId: ObjectId,  // ref: 'products'
      quantity: Number,     // >= 1
      price: Number         // snapshot giá tại thời điểm thêm vào giỏ (chỉ để hiển thị)
    }
  ],
  updatedAt: Date
}
```

> `sellerId` **không** lưu trong cart — lấy từ product khi `GET /cart` để nhóm theo người bán.

### `checkouts`

> Đại diện cho **một lần thanh toán**. Gom nhiều Order (mỗi người bán một Order).

```js
{
  _id: ObjectId,
  checkoutCode: String,    // unique, tự generate (e.g. "CHK-20261002-ABCD") — dùng làm vnp_TxnRef
  userId: ObjectId,        // ref: 'users' — null nếu là Guest

  recipient: {             // snapshot người nhận, dùng chung cho mọi order con
    fullName: String,
    phone: String,
    email: String,
    address: String
  },

  orderIds: [ObjectId],    // ref: 'orders' — các order con
  totalAmount: Number,     // VNĐ — tổng totalAmount của các order con

  status: String,          // enum: ['pending','paid','failed','expired'], default 'pending'
  expiresAt: Date,         // createdAt + 30 phút (CHECKOUT_EXPIRE_MINUTES)
  paidAt: Date,            // set khi paid
  vnpayTransactionId: String, // vnp_TransactionNo từ callback

  createdAt: Date,
  updatedAt: Date
}
```

### `orders`

> Mỗi Order thuộc **đúng 1 người bán**. `items` được embed trực tiếp (không tách collection riêng).

```js
{
  _id: ObjectId,
  orderCode: String,       // unique, tự generate (e.g. "ORD-20261002-XXXX")
  checkoutId: ObjectId,    // ref: 'checkouts', required
  userId: ObjectId,        // ref: 'users' — người mua; null nếu là Guest
  sellerId: ObjectId,      // ref: 'users', required — người bán của đơn này

  // Thông tin người nhận (snapshot tại thời điểm đặt hàng, copy từ checkout)
  recipient: {
    fullName: String,      // required
    phone: String,         // required
    email: String,         // required
    address: String        // required
  },

  // Snapshot shop để hiển thị cho người mua dù seller đổi tên shop sau này
  sellerShopName: String,

  items: [
    {
      productId: ObjectId, // ref: 'products'
      name: String,        // snapshot tên SP
      imageUrl: String,    // snapshot ảnh đầu tiên
      price: Number,       // snapshot giá (lấy từ DB lúc tạo order)
      quantity: Number
    }
  ],

  totalAmount: Number,     // VNĐ — tổng tiền của RIÊNG order này
  status: String,          // enum: ['pending','confirmed','shipping','delivered','cancelled','refunded']

  // Payment
  paymentMethod: String,   // 'vnpay'
  paymentStatus: String,   // enum: ['unpaid', 'paid', 'refunded']

  // Hủy đơn
  cancelReason: String,    // bắt buộc khi seller/admin hủy
  cancelledBy: String,     // enum: ['system', 'seller', 'admin']

  createdAt: Date,
  updatedAt: Date
}
```

### `payments`

> Lưu raw data từ VNPay để audit/debug. Ghi **cả** callback không hợp lệ.

```js
{
  _id: ObjectId,
  checkoutId: ObjectId,    // ref: 'checkouts' (null nếu không tìm thấy TxnRef)
  source: String,          // enum: ['ipn', 'return']
  vnpayData: Object,       // toàn bộ query params từ VNPay
  isValidSignature: Boolean,
  isSuccess: Boolean,
  note: String,            // vd: "late_success_after_expiry" để Admin hoàn tiền thủ công
  createdAt: Date
}
```

---

## ERD — Quan hệ giữa các Collections

```
users ───────────────────────────── carts            (1 — 1)
  │
  ├── (1 — n) products        via products.sellerId   ← người bán sở hữu SP
  │
  ├── (1 — n) checkouts       via checkouts.userId    ← người mua (null = Guest)
  │
  ├── (1 — n) orders          via orders.userId       ← người mua
  │
  └── (1 — n) orders          via orders.sellerId     ← người bán

checkouts ── (1 — n) ── orders          via orders.checkoutId
checkouts ── (1 — n) ── payments        via payments.checkoutId

categories ── (1 — n) ── products
products ·····> orders.items            (snapshot, không ref thuần túy)
```

**Ghi chú quan trọng:**

- Một `users` document đóng **hai vai**: người mua (`orders.userId`) và người bán (`products.sellerId`, `orders.sellerId`).
- `orders.items` chứa **snapshot** (tên, giá, ảnh tại thời điểm đặt) — tránh bị ảnh hưởng khi seller sửa SP sau.
- `checkouts.userId = null` và `orders.userId = null` khi là Guest checkout.
- `carts` chỉ tồn tại cho user đăng nhập — Guest không có document trong collection này.
- Thanh toán gắn ở cấp **checkout**; trạng thái giao hàng gắn ở cấp **order**.

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
products.sellerId: index              // GET /products/my, trang shop
products.categoryId: index
products.name: text index             // cho full-text search
products.price: index                 // cho range filter
products.{isActive, isBlocked}: compound index  // lọc SP hiển thị

// checkouts
checkouts.checkoutCode: unique index
checkouts.userId: index
checkouts.{status, expiresAt}: compound index   // job hủy checkout quá hạn

// orders
orders.orderCode: unique index
orders.checkoutId: index
orders.userId: index                  // lịch sử mua
orders.sellerId: index                // đơn bán của seller
orders.status: index
orders.createdAt: index               // sort by date
```

---

## Cập nhật tồn kho — quy ước

```js
// Trừ stock (khi tạo Order) — nguyên tử, chống bán lố
Product.updateOne(
  { _id, stock: { $gte: quantity }, isActive: true, isBlocked: false },
  { $inc: { stock: -quantity } },
); // modifiedCount === 0 → không đủ hàng / SP không còn bán → rollback các SP đã trừ trước đó

// Hoàn stock (khi → cancelled) — chỉ hoàn nếu vừa chuyển trạng thái thành công
Order.findOneAndUpdate(
  { _id, status: { $in: ['pending', 'confirmed'] } },
  { status: 'cancelled', ... },
); // có kết quả trả về → mới $inc stock lại cho từng item
```

# 09 — Environment Setup

## Yêu cầu cài đặt

| Công cụ | Version tối thiểu | Ghi chú                         |
| ------- | ----------------- | ------------------------------- |
| Node.js | >= 20.x           | Dùng LTS                        |
| npm     | >= 10.x           | Đi kèm Node                     |
| pnpm    | >= 8.x            | Chỉ cho `frontend/` (`corepack enable`) |
| MongoDB | >= 7.x (replica set) | **Bắt buộc replica set** để dùng transaction: dùng MongoDB Atlas (khuyến nghị) hoặc single-node replica set ở local |
| Git     | >= 2.x            |                                 |

---

## Cách clone & chạy

```bash
# 1. Clone repo
git clone <repo-url>
cd <project-folder>/backend

# 2. Cài dependencies
npm install

# 3. Copy file env
cp .env.example .env

# 4. Điền các giá trị vào .env (xem bảng bên dưới)

# 5. Chạy dev
npm run start:dev
```

---

## File `.env.example`

```env
# ── App ──────────────────────────────────────────
PORT=3000
NODE_ENV=development

# ── MongoDB ──────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/ecommerce
# Hoặc dùng Atlas:
# MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ecommerce

# ── JWT ──────────────────────────────────────────
JWT_ACCESS_SECRET=your_access_secret_here
JWT_ACCESS_EXPIRES_IN=15m

JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=7d

# ── Cloudinary ───────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── PayOS ────────────────────────────────────────
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
# Return URL / Cancel URL = FRONTEND_URL/checkout/result?checkoutCode=... (backend tự ghép, không cần biến riêng).
# Webhook URL khai báo trong trang quản lý PayOS, không nằm trong .env:
#   https://<backend-public>/api/v1/payments/payos/webhook
# localhost KHÔNG nhận được webhook → dùng ngrok/cloudflared, hoặc dựa vào đồng bộ chủ động (BR-PAY-006).

# ── Checkout ─────────────────────────────────────
CHECKOUT_EXPIRE_MINUTES=30

# ── Seed (tài khoản Admin đầu tiên — BR-AUTH-004) ─
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me_please

# Khi deploy (Vercel + Render) — xem 10-deployment.md:
#   FRONTEND_URL = URL Vercel của frontend (không có dấu / ở cuối)
#   Webhook URL của PayOS = URL public của backend trên Render (khai báo trong trang quản lý PayOS)

# ── Frontend URL (CORS + redirect sau thanh toán) ─
# Return URL redirect về: ${FRONTEND_URL}/checkout/result?checkoutCode=...&status=success|failed
FRONTEND_URL=http://localhost:5173
```

---

## Hướng dẫn lấy credentials

### MongoDB Atlas (nếu không chạy local)

1. Vào [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Tạo cluster free tier
3. Database Access → Tạo user + password
4. Network Access → Add IP `0.0.0.0/0` (development)
5. Connect → Copy connection string → paste vào `MONGODB_URI`

### Cloudinary

1. Đăng ký tại [https://cloudinary.com](https://cloudinary.com)
2. Dashboard → Copy: `Cloud Name`, `API Key`, `API Secret`
3. Dán vào `.env`

### PayOS

1. Đăng ký tại [https://my.payos.vn](https://my.payos.vn) — cần CCCD và **tài khoản ngân hàng thật** đứng tên người đăng ký.
2. Tạo **kênh thanh toán** liên kết tài khoản ngân hàng nhận tiền → lấy `Client ID`, `Api Key`, `Checksum Key` → dán vào `.env`.
3. Khai báo **Webhook URL** cho kênh (cần URL public HTTPS: ngrok/cloudflared khi dev, URL Render khi deploy). PayOS gửi một request thử khi lưu → backend phải đang chạy và trả 200.
4. **PayOS không có sandbox.** Test bằng giao dịch thật với số tiền nhỏ (vd tạo SP giá vài nghìn đồng), thanh toán bằng chuyển khoản / quét VietQR từ app ngân hàng. Tiền về chính tài khoản đã liên kết.
   - Mỗi **Checkout** = một payment link: `orderCode = payosOrderCode` (số nguyên), `amount = totalAmount` (VNĐ, không nhân 100).
   - Chạy localhost không có webhook: mở trang kết quả `/checkout/result` để backend tự tra cứu trạng thái từ PayOS.

---

## Quy tắc .env trong team

| Rule                         | Chi tiết                                                   |
| ---------------------------- | ---------------------------------------------------------- |
| ❌ **KHÔNG commit `.env`**   | File `.env` phải có trong `.gitignore`                     |
| ✅ **COMMIT `.env.example`** | Mẫu với các key, value để trống hoặc placeholder           |
| 📤 **Chia sẻ credentials**   | Qua kênh private (Zalo/Slack) — không paste lên chat chung |
| 🔄 **Khi thêm biến mới**     | Luôn cập nhật `.env.example` và thông báo teammate         |

---

## CORS Configuration

Backend cần cho phép domain FE gọi API:

```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

---

## Lưu ý về MongoDB

Việc trừ / hoàn stock dùng **cập nhật nguyên tử có điều kiện** (`updateOne` với `stock: { $gte: qty }`) nên **không bắt buộc** replica set / transaction. Nếu team muốn dùng `session.withTransaction()` thì cần MongoDB Atlas hoặc replica set local.

---

## Kiểm tra setup thành công

```bash
# Sau khi chạy npm run start:dev, kiểm tra:
curl http://localhost:3000/api/v1/categories

# Kết quả mong đợi:
# { "success": true, "data": [] }
```

---

## Scripts NestJS hữu ích

```bash
npm run start:dev     # Chạy development (hot reload)
npm run build         # Build production
npm run start:prod    # Chạy production build
npm run lint          # Kiểm tra lỗi ESLint
npm run format        # Format code với Prettier

# Generate NestJS resource nhanh:
nest g module categories
nest g controller categories
nest g service categories
```

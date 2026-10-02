# 09 — Environment Setup

## Yêu cầu cài đặt

| Công cụ | Version tối thiểu | Ghi chú                         |
| ------- | ----------------- | ------------------------------- |
| Node.js | >= 20.x           | Dùng LTS                        |
| npm     | >= 10.x           | Đi kèm Node                     |
| MongoDB | >= 7.x            | Hoặc dùng MongoDB Atlas (cloud) |
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

# ── VNPay ────────────────────────────────────────
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/v1/payments/vnpay/return
VNPAY_IPN_URL=http://localhost:3000/api/v1/payments/vnpay/ipn

# ── Frontend URL (CORS) ───────────────────────────
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

### VNPay Sandbox

1. Đăng ký tại [https://sandbox.vnpayment.vn/devreg/](https://sandbox.vnpayment.vn/devreg/)
2. Lấy `TmnCode` và `SecretKey`
3. Dùng thẻ test: [https://sandbox.vnpayment.vn/apis/vnpay-demo/](https://sandbox.vnpayment.vn/apis/vnpay-demo/)
   - Ngân hàng: NCB
   - Số thẻ: `9704198526191432198`
   - Tên: `NGUYEN VAN A`
   - Ngày: `07/15`, OTP: `123456`

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

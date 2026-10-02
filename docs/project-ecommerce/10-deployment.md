# 10 — Deploy đơn giản (Vercel + Render)

> Mục tiêu: có URL chạy được để demo. **Không** CI/CD, Docker, domain riêng. Chốt ở review D5: chỉ cần Vercel (frontend) + Render (backend).

```
Trình duyệt ──► Vercel (frontend, static) ──► Render (backend NestJS) ──► MongoDB Atlas
                                                  ▲        └──► Cloudinary
                          VNPay sandbox (Return / IPN) ────────┘
```

Thứ tự làm: **Atlas → Render (BE) → Vercel (FE) → cập nhật URL chéo → seed → smoke test**.

---

## 1. MongoDB Atlas

- Cluster free (M0) đã là replica set → dùng được transaction (BR-CHK-010).
- *Network Access*: Render free không có IP outbound cố định → cho phép `0.0.0.0/0` (chỉ chấp nhận được cho bài test; dùng user/password DB mạnh).
- Lấy connection string để điền `MONGODB_URI` ở bước 2 (tên biến theo `09-environment-setup.md`).

## 2. Backend trên Render

*New → Web Service* → chọn repo + nhánh.

| Mục | Giá trị |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm run start:prod` |
| Instance Type | Free |

- `--include=dev`: nếu đặt `NODE_ENV=production` thì `npm install` bỏ qua devDependencies và `nest build` sẽ lỗi.
- Nest phải nghe đúng cổng Render cấp: `await app.listen(process.env.PORT ?? 3000, '0.0.0.0')`.
- CORS: `app.enableCors({ origin: process.env.FRONTEND_URL })`.
- *Environment*: copy toàn bộ biến trong `.env` theo `09`, đổi: `NODE_ENV=production`, `MONGODB_URI` (Atlas), `FRONTEND_URL` (điền ở bước 4), Return URL / `VNPAY_IPN_URL` (bước 4), `ADMIN_EMAIL` / `ADMIN_PASSWORD` (mật khẩu mạnh).
- Sau khi deploy xong ghi lại URL dạng `https://<tên-service>.onrender.com`.

## 3. Frontend trên Vercel

*Add New → Project* → chọn repo.

| Mục | Giá trị |
| --- | --- |
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Install Command | `pnpm install` |
| Build Command | `pnpm build` |
| Output Directory | `dist` |

- Biến base URL API của FE (tên theo template, ví dụ `VITE_API_URL`) = `https://<tên-service>.onrender.com/api/v1`. Biến `VITE_*` được nhúng lúc build → đổi giá trị phải **redeploy**.
- Tạo `frontend/vercel.json` để F5 / mở thẳng `/checkout/result` không bị 404 (SPA routing):

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

## 4. Cập nhật URL chéo

1. Render → `FRONTEND_URL` = URL Vercel (không có dấu `/` cuối) → redeploy BE.
2. Return URL và `VNPAY_IPN_URL` = URL backend trên Render (`.../api/v1/payments/vnpay/return` và `.../ipn`).
3. Đăng ký IPN URL trong trang quản trị merchant sandbox của VNPay (cùng tài khoản đã nhận email sandbox). Deploy xong là IPN gọi được thật; Return URL vẫn cập nhật đơn như dự phòng (xem `06`).

## 5. Seed dữ liệu demo

Chạy từ máy local, trỏ vào Atlas (shell trên Render free không dùng được):

```bash
cd backend
MONGODB_URI="<connection string Atlas>" ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed
```

Ghi tài khoản demo (Admin, 2 seller, 1 buyer) vào `README.md`.

## 6. Smoke test trên URL thật

- [ ] Mở FE, đăng nhập Admin / seller / buyer được (CORS ổn).
- [ ] Seller đăng SP có ảnh (Cloudinary).
- [ ] Buyer thêm giỏ 2 shop → Checkout → thanh toán VNPay sandbox → về trang kết quả đúng trạng thái.
- [ ] Mở thẳng `/checkout/result?checkoutCode=...` (F5) không 404.
- [ ] Thanh toán thất bại / hết hạn → stock được hoàn lại.

---

## Giới hạn của Render free (kiểm tra docs Render ngày 02/10/2026)

- **Ngủ sau ~15 phút không có request**; request đầu tiên sau đó có thể chờ khoảng 30–60 giây → mở URL backend ~2 phút trước khi demo.
- Job `@Cron` hết hạn Checkout không chạy khi service ngủ; khi thức dậy, lần quét kế tiếp sẽ expire các Checkout quá `expiresAt` và hoàn stock (hoàn muộn, không mất dữ liệu).
- Filesystem tạm (mất khi redeploy/restart) → không lưu file cục bộ; ảnh đã nằm trên Cloudinary nên ổn.
- Có giới hạn số giờ chạy miễn phí mỗi tháng — đừng để nhiều service free chạy thừa.

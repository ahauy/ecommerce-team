# 02 — Scope

## ✅ Must Have (trong 1 tuần)

| #   | Module               | Mô tả                                                                                           |
| --- | -------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | **Auth**             | Đăng ký, đăng nhập, JWT (access + refresh token), đăng xuất                                     |
| 2   | **Category**         | CRUD danh mục sản phẩm (Admin quản lý), liên kết với Product                                    |
| 3   | **Product**          | CRUD sản phẩm, upload ảnh Cloudinary, tìm kiếm & lọc theo category/giá/tên, quản lý inventory   |
| 4   | **Cart**             | Thêm/xóa/cập nhật giỏ hàng (Guest dùng session/local, Customer lưu DB)                          |
| 5   | **Order & Checkout** | Guest checkout không cần tài khoản (điền thông tin ship + email), Customer checkout với account |
| 6   | **Payment — VNPay**  | Tích hợp VNPay, xử lý callback webhook, tự động `confirmed` sau thanh toán                      |
| 7   | **Order Management** | Customer xem lịch sử đơn hàng; Admin cập nhật trạng thái đơn                                    |
| 8   | **Admin Dashboard**  | Quản lý User, Category, Product, Order                                                          |

## ❌ Won't Have (không làm trong tuần này)

| #   | Tính năng                          | Lý do                                  |
| --- | ---------------------------------- | -------------------------------------- |
| -   | Review / Rating sản phẩm           | Ngoài scope bài test                   |
| -   | Voucher / Coupon / Discount        | Ngoài scope bài test                   |
| -   | Multi-vendor / Seller role         | Chỉ có Admin bán hàng                  |
| -   | Realtime notification (Socket.io)  | Ngoài scope                            |
| -   | Email transactional (xác nhận đơn) | Ngoài scope (chỉ xác nhận đơn trên UI) |
| -   | Internationalization (i18n)        | Chỉ Tiếng Việt                         |
| -   | Multi-currency                     | Chỉ VNĐ                                |
| -   | Analytics / Report                 | Ngoài scope                            |

## 📐 Boundary Notes

- **Inventory**: đặt hàng → trừ stock ngay khi tạo Order (không chờ confirm)
- **Cart của Guest**: lưu phía client (localStorage/cookie), không persist DB
- **Cart của Customer**: lưu DB, sync khi đăng nhập
- **Order email**: nằm trong Won't-Have — Admin xem đơn trực tiếp trên dashboard

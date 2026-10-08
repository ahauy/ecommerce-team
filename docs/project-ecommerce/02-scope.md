# 02 — Scope

## ✅ Must Have (trong 1 tuần)

| #   | Module               | Mô tả                                                                                           |
| --- | -------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | **Auth**             | Đăng ký, đăng nhập, JWT (access + refresh token), đăng xuất                                     |
| 2   | **Category**         | CRUD danh mục sản phẩm (Admin quản lý), liên kết với Product                                    |
| 3   | **Product**          | Đăng bán / sửa / ẩn SP (**người bán sở hữu SP của mình**), upload ảnh Cloudinary, tìm kiếm & lọc theo category/giá/tên/người bán, quản lý inventory |
| 4   | **Cart**             | Thêm/xóa/cập nhật giỏ hàng (Guest dùng localStorage, Customer lưu DB); giỏ nhóm theo người bán; không mua SP của chính mình |
| 5   | **Order & Checkout** | Chỉ user đã đăng nhập (không có Guest checkout); **1 lần checkout tách thành mỗi người bán 1 Order** (gom trong 1 Checkout) |
| 6   | **Payment — PayOS**  | 1 payment link PayOS cho cả Checkout, xử lý webhook + đồng bộ trạng thái, tự động `confirmed` tất cả Order con sau thanh toán |
| 7   | **Order Management** | Người mua xem đơn đã mua; **Người bán xem & cập nhật trạng thái đơn của mình**; Admin quản lý mọi đơn |
| 8   | **Admin Dashboard**  | Quản lý User (ban kéo theo block SP), Category, Product (block SP vi phạm), Order               |
| 9   | **Seller / Gian hàng** | Thiết lập gian hàng (`shopName`, `pickupAddress`), trang shop công khai, "Sản phẩm của tôi", "Đơn bán" |
| 10  | **User Profile**     | Xem / sửa profile (`/users/me`) để prefill checkout                                             |

## ❌ Won't Have (không làm trong tuần này)

| #   | Tính năng                          | Lý do                                  |
| --- | ---------------------------------- | -------------------------------------- |
| -   | Review / Rating sản phẩm           | Ngoài scope bài test                   |
| -   | Voucher / Coupon / Discount        | Ngoài scope bài test                   |
| -   | Role `seller` riêng / đăng ký shop có KYC (CCCD, thuế) | Dùng chung 1 tài khoản; bán = có `shopName` |
| -   | Duyệt SP trước khi hiển thị        | Admin kiểm duyệt sau bằng block        |
| -   | Biến thể SP (màu/size), thương hiệu | Mỗi SP một giá + một tồn kho          |
| -   | Tính phí vận chuyển / chọn đơn vị vận chuyển | Chỉ ghi nhận trạng thái giao hàng |
| -   | Chia tiền / đối soát / rút tiền cho người bán | Tiền về tài khoản ngân hàng của sàn (liên kết PayOS); hoàn tiền Admin chuyển khoản thủ công |
| -   | Người mua tự hủy đơn / bấm "Đã nhận hàng" | Chỉ Seller & Admin đổi trạng thái |
| -   | Chat người mua – người bán         | Ngoài scope                            |
| -   | Video / nhiều ảnh mô tả SP         | Tối đa 5 ảnh                           |
| -   | Realtime notification (Socket.io)  | Ngoài scope                            |
| -   | Email transactional (xác nhận đơn) | Ngoài scope (chỉ xác nhận đơn trên UI) |
| -   | Internationalization (i18n)        | Chỉ Tiếng Việt                         |
| -   | Multi-currency                     | Chỉ VNĐ                                |
| -   | Analytics / Report                 | Ngoài scope                            |

## 📐 Boundary Notes

- **Inventory**: đặt hàng → trừ stock ngay khi tạo Order (không chờ confirm), dùng cập nhật nguyên tử chống bán lố
- **Cart của Guest**: lưu phía client (localStorage/cookie), không persist DB
- **Cart của Customer**: lưu DB, sync khi đăng nhập
- **Multi-seller checkout**: 1 lần bấm "Đặt hàng" → 1 Checkout + N Order (mỗi người bán 1 Order); thanh toán **một lần**; trạng thái giao hàng mỗi Order độc lập
- **Ai đổi trạng thái đơn**: Seller (chủ đơn) và Admin; người mua chỉ xem
- **Sở hữu**: Seller chỉ sửa SP / xử lý đơn của mình; Admin bypass; Seller không mua SP của mình
- **Order email**: nằm trong Won't-Have — Seller/Admin xem đơn trực tiếp trên dashboard

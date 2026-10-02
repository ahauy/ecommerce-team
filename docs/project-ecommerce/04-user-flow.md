# 04 — User Flow

## Flow 1: Guest — Xem & Mua hàng

```
[Vào trang chủ]
      │
      ▼
[Xem danh sách sản phẩm]
  - Lọc theo category
  - Lọc theo khoảng giá
  - Tìm kiếm theo tên
      │
      ▼
[Xem chi tiết sản phẩm]
  - Ảnh, tên, giá, mô tả, tồn kho
  - Nếu stock = 0 → hiện "Hết hàng", không thêm được giỏ
      │
      ▼
[Thêm vào giỏ hàng] ← lưu localStorage
      │
      ▼
[Xem giỏ hàng]
  - Thay đổi số lượng
  - Xóa sản phẩm
  - Hiển thị tổng tiền (VNĐ)
      │
      ▼
[Checkout — Guest]
  Điền thông tin bắt buộc:
  ✦ Họ tên
  ✦ Số điện thoại
  ✦ Email
  ✦ Địa chỉ giao hàng
      │
      ▼
[Xác nhận đơn hàng]
  - Hiển thị danh sách SP, tổng tiền
  - Bấm "Thanh toán qua VNPay"
      │
      ▼
[Redirect → VNPay]
      │
      ├─── [Thanh toán THÀNH CÔNG]
      │         │
      │         ▼
      │    Backend nhận webhook → Order: pending → confirmed
      │    → Redirect về trang "Đặt hàng thành công"
      │
      └─── [Thanh toán THẤT BẠI / HỦY]
                │
                ▼
           Rollback stock → Order: cancelled
           → Redirect về trang "Thanh toán thất bại"
```

---

## Flow 2: Customer — Đăng ký & Mua hàng

```
[Đăng ký tài khoản]
  - Email, password, họ tên
  - Email đã tồn tại → báo lỗi
      │
      ▼
[Đăng nhập]
  - Nhận Access Token (15 phút) + Refresh Token (7 ngày)
  - Merge cart localStorage vào cart DB
      │
      ▼
[Xem sản phẩm / Thêm vào giỏ] ← như Guest nhưng lưu DB
      │
      ▼
[Checkout — Customer]
  - Tự động điền từ profile
  - Cho phép sửa địa chỉ giao hàng
      │
      ▼
[Thanh toán VNPay] ← tương tự Guest
      │
      ▼
[Xem lịch sử đơn hàng]
  - Danh sách đơn hàng của mình
  - Xem chi tiết từng đơn (sản phẩm, trạng thái, tổng tiền)

[Làm mới Access Token]
  - Dùng Refresh Token khi Access Token hết hạn
  - Refresh Token hết hạn → bắt đăng nhập lại
```

---

## Flow 3: Admin — Quản lý hệ thống

```
[Đăng nhập Admin]
  - Tài khoản role = admin
      │
      ▼
[Admin Dashboard]
  │
  ├── [Quản lý Category]
  │     - Tạo / Sửa / Xóa category
  │     - Không xóa nếu còn sản phẩm đang dùng
  │
  ├── [Quản lý Product]
  │     - Tạo / Sửa / Xóa sản phẩm
  │     - Upload ảnh Cloudinary (tối đa 5 ảnh)
  │     - Gán category
  │     - Cập nhật stock
  │
  ├── [Quản lý Order]
  │     - Xem tất cả đơn hàng
  │     - Lọc theo trạng thái
  │     - Cập nhật trạng thái:
  │         confirmed → shipping → delivered
  │         * → cancelled → refunded
  │
  └── [Quản lý User]
        - Xem danh sách Customer
        - Ban / Unban user
        - Không tự xóa chính mình
```

---

## Edge Cases quan trọng

| Tình huống                                              | Xử lý                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------- |
| Sản phẩm hết hàng khi user đang ở trang checkout        | Báo lỗi, yêu cầu xem lại giỏ hàng                                          |
| Nhiều user cùng mua sản phẩm cuối cùng (race condition) | Validate stock khi tạo Order, lock stock trước khi deduct                  |
| VNPay timeout (không nhận callback)                     | Order ở `pending` quá 30 phút → tự động chuyển `cancelled`, rollback stock |
| Refresh Token hết hạn                                   | Redirect về trang đăng nhập                                                |
| Guest bấm "Đăng nhập" khi đang có hàng trong giỏ        | Sau đăng nhập, merge cart local vào cart DB                                |

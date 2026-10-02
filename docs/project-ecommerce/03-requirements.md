# 03 — Requirements (Business Rules)

## BR — Business Rules

### Auth

| ID          | Rule                                                               |
| ----------- | ------------------------------------------------------------------ |
| BR-AUTH-001 | Email là định danh duy nhất — không được trùng khi đăng ký         |
| BR-AUTH-002 | Password phải hash bằng bcrypt trước khi lưu DB                    |
| BR-AUTH-003 | Access Token hết hạn sau 15 phút; Refresh Token hết hạn sau 7 ngày |
| BR-AUTH-004 | Chỉ Admin mới có thể gán role `admin` cho user khác                |
| BR-AUTH-005 | Guest không có token — truy cập public endpoint bình thường        |

### Category

| ID         | Rule                                                                                 |
| ---------- | ------------------------------------------------------------------------------------ |
| BR-CAT-001 | Tên category phải unique                                                             |
| BR-CAT-002 | Không được xóa category nếu còn sản phẩm đang dùng (hoặc phải unlink sản phẩm trước) |
| BR-CAT-003 | Chỉ Admin được CRUD category                                                         |
| BR-CAT-004 | Category có thể có ảnh đại diện (optional)                                           |

### Product

| ID         | Rule                                                                             |
| ---------- | -------------------------------------------------------------------------------- |
| BR-PRD-001 | Mỗi sản phẩm phải thuộc đúng 1 category                                          |
| BR-PRD-002 | `stock` (tồn kho) không được âm — validate trước khi tạo Order                   |
| BR-PRD-003 | Khi `stock = 0`, sản phẩm hiển thị "Hết hàng" — vẫn xem được, không thêm vào giỏ |
| BR-PRD-004 | Giá sản phẩm là số nguyên dương (VNĐ), không có số thập phân                     |
| BR-PRD-005 | Ảnh sản phẩm lưu URL Cloudinary, tối đa 5 ảnh / sản phẩm                         |
| BR-PRD-006 | Tìm kiếm hỗ trợ: tên (text search), lọc theo category, lọc theo khoảng giá       |
| BR-PRD-007 | Chỉ Admin được CRUD sản phẩm                                                     |

### Cart

| ID          | Rule                                                               |
| ----------- | ------------------------------------------------------------------ |
| BR-CART-001 | Guest: cart lưu client-side (localStorage). Không persist DB       |
| BR-CART-002 | Customer: cart lưu DB. Khi đăng nhập, merge cart local vào cart DB |
| BR-CART-003 | Số lượng trong cart không được vượt quá `stock` hiện tại           |
| BR-CART-004 | Xóa item khỏi cart khi `stock = 0` lúc user load lại giỏ hàng      |

### Order & Checkout

| ID         | Rule                                                                                   |
| ---------- | -------------------------------------------------------------------------------------- |
| BR-ORD-001 | Guest checkout: bắt buộc điền `fullName`, `phone`, `email`, `shippingAddress`          |
| BR-ORD-002 | Customer checkout: tự động lấy thông tin từ profile, cho phép override địa chỉ         |
| BR-ORD-003 | Khi tạo Order: trừ `stock` ngay lập tức (reserve inventory)                            |
| BR-ORD-004 | Nếu thanh toán thất bại hoặc timeout: rollback `stock` — Order chuyển sang `cancelled` |
| BR-ORD-005 | Order không thể bị xóa — chỉ thay đổi trạng thái                                       |
| BR-ORD-006 | Customer chỉ thấy Order của chính mình                                                 |
| BR-ORD-007 | Admin thấy tất cả Order và có thể cập nhật trạng thái                                  |

### Order State Machine

```
[pending]
    │
    │ VNPay callback SUCCESS
    ▼
[confirmed]
    │
    │ Admin cập nhật
    ▼
[shipping]
    │
    │ Admin cập nhật
    ▼
[delivered]

[pending] ──→ [cancelled]  (thanh toán thất bại / timeout / Admin hủy)
[confirmed] ──→ [cancelled] (Admin hủy trước khi ship)
[cancelled] ──→ [refunded]  (Admin xử lý hoàn tiền thủ công)
```

| ID         | Rule                                                             |
| ---------- | ---------------------------------------------------------------- |
| BR-ORD-008 | Chuyển `pending → confirmed`: chỉ qua VNPay callback tự động     |
| BR-ORD-009 | Chuyển `confirmed → shipping → delivered`: chỉ Admin             |
| BR-ORD-010 | Chuyển `→ cancelled`: Admin hoặc hệ thống (thanh toán lỗi)       |
| BR-ORD-011 | Chuyển `cancelled → refunded`: chỉ Admin                         |
| BR-ORD-012 | `delivered` và `refunded` là trạng thái cuối — không chuyển tiếp |

### Payment — VNPay

| ID         | Rule                                                                          |
| ---------- | ----------------------------------------------------------------------------- |
| BR-PAY-001 | Redirect user đến VNPay sau khi tạo Order                                     |
| BR-PAY-002 | VNPay gọi về webhook URL của backend để xác nhận kết quả                      |
| BR-PAY-003 | Backend verify chữ ký (checksum) VNPay trước khi xử lý callback               |
| BR-PAY-004 | Thanh toán thành công → `confirmed`, trừ stock đã thực hiện từ bước tạo Order |
| BR-PAY-005 | Thanh toán thất bại → rollback stock, Order → `cancelled`                     |

### Admin

| ID         | Rule                                                       |
| ---------- | ---------------------------------------------------------- |
| BR-ADM-001 | Admin truy cập tất cả: User list, Category, Product, Order |
| BR-ADM-002 | Admin không thể tự xóa chính mình                          |
| BR-ADM-003 | Admin có thể ban/unban user (Customer)                     |

# 03 — Requirements (Business Rules)

> **Mô hình:** sàn thương mại điện tử nhiều người bán (kiểu Shopee thu gọn). **Một tài khoản dùng cho cả mua và bán** — không có role `seller` riêng. "Người bán" (Seller) là vai trò theo ngữ cảnh: user là chủ sở hữu (`sellerId`) của sản phẩm / đơn hàng đang thao tác.

## Vai trò

| Vai trò           | Là ai                                         | Cách xác định                             |
| ----------------- | --------------------------------------------- | ----------------------------------------- |
| **Guest**         | Chưa đăng nhập                                | Không có token                            |
| **Customer**      | User đã đăng nhập (người mua)                 | `role = customer`                         |
| **Seller**        | Customer đang thao tác trên SP/đơn của mình   | `product.sellerId` / `order.sellerId` = `user.id` |
| **Admin**         | Quản trị sàn                                  | `role = admin`                            |

---

## BR — Business Rules

### Auth

| ID          | Rule                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------- |
| BR-AUTH-001 | Email là định danh duy nhất — không được trùng khi đăng ký                                |
| BR-AUTH-002 | Password phải hash bằng bcrypt trước khi lưu DB                                           |
| BR-AUTH-003 | Access Token hết hạn sau 15 phút; Refresh Token hết hạn sau 7 ngày                        |
| BR-AUTH-004 | Chỉ Admin mới có thể gán role `admin` cho user khác                                       |
| BR-AUTH-005 | Guest không có token — truy cập public endpoint bình thường                               |
| BR-AUTH-006 | Một tài khoản vừa mua vừa bán được; không có role `seller` riêng (role chỉ `customer`/`admin`) |
| BR-AUTH-007 | User bị ban (`isActive = false`) không đăng nhập được (403) và không refresh được token   |

### User & Shop (gian hàng)

| ID         | Rule                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| BR-USR-001 | User có profile (`fullName`, `phone`, `address`) — dùng để tự điền form checkout                                         |
| BR-USR-002 | Muốn đăng bán sản phẩm, user phải thiết lập gian hàng trước: `shopName` (3–50 ký tự) và `pickupAddress` (bắt buộc)      |
| BR-USR-003 | `shopName` hiển thị công khai trên SP và trang shop; không bắt buộc unique (đơn giản hóa cho bài test)                   |
| BR-USR-004 | Không có KYC / khai báo thuế / duyệt gian hàng — thiết lập xong là bán được                                              |

### Category

| ID         | Rule                                                                                 |
| ---------- | ------------------------------------------------------------------------------------ |
| BR-CAT-001 | Tên category phải unique                                                             |
| BR-CAT-002 | Không được xóa category nếu còn sản phẩm đang dùng (của bất kỳ người bán nào)        |
| BR-CAT-003 | Chỉ Admin được CRUD category                                                         |
| BR-CAT-004 | Category có thể có ảnh đại diện (optional)                                           |
| BR-CAT-005 | Category dùng chung toàn sàn — người bán chỉ **chọn** category, không tạo mới        |

### Product

| ID         | Rule                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| BR-PRD-001 | Mỗi sản phẩm phải thuộc đúng 1 category                                                                                  |
| BR-PRD-002 | `stock` (tồn kho) không được âm — validate trước khi tạo Order                                                           |
| BR-PRD-003 | Khi `stock = 0`, sản phẩm hiển thị "Hết hàng" — vẫn xem được, không thêm vào giỏ                                         |
| BR-PRD-004 | Giá sản phẩm là số nguyên dương (VNĐ), không có số thập phân                                                             |
| BR-PRD-005 | Ảnh sản phẩm lưu URL Cloudinary, tối đa 5 ảnh / sản phẩm; ảnh đầu tiên là ảnh bìa                                        |
| BR-PRD-006 | Tìm kiếm hỗ trợ: tên (text search), lọc theo category, lọc theo khoảng giá, lọc theo người bán (`sellerId`)              |
| BR-PRD-007 | Mọi user đã thiết lập gian hàng (BR-USR-002) và Admin được **tạo** sản phẩm; `sellerId` = người tạo                      |
| BR-PRD-008 | SP hiển thị công khai khi và chỉ khi `isActive = true` **và** `isBlocked = false`                                        |
| BR-PRD-009 | Tên sản phẩm tối đa 120 ký tự                                                                                            |
| BR-PRD-010 | `sellerId` bất biến — không đổi chủ sau khi tạo                                                                          |

### Seller (đăng bán & sở hữu)

| ID          | Rule                                                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| BR-SELL-001 | Seller chỉ sửa / ẩn / xóa mềm / cập nhật stock **sản phẩm của mình**. Admin thao tác được trên mọi SP. Sai chủ → 403                      |
| BR-SELL-002 | Seller **không được mua sản phẩm của chính mình** — chặn ở thêm giỏ, merge cart và tạo Order                                              |
| BR-SELL-003 | Seller chỉ xem và xử lý các Order có `order.sellerId` = mình                                                                              |
| BR-SELL-004 | Seller bị ban → toàn bộ SP của họ bị block (`isBlocked = true`, `blockReason = "seller_banned"`); unban → chỉ mở lại SP có reason này     |
| BR-SELL-005 | Admin có thể block SP vi phạm (bắt buộc nhập lý do). Seller không tự mở lại được; vẫn thấy SP bị block kèm lý do                          |
| BR-SELL-006 | Ẩn / xóa mềm / block SP không ảnh hưởng Order đã tạo (Order lưu snapshot)                                                                 |
| BR-SELL-007 | Không duyệt trước — đăng là hiển thị ngay (Admin kiểm duyệt sau bằng block)                                                               |

### Cart

| ID          | Rule                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| BR-CART-001 | Guest: cart lưu client-side (localStorage). Không persist DB                                                  |
| BR-CART-002 | Customer: cart lưu DB. Khi đăng nhập, merge cart local vào cart DB                                            |
| BR-CART-003 | Số lượng trong cart không được vượt quá `stock` hiện tại                                                      |
| BR-CART-004 | Xóa item khỏi cart khi `stock = 0` **hoặc** SP không còn hiển thị (`isActive = false` / `isBlocked = true`) lúc user load lại giỏ |
| BR-CART-005 | Giỏ hàng cho phép trộn SP của nhiều người bán; khi hiển thị, nhóm theo người bán (như Shopee)                 |
| BR-CART-006 | Không thêm SP của chính mình vào giỏ; khi merge cart, tự lọc bỏ các SP này                                    |

### Checkout (nhóm đơn) — một lần thanh toán, nhiều đơn

| ID         | Rule                                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| BR-CHK-001 | `POST /orders` nhóm các item theo `sellerId` → tạo **1 Checkout + N Order** (mỗi người bán 1 Order)                                 |
| BR-CHK-002 | All-or-nothing: nếu bất kỳ SP nào không đủ stock / không hợp lệ → rollback phần đã trừ, **không tạo** Checkout hay Order nào          |
| BR-CHK-003 | Giá và tên SP luôn lấy từ DB lúc tạo Order — không tin giá do client gửi                                                            |
| BR-CHK-004 | 1 Checkout = **1 giao dịch VNPay** duy nhất; `totalAmount` của Checkout = tổng `totalAmount` các Order con                          |
| BR-CHK-005 | Checkout hết hạn sau **30 phút** kể từ lúc tạo (`expiresAt`) nếu chưa thanh toán                                                    |
| BR-CHK-006 | Thông tin người nhận (`recipient`) dùng chung cho mọi Order con của cùng Checkout                                                   |

### Order

| ID         | Rule                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-ORD-001 | Guest checkout: bắt buộc điền `fullName`, `phone`, `email`, `shippingAddress`                                                               |
| BR-ORD-002 | Customer checkout: tự động lấy thông tin từ profile, cho phép override địa chỉ                                                              |
| BR-ORD-003 | Khi tạo Order: trừ `stock` ngay (reserve), bằng cập nhật nguyên tử có điều kiện `stock >= quantity` — chống bán lố khi nhiều người cùng mua |
| BR-ORD-004 | Thanh toán thất bại hoặc Checkout hết hạn: **tất cả** Order con chuyển `cancelled` và hoàn `stock`                                          |
| BR-ORD-005 | Order không thể bị xóa — chỉ thay đổi trạng thái                                                                                            |
| BR-ORD-006 | Người mua chỉ thấy Order của chính mình (`order.userId`)                                                                                    |
| BR-ORD-007 | Người bán chỉ thấy Order của mình (`order.sellerId`) — xem BR-SELL-003                                                                      |
| BR-ORD-008 | Admin thấy tất cả Order và cập nhật được trạng thái                                                                                         |
| BR-ORD-009 | Các Order con của cùng Checkout có trạng thái **độc lập** (shop A đã giao, shop B vẫn đang chuẩn bị)                                        |
| BR-ORD-010 | Hoàn `stock` khi → `cancelled` chỉ thực hiện **đúng 1 lần** (chuyển trạng thái bằng cập nhật có điều kiện, chỉ hoàn nếu bản ghi vừa được cập nhật) |
| BR-ORD-011 | Lý do hủy (`cancelReason`) bắt buộc khi Seller hoặc Admin hủy đơn                                                                           |

### Order State Machine

Áp dụng cho **từng Order** (không phải Checkout).

```
[pending]
    │
    │ Thanh toán VNPay thành công (hệ thống)
    ▼
[confirmed]
    │
    │ Seller của đơn / Admin
    ▼
[shipping]
    │
    │ Seller của đơn / Admin
    ▼
[delivered]

[pending]   ──→ [cancelled]  (thanh toán thất bại / hết hạn: hệ thống · hoặc Admin)
[confirmed] ──→ [cancelled]  (Seller của đơn / Admin — trước khi giao)
[cancelled] ──→ [refunded]   (chỉ Admin, chỉ khi đơn đã thanh toán — hoàn tiền thủ công)
```

| Chuyển trạng thái       | Ai được thực hiện              | Điều kiện                                   |
| ----------------------- | ------------------------------ | ------------------------------------------- |
| `pending → confirmed`   | **Hệ thống** (VNPay thành công) | Không ai chuyển tay                        |
| `pending → cancelled`   | Hệ thống · Admin               | Thanh toán lỗi / hết hạn / Admin hủy        |
| `confirmed → shipping`  | **Seller của đơn** · Admin     |                                             |
| `shipping → delivered`  | **Seller của đơn** · Admin     |                                             |
| `confirmed → cancelled` | **Seller của đơn** · Admin     | Có `cancelReason`; hoàn stock               |
| `cancelled → refunded`  | Admin                          | `paymentStatus = paid`; set `refunded`      |

| ID         | Rule                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------- |
| BR-STT-001 | Chuyển `pending → confirmed`: chỉ qua kết quả thanh toán VNPay đã xác thực, không qua API tay |
| BR-STT-002 | Chuyển `confirmed → shipping → delivered`: Seller sở hữu đơn hoặc Admin                       |
| BR-STT-003 | Chuyển `→ cancelled`: theo bảng trên; từ `shipping` trở đi **không** được hủy                 |
| BR-STT-004 | Chuyển `cancelled → refunded`: chỉ Admin, và chỉ khi `paymentStatus = paid`                   |
| BR-STT-005 | `delivered` và `refunded` là trạng thái cuối — không chuyển tiếp                              |
| BR-STT-006 | Chuyển sai chiều → 400; user không có quyền với đơn đó → 403                                  |

### Payment — VNPay

| ID         | Rule                                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-PAY-001 | Redirect user đến VNPay sau khi tạo Checkout                                                                                                   |
| BR-PAY-002 | VNPay gọi IPN (`GET`, server-to-server) về backend để xác nhận kết quả                                                                         |
| BR-PAY-003 | Backend verify chữ ký HMAC-SHA512, `vnp_TxnRef` tồn tại, và số tiền khớp `totalAmount × 100` trước khi xử lý                                    |
| BR-PAY-004 | Thanh toán thành công → Checkout `paid`; **tất cả** Order con `pending → confirmed`, `paymentStatus = paid` (stock đã trừ từ lúc tạo Order)     |
| BR-PAY-005 | Thanh toán thất bại → Checkout `failed`; tất cả Order con → `cancelled` + hoàn stock                                                           |
| BR-PAY-006 | Return URL và IPN dùng **chung một hàm xử lý idempotent** (sau khi verify checksum) — bên nào đến trước thì xử lý, bên sau bỏ qua               |
| BR-PAY-007 | `vnp_TxnRef` = `checkoutCode`; `vnp_Amount` = `totalAmount × 100`                                                                              |
| BR-PAY-008 | Mọi callback (hợp lệ hay không) đều lưu raw data vào `payments` để audit                                                                       |
| BR-PAY-009 | Job định kỳ (mỗi phút) tìm Checkout `pending` quá `expiresAt` → `expired`, hủy các Order `pending` con + hoàn stock                            |

### Admin

| ID         | Rule                                                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| BR-ADM-001 | Admin truy cập tất cả: User list, Category, Product (kể cả ẩn / bị block), Order                                             |
| BR-ADM-002 | Admin không thể tự xóa / ban chính mình                                                                                      |
| BR-ADM-003 | Admin có thể ban/unban user — ban user kéo theo block toàn bộ SP của user đó (BR-SELL-004)                                   |
| BR-ADM-004 | Admin có thể block/unblock từng sản phẩm vi phạm, bắt buộc nhập lý do khi block (BR-SELL-005)                                |
| BR-ADM-005 | Admin không xóa được Order; chỉ đổi trạng thái theo State Machine                                                            |

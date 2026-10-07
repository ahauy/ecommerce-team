# 04 — User Flow

> **Một tài khoản, hai vai:** mọi user đã đăng nhập đều có thể **mua** (Flow 2) và **bán** (Flow 3). Hai luồng này dùng chung một tài khoản.

## Flow 1: Guest — Xem & Mua hàng

```
[Vào trang chủ]
      │
      ▼
[Xem danh sách sản phẩm]
  - Lọc theo category
  - Lọc theo khoảng giá
  - Tìm kiếm theo tên
  - (Tùy chọn) Bấm tên shop → xem SP của shop đó
      │
      ▼
[Xem chi tiết sản phẩm]
  - Ảnh, tên, giá, mô tả, tồn kho, tên shop
  - Nếu stock = 0 → hiện "Hết hàng", không thêm được giỏ
      │
      ▼
[Thêm vào giỏ hàng] ← lưu localStorage
      │
      ▼
[Xem giỏ hàng]
  - Hiển thị NHÓM THEO SHOP (mỗi shop một khối, có subtotal)
  - Thay đổi số lượng / xóa sản phẩm
  - Hiển thị tổng tiền (VNĐ)
      │
      ▼
[Checkout — Guest]
  Điền thông tin bắt buộc:
  ✦ Họ tên  ✦ Số điện thoại  ✦ Email  ✦ Địa chỉ giao hàng
      │
      ▼
[Xác nhận đơn hàng] → (xem Flow 4: Checkout nhiều shop)
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
  - Merge cart localStorage vào cart DB (tự lọc bỏ SP của chính mình)
      │
      ▼
[Xem sản phẩm / Thêm vào giỏ] ← như Guest nhưng lưu DB
  - Thêm SP của chính mình → báo lỗi "Bạn không thể mua sản phẩm của chính mình"
      │
      ▼
[Checkout — Customer]
  - Tự động điền từ profile (GET /users/me)
  - Cho phép sửa địa chỉ giao hàng
      │
      ▼
[Thanh toán VNPay] → (xem Flow 4)
      │
      ▼
[Xem lịch sử đơn hàng đã mua]
  - Mỗi đơn gắn với 1 shop; cùng 1 lần thanh toán có thể có nhiều đơn
  - Xem chi tiết từng đơn (sản phẩm, trạng thái, tổng tiền)

[Làm mới Access Token]
  - Dùng Refresh Token khi Access Token hết hạn
  - Refresh Token hết hạn → bắt đăng nhập lại
```

---

## Flow 3: Customer → Seller — Đăng bán & Xử lý đơn

```
[Đã đăng nhập] → bấm "Đăng bán" / "Kênh người bán"
      │
      ├── Chưa có gian hàng?
      │       ▼
      │   [Thiết lập gian hàng]  (PATCH /users/me/shop)
      │     ✦ Tên shop (3–50 ký tự)  ✦ Địa chỉ lấy hàng
      │     (không KYC, không duyệt — lưu xong là bán được)
      │
      ▼
[Sản phẩm của tôi]  (GET /products/my)
  - Danh sách SP của mình, kể cả ẩn / bị Admin block (kèm lý do)
      │
      ▼
[Thêm sản phẩm mới]
  - Tên (≤120 ký tự) · Category (chọn từ danh sách Admin) · Mô tả
  - Giá · Tồn kho
  - Ảnh: tối đa 5, ảnh đầu = ảnh bìa (upload Cloudinary)
  - "Lưu & Hiển thị" → SP xuất hiện công khai ngay (isActive = true)
      │
      ▼
[Quản lý SP]
  - Sửa giá / tồn kho / mô tả
  - Ẩn / Hiện SP (isActive)         ← SP bị Admin block thì KHÔNG tự hiện lại được
  - Chỉ thao tác được trên SP của mình (SP người khác → 403)

═════════ Khi có người mua ═════════

[Đơn bán]  (GET /orders/selling)
  - Chỉ thấy đơn chứa SP của mình
  - Lọc theo trạng thái
      │
      ▼
[Đơn mới: status = confirmed]  ← đã thanh toán VNPay
      │
      ├── [Bấm "Giao hàng"]    confirmed → shipping
      │         │
      │         ▼
      │    [Bấm "Đã giao"]     shipping → delivered
      │
      └── [Bấm "Hủy đơn"] + nhập lý do   confirmed → cancelled (hoàn stock)
              └── Admin sẽ hoàn tiền thủ công (cancelled → refunded)
```

---

## Flow 4: Checkout nhiều shop — một lần thanh toán, nhiều đơn

```
[Giỏ hàng có SP của Shop A và Shop B]
      │
      ▼
[POST /orders]  items = [A1, A2, B1]
      │
      ├─ Server nhóm theo sellerId
      ├─ Với từng SP: trừ stock nguyên tử (stock >= qty)
      │     └─ Có SP không đủ hàng → hoàn các SP đã trừ → 400 (không tạo gì)
      ├─ Tạo Order(A: A1,A2) · Order(B: B1) — đều `pending`
      ├─ Tạo Checkout (gom 2 order, tổng tiền, hết hạn sau 30 phút)
      └─ Sinh vnpayUrl (vnp_TxnRef = checkoutCode, 1 giao dịch cho tổng tiền)
      │
      ▼
[Redirect → VNPay]
      │
      ├─── [Thanh toán THÀNH CÔNG]
      │         │
      │         ▼
      │    Return/IPN → Checkout: paid
      │    → Order A: pending → confirmed   ┐ cùng lúc,
      │    → Order B: pending → confirmed   ┘ paymentStatus = paid
      │    → Redirect "Đặt hàng thành công" (liệt kê 2 đơn)
      │
      └─── [Thanh toán THẤT BẠI / HỦY / HẾT HẠN 30 PHÚT]
                │
                ▼
           Checkout: failed | expired
           → Order A, Order B: cancelled + hoàn stock (cả hai)
           → Redirect "Thanh toán thất bại"

[Sau khi confirmed — hai đơn đi độc lập]
   Shop A: confirmed → shipping → delivered
   Shop B: confirmed → cancelled (hết hàng)  → Admin refund riêng đơn B
```

---

## Flow 5: Admin — Quản lý hệ thống

```
[Đăng nhập Admin]
  - Tài khoản role = admin
      │
      ▼
[Admin Dashboard]
  │
  ├── [Quản lý Category]
  │     - Tạo / Sửa / Xóa category
  │     - Không xóa nếu còn sản phẩm (của bất kỳ shop nào) đang dùng
  │
  ├── [Quản lý Product]  (GET /admin/products)
  │     - Xem TẤT CẢ SP của mọi shop, kể cả ẩn / bị block
  │     - Block SP vi phạm (bắt buộc nhập lý do) / Unblock
  │     - Sửa / ẩn bất kỳ SP nào (quyền bypass ownership)
  │
  ├── [Quản lý Order]
  │     - Xem tất cả đơn hàng, lọc theo trạng thái / shop / người mua
  │     - Cập nhật trạng thái (như Seller, cộng thêm):
  │         cancelled → refunded   (chỉ đơn đã thanh toán — hoàn tiền thủ công)
  │
  └── [Quản lý User]
        - Xem danh sách user, lọc theo role / trạng thái
        - Ban / Unban user  →  ban kéo theo block toàn bộ SP của user đó
        - Không tự ban / xóa chính mình
```

---

## Edge Cases quan trọng

| Tình huống                                                         | Xử lý                                                                                  |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Sản phẩm hết hàng khi user đang ở trang checkout                   | Báo lỗi kèm danh sách SP thiếu, yêu cầu xem lại giỏ hàng; không tạo đơn nào             |
| Nhiều user cùng mua sản phẩm cuối cùng (race condition)            | Trừ stock bằng cập nhật nguyên tử `stock >= qty`; ai không trừ được thì nhận lỗi hết hàng |
| Giỏ có SP của 3 shop, shop thứ 3 hết hàng                          | Hoàn stock 2 shop đã trừ, **không tạo** checkout/order nào (all-or-nothing)            |
| VNPay timeout (không nhận callback)                                | Checkout `pending` quá 30 phút → `expired`; mọi order con `cancelled` + hoàn stock     |
| VNPay báo thành công **sau** khi checkout đã `expired`             | Ghi `payments` với `note = late_success_after_expiry`, trả `02`; Admin hoàn tiền thủ công |
| IPN và Return URL đến gần như cùng lúc                             | Xử lý idempotent theo trạng thái checkout — chỉ lần đến trước có hiệu lực              |
| Chạy `localhost`, VNPay không gọi được IPN                         | Return URL cũng cập nhật đơn (BR-PAY-006); hoặc dùng ngrok cho IPN                     |
| Refresh Token hết hạn                                              | Redirect về trang đăng nhập                                                            |
| Guest bấm "Đăng nhập" khi đang có hàng trong giỏ                   | Sau đăng nhập, FE gọi `POST /cart/merge` rồi xóa localStorage (BR-CART-002, BR-CART-008) |
| Seller tự mua SP của mình                                          | Chặn ở thêm giỏ, merge cart (tự lọc) và `POST /orders` (400)                           |
| Seller sửa giá khi SP đang nằm trong giỏ người khác                | Giỏ luôn hiện giá mới (BR-CART-007); **tính lại giá từ DB** khi tạo Order              |
| Seller giảm stock xuống dưới số lượng trong giỏ                    | Giữ nguyên số lượng, item `exceeds_stock` — người mua phải giảm số lượng (BR-CART-003) |
| Seller ẩn SP / Admin block SP / SP hết hàng khi đang nằm trong giỏ | Item vẫn ở trong giỏ, đánh dấu `unavailable` / `out_of_stock`, không mua được (BR-CART-004) |
| Seller ẩn / xóa SP đang có đơn `pending` hoặc `confirmed`          | Đơn vẫn xử lý bình thường (snapshot); SP chỉ biến mất khỏi danh sách công khai          |
| Seller bị ban khi đang có đơn `confirmed` chưa giao                | Đơn giữ nguyên; Admin quyết định xử lý (hủy + hoàn tiền hoặc tự cập nhật trạng thái)   |
| Seller cố mở lại SP đã bị Admin block                              | Cập nhật `isActive` được nhưng SP vẫn không hiển thị (vì `isBlocked`); thấy lý do block |
| Seller A cố sửa SP / đơn của Seller B                              | 403 (ghi) hoặc 404 (đọc theo "của tôi")                                                |
| Seller đặt trạng thái `refunded`                                   | 403 — chỉ Admin                                                                        |
| Thanh toán thành công — xử lý giỏ hàng                             | Xóa item đã mua khỏi cart DB (BR-CHK-007)                                                   |
| User sửa query `/checkout/result?status=success`                   | FE **không tin** query; gọi `GET /checkouts/:checkoutCode` lấy trạng thái thật             |
| Admin muốn hủy Order `pending`                                     | Không cho phép (BR-STT-007) — chờ hệ thống hủy khi thanh toán lỗi / hết hạn                |
| User đóng trang kết quả sau khi thanh toán                         | Xem lại ở "Lịch sử đơn mua", hoặc mở lại `/checkout/result?checkoutCode=...` (API yêu cầu đăng nhập + đúng chủ) |
| Guest bấm "Thêm giỏ"                                               | Lưu vào giỏ localStorage (BR-CART-001)                                                      |
| Guest bấm "Đặt hàng"                                               | FE chuyển sang trang đăng nhập (BR-AUTH-012), sau đó merge giỏ rồi quay lại giỏ hàng        |
| Admin gọi thêm giỏ / `POST /orders` / `POST /products`             | 403 (BR-AUTH-011)                                                                           |

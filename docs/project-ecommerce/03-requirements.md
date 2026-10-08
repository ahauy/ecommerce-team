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
| BR-AUTH-004 | Không có API gán role `admin`. Tài khoản Admin đầu tiên được tạo bằng **seed script** (đọc `ADMIN_EMAIL` / `ADMIN_PASSWORD` từ `.env`); đăng ký công khai luôn ra `role = customer` |
| BR-AUTH-005 | Guest không có token — truy cập public endpoint bình thường                               |
| BR-AUTH-006 | Một tài khoản vừa mua vừa bán được; không có role `seller` riêng (role chỉ `customer`/`admin`) |
| BR-AUTH-007 | User bị ban (`isActive = false`) không đăng nhập được (403) và không refresh được token   |
| BR-AUTH-008 | Password tối thiểu 8 ký tự (khớp ví dụ lỗi validation ở API Contract) |
| BR-AUTH-009 | Ban có hiệu lực **ngay**: `JwtStrategy.validate` đọc `isActive` từ DB mỗi request — access token còn hạn của user bị ban bị từ chối (403) |
| BR-AUTH-010 | `users.refreshToken` lưu **hash** (SHA-256), không lưu raw; mỗi user 1 refresh token (đăng nhập thiết bị mới vô hiệu hóa token cũ) |
| BR-AUTH-011 | Admin **chỉ kiểm duyệt**: block/unblock SP, ban/unban user, xem đơn, hủy / hoàn tiền đơn đã thanh toán. Admin **không mua** (thêm giỏ, `POST /orders` → 403) và **không đăng bán** (không có gian hàng, `POST /products` → 403) |
| BR-AUTH-012 | Guest (chưa đăng nhập) xem SP / shop / category và **có giỏ hàng lưu localStorage** (BR-CART-001). Checkout / đơn hàng yêu cầu đăng nhập — **không có Guest checkout** |

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
| BR-PRD-011 | `slug` unique **toàn sàn** nhưng nhiều người bán có thể đặt trùng tên → slug = `slugify(name)` + hậu tố ngẫu nhiên ngắn (vd `iphone-15-pro-k3f9`); API tra cứu SP dùng `:id`, slug chỉ để hiển thị URL |
| BR-PRD-012 | Mỗi URL trong `images[]` phải bắt đầu bằng `https://res.cloudinary.com/<CLOUDINARY_CLOUD_NAME>/` — từ chối URL ngoài (400) |
| BR-PRD-013 | `PATCH /products/:id` dùng DTO whitelist: **không** nhận `sellerId`, `isBlocked`, `blockReason`, `slug` từ body của Seller (chống mass assignment) |

### Seller (đăng bán & sở hữu)

| ID          | Rule                                                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| BR-SELL-001 | Seller chỉ sửa / ẩn / xóa mềm / cập nhật stock **sản phẩm của mình**. Admin thao tác được trên mọi SP. Sai chủ → 403                      |
| BR-SELL-002 | Seller **không được mua sản phẩm của chính mình** — chặn ở thêm giỏ và tạo Order |
| BR-SELL-003 | Seller chỉ xem và xử lý các Order có `order.sellerId` = mình                                                                              |
| BR-SELL-004 | Seller bị ban → block các SP **đang `isBlocked = false`** (`isBlocked = true`, `blockReason = "seller_banned"`); **không ghi đè** `blockReason` của SP đã bị Admin block trước đó. Unban → chỉ mở lại SP có `blockReason = "seller_banned"` |
| BR-SELL-005 | Admin có thể block SP vi phạm (bắt buộc nhập lý do). Seller không tự mở lại được; vẫn thấy SP bị block kèm lý do                          |
| BR-SELL-006 | Ẩn / xóa mềm / block SP không ảnh hưởng Order đã tạo (Order lưu snapshot)                                                                 |
| BR-SELL-007 | Không duyệt trước — đăng là hiển thị ngay (Admin kiểm duyệt sau bằng block)                                                               |

### Cart

| ID          | Rule                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| BR-CART-001 | Guest: cart lưu client-side (localStorage), chỉ gồm `productId` + `quantity`. Không persist DB (không có `userId`) |
| BR-CART-002 | Customer: cart lưu DB (1 user 1 cart). Ngay sau khi đăng nhập, FE gọi `POST /cart/merge` với cart localStorage rồi xóa localStorage |
| BR-CART-003 | Thêm / sửa số lượng: tổng số lượng của 1 SP trong giỏ không được vượt quá `stock` hiện tại → 400. Khi tải lại giỏ mà `stock` đã giảm xuống dưới số lượng (vẫn > 0): **giữ nguyên số lượng**, đánh dấu `exceeds_stock`; người dùng phải tự giảm số lượng mới mua được SP đó |
| BR-CART-004 | SP hết hàng (`stock = 0`) hoặc ngừng bán (`isActive = false` / `isBlocked = true`) **vẫn giữ trong giỏ** và được đánh dấu (`out_of_stock` / `unavailable`); không mua được, không tính vào tổng tiền; người dùng tự xóa. Chỉ SP không còn tồn tại trong DB mới tự bị loại khỏi giỏ |
| BR-CART-005 | Giỏ hàng cho phép trộn SP của nhiều người bán; khi hiển thị, nhóm theo người bán (như Shopee)                 |
| BR-CART-006 | Không thêm SP của chính mình vào giỏ (400); khi merge cart, tự lọc bỏ các SP này                              |
| BR-CART-007 | Giá trong giỏ **luôn là giá hiện tại** của SP (không lưu giá trong cart DB); Order vẫn tính lại giá từ DB lúc tạo |
| BR-CART-008 | Merge: gộp trùng `productId`, cộng dồn với số lượng đang có và cap ở `stock` (không làm giảm số lượng đang có); tự bỏ qua SP không tồn tại / ngừng bán / hết hàng / của chính mình |
| BR-CART-009 | Giỏ tối đa 100 SP khác nhau; thêm SP thứ 101 → 400; merge bỏ qua phần vượt                                     |

### Checkout (nhóm đơn) — một lần thanh toán, nhiều đơn

| ID         | Rule                                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| BR-CHK-001 | `POST /orders` nhóm các item theo `sellerId` → tạo **1 Checkout + N Order** (mỗi người bán 1 Order)                                 |
| BR-CHK-002 | All-or-nothing: nếu bất kỳ SP nào không đủ stock / không hợp lệ → rollback phần đã trừ, **không tạo** Checkout hay Order nào          |
| BR-CHK-003 | Giá và tên SP luôn lấy từ DB lúc tạo Order — không tin giá do client gửi                                                            |
| BR-CHK-004 | 1 Checkout = **1 payment link PayOS** duy nhất (định danh bằng `payosOrderCode`); `totalAmount` của Checkout = tổng `totalAmount` các Order con                          |
| BR-CHK-005 | Checkout hết hạn sau **30 phút** kể từ lúc tạo (`expiresAt`) nếu chưa thanh toán                                                    |
| BR-CHK-006 | Thông tin người nhận (`recipient`) dùng chung cho mọi Order con của cùng Checkout                                                   |
| BR-CHK-007 | Khi Checkout chuyển `paid`: xóa các item đã mua khỏi cart DB của người mua. Checkout `failed`/`expired`: **giữ nguyên** giỏ |
| BR-CHK-008 | Customer bỏ trống `recipient` → lấy từ profile; nếu profile thiếu `phone`/`address` → 400 yêu cầu bổ sung (email lấy từ tài khoản) |
| BR-CHK-009 | `checkoutCode` / `orderCode` có đuôi ≥ 10 ký tự ngẫu nhiên (crypto). `GET /checkouts/:checkoutCode` yêu cầu đăng nhập và chỉ **chủ Checkout** (`userId`) xem được — người khác → 404 |
| BR-CHK-010 | Tạo Checkout (trừ stock từng item + tạo Checkout + N Order) chạy trong **1 MongoDB multi-document transaction** (`session.withTransaction`): lỗi/hết hàng ở bất kỳ bước nào → abort toàn bộ, không có rollback thủ công, không rò rỉ stock. `restockAndCancel` (hủy Order + hoàn stock) cũng là 1 transaction. Không gọi dịch vụ ngoài (PayOS, Cloudinary) bên trong transaction — gọi PayOS tạo payment link **sau khi** commit; tạo link lỗi → Checkout `failed` + `restockAndCancel` mọi Order con, trả 502. Yêu cầu MongoDB replica set (Atlas có sẵn) |

### Order

| ID         | Rule                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-ORD-001 | **Không có Guest checkout**: chỉ Customer đã đăng nhập được tạo Checkout (thiếu token → 401, Admin → 403). Guest bấm "Đặt hàng" → đăng nhập, merge giỏ, rồi mới checkout |
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
    │ Thanh toán PayOS thành công (hệ thống)
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

[pending]   ──→ [cancelled]  (thanh toán thất bại / hết hạn: CHỈ hệ thống)
[confirmed] ──→ [cancelled]  (Seller của đơn / Admin — trước khi giao)
[cancelled] ──→ [refunded]   (chỉ Admin, chỉ khi đơn đã thanh toán — hoàn tiền thủ công)
```

| Chuyển trạng thái       | Ai được thực hiện              | Điều kiện                                   |
| ----------------------- | ------------------------------ | ------------------------------------------- |
| `pending → confirmed`   | **Hệ thống** (PayOS thành công) | Không ai chuyển tay                        |
| `pending → cancelled`   | **Hệ thống** (không ai hủy tay) | Thanh toán lỗi / Checkout hết hạn           |
| `confirmed → shipping`  | **Seller của đơn** · Admin     |                                             |
| `shipping → delivered`  | **Seller của đơn** · Admin     |                                             |
| `confirmed → cancelled` | **Seller của đơn** · Admin     | Có `cancelReason`; hoàn stock               |
| `cancelled → refunded`  | Admin                          | `paymentStatus = paid`; set `refunded`      |

| ID         | Rule                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------- |
| BR-STT-001 | Chuyển `pending → confirmed`: chỉ qua kết quả thanh toán PayOS đã xác thực (webhook đúng chữ ký hoặc tra cứu trực tiếp API PayOS), không qua API tay |
| BR-STT-002 | Chuyển `confirmed → shipping → delivered`: Seller sở hữu đơn hoặc Admin                       |
| BR-STT-003 | Chuyển `→ cancelled`: theo bảng trên; từ `shipping` trở đi **không** được hủy                 |
| BR-STT-004 | Chuyển `cancelled → refunded`: chỉ Admin, và chỉ khi `paymentStatus = paid`                   |
| BR-STT-005 | `delivered` và `refunded` là trạng thái cuối — không chuyển tiếp                              |
| BR-STT-006 | Chuyển sai chiều → 400; user không có quyền với đơn đó → 403                                  |
| BR-STT-007 | Order `pending` **không** bị Admin/Seller hủy tay: nếu hủy trong lúc Checkout còn `pending` thì người mua vẫn có thể thanh toán đủ `totalAmount` cho cả Checkout → lệch tiền. Chỉ hệ thống hủy khi Checkout `failed`/`expired` |

### Payment — PayOS

> PayOS tạo **payment link**: trang thanh toán chuyển khoản / quét VietQR. Tiền về tài khoản ngân hàng của sàn đã liên kết với PayOS.

| ID         | Rule |
| ---------- | ---- |
| BR-PAY-001 | Sau khi tạo Checkout, backend gọi PayOS `POST /v2/payment-requests` tạo payment link và trả `paymentUrl` (= `checkoutUrl` của PayOS) để FE redirect |
| BR-PAY-002 | PayOS gọi **webhook** (`POST`, server-to-server) về backend khi nhận được tiền |
| BR-PAY-003 | Backend verify `signature` của webhook (HMAC-SHA256 trên các field của `data`, sắp xếp key theo alphabet, giá trị `null` → chuỗi rỗng, key `PAYOS_CHECKSUM_KEY`), `orderCode` tồn tại trước khi xử lý. Chỉ coi là đã thanh toán khi `code = "00"` và số tiền ≥ `totalAmount`: trả **dư** → vẫn xác nhận đơn, ghi `payments.note = overpaid` để Admin hoàn phần chênh lệch; trả **thiếu** → không xác nhận, ghi `underpaid` và tra cứu PayOS ngay (PayOS cộng dồn nhiều lần chuyển) |
| BR-PAY-004 | Thanh toán thành công → Checkout `paid`; **tất cả** Order con `pending → confirmed`, `paymentStatus = paid` (stock đã trừ từ lúc tạo Order) |
| BR-PAY-005 | Người mua hủy trên trang PayOS (link `CANCELLED`) → Checkout `failed`; tất cả Order con → `cancelled` + hoàn stock |
| BR-PAY-006 | Webhook và **đồng bộ chủ động** (gọi PayOS `GET /v2/payment-requests/{payosOrderCode}` khi FE mở `GET /checkouts/:checkoutCode` mà Checkout còn `pending`, và trong cron hết hạn) dùng **chung một hàm xử lý idempotent**. Return URL / Cancel URL của PayOS **không có chữ ký** → không bao giờ cập nhật đơn dựa vào query trên URL. Đồng bộ từ `GET /checkouts/:checkoutCode` giới hạn **tối đa 1 lần / 10 giây / Checkout** (`lastSyncedAt`) để FE poll không làm quá tải PayOS; cron hết hạn luôn tra cứu |
| BR-PAY-007 | PayOS yêu cầu `orderCode` là **số nguyên** → mỗi Checkout có thêm `payosOrderCode` (số nguyên dương, unique, ≤ 9007199254740991; vd timestamp ms × 1000 + 3 chữ số ngẫu nhiên, trùng thì sinh lại). `amount = totalAmount` (VNĐ, **không** nhân 100). `description` ≤ 9 ký tự (giới hạn với tài khoản ngân hàng chưa liên kết payOS) → dùng 9 ký tự cuối của `checkoutCode` |
| BR-PAY-008 | Mọi webhook (hợp lệ hay không) đều lưu raw data vào `payments` để audit. Đồng bộ chủ động chỉ lưu khi có kết quả (`PAID` / `CANCELLED` / `FAILED` / `EXPIRED` / `UNDERPAID`) — bỏ qua `PENDING` / `PROCESSING` để không sinh log mỗi lần FE poll; `UNDERPAID` (trả thiếu) ghi 1 lần để Admin hoàn tiền |
| BR-PAY-009 | Job định kỳ (mỗi phút) tìm Checkout `pending` quá `expiresAt`: tra cứu PayOS trước (`PAID` → xử lý như thành công); chưa trả → gọi PayOS hủy link (`POST /v2/payment-requests/{id}/cancel`) rồi `expired`, hủy các Order `pending` con + hoàn stock |
| BR-PAY-010 | Truyền `expiredAt = expiresAt` (Unix timestamp, **giây**) khi tạo payment link để PayOS tự khóa link sau hạn — giảm tình huống thanh toán muộn |
| BR-PAY-011 | Chuyển trạng thái Checkout bằng **cập nhật có điều kiện** (`findOneAndUpdate({ _id, status: "pending" }, ...)`) — dùng chung cho webhook, đồng bộ chủ động và cron hết hạn; bên nào cập nhật được bản ghi trước thì xử lý tiếp (cập nhật Order, hoàn stock), bên sau bỏ qua. Cập nhật Checkout + Order con (+ hoàn stock nếu hủy) nằm trong **cùng 1 transaction** (BR-CHK-010) |
| BR-PAY-012 | Thanh toán thành công đến **sau** khi Checkout đã `expired` / `failed` (late success) → không mở lại đơn; ghi `payments.note = late_success_after_expiry`; Admin hoàn tiền **thủ công bằng chuyển khoản** (PayOS không có API hoàn tiền cho payment link) |
| BR-PAY-013 | Webhook trả **HTTP 200** khi chữ ký hợp lệ, kể cả khi không tìm thấy `orderCode`, đã xử lý trước đó, sai số tiền hay thanh toán muộn (chỉ ghi `payments`) để PayOS không gửi lại; sai chữ ký → 400. Khi đăng ký webhook URL, PayOS gửi một request thử → backend phải trả 200 |

### Admin

| ID         | Rule                                                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| BR-ADM-001 | Admin truy cập tất cả: User list, Category, Product (kể cả ẩn / bị block), Order                                             |
| BR-ADM-002 | Admin không thể tự xóa / ban chính mình                                                                                      |
| BR-ADM-003 | Admin có thể ban/unban user — ban user kéo theo block toàn bộ SP của user đó (BR-SELL-004)                                   |
| BR-ADM-004 | Admin có thể block/unblock từng sản phẩm vi phạm, bắt buộc nhập lý do khi block (BR-SELL-005)                                |
| BR-ADM-005 | Admin không xóa được Order; chỉ đổi trạng thái theo State Machine                                                            |

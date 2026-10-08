# CONTEXT.md — Shared Language (Ubiquitous Language)

> **Purpose:** A single "shared language" for human developers and AI agents. Agents read this file to decode project-specific jargon instead of guessing every time. This implements the Ubiquitous Language pattern (Eric Evans, _Domain-Driven Design_) — origin: `mattpocock/skills`.
>
> **Role in Framework:** `CONTEXT.md` serves as the "Data Plane" bridging the Control Plane (BA pipeline & governance) with execution. Whenever `domain-modeling` or an elicitation interview introduces or refines a domain concept, it must **update inline** this file. Nobody reinvents terminology across sessions.

## Usage Rules

1. **One-line concise definitions** for each term — do not replicate extensive documentation.
2. **Before / After** comparisons to demonstrate value: verbose phrase (Before) → concise shorthand (After).
3. **Naming consistency:** variables, functions, components, and files must strictly adhere to the terms established here.
4. **Update inline:** whenever a decision or definition surfaces during elicitation or domain modeling, add or update the entry immediately (link to the relevant ADR if it is an architectural decision).
5. **Soft immutability:** never delete terms already in use across the codebase; mark them as `deprecated → alias`.

## Glossary — Ecommerce Team Project

| Term                     | Short definition                                                                                                                 | Notes                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Guest**                | User chưa đăng nhập                                                                                                              | Cart lưu localStorage                                                 |
| **Customer**             | User đã đăng nhập, role=customer — vừa mua vừa bán được                                                                          | Cart lưu DB                                                           |
| **Buyer**                | Customer đang đóng vai người mua                                                                                                 | Không phải role                                                       |
| **Seller**               | Customer là chủ (`sellerId`) của SP/đơn đang thao tác                                                                            | **Không phải role** — xác định bằng ownership                         |
| **Admin**                | User role=admin                                                                                                                  | Quản lý sàn, block SP, xử lý mọi đơn                                  |
| **shop**                 | Gian hàng của Seller: `shopName` + `pickupAddress` trên user                                                                     | Phải có mới được đăng bán                                             |
| **sellerId**             | Chủ sở hữu SP / người bán của Order                                                                                              | Bất biến trên Product                                                 |
| **ownership**            | Quy tắc: chỉ chủ SP/đơn (hoặc Admin) được ghi                                                                                    | Sai chủ → 403; đọc `/my` → 404                                        |
| **Checkout**             | 1 lần bấm "Đặt hàng" = 1 payment link PayOS, gom N Order                                                                            | Mã gửi PayOS là `payosOrderCode`                                         |
| **checkoutCode**         | Mã checkout tự generate                                                                                                          | e.g. `CHK-20261002-7F3K9QX2AB` (đuôi ngẫu nhiên, không đoán được)     |
| **block**                | Admin gỡ SP vi phạm (`isBlocked`) — khác Seller ẩn (`isActive`)                                                                  | Ban seller → block SP, reason `seller_banned`                         |
| **SP**                   | Sản phẩm (Product)                                                                                                               | Viết tắt dùng trong comment                                           |
| **stock**                | Số lượng tồn kho của 1 SP                                                                                                        | Trừ ngay khi tạo Order                                                |
| **orderCode**            | Mã đơn hàng tự generate — mỗi Order thuộc đúng 1 Seller                                                                          | e.g. `ORD-20261002-4M8TQ2ZP6C`                                        |
| **snapshot**             | Dữ liệu SP embed vào Order                                                                                                       | Không bị thay đổi khi Seller/Admin sửa SP sau                         |
| **reserve inventory**    | Trừ stock ngay khi tạo Order pending (nguyên tử `stock >= qty`)                                                                  | Hoàn stock nếu thanh toán lỗi / hết hạn / hủy đơn                     |
| **authStore**            | Zustand store lưu user + tokens                                                                                                  | `frontend/src/stores/auth.store.ts` (tạo mới)                         |
| **cartStore**            | Zustand store quản lý cart state                                                                                                 | `frontend/src/stores/cart.store.ts` (tạo mới)                         |
| **webhook (PayOS)**     | PayOS gọi `POST /payments/payos/webhook` server-to-server khi nhận được tiền (thay cho IPN của VNPay)                            | Verify HMAC-SHA256 trên `data` bằng `PAYOS_CHECKSUM_KEY`              |
| **payment link**         | Trang thanh toán PayOS (chuyển khoản / VietQR) tạo cho 1 Checkout                                                                | `checkoutUrl` → trả FE dưới tên `paymentUrl`                          |
| **payosOrderCode**       | `orderCode` gửi PayOS — số nguyên dương unique của Checkout (PayOS không nhận chuỗi)                                             | Khác `checkoutCode` (chuỗi hiển thị cho người dùng)                   |
| **đồng bộ chủ động**     | Backend tự tra cứu PayOS (`GET /v2/payment-requests/{payosOrderCode}`) khi mở trang kết quả hoặc trong cron hết hạn             | Dùng chung hàm xử lý idempotent với webhook (BR-PAY-006)              |
| **soft delete**          | Ẩn SP bằng `isActive=false`, không xóa khỏi DB                                                                                   | SP hiển thị khi `isActive && !isBlocked`                              |
| **slug**                 | URL-friendly version của name                                                                                                    | e.g. "iPhone 15 Pro" → "iphone-15-pro"                                |
| **shopSlug**             | Auto-generated unique URL identifier derived from `shopName` (e.g., "my-shop-2")                                                 | Stable; used in public shop URL `/shops/{shopSlug}`                   |
| **pickupAddress**        | Free-text pickup location for seller's orders (min 10 chars)                                                                     | Not structured; phone is separate                                     |
| **VN phone format**      | Regex `^(\+84                                                                                                                    | 0)[0-9]{9,10}$` for Vietnamese mobile numbers                         | Stored on User profile, required for shop setup |
| **Order**                | Đơn của 1 Seller trong 1 Checkout; có state machine riêng                                                                        | `orders` collection; items embed                                      |
| **recipient**            | Snapshot người nhận (fullName, phone, email, address)                                                                            | Dùng chung cho mọi Order con của Checkout                             |
| **pending**              | Order đã tạo, stock đã giữ, **chờ thanh toán PayOS**                                                                             | Chỉ hệ thống chuyển tiếp/hủy                                          |
| **confirmed**            | Order **đã thanh toán**, chờ Seller giao — KHÔNG phải "Seller đã duyệt"                                                          | Do hệ thống đặt sau PayOS thành công                                  |
| **shipping / delivered** | Seller (hoặc Admin) đang giao / đã giao                                                                                          | Seller bấm tay                                                        |
| **cancelled / refunded** | Đơn bị hủy (hoàn stock đúng 1 lần) / Admin đã hoàn tiền thủ công                                                                 | `refunded` chỉ khi `paymentStatus = paid`                             |
| **late success**         | PayOS báo đã nhận tiền **sau** khi Checkout đã `expired`                                                                           | Ghi `payments.note`, Admin chuyển khoản hoàn tiền thủ công                         |
| **Guest**                | Khách chưa đăng nhập: xem SP / shop / category, có giỏ localStorage                                                              | Không có Guest checkout; merge giỏ khi đăng nhập (BR-CART-002)        |
| **cart merge**           | `POST /cart/merge` ngay sau đăng nhập: đổ giỏ localStorage vào cart DB rồi xóa localStorage                                      | Cộng dồn, cap ở stock, bỏ qua SP không hợp lệ (BR-CART-008)           |
| **cart item status**     | Trạng thái item tính lúc `GET /cart`: `available` / `exceeds_stock` / `out_of_stock` / `unavailable`                             | Chỉ `available` mua được và tính tiền (BR-CART-003, BR-CART-004)      |
| **Admin**                | Tài khoản chỉ kiểm duyệt: block SP, ban user, hoàn tiền thủ công                                                                 | Không mua, không bán; tạo bằng seed script (BR-AUTH-004, BR-AUTH-011) |
| **transaction**          | MongoDB multi-document transaction (`session.withTransaction`) bao quanh: trừ stock + tạo Checkout/Order; hủy Order + hoàn stock | Cần replica set (Atlas có sẵn) — BR-CHK-010                           |

| **DESIGN.md** | Single source of truth for frontend UI tokens, two-canvas polarity, pill buttons (`rounded-full`), and typography (`ss03`) | `frontend/DESIGN.md` |
| **Stitch Project** | Canonical UI/UX design mock repository on Stitch (`Shopify Vietnam Marketplace Design System`), query via Stitch MCP (`get_screen`) | `projects/6249429078653284294` |
| **accessToken** | Short-lived JWT (15m) in Authorization header | `JWT_ACCESS_EXPIRES_IN` |
| **refreshToken** | Long-lived JWT (7d) in httpOnly cookie `Path=/api/v1/auth` | `JWT_REFRESH_EXPIRES_IN` |
| **refreshToken hash** | SHA-256 hash of refreshToken stored in `users.refreshToken` | Never plain text |
| **isRefreshing queue** | Frontend guard preventing concurrent refresh storms | `frontend/src/services/apiClient.ts` |
| **single session model** | New login overwrites refreshToken hash, invalidating prior sessions | BR-AUTH-015 |
| **Page-Centric Architecture** | Mỗi page sở hữu trọn vẹn `components/`, `services/`, `hooks/`, `dialogs/`, `schemas/`, `types.ts` | `src/pages/<PageName>/` |
| **Shared Boundary Rule** | Chỉ đưa component/service/hook/dialog ra root `src/` khi được dùng chung qua 2+ pages | Cấm để component/service đơn lẻ ở root |
| **Formik + Yup** | Chuẩn hóa form handling & validation schemas trong toàn bộ frontend | Schemas đặt tại `schemas/<feature>.schema.ts` |
| **TanStack Query** | Chuẩn hóa fetch, cache và mutation server state (`useQuery`, `useMutation`) | Tự động invalidate queries liên quan khi mutate |

## Before / After (Usage Rule 2)

| Before (dài dòng)                                             | After (thuật ngữ chuẩn)               |
| ------------------------------------------------------------- | ------------------------------------- |
| "Người dùng đã đăng nhập đang đăng bán sản phẩm mà họ là chủ" | **Seller** (ownership qua `sellerId`) |
| "Đơn đã trả tiền nhưng shop chưa giao"                        | Order `confirmed`                     |
| "Trừ tồn kho ngay lúc đặt, hoàn lại nếu không trả tiền"       | **reserve inventory**                 |
| "Một lần bấm đặt hàng cho giỏ có hàng của nhiều shop"         | 1 **Checkout** + N **Order**          |

## Where to Look

- **`frontend/DESIGN.md`** for mandatory frontend design tokens, two-canvas polarity system, universal pill button geometry (`9999px`), typography hierarchy (`ss03`), and hairlines.
- **Stitch MCP Project (`projects/6249429078653284294`)** for official screen mocks, layout HTML (`htmlCode`), and visual reference screenshots (`screenshot`) mapped to User Stories in `docs/PRODUCT_BACKLOG_ROADMAP.md`.
- **Scan codebase** to identify existing implicit terms or jargon not yet cataloged here → add them to the table.
- **`adr/`** for load-bearing architectural decisions that require extensive rationale (link from the glossary where applicable).
- **`.specify/features/<slug>/`** for full business rules and finite state machines (this file is an index of ubiquitous language, not a substitute for formal SRS documents).

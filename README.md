# Ecommerce Team — Sàn Thương Mại Điện Tử Đa Người Bán

Sàn thương mại điện tử **nhiều người bán** (mô hình tương tự Shopee thu gọn): chỉ với **một tài khoản duy nhất**, người dùng vừa có thể **mua sắm** vừa có thể **mở gian hàng đăng bán** sản phẩm. Khách chưa đăng nhập có thể tự do xem hàng và thêm vào giỏ tạm; Quản trị viên (Admin) có cổng riêng để điều hành và kiểm duyệt toàn sàn.

**Luồng hoạt động chính:** Đăng bán sản phẩm → Khám phá & tìm kiếm → Giỏ hàng → Đặt hàng (tự động tách đơn theo từng Shop) → Thanh toán VietQR qua PayOS (chỉ 1 lần quét mã cho cả giỏ hàng) → Người bán xử lý & giao hàng → Admin giám sát toàn sàn.

---

## 🌐 Trải nghiệm trực tuyến (Live Demo)

- **Website chính thức (Vercel):** [https://ecommerce-team.vercel.app/](https://ecommerce-team.vercel.app/)

> **💡 Lưu ý khi truy cập lần đầu:** Hệ thống máy chủ (Backend trên Render Free Tier) sẽ tự động chuyển sang chế độ nghỉ sau khoảng 15 phút không có người truy cập. Khi bạn mở website lần đầu tiên, nếu chưa thấy danh sách sản phẩm hiện ra ngay, vui lòng **đợi khoảng 30–60 giây** và tải lại trang để hệ thống khởi động lại hoàn toàn.

---

## 📖 Hướng dẫn sử dụng Website (Dành cho người dùng cuối)

Tài liệu dưới đây hướng dẫn chi tiết cách sử dụng từng tính năng trên website [ecommerce-team.vercel.app](https://ecommerce-team.vercel.app/) theo 4 vai trò: **Khách vãng lai**, **Người mua hàng**, **Người bán hàng**, và **Quản trị viên**.

---

### Phần 1: Dành cho Khách vãng lai (Chưa đăng nhập)

Ngay khi mở trang chủ [https://ecommerce-team.vercel.app/](https://ecommerce-team.vercel.app/), bạn có thể thoải mái khám phá sản phẩm mà chưa cần tạo tài khoản:

1. **Tìm kiếm & Lọc sản phẩm tại Trang chủ (`/`)**:
   - **Tìm kiếm theo từ khóa**: Nhập tên sản phẩm vào thanh tìm kiếm ở đầu trang.
   - **Lọc theo Danh mục ngành hàng**: Chọn danh mục (Thời trang, Điện tử, Gia dụng, v.v.) ở bộ lọc để xem đúng nhóm hàng bạn quan tâm.
   - **Lọc theo Khoảng giá & Sắp xếp**: Nhập mức giá tối thiểu – tối đa hoặc sắp xếp sản phẩm theo *Mới nhất*, *Giá tăng dần*, *Giá giảm dần*.
2. **Xem chi tiết sản phẩm (`/products/:id`) & Gian hàng của Shop (`/shops/:sellerId`)**:
   - Bấm vào bất kỳ sản phẩm nào để xem bộ ảnh chi tiết, giá bán, số lượng tồn kho hiện tại và mô tả sản phẩm.
   - Bấm vào **Tên gian hàng (Shop)** trên trang sản phẩm để ghé thăm trang riêng của Shop đó (`/shops/:sellerId`) và xem toàn bộ mặt hàng Shop đang bày bán.
3. **Thêm vào Giỏ hàng tạm (`/cart`)**:
   - Bạn có thể chọn số lượng và bấm **Thêm vào giỏ hàng** ngay cả khi chưa đăng nhập.
   - Các sản phẩm sẽ được lưu tạm trên trình duyệt của bạn và tự động gom nhóm gọn gàng theo từng Shop.

---

### Phần 2: Dành cho Người mua hàng (Mua sắm & Thanh toán)

Để tiến hành đặt hàng và thanh toán, bạn cần đăng nhập vào tài khoản Người mua:

1. **Đăng ký & Đăng nhập (`/register`, `/login`)**:
   - Nếu chưa có tài khoản, bấm **Đăng ký** (`/register`), nhập Họ tên, Email và Mật khẩu.
   - Khi bạn **Đăng nhập** (`/login`), toàn bộ sản phẩm bạn đã chọn trong **Giỏ hàng tạm lúc chưa đăng nhập sẽ tự động được gộp** vào giỏ hàng tài khoản của bạn — không bị mất món hàng nào!
2. **Quản lý Giỏ hàng (`/cart`)**:
   - Truy cập biểu tượng **Giỏ hàng** ở góc trên bên phải (`/cart`).
   - Tại đây bạn có thể **tăng/giảm số lượng**, **xóa mặt hàng**, hoặc kiểm tra thông báo nếu có sản phẩm vừa hết hàng hay bị ngừng bán.
   - *Lưu ý:* Để đảm bảo minh bạch, bạn không thể tự thêm hoặc tự mua sản phẩm do chính gian hàng của mình đăng bán.
3. **Đặt hàng & Thanh toán VietQR qua PayOS (`/checkout`)**:
   - Từ giỏ hàng, bấm **Tiến hành thanh toán** để chuyển sang trang `/checkout`.
   - **Bước 1 — Kiểm tra thông tin nhận hàng**: Điền hoặc chỉnh sửa *Họ tên người nhận*, *Số điện thoại* (định dạng SĐT Việt Nam) và *Địa chỉ giao hàng chi tiết*.
   - **Bước 2 — Xác nhận Đặt hàng**:
     - Dù giỏ hàng của bạn có sản phẩm từ **nhiều Shop khác nhau**, hệ thống sẽ tự động tách thành các đơn hàng riêng cho từng Shop nhưng chỉ tạo **1 mã thanh toán tổng duy nhất**.
     - Số lượng tồn kho của sản phẩm sẽ được hệ thống giữ chỗ cho bạn trong vòng **30 phút** chờ thanh toán.
   - **Bước 3 — Quét mã VietQR trên cổng PayOS**:
     - Sau khi bấm **Đặt hàng**, bạn sẽ được chuyển tới trang thanh toán **PayOS** hiển thị mã **VietQR**.
     - Mở ứng dụng Ngân hàng trên điện thoại và quét mã QR để chuyển khoản đúng số tiền.
     - *(Mẹo trải nghiệm Demo: Cổng PayOS kết nối giao dịch ngân hàng thật. Khi thử nghiệm tính năng thanh toán, bạn nên chọn hoặc tự đăng các sản phẩm có mệnh giá nhỏ từ **2.000đ – 5.000đ**).*
   - **Bước 4 — Nhận kết quả thanh toán (`/checkout/result`)**:
     - Ngay khi chuyển khoản thành công, bạn sẽ được đưa về trang **Kết quả thanh toán (`/checkout/result`)** và trạng thái các đơn hàng tự động chuyển sang **Đã xác nhận (Confirmed)**.
     - Nếu bạn bấm **Hủy thanh toán** trên PayOS, đơn hàng sẽ được hủy ngay và số lượng tồn kho được trả lại kệ hàng.
4. **Theo dõi Đơn mua & Quản lý Hồ sơ cá nhân**:
   - **Đơn mua của tôi (`/account/orders`)**: Xem toàn bộ lịch sử mua hàng, lọc theo trạng thái (*Chờ thanh toán*, *Đã xác nhận*, *Đang giao*, *Đã giao*, *Đã hủy*, *Đã hoàn tiền*). Bấm vào từng đơn (`/account/orders/:id`) để xem chi tiết mặt hàng và mã giao dịch. Với các đơn *Chờ thanh toán*, bạn cũng có thể bấm **Hủy đơn** trực tiếp.
   - **Hồ sơ cá nhân (`/account/profile`)**: Cập nhật Họ tên, Số điện thoại và Địa chỉ nhận hàng mặc định để các lần mua sau không cần nhập lại.

---

### Phần 3: Kênh Người bán (Seller Center — Một tài khoản vừa Mua vừa Bán)

Bạn không cần tạo tài khoản thứ hai để bán hàng! Bất kỳ tài khoản người mua nào cũng có thể mở gian hàng tại **Kênh Người Bán**:

1. **Bước 1 — Thiết lập Gian hàng lần đầu (`/seller/setup`)**:
   - Bấm vào mục **Kênh người bán** trên thanh điều hướng (hoặc truy cập `/seller/login` / `/seller/setup`).
   - Điền thông tin kích hoạt Shop:
     - **Tên gian hàng**: Từ 3 đến 50 ký tự (tên hiển thị công khai với người mua).
     - **Số điện thoại liên hệ**: Số điện thoại hợp lệ tại Việt Nam (`0xxxxxxxxx` hoặc `+84xxxxxxxxx`).
     - **Địa chỉ lấy hàng**: Địa chỉ kho/cửa hàng của bạn (tối thiểu 10 ký tự).
   - Bấm **Lưu thông tin** để chính thức mở gian hàng. Bạn có thể cập nhật lại thông tin này bất cứ lúc nào tại **Hồ sơ gian hàng (`/seller/profile`)**.
2. **Bước 2 — Đăng bán & Quản lý Sản phẩm (`/seller/products`)**:
   - Vào mục **Sản phẩm của tôi (`/seller/products`)** $\rightarrow$ bấm **Thêm sản phẩm mới (`/seller/products/new`)**.
   - Điền đầy đủ thông tin mặt hàng:
     - **Tên sản phẩm** & **Danh mục ngành hàng**.
     - **Giá bán (VNĐ)** và **Số lượng tồn kho**.
     - **Hình ảnh sản phẩm**: Tải lên từ **1 đến tối đa 5 ảnh** (định dạng JPG, PNG, WebP, mỗi ảnh tối đa 5MB; ảnh đầu tiên sẽ là ảnh đại diện).
     - **Mô tả chi tiết**: Thông số, chất liệu, bảo hành...
   - Sau khi đăng, sản phẩm sẽ xuất hiện ngay trên sàn! Tại danh sách `/seller/products`, bạn có thể:
     - **Chỉnh sửa (`/seller/products/:id/edit`)**: Cập nhật giá, số lượng tồn kho, hình ảnh, mô tả.
     - **Ẩn / Hiện sản phẩm**: Tạm ẩn sản phẩm khi chưa muốn bán tiếp hoặc bật hiển thị trở lại.
     - **Xem lý do bị khóa**: Nếu sản phẩm vi phạm quy định và bị Admin khóa, lý do khóa sẽ hiển thị rõ ràng trên thẻ sản phẩm.
3. **Bước 3 — Xử lý Đơn hàng của khách (`/seller/orders`)**:
   - Truy cập **Quản lý đơn bán (`/seller/orders`)** để xem các đơn hàng khách đã đặt tại Shop của bạn:
     - Khi khách vừa đặt nhưng chưa chuyển khoản: Đơn ở trạng thái **Chờ thanh toán (Pending Payment)**.
     - Khi khách đã thanh toán qua PayOS: Đơn tự động chuyển sang **Đã xác nhận (Confirmed)**.
   - **Quy trình giao hàng dành cho Shop**:
     1. Tại đơn hàng **Đã xác nhận**, bấm nút **Giao hàng** sau khi bạn đã đóng gói và bàn giao cho đơn vị vận chuyển $\rightarrow$ đơn chuyển sang **Đang giao (Shipping)**.
     2. Khi hàng đã tới tay người mua, bấm nút **Đã giao** $\rightarrow$ đơn hoàn tất ở trạng thái **Đã giao (Delivered)**.
     3. **Trường hợp cần Hủy đơn**: Nếu đơn đang ở trạng thái *Chờ thanh toán* hoặc *Đã xác nhận* mà Shop không thể cung cấp hàng, bạn có thể bấm **Hủy đơn** và nhập lý do hủy $\rightarrow$ đơn chuyển sang **Đã hủy (Cancelled)** và tồn kho sản phẩm được cộng trả lại tự động.

---

### Phần 4: Cổng Quản trị viên (Admin Portal — `/admin/login`)

Tài khoản Quản trị viên (Admin) được tách biệt hoàn toàn để đảm bảo tính khách quan (Admin không mua hàng và không mở shop bán hàng):

1. **Đăng nhập Quản trị (`/admin/login`)**:
   - Truy cập trang đăng nhập dành riêng cho Admin tại `/admin/login`.
2. **Quản lý Danh mục ngành hàng (`/admin/categories`)**:
   - Tạo danh mục mới, đổi tên danh mục, bật/tắt trạng thái hoạt động hoặc xóa danh mục (chỉ cho phép xóa danh mục chưa có sản phẩm nào gắn vào).
3. **Kiểm duyệt Sản phẩm toàn sàn (`/admin/products`)**:
   - Tra cứu và rà soát toàn bộ sản phẩm do các Shop đăng tải.
   - **Khóa sản phẩm vi phạm (Block)**: Nhập lý do vi phạm (bắt buộc) để gỡ sản phẩm khỏi trang chủ và trang tìm kiếm ngay lập tức; hoặc **Mở khóa (Unblock)** khi Shop đã khắc phục.
4. **Quản lý Người dùng (`/admin/users`)**:
   - Xem danh sách tài khoản trên hệ thống, tìm kiếm theo tên/email.
   - **Khóa / Mở khóa tài khoản**: Khi khóa một tài khoản vi phạm, người dùng đó sẽ bị đăng xuất ngay lập tức và toàn bộ sản phẩm đang bán của họ cũng tự động bị khóa khỏi sàn.

---

### Phần 5: Câu hỏi thường gặp (FAQ)

- **1. Tôi thêm hàng vào giỏ lúc chưa đăng nhập, sau khi đăng nhập thì giỏ hàng có bị mất không?**
  > Không! Hệ thống tự động đồng bộ và gộp toàn bộ sản phẩm trong giỏ tạm trên trình duyệt vào giỏ hàng tài khoản của bạn ngay khi bạn đăng nhập thành công.
- **2. Tôi mua sản phẩm của 3 Shop khác nhau trong cùng một lần đặt hàng thì phải chuyển khoản mấy lần?**
  > Bạn chỉ cần quét mã VietQR và **chuyển khoản 1 lần duy nhất** cho tổng giá trị đơn hàng qua PayOS. Hệ thống sẽ tự động chia thành 3 đơn hàng riêng biệt để từng Shop chủ động chuẩn bị và giao hàng cho bạn.
- **3. Nếu tôi lỡ đóng tab trình duyệt khi đang ở màn hình quét mã QR PayOS thì sao?**
  > Đơn hàng của bạn vẫn được giữ chỗ tồn kho trong **30 phút**. Nếu bạn đã chuyển khoản thành công, hệ thống vẫn tự động ghi nhận thanh toán qua Webhook. Nếu sau 30 phút bạn không thanh toán, hệ thống sẽ tự động hủy đơn quá hạn và hoàn trả số lượng tồn kho về lại cho Shop.

---

## 🛠️ Dành cho Nhà phát triển (Developer Documentation)

### Tech stack

| Layer | Công nghệ |
| --- | --- |
| Backend | NestJS 11 · MongoDB Atlas (Mongoose, multi-document transaction) · JWT (access + refresh) |
| Frontend | React 18 · Vite · TypeScript · Tailwind + shadcn/ui · Zustand · TanStack Query |
| Dịch vụ ngoài | Cloudinary (ảnh SP) · PayOS (thanh toán chuyển khoản / VietQR — không có sandbox, test bằng giao dịch thật số tiền nhỏ) |
| Deploy | Vercel (frontend) · Render (backend, free tier) · MongoDB Atlas |

### Cấu trúc repo

```
backend/     NestJS API            (npm)
frontend/    React + Vite          (pnpm)
docs/        tài liệu dự án        → docs/project-ecommerce/README.md là mục lục
adr/         quyết định kiến trúc
.specify/    đặc tả theo feature
CONTEXT.md   thuật ngữ dùng chung (đọc trước khi đặt tên biến / hàm)
```

### Chạy nhanh tại máy cá nhân (Local Development)

```bash
# Backend  (cổng 3000) — tạo .env theo docs/project-ecommerce/09-environment-setup.md
cd backend && npm install && npm run start:dev

# Frontend (cổng 5173)
cd frontend && pnpm install && pnpm dev
```

Chi tiết biến môi trường, MongoDB Atlas, Cloudinary, PayOS: [`09-environment-setup.md`](docs/project-ecommerce/09-environment-setup.md). Backend dùng transaction nên MongoDB phải là **replica set** (Atlas free tier là đủ).

### Tài liệu kỹ thuật chi tiết

| Cần gì | Xem |
| --- | --- |
| Scope & luật nghiệp vụ | [`02-scope.md`](docs/project-ecommerce/02-scope.md) · [`03-requirements.md`](docs/project-ecommerce/03-requirements.md) |
| Luồng người dùng | [`04-user-flow.md`](docs/project-ecommerce/04-user-flow.md) |
| DB & API | [`05-database-erd.md`](docs/project-ecommerce/05-database-erd.md) · [`06-api-contract.md`](docs/project-ecommerce/06-api-contract.md) |
| Quy ước code & git | [`07-tech-conventions.md`](docs/project-ecommerce/07-tech-conventions.md) |
| Phân công & timeline | [`08-task-breakdown.md`](docs/project-ecommerce/08-task-breakdown.md) |
| Deploy (Vercel + Render) | [`10-deployment.md`](docs/project-ecommerce/10-deployment.md) |

### Git workflow

`main` (ổn định) ← `dev` (tích hợp) ← `feature/<tên>`; Conventional Commits; mỗi PR cần ≥ 1 người review. Chi tiết: `07-tech-conventions.md`.

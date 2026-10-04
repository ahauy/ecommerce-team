# User Stories — US-AUTH-001: Đăng ký & Đăng nhập tài khoản

- **Feature ID:** `US-AUTH-001`
- **Feature Slug:** `auth-register-login`

---

### Scenario US-AUTH-001.1: Đăng ký tài khoản thành công (Happy Path)

- **Given** Khách vãng lai (Guest) truy cập trang `/register`
- **When** Điền đầy đủ email chưa từng đăng ký (ví dụ `buyer@example.com`), password hợp lệ (>= 8 ký tự), và họ tên `Nguyễn Văn A`, sau đó bấm Đăng ký
- **Then** Hệ thống gửi `POST /api/v1/auth/register`
- **And** Backend mã hóa password bằng bcrypt (rounds 10)
- **And** Tạo bản ghi mới trong `users` với `role: 'customer'`, `isActive: true`
- **And** Trả về HTTP 201 Created với payload `{ success: true, data: { userId, email, fullName }, message: "Đăng ký thành công" }`
- **And** Frontend hiển thị thông báo thành công và chuyển hướng người dùng sang trang `/login`.

---

### Scenario US-AUTH-001.2: Đăng ký với email đã tồn tại (Conflict)

- **Given** Một tài khoản đã đăng ký trước đó với email `existing@example.com`
- **When** Người dùng thực hiện đăng ký với email `existing@example.com`
- **Then** Backend phát hiện email trùng và trả về HTTP 409 Conflict với `{ success: false, message: "Email đã tồn tại trên hệ thống" }`
- **And** Frontend hiển thị thông báo lỗi tại trường email hoặc banner thông báo.

---

### Scenario US-AUTH-001.3: Đăng nhập thành công (Happy Path)

- **Given** Người dùng đã có tài khoản hợp lệ (`user@example.com`, pass `Abc@12345`, `isActive: true`)
- **When** Người dùng nhập đúng email và mật khẩu tại form `/login` và bấm Đăng nhập
- **Then** Hệ thống gửi `POST /api/v1/auth/login`
- **And** Backend xác thực password hash hợp lệ
- **And** Tạo access token (15m) chứa `sub: user._id`, `email`, `role`
- **And** Tạo refresh token (7d), hash SHA-256 lưu vào `users.refreshToken`
- **And** Đính kèm `refreshToken` vào `httpOnly` cookie (`SameSite=Lax`, `Path=/api/v1/auth`)
- **And** Trả về HTTP 200 OK với body chứa `accessToken` và `user: { id, email, fullName, role, shopName }`
- **And** Frontend lưu `accessToken` vào Zustand in-memory state và chuyển hướng về trang chủ hoặc trang trước đó.

---

### Scenario US-AUTH-001.4: Đăng nhập sai mật khẩu (Unauthorized)

- **Given** Tài khoản tồn tại trên hệ thống
- **When** Người dùng đăng nhập với mật khẩu không chính xác
- **Then** Backend trả về HTTP 401 Unauthorized với `{ success: false, message: "Email hoặc mật khẩu không chính xác" }`
- **And** Không sinh JWT token hay cập nhật cookie.

---

### Scenario US-AUTH-001.5: Đăng nhập khi tài khoản bị khóa (Forbidden)

- **Given** Tài khoản có `isActive = false` trong cơ sở dữ liệu
- **When** Người dùng cố gắng đăng nhập với đúng thông tin email và mật khẩu
- **Then** Backend phát hiện tài khoản bị khóa và trả về HTTP 403 Forbidden với `{ success: false, message: "Tài khoản đã bị khóa" }`
- **And** Từ chối đăng nhập.

---

### Scenario US-AUTH-001.6: Validate form ở phía Client & Server

- **Given** Người dùng để trống trường hoặc nhập email sai format, password < 8 ký tự
- **When** Bấm submit form
- **Then** Client hiển thị lỗi validation ngay lập tức qua Formik/Yup
- **And** Nếu gửi trực tiếp qua API, backend `ValidationPipe` chặn lại và trả về HTTP 400 Bad Request kèm chi tiết mảng lỗi `errors`.

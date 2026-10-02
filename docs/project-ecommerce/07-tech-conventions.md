# 07 — Tech Stack & Conventions

## Monorepo Structure

```
ecommerce-team/              ← root repo (2 project độc lập, KHÔNG có pnpm workspace / apps/)
├── backend/                 ← NestJS API (npm)
├── frontend/                ← React 18 + Vite, clone từ react-boider-plate-ts (pnpm)
├── docs/  adr/  .specify/   ← tài liệu & đặc tả
└── CONTEXT.md  README.md
```

## Frontend Stack (Template: react-boider-plate-ts)

| Thư viện                     | Dùng cho                               |
| ---------------------------- | -------------------------------------- |
| **React 18 + Vite**          | Build tool + UI runtime                |
| **TypeScript (strict)**      | Type safety                            |
| **Tailwind CSS + shadcn/ui** | Styling + component library            |
| **React Router v6**          | Routing, Private Route, lazy loading   |
| **Zustand**                  | Global state: `authStore`, `cartStore` |
| **TanStack Query**           | Server state, caching API calls        |
| **Axios**                    | HTTP client (base URL = `/api/v1`)     |
| **Formik + Yup**             | Forms + validation                     |
| **i18next**                  | i18n — dùng tiếng Việt (`vi`)          |
| **Lucide React**             | Icons                                  |
| **react-toastify**           | Toast notifications                    |

## Frontend Folder Structure

> Cây dưới đây là **đích đến**. Template hiện có `HOCs/`, `consts/`, `helpers/`, `interfaces/`, `i18n/`, `providers/`, `layouts/` và `stores/useStores.ts`. **Giữ nguyên cấu trúc template**, chỉ thêm thư mục/file mới (`pages/seller`, `pages/admin`, `services/*.service.ts`...) — không refactor template trong 1 tuần.

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # Router setup
│   │
│   ├── assets/                   # Images, fonts
│   ├── components/               # Shared UI components
│   │   ├── ui/                   # shadcn/ui generated components
│   │   └── shared/               # Custom shared components
│   │
│   ├── hooks/                    # Custom hooks (useAuth, useCart...)
│   ├── lib/                      # utils, cn helper, axios instance
│   ├── stores/                   # Zustand stores
│   │   ├── auth.store.ts
│   │   └── cart.store.ts
│   │
│   ├── services/                 # API calls (grouped by module)
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   ├── cart.service.ts
│   │   ├── order.service.ts
│   │   ├── user.service.ts           # /users/me, /users/me/shop
│   │   └── shop.service.ts           # /shops/:sellerId
│   │
│   ├── pages/                    # Route-level components
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── products/
│   │   │   ├── ProductListPage.tsx
│   │   │   └── ProductDetailPage.tsx
│   │   ├── cart/
│   │   │   └── CartPage.tsx
│   │   ├── checkout/
│   │   │   ├── CheckoutPage.tsx
│   │   │   ├── OrderSuccessPage.tsx
│   │   │   └── OrderFailPage.tsx
│   │   ├── orders/
│   │   │   └── OrderHistoryPage.tsx  # đơn đã mua
│   │   ├── shop/
│   │   │   └── ShopPage.tsx          # trang công khai của 1 gian hàng
│   │   ├── profile/
│   │   │   └── ProfilePage.tsx
│   │   ├── seller/                   # "Kênh người bán" (PrivateRoute)
│   │   │   ├── ShopSetupPage.tsx     # thiết lập shopName, pickupAddress
│   │   │   ├── MyProductsPage.tsx    # Sản phẩm của tôi
│   │   │   ├── ProductFormPage.tsx   # Thêm / sửa SP + upload ảnh
│   │   │   └── SellerOrdersPage.tsx  # Đơn bán + nút Giao hàng / Đã giao / Hủy
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminProducts.tsx     # xem mọi SP, block / unblock
│   │       ├── AdminCategories.tsx
│   │       ├── AdminOrders.tsx
│   │       └── AdminUsers.tsx
│   │
│   ├── routes/                   # Route config + guards
│   │   ├── PrivateRoute.tsx      # Redirect nếu chưa login
│   │   ├── AdminRoute.tsx        # Redirect nếu không phải admin
│   │   └── index.tsx
│   │
│   ├── types/                    # Shared TypeScript types
│   │   ├── auth.types.ts
│   │   ├── product.types.ts
│   │   ├── shop.types.ts
│   │   └── order.types.ts            # Order, Checkout
│   │
│   └── locales/                  # i18n
│       ├── vi.json
│       └── en.json
│
├── .env.example
├── vite.config.ts
└── package.json
```

## Folder Structure — NestJS Backend

```
backend/
├── src/
│   ├── main.ts                    # Entry point
│   ├── app.module.ts
│   │
│   ├── common/                    # Shared utilities
│   │   ├── decorators/            # @CurrentUser, @Roles, etc.
│   │   │                          # Ownership check dùng helper assertOwnerOrAdmin() ở service
│   │   ├── guards/                # JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard
│   │   ├── filters/               # GlobalExceptionFilter
│   │   ├── interceptors/          # ResponseInterceptor (wrap format)
│   │   ├── pipes/                 # ValidationPipe
│   │   └── utils/                 # helpers, slug generator, etc.
│   │
│   ├── config/                    # Configuration modules
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── cloudinary.config.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/        # JwtStrategy, JwtRefreshStrategy
│   │   │   └── dto/               # RegisterDto, LoginDto
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts # /users/me, /users/me/shop
│   │   │   ├── users.service.ts
│   │   │   ├── schemas/           # user.schema.ts
│   │   │   └── dto/               # update-profile.dto.ts, setup-shop.dto.ts
│   │   │
│   │   ├── shops/
│   │   │   ├── shops.module.ts
│   │   │   ├── shops.controller.ts # GET /shops/:sellerId
│   │   │   └── shops.service.ts    # dùng UsersService + ProductsService
│   │   │
│   │   ├── categories/
│   │   │   ├── categories.module.ts
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.service.ts
│   │   │   ├── schemas/           # category.schema.ts
│   │   │   └── dto/
│   │   │
│   │   ├── products/
│   │   │   ├── products.module.ts
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── schemas/           # product.schema.ts
│   │   │   └── dto/
│   │   │
│   │   ├── cart/
│   │   │   ├── cart.module.ts
│   │   │   ├── cart.controller.ts
│   │   │   ├── cart.service.ts
│   │   │   ├── schemas/           # cart.schema.ts
│   │   │   └── dto/
│   │   │
│   │   ├── orders/
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.controller.ts   # /orders, /orders/my, /orders/selling, PATCH status
│   │   │   ├── orders.service.ts      # tạo checkout, nhóm theo seller, state machine
│   │   │   ├── checkout-expiry.task.ts # @Cron mỗi phút: hủy checkout quá hạn + hoàn stock
│   │   │   ├── schemas/           # order.schema.ts, checkout.schema.ts
│   │   │   └── dto/
│   │   │
│   │   ├── payments/
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   └── schemas/           # payment.schema.ts
│   │   │
│   │   ├── upload/
│   │   │   ├── upload.module.ts
│   │   │   ├── upload.controller.ts
│   │   │   └── upload.service.ts  # Cloudinary integration
│   │   │
│   │   └── admin/
│   │       ├── admin.module.ts
│   │       ├── admin.controller.ts
│   │       └── admin.service.ts
│   │
├── test/                          # E2E tests
├── .env
├── .env.example
└── package.json
```

---

## Naming Conventions

### Files & Folders

| Loại        | Convention               | Ví dụ                       |
| ----------- | ------------------------ | --------------------------- |
| Module file | `<name>.module.ts`       | `products.module.ts`        |
| Controller  | `<name>.controller.ts`   | `products.controller.ts`    |
| Service     | `<name>.service.ts`      | `products.service.ts`       |
| Schema      | `<name>.schema.ts`       | `product.schema.ts`         |
| DTO         | `<action>-<name>.dto.ts` | `create-product.dto.ts`     |
| Guard       | `<name>.guard.ts`        | `jwt-auth.guard.ts`         |
| Decorator   | `<name>.decorator.ts`    | `current-user.decorator.ts` |

### Variables & Functions

| Loại                | Convention          | Ví dụ                               |
| ------------------- | ------------------- | ----------------------------------- |
| Variable / Function | `camelCase`         | `getUserById`, `totalAmount`        |
| Class / Schema      | `PascalCase`        | `ProductSchema`, `CreateProductDto` |
| Constant            | `UPPER_SNAKE_CASE`  | `JWT_SECRET`, `MAX_IMAGES`          |
| Enum                | `PascalCase` values | `OrderStatus.PENDING`               |
| MongoDB field       | `camelCase`         | `categoryId`, `createdAt`           |

### API Endpoints

- Dùng **noun, plural**: `/products`, `/categories`, `/orders`
- Dùng **kebab-case**: `/order-items` không phải `/orderItems`
- Không dùng động từ trong URL: `/products` (GET) thay vì `/getProducts`

---

## Enums (thống nhất giữa FE & BE)

```typescript
// Order Status
export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  SHIPPING = "shipping",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

// Payment Status (cấp Order)
export enum PaymentStatus {
  UNPAID = "unpaid",
  PAID = "paid",
  REFUNDED = "refunded",
}

// Checkout Status (cấp Checkout — 1 giao dịch VNPay)
export enum CheckoutStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  EXPIRED = "expired",
}

// Ai hủy đơn
export enum CancelledBy {
  SYSTEM = "system",
  SELLER = "seller",
  ADMIN = "admin",
}

// Lý do block mặc định khi ban seller
export const BLOCK_REASON_SELLER_BANNED = "seller_banned";

// User Role — KHÔNG có "seller": bán hàng xác định bằng quyền sở hữu (sellerId)
export enum UserRole {
  CUSTOMER = "customer",
  ADMIN = "admin",
}
```

---

## Git Workflow

### Branch Strategy

```
main          ← production-ready (chỉ merge từ dev sau review)
  └── dev     ← integration branch (merge feature branches vào đây)
        ├── feature/auth
        ├── feature/category-product
        ├── feature/seller-shop
        ├── feature/cart
        ├── feature/order-checkout
        ├── feature/payment-vnpay
        └── feature/admin-dashboard
```

### Commit Message — Conventional Commits

```
<type>(<scope>): <description>

type:
  feat     — tính năng mới
  fix      — sửa bug
  docs     — chỉ thay đổi tài liệu
  refactor — refactor code
  test     — thêm/sửa test
  chore    — cấu hình, package, CI

scope: auth | user | shop | category | product | cart | order | checkout | payment | admin | upload

Ví dụ:
  feat(product): add text search by product name
  fix(order): rollback stock when payment fails
  feat(product): restrict update/delete to owner or admin
  docs(api): update order status endpoint docs
  refactor(auth): extract token validation to helper
```

### Pull Request Rules

1. Mở PR từ `feature/*` vào `dev`
2. Cần ít nhất **1 người review** trước khi merge
3. Resolve conflict trước khi request review
4. Xóa branch sau khi merge

---

## Code Style

- **Prettier** format on save — không tranh cãi style
- **ESLint** — follow NestJS default config
- **Max file length**: 300 dòng (nếu vượt, tách service/helper)
- **Max function length**: 50 dòng
- **No `any` type** — luôn có type rõ ràng
- **DTOs phải có validation** — dùng `class-validator`
- **Service không import trực tiếp Schema của module khác** — dùng qua Service của module đó

---

## Bảo mật tối thiểu (bắt buộc, chi phí thấp)

- `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` toàn cục — chặn mass assignment (`role`, `isActive`, `sellerId`, `isBlocked`... không bao giờ nhận từ body).
- `helmet()` + `@nestjs/throttler` cho nhóm `/auth/*` (vd 10 req/phút/IP) để chống dò mật khẩu.
- Không log password / token / `vnp_SecureHash` / secret; `.env` không commit.
- Mọi endpoint `/orders/selling*`, `/products/my`, `PATCH /orders/:id/status`, `PATCH|DELETE /products/:id` phải có test **sai chủ → 403/404** (đã nằm trong DoD).
- Phân trang: `limit` tối đa 100 ở mọi endpoint danh sách.

## Dependencies backend cần cài (scaffold hiện chỉ có NestJS starter)

`@nestjs/config @nestjs/mongoose mongoose @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer @nestjs/schedule cloudinary multer helmet @nestjs/throttler` (+ `@types/bcrypt @types/multer @types/passport-jwt` ở dev).

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

> Giữ khung của template (`HOCs/`, `consts/`, `helpers/`, `i18n/`, `providers/`, `layouts/`), chỉ sắp xếp lại cho nhất quán. **Không refactor sâu trong 1 tuần.**

### Nguyên tắc đặt file

| Loại code | Đặt ở | Lý do |
| --- | --- | --- |
| Gọi API (axios) | `services/<domain>.service.ts` | 1 domain được nhiều page dùng chung (product: list, detail, my-products, admin, shop) |
| Type / interface / DTO | `types/<domain>.types.ts` | Không copy type giữa các page, đổi API chỉ sửa 1 chỗ |
| Hook TanStack Query | `hooks/queries/use<Domain>.ts` | Query key và invalidate tập trung theo domain |
| Zustand store | `stores/<name>.store.ts` | Chỉ cho state client (auth, cart) |
| Route + guard | `routes/` | `App.tsx` chỉ còn providers |
| Yup schema, component con, dialog, test **chỉ của 1 page** | trong thư mục page đó | Đây là thứ duy nhất nên nằm trong page |

> **KHÔNG** đặt `services/`, `types.ts`, `hooks/` bên trong thư mục page.

### Cây thư mục

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # Providers + <Router><AppRoutes /></Router>
│   │
│   ├── routes/
│   │   ├── index.tsx             # Toàn bộ <Routes>, Suspense, ErrorBoundary
│   │   ├── PrivateRoute.tsx      # Redirect nếu chưa login
│   │   └── AdminRoute.tsx        # (sẽ thêm) sau khi thống nhất auth
│   │
│   ├── layouts/                  # DefaultLayout, ...
│   ├── pages/                    # Gom theo nhóm; mỗi page là 1 thư mục
│   │   ├── auth/                 # LoginPage, RegisterPage, ForgotPassword, ChangePassword
│   │   ├── home/                 # Homepage
│   │   ├── products/             # (sẽ thêm) ProductListPage, ProductDetailPage
│   │   ├── cart/  checkout/  orders/   # (sẽ thêm)
│   │   ├── shop/                 # PublicShopPage
│   │   ├── profile/              # ProfilePage
│   │   ├── seller/               # ShopSetupPage, (sẽ thêm) MyProductsPage, ProductFormPage, SellerOrdersPage
│   │   ├── admin/                # AdminCategoryPage, (sẽ thêm) AdminProducts, AdminOrders, AdminUsers
│   │   └── errors/               # Page404
│   │       └── <PageName>/
│   │           ├── index.tsx
│   │           ├── components/   # chỉ của page này
│   │           ├── dialogs/
│   │           ├── schemas/      # Yup
│   │           └── __tests__/
│   │
│   ├── services/                 # API calls, nhóm theo domain
│   │   ├── apiClient.ts          # axios instance + refresh token interceptor
│   │   ├── auth.service.ts  user.service.ts  shop.service.ts  category.service.ts
│   │   └── (sẽ thêm) product.service.ts  cart.service.ts  order.service.ts
│   │
│   ├── hooks/
│   │   ├── queries/              # hook TanStack Query theo domain (usePublicShop, ...)
│   │   └── use*.ts               # hook UI dùng chung
│   │
│   ├── types/                    # *.types.ts theo domain: common, user, category, product, shop, (order)
│   ├── stores/                   # auth.store.ts, (sẽ thêm) cart.store.ts
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui generated
│   │   └── ...                   # component dùng chung (Navbar, Sidebar, CategoryNav, customFieldsFormik, dialogs)
│   │
│   ├── providers/  HOCs/  consts/  helpers/  lib/
│   ├── i18n/                     # vi / en
│   └── styles/  assets/  test/  @types/
│
├── DESIGN.md
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

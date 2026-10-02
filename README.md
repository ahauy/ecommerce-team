# Ecommerce Team Project

Sàn thương mại điện tử **nhiều người bán** (kiểu Shopee thu gọn): một tài khoản vừa **mua** vừa **đăng bán** sản phẩm. Khách chưa đăng nhập chỉ xem hàng; Admin chỉ kiểm duyệt (không mua, không bán). Bài test giao bởi cấp trên · team 2 người · deadline 1 tuần.

**Luồng chính:** đăng bán SP → xem SP → giỏ hàng → checkout (tách đơn theo người bán) → thanh toán VNPay (1 giao dịch) → người bán xử lý đơn → Admin giám sát.

## Tech stack

| Layer | Công nghệ |
| --- | --- |
| Backend | NestJS 11 · MongoDB Atlas (Mongoose, multi-document transaction) · JWT (access + refresh) |
| Frontend | React 18 · Vite · TypeScript · Tailwind + shadcn/ui · Zustand · TanStack Query |
| Dịch vụ ngoài | Cloudinary (ảnh SP) · VNPay Sandbox (thanh toán) |
| Deploy | Vercel (frontend) · Render (backend, free tier) · MongoDB Atlas |

## Cấu trúc repo

```
backend/     NestJS API            (npm)
frontend/    React + Vite          (pnpm)
docs/        tài liệu dự án        → docs/project-ecommerce/README.md là mục lục
adr/         quyết định kiến trúc
.specify/    đặc tả theo feature
CONTEXT.md   thuật ngữ dùng chung (đọc trước khi đặt tên biến / hàm)
```

## Chạy nhanh

```bash
# Backend  (cổng 3000) — tạo .env theo docs/project-ecommerce/09-environment-setup.md
cd backend && npm install && npm run start:dev

# Frontend (cổng 5173)
cd frontend && pnpm install && pnpm dev
```

Chi tiết biến môi trường, MongoDB Atlas, Cloudinary, VNPay sandbox: [`09-environment-setup.md`](docs/project-ecommerce/09-environment-setup.md). Backend dùng transaction nên MongoDB phải là **replica set** (Atlas free tier là đủ).

## Tài liệu

| Cần gì | Xem |
| --- | --- |
| Scope & luật nghiệp vụ | [`02-scope.md`](docs/project-ecommerce/02-scope.md) · [`03-requirements.md`](docs/project-ecommerce/03-requirements.md) |
| Luồng người dùng | [`04-user-flow.md`](docs/project-ecommerce/04-user-flow.md) |
| DB & API | [`05-database-erd.md`](docs/project-ecommerce/05-database-erd.md) · [`06-api-contract.md`](docs/project-ecommerce/06-api-contract.md) |
| Quy ước code & git | [`07-tech-conventions.md`](docs/project-ecommerce/07-tech-conventions.md) |
| Phân công & timeline | [`08-task-breakdown.md`](docs/project-ecommerce/08-task-breakdown.md) |
| Deploy (Vercel + Render) | [`10-deployment.md`](docs/project-ecommerce/10-deployment.md) |

## Git workflow

`main` (ổn định) ← `dev` (tích hợp) ← `feature/<tên>`; Conventional Commits; mỗi PR cần ≥ 1 người review. Chi tiết: `07-tech-conventions.md`.

## Tài khoản demo

_(điền sau khi có seed script — task 1.10: Admin, 2 seller, 1 buyer; thẻ test VNPay xem `09-environment-setup.md`)_

## Demo online

- Frontend (Vercel): _(điền sau khi deploy)_
- Backend (Render): _(điền sau khi deploy — free tier ngủ sau ~15 phút không có request, request đầu có thể chờ 30–60 giây; mở trước khi demo)_

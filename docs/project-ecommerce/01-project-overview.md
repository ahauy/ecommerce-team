# 01 — Project Overview

## Tổng quan dự án

| Mục           | Nội dung                                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên dự án** | Ecommerce Team Project                                                                                                                        |
| **Mục tiêu**  | Xây dựng **sàn thương mại điện tử nhiều người bán** (kiểu Shopee thu gọn): user vừa **đăng bán** vừa **mua** sản phẩm vật lý. Luồng: đăng bán SP → xem SP → giỏ hàng → checkout (tách đơn theo người bán) → thanh toán PayOS → người bán xử lý đơn |
| **Deadline**  | 1 tuần                                                                                                                                        |
| **Team**      | 2 người — phân công theo feature (mỗi người làm FE→BE của feature mình)                                                                       |
| **Ngôn ngữ**  | Tiếng Việt                                                                                                                                    |
| **Tiền tệ**   | VNĐ                                                                                                                                           |

## Tech Stack

| Layer            | Công nghệ                          |
| ---------------- | ---------------------------------- |
| **Frontend**     | Template sẵn (tích hợp qua API)    |
| **Backend**      | NestJS (Node.js framework)         |
| **Database**     | MongoDB (via Mongoose)             |
| **Auth**         | JWT (Access Token + Refresh Token) |
| **File Storage** | Cloudinary (upload ảnh sản phẩm)   |
| **Payment**      | PayOS (payment link: chuyển khoản / VietQR) |
| **API Style**    | REST — versioned `/api/v1/...`     |

## Kiến trúc tổng quan

```
┌─────────────────────────────────┐
│         Frontend (Template)     │
│  Guest / Customer / Admin UI    │
└─────────────┬───────────────────┘
              │ REST /api/v1/
┌─────────────▼───────────────────┐
│       NestJS Backend            │
│  Auth · User/Shop · Category    │
│  Product · Cart · Order         │
│  Checkout · Payment · Admin     │
└─────────────┬───────────────────┘
              │ Mongoose
┌─────────────▼───────────────────┐
│          MongoDB                │
└─────────────────────────────────┘
              │
  ┌───────────┴────────────┐
  │ Cloudinary   PayOS API │
  └────────────────────────┘
```

## Nguyên tắc làm việc chung

1. **API versioning** — luôn prefix `/api/v1/`
2. **Response format** — thống nhất JSON wrapper (xem phần API Contract)
3. **Branch strategy** — `main` (stable) · `dev` (integration) · `feature/<tên>` (cá nhân)
4. **Commit convention** — Conventional Commits (xem phần Tech Conventions)
5. **Zero silent assumption** — mọi câu hỏi về logic đều hỏi nhau trước khi code
6. **Một tài khoản, hai vai** — không có role `seller`; quyền bán xác định bằng quyền sở hữu (`sellerId`)

## Mô hình vai trò

| Vai trò      | Mô tả                                                                          |
| ------------ | ------------------------------------------------------------------------------ |
| **Guest**    | Chưa đăng nhập: xem SP, thêm giỏ (localStorage); muốn đặt hàng phải đăng nhập  |
| **Customer** | User đã đăng nhập: mua hàng, và **bán hàng** sau khi thiết lập gian hàng        |
| **Seller**   | Không phải role — là Customer khi thao tác trên SP/đơn mà mình sở hữu          |
| **Admin**    | Quản trị sàn: Category, kiểm duyệt SP (block), User, mọi Order                 |

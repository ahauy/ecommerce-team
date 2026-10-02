# 01 — Project Overview

## Tổng quan dự án

| Mục           | Nội dung                                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên dự án** | Ecommerce Team Project                                                                                                                        |
| **Mục tiêu**  | Xây dựng hệ thống thương mại điện tử bán sản phẩm vật lý với đầy đủ luồng: xem SP → giỏ hàng → checkout → thanh toán VNPay → quản lý đơn hàng |
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
| **Payment**      | VNPay                              |
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
│  Auth · Category · Product      │
│  Cart · Order · Payment · Admin │
└─────────────┬───────────────────┘
              │ Mongoose
┌─────────────▼───────────────────┐
│          MongoDB                │
└─────────────────────────────────┘
              │
  ┌───────────┴────────────┐
  │ Cloudinary   VNPay API │
  └────────────────────────┘
```

## Nguyên tắc làm việc chung

1. **API versioning** — luôn prefix `/api/v1/`
2. **Response format** — thống nhất JSON wrapper (xem phần API Contract)
3. **Branch strategy** — `main` (stable) · `dev` (integration) · `feature/<tên>` (cá nhân)
4. **Commit convention** — Conventional Commits (xem phần Tech Conventions)
5. **Zero silent assumption** — mọi câu hỏi về logic đều hỏi nhau trước khi code

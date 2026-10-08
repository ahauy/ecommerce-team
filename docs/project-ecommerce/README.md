# 📚 Tài liệu Dự án Ecommerce

> **Stack:** NestJS · MongoDB · Frontend Template · PayOS · Cloudinary  
> **Team:** 2 người · **Deadline:** 1 tuần

---

## Mục lục

| #   | Tài liệu                                       | Mô tả                                       |
| --- | ---------------------------------------------- | ------------------------------------------- |
| 01  | [Project Overview](./01-project-overview.md)   | Tổng quan dự án, tech stack, kiến trúc      |
| 02  | [Scope](./02-scope.md)                         | Must Have & Won't Have                      |
| 03  | [Requirements](./03-requirements.md)           | Business Rules (BR-XXX) đầy đủ              |
| 04  | [User Flow](./04-user-flow.md)                 | Luồng Guest · Customer · Admin + Edge Cases |
| 05  | [Database ERD](./05-database-erd.md)           | MongoDB schemas, quan hệ, index             |
| 06  | [API Contract](./06-api-contract.md)           | Tất cả endpoints `/api/v1/...` + format     |
| 07  | [Tech Conventions](./07-tech-conventions.md)   | Folder structure, naming, git workflow      |
| 08  | [Task Breakdown](./08-task-breakdown.md)       | Phân công, dependency, timeline             |
| 09  | [Environment Setup](./09-environment-setup.md) | `.env`, credentials, hướng dẫn chạy         |

---

## Quick Reference

### RBAC

| Role         | Quyền chính                                      |
| ------------ | ------------------------------------------------ |
| **Guest**    | Xem SP · Tìm kiếm · Giỏ localStorage (đặt hàng phải đăng nhập) |
| **Customer** | Mọi quyền Guest · Cart DB · Lịch sử đơn mua · **Đăng bán SP** · **Xử lý đơn bán** |
| **Admin**    | Quản lý User · Category · Product (block) · Order (mọi shop) |

> **Seller không phải role riêng** — là Customer đang thao tác trên SP/đơn của chính mình (`sellerId`).

### Order State Machine

Áp dụng cho **từng Order** (mỗi người bán một Order):

```
pending → confirmed (PayOS auto) → shipping → delivered   (Seller / Admin)
       ↘ cancelled (fail/timeout/seller/admin) → refunded (Admin)
```

### Key Business Rules

- `stock` không được âm — trừ nguyên tử `stock >= qty` khi tạo Order
- Đặt hàng → **trừ stock ngay** (reserve)
- **1 lần checkout = 1 Checkout + N Order** (mỗi người bán 1 Order) · **1 payment link PayOS** (`orderCode = payosOrderCode`)
- Người mua hủy thanh toán PayOS / hết hạn 30 phút → **tất cả Order con** `cancelled` + **rollback stock**
- Seller chỉ sửa SP & xử lý đơn **của mình**; Seller **không mua SP của chính mình**
- Admin block SP vi phạm; ban user → block toàn bộ SP của user đó
- Guest cart: **localStorage** (không lưu DB)
- Ảnh sản phẩm: **Cloudinary**, tối đa 5 ảnh

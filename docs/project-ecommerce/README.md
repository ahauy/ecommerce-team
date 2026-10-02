# 📚 Tài liệu Dự án Ecommerce

> **Stack:** NestJS · MongoDB · Frontend Template · VNPay · Cloudinary  
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
| **Guest**    | Xem SP · Tìm kiếm · Checkout không cần tài khoản |
| **Customer** | Mọi quyền Guest · Cart DB · Lịch sử đơn hàng     |
| **Admin**    | Quản lý User · Category · Product · Order        |

### Order State Machine

```
pending → confirmed (VNPay auto) → shipping → delivered
       ↘ cancelled (fail/admin)  → refunded
```

### Key Business Rules

- `stock` không được âm — validate khi tạo Order
- Đặt hàng → **trừ stock ngay** (reserve)
- VNPay callback thất bại → **rollback stock** + `cancelled`
- Guest cart: **localStorage** (không lưu DB)
- Ảnh sản phẩm: **Cloudinary**, tối đa 5 ảnh

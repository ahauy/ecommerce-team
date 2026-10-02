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

| Term                  | Short definition                                              | Notes                                    |
| --------------------- | ------------------------------------------------------------- | ---------------------------------------- |
| **Guest**             | User chưa đăng nhập                                           | Cart lưu localStorage                    |
| **Customer**          | User đã đăng nhập, role=customer                              | Cart lưu DB                              |
| **Admin**             | User role=admin                                               | Quản lý toàn bộ hệ thống                 |
| **SP**                | Sản phẩm (Product)                                            | Viết tắt dùng trong comment              |
| **stock**             | Số lượng tồn kho của 1 SP                                     | Trừ ngay khi tạo Order                   |
| **orderCode**         | Mã đơn hàng tự generate                                       | e.g. `ORD-20241002-ABCD`                 |
| **snapshot**          | Dữ liệu SP embed vào Order                                    | Không bị thay đổi khi Admin sửa SP sau   |
| **reserve inventory** | Trừ stock ngay khi tạo Order pending                          | Rollback nếu thanh toán thất bại         |
| **merge cart**        | Merge localStorage cart vào DB cart khi đăng nhập             |                                          |
| **authStore**         | Zustand store lưu user + tokens                               | `apps/frontend/src/stores/auth.store.ts` |
| **cartStore**         | Zustand store quản lý cart state                              | `apps/frontend/src/stores/cart.store.ts` |
| **IPN**               | Instant Payment Notification — VNPay webhook server-to-server | Verify HMAC-SHA512                       |
| **soft delete**       | Ẩn SP bằng `isActive=false`, không xóa khỏi DB                |                                          |
| **slug**              | URL-friendly version của name                                 | e.g. "iPhone 15 Pro" → "iphone-15-pro"   |

## Where to Look

- **Scan codebase** to identify existing implicit terms or jargon not yet cataloged here → add them to the table.
- **`adr/`** for load-bearing architectural decisions that require extensive rationale (link from the glossary where applicable).
- **`.specify/features/<slug>/`** for full business rules and finite state machines (this file is an index of ubiquitous language, not a substitute for formal SRS documents).

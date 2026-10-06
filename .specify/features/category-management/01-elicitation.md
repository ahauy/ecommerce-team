# Elicitation Record: Quản lý Category (Admin CRUD) (US-CAT-001)

- **Feature ID:** `US-CAT-001`
- **Feature Slug:** `category-management`
- **Classification:** Bounded Task (Effort: M)
- **Protocol:** Bounded Task Pipeline (Stages 1 → 2 → 4 → 5 → 6 → 7 → 8)
- **Status:** Interview Complete — Decisions Confirmed & Signed Off

---

## 1. Stage 1 — Intake Validation

### 1.1 Technical & Business Context Alignment
- **Roadmap Reference:** Sprint 1 Core Foundation (`US-CAT-001`), Priority: Must-Have (P0).
- **Dependencies:** Depends on `US-AUTH-001` (Admin authentication, JWT, `RolesGuard`). Blocks `US-PRD-001` (Product management).
- **Tech Stack:**
  - Backend: NestJS 10, Mongoose ODM, MongoDB, `class-validator`, `RolesGuard`.
  - Frontend: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query.
  - Design Authority: `frontend/DESIGN.md` & Stitch screens (`projects/6249429078653284294/screens/920a53a998bd4e8e8b0b16ec16a08793`, `4ff01870d2a9498b8f48f72196b0383c`, `b3ff9a13af8b42c7b154bc1730ab9471`).

### 1.2 Intake Signals Verification
- **Domain Entities:** 1 (`Category`: `name`, `slug`, `description`, `imageUrl`, `isActive`, timestamps).
- **Database Schema:** New `categories` collection in MongoDB with unique indexes on `name` and `slug`.
- **UI Touchpoints:** 2 flows:
  1. Admin Category Management (`/admin/categories`): List table, create dialog, edit dialog, delete confirmation dialog.
  2. Public Storefront Navigation: Header nav / sidebar drawer for active category filtering.
- **Affected Roles:** Admin (Full CRUD), Public / Customer / Seller (Read active categories).
- **Classification Verdict:** Confirmed **Bounded Task (Effort: M)**.

---

## 2. Stage 2 — Stakeholder Interview Decisions

### DEC-CAT-01: Flat Category Taxonomy
- **Decision:** Category catalog is strictly single-level (flat list, no `parentId` nesting).
- **Rationale:** Aligns with Sprint 1 MVP scope, matches roadmap data model (`name, slug, description, imageUrl, isActive`), and avoids recursive query overhead.

### DEC-CAT-02: Slug Generation & Immutability
- **Decision:** `slug` is auto-generated upon category creation (`POST`) from `name` by stripping Vietnamese diacritics and converting to kebab-case (e.g., "Thời Trang Nam" → `thoi-trang-nam`). On rename/update via `PATCH /api/v1/categories/:id`, `slug` is **immutable** (remains unchanged).
- **Rationale:** Protects permalinks, SEO indexing, and upcoming product links from breaking when an admin corrects a typographical error in category name.

### DEC-CAT-03: Hard Delete on Zero Products
- **Decision:** `DELETE /api/v1/categories/:id` performs a physical hard delete (`deleteOne`) from MongoDB if and only if zero products are associated with the category.
- **Rationale:** Enables true administrative data cleanup of obsolete or erroneously created unused categories without accumulating database dead-weight.

### DEC-CAT-04: Visibility Toggled via `isActive`
- **Decision:** Deactivation / hiding a category from public store is managed via `PATCH /api/v1/categories/:id` with `{ isActive: false }`. Public storefront `GET /api/v1/categories` returns only categories where `{ isActive: true }`. Admin category list returns all categories (both active and inactive).
- **Rationale:** Clear separation of concerns between operational visibility (soft toggle) and data deletion (hard purge when unreferenced).

### DEC-CAT-05: Strict Referential Integrity on Delete
- **Decision:** Before executing deletion, backend queries `Product` collection for any product referencing `category = categoryId` across all statuses (active, draft, or blocked). If product count > 0, deletion is blocked and throws HTTP 400 Bad Request with message: `"Không thể xóa danh mục đang có {count} sản phẩm liên kết"`.
- **Rationale:** Enforces strict referential integrity across the marketplace, preventing orphaned products.

---

## 3. Assumptions Register (ASM)

| ID | Topic | Confirmed Assumption | Source |
|---|---|---|---|
| `ASM-CAT-001-001` | Hierarchy | Taxonomy is flat 1-level; no `parentId` or recursive nesting | Interview Q1 (Opt A) |
| `ASM-CAT-001-002` | Slug Immutability | `slug` auto-generated on creation from `name`; immutable upon name updates | Interview Q1 (Opt A) |
| `ASM-CAT-001-003` | Deletion Policy | Hard delete (`deleteOne`) permitted if and only if referenced product count == 0 | Interview Q2 (Opt A) |
| `ASM-CAT-001-004` | Storefront Visibility | `isActive: false` hides category from public nav without breaking existing product references | Interview Q2 (Opt A) |
| `ASM-CAT-001-005` | Referential Integrity | Delete check counts all products referencing categoryId (any status); blocks with HTTP 400 if count > 0 | Interview Q3 (Opt A) |
| `ASM-CAT-001-006` | Pre-Product Grace | If Product collection is empty or not yet registered, product count returns 0 and delete succeeds | Interview Q3 (Opt A) |
| `ASM-CAT-001-007` | Name Uniqueness | Category `name` is unique case-insensitive; duplicate creates return HTTP 409 Conflict | AC + BR-CAT-002 |
| `ASM-CAT-001-008` | RBAC Isolation | Admin mutations require JWT + `RolesGuard(Role.Admin)`; public GET requires no authentication | AC + BR-CAT-001 |

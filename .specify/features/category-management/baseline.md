# Domain Decision Baseline — US-CAT-001 (category-management)

**Version:** 1.0  
**Status:** SIGNED-OFF v1.0  
**Date:** 2026-10-06  
**Author:** Lead Business Analyst & Domain Architect  
**Approved by:** Stakeholder (User Confirmed)

---

## 1. Scope Summary

- **Feature:** Quản lý Category (Admin CRUD)
- **User Story:** `US-CAT-001`
- **Epic:** EPIC-02: Category & Product Catalog
- **Effort:** M (Bounded Task) | **Context-budget:** single-session
- **Protocol:** Bounded Task Pipeline (Stages 1 → 2 → 4 → 5 → 6 → 7 → 8)
- **Primary Goal:** Provide Admin with complete CRUD management over system-wide categories with auto-slug generation and strict delete protection when products exist, while enabling public visitors to browse active categories for navigation and filtering.

---

## 2. Signed-Off Business Rules (BR-)

| ID | Rule | Description |
|---|---|---|
| **BR-CAT-001** | Admin Role Required | All mutation endpoints (`POST`, `PATCH`, `DELETE`) require authenticated Admin role via `JwtAuthGuard` and `RolesGuard(Role.Admin)`. |
| **BR-CAT-002** | Name Uniqueness & Validation | Category `name` is required, trimmed, 2–50 characters, and unique case-insensitively across the database. Duplicate creates or renames throw HTTP 409 Conflict. |
| **BR-CAT-003** | Auto-Generated Slug | `slug` is automatically generated from `name` upon creation via Vietnamese diacritic transliteration to lower kebab-case. |
| **BR-CAT-004** | Slug Immutability | Category `slug` is immutable: subsequent `PATCH` updates to category `name` NEVER modify `slug`. |
| **BR-CAT-005** | Optional Description | `description` is optional, plain text, maximum 500 characters. |
| **BR-CAT-006** | Optional Image URL | `imageUrl` is optional; if present, must be a valid HTTP/HTTPS URL string. |
| **BR-CAT-007** | Visibility Default | `isActive` defaults to `true` on creation. Can be toggled to `false` via `PATCH` to hide from storefront without deleting. |
| **BR-CAT-008** | Public Read Isolation | Public `GET /api/v1/categories` returns only categories with `isActive = true`. Admin endpoint returns all categories. |
| **BR-CAT-009** | Restrict Delete on Products | `DELETE /api/v1/categories/:id` validates zero product references in `Product` collection across all product statuses. |
| **BR-CAT-010** | Delete Conflict Error | If referenced product count > 0, `DELETE` throws HTTP 400 Bad Request with: `"Không thể xóa danh mục đang có {count} sản phẩm liên kết"`. |

---

## 3. Assumptions Register (ASM-)

| ID | Assumption | Validation Source |
|---|---|---|
| `ASM-CAT-001-001` | Flat 1-level category taxonomy; no `parentId` nesting in Sprint 1 | Stakeholder Confirmed (Opt A) |
| `ASM-CAT-001-002` | `slug` auto-generated on creation from `name`; immutable upon name updates | Stakeholder Confirmed (Opt A) |
| `ASM-CAT-001-003` | Hard delete (`deleteOne`) permitted if and only if referenced product count == 0 | Stakeholder Confirmed (Opt A) |
| `ASM-CAT-001-004` | `isActive: false` hides category from public nav without breaking existing product references | Stakeholder Confirmed (Opt A) |
| `ASM-CAT-001-005` | Delete check counts all products referencing categoryId (any status); blocks with HTTP 400 if count > 0 | Stakeholder Confirmed (Opt A) |
| `ASM-CAT-001-006` | If Product collection is empty or not yet registered, product count returns 0 and delete succeeds | Stakeholder Confirmed (Opt A) |
| `ASM-CAT-001-007` | Category `name` is unique case-insensitive; duplicate creates return HTTP 409 Conflict | Roadmap AC + BR-CAT-002 |
| `ASM-CAT-001-008` | Admin mutations require JWT + `RolesGuard(Role.Admin)`; public GET requires no authentication | Roadmap AC + BR-CAT-001 |

---

## 4. Won't-Have (Explicit Scope Fence)

- Multi-level hierarchical category trees (parent-child subcategories / `parentId`).
- Manual custom editing of `slug` in Admin UI.
- Direct multipart binary upload within Category creation (uses existing upload endpoint / Cloudinary URL string).
- Cascade deletion of products when category is deleted.
- Client-side category reordering / drag-and-drop hierarchy sorting.

---

## 5. Technical Contract & Architecture Summary

### 5.1 Endpoints
- `GET /api/v1/categories` — Public, returns active categories (`isActive: true`).
- `GET /api/v1/admin/categories` — Admin, returns all categories with `productCount`.
- `POST /api/v1/categories` — Admin, creates category with auto-slug.
- `PATCH /api/v1/categories/:id` — Admin, updates name/description/image/isActive.
- `DELETE /api/v1/categories/:id` — Admin, hard deletes if 0 products; 400 if > 0 products.

### 5.2 Schema & Database
- Collection: `categories`
- Schema Fields: `name` (unique vi), `slug` (unique), `description`, `imageUrl`, `isActive`, `createdAt`, `updatedAt`.
- Cross-collection constraint: `Product.countDocuments({ category: id }) == 0`.

### 5.3 UI & Stitch Screen References
- Design Authority: `frontend/DESIGN.md` (Pill buttons `rounded-full`, hairline borders, cream/white canvas).
- `projects/6249429078653284294/screens/920a53a998bd4e8e8b0b16ec16a08793` ("Admin danh mục #1" - Category List).
- `projects/6249429078653284294/screens/4ff01870d2a9498b8f48f72196b0383c` ("Admin danh mục #2" - Delete Warning Modal).
- `projects/6249429078653284294/screens/b3ff9a13af8b42c7b154bc1730ab9471` ("Admin danh mục #3" - Category Edit Modal).

---

## 6. Sign-Off & Handover Authorization

- **Phase 1 BA & Specification Status:** **COMPLETED & SIGNED-OFF**
- **Zero-Code Rule Enforced:** Yes (Zero application code or migrations written in Phase 1).
- **Next Step:** Handover to Phase 2 (Architecture & Implementation) for module scaffolding, schema creation, service unit tests, controllers, and frontend views.

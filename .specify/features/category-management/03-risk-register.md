# Risk Register & Contradiction Analysis — US-CAT-001 (category-management)

- **Feature ID:** `US-CAT-001`
- **Feature Slug:** `category-management`
- **Stage:** Stage 5 — Risk Scanner & Contradiction Analysis Light (Bounded Task)

---

## 1. Risk Register

| Risk ID | Risk Description | Severity | Likelihood | Mitigation Strategy | Owner |
|---|---|:---:|:---:|---|:---:|
| **RISK-CAT-001** | **Orphaned Products via Partial Status Filtering**: If the deletion check only queries active products (`isActive: true`), products in draft, archived, or blocked states could be orphaned if their category is deleted. | High | Medium | Query `Product.countDocuments({ category: categoryId })` across **all** product states with no status filters. Any associated record blocks deletion. | Backend |
| **RISK-CAT-002** | **Pre-Product Model Dependency**: `US-CAT-001` is implemented before `US-PRD-001`. Injecting `ProductModel` into `CategoriesModule` could fail if the Product schema is not yet registered. | High | High | Define a lightweight check: use Mongoose `connection.models['Product']` or a safe dynamic count helper that returns 0 if the `Product` collection is not yet instantiated. | Backend |
| **RISK-CAT-003** | **Vietnamese Diacritics Slug Collisions**: Two distinct category names with different tonal marks (e.g. "Thời Trang" and "Thới Tràng") generate identical base slugs (`thoi-trang`). | Medium | Low | Since `name` is unique case-insensitively, identical names are prevented by `BR-CAT-002`. For tone collisions, slug generator appends incrementing integer (`-2`, `-3`) before insertion if slug already exists. | Backend |
| **RISK-CAT-004** | **SEO & Permalinks Breakage on Rename**: If changing a category name modifies its slug, existing public URLs, search engine indices, and shared links would result in 404s. | Medium | High | Enforced **DEC-CAT-02 / BR-CAT-004**: Slug is immutable upon creation. `PATCH /api/v1/categories/:id` updates display `name`, `description`, `imageUrl`, and `isActive`, but never regenerates `slug`. | Architecture |
| **RISK-CAT-005** | **Frontend Stale Navigation Cache**: Public users or sellers may see deactivated categories if client cache does not invalidate upon Admin mutations. | Low | Medium | TanStack Query invalidates `['categories']` and `['admin', 'categories']` query keys on successful mutations. | Frontend |

---

## 2. MoSCoW Feature Prioritization

### Must Have (P0 — Sprint 1 Baseline)
- `POST /api/v1/categories` (Admin) with automatic Vietnamese slugification and 409 Conflict duplicate name detection.
- `GET /api/v1/categories` (Public) returning only `{ isActive: true }` categories for storefront navigation.
- `GET /api/v1/admin/categories` (Admin) returning all categories with active/inactive indicators.
- `PATCH /api/v1/categories/:id` (Admin) updating name, description, imageUrl, and isActive without altering slug.
- `DELETE /api/v1/categories/:id` (Admin) with strict zero-product referential integrity validation (rejecting with 400 Bad Request if count > 0).
- Frontend Admin Category Management: List table, Create modal/drawer, Edit modal, and Delete confirmation dialog complying with `frontend/DESIGN.md` (pill buttons, hairline borders, cream/white canvas).
- Frontend Public CategoryNav/Sidebar drawer for discovery.

### Should Have (P1)
- Category thumbnail preview in Admin table and public nav.
- Local search/filter by category name in Admin table.
- Loading skeleton states and toast notifications on success/error.

### Could Have (P2)
- Display badge showing total referenced product count in Admin category list.
- Custom sort ordering / priority index.

### Won't Have (MVP Out of Scope)
- Multi-tier recursive category tree (subcategories / parentId) — Deferred to future sprint.
- Manual custom slug override in create/edit form.
- Direct image file upload endpoint within category creation (uses Cloudinary URL string or existing upload service).

---

## 3. Contradiction & Consistency Analysis

1. **Intake vs Roadmap Alignment:**
   - Both specify single-entity category management with 2 roles (Admin, Public/Customer).
   - Roadmap Effort: M matches Bounded Task protocol.
   - No scope leakage into product attributes or inventory.

2. **Schema & Architecture Consistency:**
   - Mongoose schema in `02-domain-model.md` defines `name`, `slug`, `description`, `imageUrl`, and `isActive` matching `00-intake.md`.
   - Index collation `{ locale: 'vi', strength: 2 }` prevents duplicate names differing only by case or spacing.

3. **Design System & Stitch Screen Compliance:**
   - Screen `projects/6249429078653284294/screens/920a53a998bd4e8e8b0b16ec16a08793`: Admin list view with pill buttons, status badges (`Hoạt động` / `Ẩn`), search bar, and action buttons.
   - Screen `projects/6249429078653284294/screens/4ff01870d2a9498b8f48f72196b0383c`: Delete modal with alert warning when products exist, blocking accidental deletion.
   - Screen `projects/6249429078653284294/screens/b3ff9a13af8b42c7b154bc1730ab9471`: Edit modal matching `frontend/DESIGN.md` input fields and pill action buttons.

**Conclusion:** Zero contradictions found across specifications, design system, and technical constraints.

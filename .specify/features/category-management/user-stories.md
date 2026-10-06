# User Stories — US-CAT-001 (category-management)

- **Feature ID:** `US-CAT-001`
- **Feature Slug:** `category-management`
- **Stage:** Stage 6 — User Stories & Acceptance Scenarios

---

### User Story 1 — Public Category Browsing (Priority: P1)

**Story:**  
As a public visitor or shopper,  
I want to view the list of active categories on the marketplace header and navigation sidebar,  
So that I can easily browse products organized by relevant categories.

**Why this priority:**  
Core marketplace discovery. Without category navigation, shoppers cannot filter or discover products by classification.

**Independent Test:**  
Can be tested independently by querying `GET /api/v1/categories` and verifying only `isActive: true` categories are returned, and verifying the `CategoryNav` component renders pills/links for each active item.

**Acceptance Scenarios:**
1. **Given** the database contains 3 active categories and 1 inactive category,  
   **When** a guest user navigates to the homepage or requests `GET /api/v1/categories`,  
   **Then** the response status is 200 OK containing exactly the 3 active categories, and the inactive category is omitted.
2. **Given** no active categories exist in the database,  
   **When** `GET /api/v1/categories` is requested,  
   **Then** the response status is 200 OK with an empty array `[]`, and the navigation UI gracefully renders without breaking.

---

### User Story 2 — Admin Category Creation & Auto-Slug (Priority: P1)

**Story:**  
As an Administrator,  
I want to create a new category with a name, description, and optional image URL,  
So that sellers have verified taxonomies to assign to their products.

**Why this priority:**  
Precursor to `US-PRD-001`. Products cannot be categorized or created until at least one category exists.

**Independent Test:**  
Log in as Admin, send `POST /api/v1/categories` with valid data, verify 201 Created response with auto-generated slug, and verify duplicate name returns 409 Conflict.

**Acceptance Scenarios:**
1. **Given** an authenticated Admin user,  
   **When** they submit `POST /api/v1/categories` with `name: "Thiết Bị Điện Tử"` and optional `description: "Đồ gia dụng và công nghệ"`,  
   **Then** the backend returns 201 Created with `slug: "thiet-bi-dien-tu"`, `isActive: true`, and the record is persisted.
2. **Given** a category named `"Thời Trang Nam"` already exists,  
   **When** an Admin submits `POST /api/v1/categories` with `name: "thời trang nam"` (case-insensitive collision),  
   **Then** the backend returns 409 Conflict with message `"Tên danh mục đã tồn tại"`.
3. **Given** an unauthenticated user or customer without Admin role,  
   **When** they attempt `POST /api/v1/categories`,  
   **Then** the backend returns 401 Unauthorized or 403 Forbidden.
4. **Given** invalid payload (e.g. `name` with length < 2 or > 50 characters, or invalid `imageUrl`),  
   **When** Admin submits `POST /api/v1/categories`,  
   **Then** the backend returns 400 Bad Request with field-level validation error messages.

---

### User Story 3 — Admin Category Modification & Visibility Toggle (Priority: P1)

**Story:**  
As an Administrator,  
I want to update an existing category's details (name, description, imageUrl, isActive) while keeping its slug immutable,  
So that I can correct errors or hide seasonal categories without breaking existing product permalinks.

**Why this priority:**  
Essential for catalog maintenance and seasonal merchandising without destructive data loss.

**Independent Test:**  
Send `PATCH /api/v1/categories/:id` with updated name and `isActive: false`, verify status 200 OK, verify slug remains unchanged, and confirm the category is no longer returned in public `GET /api/v1/categories`.

**Acceptance Scenarios:**
1. **Given** an existing category with `name: "Sách & Báo"`, `slug: "sach-bao"`, and `isActive: true`,  
   **When** Admin sends `PATCH /api/v1/categories/:id` with `name: "Sách & Văn Phòng Phẩm"`,  
   **Then** the category's name is updated, but `slug` remains `"sach-bao"` (immutable), and status 200 OK is returned.
2. **Given** an active category,  
   **When** Admin sends `PATCH /api/v1/categories/:id` with `isActive: false`,  
   **Then** `isActive` becomes `false`; the category disappears from public `GET /api/v1/categories`, but remains visible in Admin category list `GET /api/v1/admin/categories`.
3. **Given** Admin updates category name to a name that already belongs to another existing category,  
   **When** `PATCH /api/v1/categories/:id` is submitted,  
   **Then** the backend returns 409 Conflict with `"Tên danh mục đã tồn tại"`.

---

### User Story 4 — Admin Category Deletion & Referential Integrity (Priority: P1)

**Story:**  
As an Administrator,  
I want to permanently delete unused categories while being strictly prevented from deleting categories associated with any products,  
So that database clutter is eliminated safely without producing orphaned products.

**Why this priority:**  
Enforces marketplace referential integrity and prevents catastrophic data corruption in the product catalog.

**Independent Test:**  
Attempt deletion of a category linked to products (verify 400 Bad Request rejection with localized count message). Then delete an unreferenced category (verify 200 OK / 204 and complete database purge).

**Acceptance Scenarios:**
1. **Given** a category that is referenced by 5 products (regardless of product status),  
   **When** Admin submits `DELETE /api/v1/categories/:id`,  
   **Then** the request is rejected with HTTP 400 Bad Request, returning:  
   `{"statusCode": 400, "message": "Không thể xóa danh mục đang có 5 sản phẩm liên kết", "error": "Bad Request"}`, and the category remains untouched.
2. **Given** a category with 0 referenced products,  
   **When** Admin submits `DELETE /api/v1/categories/:id` and confirms in the dialog,  
   **Then** the backend permanently deletes the document from MongoDB, returning 200 OK (or 204 No Content), and subsequent `GET /api/v1/categories/:id` returns 404 Not Found.
3. **Given** a non-existent category ID (valid MongoDB ObjectId but not in DB),  
   **When** Admin submits `DELETE /api/v1/categories/:id`,  
   **Then** the backend returns 404 Not Found with `"Không tìm thấy danh mục"`.

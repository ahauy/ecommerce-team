# Feature Specification: Quản lý Category (Admin CRUD) (US-CAT-001)

- **Feature ID:** `US-CAT-001`
- **Slug:** `category-management`
- **Feature Branch:** `feat/category-management`
- **Status:** Specified & Sign-Off Ready
- **Single Source of Truth (Design):** `frontend/DESIGN.md` & Stitch screens (`projects/6249429078653284294`)

---

## 1. REST API Contract

### 1.1 `GET /api/v1/categories` (Public Storefront)
- **Description:** Retrieve list of all currently active categories for public navigation and product filtering.
- **Auth:** Public (No Bearer token required)
- **Response 200 OK:**
```json
[
  {
    "_id": "6701a2b3c4d5e6f7a8b9c0d1",
    "name": "Thiết Bị Điện Tử",
    "slug": "thiet-bi-dien-tu",
    "description": "Điện thoại, máy tính bảng và phụ kiện",
    "imageUrl": "https://res.cloudinary.com/.../electronics.png",
    "isActive": true,
    "createdAt": "2026-10-06T00:00:00.000Z",
    "updatedAt": "2026-10-06T00:00:00.000Z"
  }
]
```

---

### 1.2 `GET /api/v1/admin/categories` (Admin Catalog)
- **Description:** Retrieve all categories (both active and inactive) for administrative management.
- **Auth:** Bearer JWT + `RolesGuard(Role.Admin)`
- **Response 200 OK:**
```json
[
  {
    "_id": "6701a2b3c4d5e6f7a8b9c0d1",
    "name": "Thiết Bị Điện Tử",
    "slug": "thiet-bi-dien-tu",
    "description": "Điện thoại, máy tính bảng và phụ kiện",
    "imageUrl": "https://res.cloudinary.com/.../electronics.png",
    "isActive": true,
    "productCount": 15,
    "createdAt": "2026-10-06T00:00:00.000Z",
    "updatedAt": "2026-10-06T00:00:00.000Z"
  }
]
```

---

### 1.3 `POST /api/v1/categories` (Admin Create Category)
- **Description:** Create a new category. Backend automatically generates `slug` from `name`.
- **Auth:** Bearer JWT + `RolesGuard(Role.Admin)`
- **Request Body (`CreateCategoryDto`):**
```json
{
  "name": "Thời Trang Nam",
  "description": "Quần áo, giày dép phụ kiện nam",
  "imageUrl": "https://res.cloudinary.com/.../mens-fashion.png",
  "isActive": true
}
```
- **Validation Rules:**
  - `name`: String, required, min 2, max 50 chars, trimmed.
  - `description`: String, optional, max 500 chars.
  - `imageUrl`: String, optional, valid URL format.
  - `isActive`: Boolean, optional, default `true`.
- **Response 201 Created:** Returns newly created Category document.
- **Error Responses:**
  - `400 Bad Request`: Payload validation failed.
  - `401 Unauthorized`: Missing or invalid token.
  - `403 Forbidden`: User does not hold Admin role.
  - `409 Conflict`: `{"statusCode": 409, "message": "Tên danh mục đã tồn tại", "error": "Conflict"}`.

---

### 1.4 `PATCH /api/v1/categories/:id` (Admin Update Category)
- **Description:** Update category name, description, image, or active visibility. Slug remains immutable.
- **Auth:** Bearer JWT + `RolesGuard(Role.Admin)`
- **Path Param:** `:id` (MongoDB ObjectId)
- **Request Body (`UpdateCategoryDto`):**
```json
{
  "name": "Thời Trang Nam & Phụ Kiện",
  "description": "Cập nhật mô tả mới",
  "imageUrl": "https://res.cloudinary.com/.../mens-fashion-v2.png",
  "isActive": false
}
```
- **Response 200 OK:** Returns updated Category document with unchanged `slug`.
- **Error Responses:**
  - `400 Bad Request`: Invalid ObjectId or validation errors.
  - `404 Not Found`: Category not found.
  - `409 Conflict`: New name collides with another existing category.

---

### 1.5 `DELETE /api/v1/categories/:id` (Admin Delete Category)
- **Description:** Permanently delete category if zero products are referencing it.
- **Auth:** Bearer JWT + `RolesGuard(Role.Admin)`
- **Path Param:** `:id` (MongoDB ObjectId)
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Xóa danh mục thành công"
}
```
- **Error Responses:**
  - `400 Bad Request`: If products reference this category:
  ```json
  {
    "statusCode": 400,
    "message": "Không thể xóa danh mục đang có 8 sản phẩm liên kết",
    "error": "Bad Request"
  }
  ```
  - `404 Not Found`: Category not found.

---

## 2. Vietnamese Slug Transliteration Algorithm

The backend implements a dedicated transliteration helper (`slugify`):
1. Converts unicode string using NFD normalization (`normalize("NFD")`).
2. Strips combining diacritical marks (`replace(/[\u0300-\u036f]/g, "")`).
3. Replaces Vietnamese specific characters (`đ`/`Đ` → `d`).
4. Replaces special characters and consecutive spaces with a single hyphen (`-`).
5. Trims leading and trailing hyphens.
6. Converts to lowercase.

---

## 3. Frontend & Stitch Design System Specifications

### 3.1 Screen Mappings
- **Admin Category Management:** Stitch screen `projects/6249429078653284294/screens/920a53a998bd4e8e8b0b16ec16a08793`
  - URL Route: `/admin/categories`
  - Features: Header with title, pill button "+ Thêm danh mục", search input, data table showing: Image/Icon, Tên danh mục, Slug, Số sản phẩm, Trạng thái (Pill badge: `Hoạt động` - `bg-aloe-10` / `Ẩn` - `bg-shade-30`), Thao tác (Edit, Delete).
- **Admin Delete Category Warning Modal:** Stitch screen `projects/6249429078653284294/screens/4ff01870d2a9498b8f48f72196b0383c`
  - When referenced products > 0: Modal displays warning alert: "Không thể xóa danh mục này vì đang có X sản phẩm liên kết. Vui lòng chuyển sản phẩm sang danh mục khác hoặc ẩn danh mục thay vì xóa." Confirm button is disabled or converts to "Ẩn danh mục".
- **Admin Category Form Modal (Create/Edit):** Stitch screen `projects/6249429078653284294/screens/b3ff9a13af8b42c7b154bc1730ab9471`
  - Fields: Tên danh mục (input with live preview), Mô tả (textarea), URL Ảnh/Icon (input with image preview), Trạng thái hiển thị (Switch toggle).

### 3.2 UI Design Token Compliance (`frontend/DESIGN.md`)
- **Pill Buttons:** All action buttons (`Button`) MUST use `rounded-full` class.
- **Canvas:** Transactional cream/white canvas (`bg-white` / `bg-canvas-cream`).
- **Hairlines:** 1px borders (`border-hairline-light` / `border-black/10`).
- **Typography:** Display weights 330-500, Inter body font with `ss03` font feature enabled.
- **Anti-AI-Slop:** No generic gradients, no heavy glassmorphism, no rounded rectangular buttons.

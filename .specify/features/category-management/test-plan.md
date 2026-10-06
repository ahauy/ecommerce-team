# Test Plan — US-CAT-001 (category-management)

- **Feature ID:** `US-CAT-001`
- **Slug:** `category-management`
- **Target Coverage:** > 90% service unit tests, 100% controller authorization tests, component smoke tests

---

## 1. Test Case Traceability Matrix

| TC ID | Requirement / Scenario | Test Type | Layer | Target Assertions | Priority |
|---|---|---|---|---|:---:|
| **TC-CAT-001** | Public category list returns only active categories | Unit / Controller | Backend | `GET /api/v1/categories` returns array with `isActive = true` only. Inactive excluded. | P0 |
| **TC-CAT-002** | Admin gets full category list (active and inactive) | Unit / Controller | Backend | `GET /api/v1/admin/categories` returns all categories with `productCount`. | P0 |
| **TC-CAT-003** | Admin creates category successfully with auto-slug | Unit / Controller | Backend | `POST /api/v1/categories` with valid name generates correct kebab-case slug and returns 201. | P0 |
| **TC-CAT-004** | Duplicate category name rejects with 409 Conflict | Unit / Controller | Backend | Attempting to create existing name (case-insensitive) throws `ConflictException(409)`. | P0 |
| **TC-CAT-005** | Category creation validation errors | DTO Unit | Backend | `CreateCategoryDto` rejects name < 2 chars, > 50 chars, or invalid image URL. | P0 |
| **TC-CAT-006** | Admin updates category details; slug remains immutable | Unit / Controller | Backend | `PATCH /api/v1/categories/:id` updates name/description/isActive; `slug` does not change. | P0 |
| **TC-CAT-007** | Admin renames category to an existing name | Unit / Controller | Backend | `PATCH` with colliding name throws `ConflictException(409)`. | P0 |
| **TC-CAT-008** | Admin deletes category when product count == 0 | Unit / Controller | Backend | `DELETE /api/v1/categories/:id` purges record from DB and returns 200 OK. | P0 |
| **TC-CAT-009** | Admin delete blocked when product count > 0 | Unit / Controller | Backend | `DELETE /api/v1/categories/:id` throws `BadRequestException(400)` with message containing product count. | P0 |
| **TC-CAT-010** | Non-admin / guest blocked on mutations | Security Guard | Backend | `POST`, `PATCH`, `DELETE` return 401 (guest) or 403 (customer). | P0 |
| **TC-CAT-011** | Vietnamese diacritics slug transliteration | Unit Helper | Backend | Helper correctly strips accents: "Thời Trang Nam" → "thoi-trang-nam", "Điện Thoại & Tablet" → "dien-thoai-tablet". | P0 |
| **TC-CAT-012** | Admin Category List component render | Component / UI | Frontend | Renders category table with pill status badges, edit/delete action triggers. | P1 |
| **TC-CAT-013** | Admin Category Form validation & submission | Component / UI | Frontend | Formik/Yup validation, triggers create/update mutation and toast notification. | P1 |
| **TC-CAT-014** | Delete Modal warning display | Component / UI | Frontend | Disables delete or shows alert message when category has linked products. | P1 |
| **TC-CAT-015** | Public CategoryNav storefront rendering | Component / UI | Frontend | Renders category pill links on public header/sidebar without crashing on empty state. | P1 |

---

## 2. Backend Unit Test Specifications

### 2.1 TC-CAT-003: Auto-slug generation on create
```typescript
it('should auto-generate slug from name and save category', async () => {
  const createDto: CreateCategoryDto = {
    name: 'Đồ Gia Dụng',
    description: 'Vật dụng gia đình',
    isActive: true,
  };
  mockCategoryModel.findOne.mockResolvedValue(null);
  mockCategoryModel.create.mockImplementation((doc) => ({
    ...doc,
    _id: 'cat-id-1',
  }));

  const result = await service.create(createDto);
  expect(result.slug).toBe('do-gia-dung');
  expect(result.name).toBe('Đồ Gia Dụng');
});
```

### 2.2 TC-CAT-004: Duplicate name conflict
```typescript
it('should throw ConflictException when category name exists', async () => {
  mockCategoryModel.findOne.mockResolvedValue({ _id: 'cat-1', name: 'Thời Trang' });
  await expect(service.create({ name: 'thời trang' })).rejects.toThrow(ConflictException);
});
```

### 2.3 TC-CAT-006: Immutable slug on rename
```typescript
it('should update name without mutating existing slug', async () => {
  const existing = { _id: 'cat-1', name: 'Cũ', slug: 'slug-cu', save: jest.fn() };
  mockCategoryModel.findById.mockResolvedValue(existing);
  mockCategoryModel.findOne.mockResolvedValue(null);

  await service.update('cat-1', { name: 'Mới' });
  expect(existing.name).toBe('Mới');
  expect(existing.slug).toBe('slug-cu'); // Slug remains unchanged
});
```

### 2.4 TC-CAT-009: Block deletion when products exist
```typescript
it('should throw BadRequestException when category is referenced by products', async () => {
  mockCategoryModel.findById.mockResolvedValue({ _id: 'cat-1' });
  mockProductModel.countDocuments.mockResolvedValue(5);

  await expect(service.remove('cat-1')).rejects.toThrow(
    new BadRequestException('Không thể xóa danh mục đang có 5 sản phẩm liên kết'),
  );
  expect(mockCategoryModel.deleteOne).not.toHaveBeenCalled();
});
```

### 2.5 TC-CAT-008: Hard delete when zero products
```typescript
it('should delete category when zero products are referenced', async () => {
  mockCategoryModel.findById.mockResolvedValue({ _id: 'cat-1' });
  mockProductModel.countDocuments.mockResolvedValue(0);
  mockCategoryModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

  const result = await service.remove('cat-1');
  expect(result).toEqual({ success: true, message: 'Xóa danh mục thành công' });
  expect(mockCategoryModel.deleteOne).toHaveBeenCalledWith({ _id: 'cat-1' });
});
```

---

## 3. Frontend Component & E2E Test Scope

1. **Category Table Smoke Test (`AdminCategoryPage`):**
   - Renders with loading skeleton.
   - Shows rows with category name, slug, status pill badge (`Hoạt động` / `Ẩn`).
   - Clicking "+ Thêm danh mục" opens Create Category dialog.
2. **Category Dialog Validation:**
   - Empty name triggers "Tên danh mục là bắt buộc".
   - Name < 2 characters triggers minlength error.
   - Successful submit invalidates React Query cache and closes modal.
3. **Delete Confirmation Flow:**
   - Clicking Delete opens confirmation modal with category title.
   - If referenced products > 0, shows alert from Stitch screen 2.

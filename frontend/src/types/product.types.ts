/**
 * Types dùng chung cho danh sách & chi tiết sản phẩm công khai (US-PRD-002).
 * Khớp với docs/06-api-contract.md → "Product — /api/v1/products".
 */

export type ProductSortBy = 'price' | 'createdAt' | 'name';
export type ProductSortOrder = 'asc' | 'desc';

/** Query params của `GET /products`. */
export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: ProductSortBy;
  order?: ProductSortOrder;
}

/** Phản hồi phân trang chuẩn: `{ items, total, page, limit, totalPages }`. */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Thẻ sản phẩm hiển thị trong lưới (đã chuẩn hoá từ item của API). */
export interface ProductSummary {
  id: string;
  name: string;
  slug: string | null;
  price: number;
  stock: number;
  /** Ảnh bìa = ảnh đầu tiên (BR-PRD-005). */
  imageUrl: string | null;
  sellerId: string | null;
  shopName: string | null;
}

/** Chi tiết sản phẩm — `GET /products/:id`. */
export interface ProductDetail {
  id: string;
  name: string;
  slug: string | null;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: { id: string; name: string; slug?: string | null } | null;
  seller: { id: string; shopName: string | null };
  isActive: boolean;
  /** Chỉ được trả về cho Owner / Admin. */
  isBlocked: boolean;
  blockReason: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * TypeScript interfaces for Category Management (US-CAT-001)
 * Aligned with backend schema & OpenAPI contract
 */

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Item trả về từ public `GET /categories` (chỉ category đang active) */
export interface PublicCategoryItem {
  _id: any;
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  /** Số SP đang hiển thị — chỉ có khi API trả về; UI tự ẩn nếu thiếu. */
  productCount?: number;
}

export interface AdminCategoryItem extends CategoryItem {
  productCount: number;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface ApiResponseEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  errors?: string[];
}

export interface DeleteCategoryResponse {
  id: string;
}

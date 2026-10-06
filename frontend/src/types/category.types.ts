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
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
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

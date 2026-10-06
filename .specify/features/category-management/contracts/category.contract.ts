/**
 * TypeScript Contracts for Category Management (US-CAT-001)
 * Single Source of Truth for Backend DTOs & Frontend API Services
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

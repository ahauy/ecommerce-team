export interface CategoryResponseDto {
  _id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoryResponseDto extends CategoryResponseDto {
  productCount: number;
}

export interface DeleteCategoryResponseDto {
  success: boolean;
  message: string;
}

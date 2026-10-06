export interface ProductSummaryDto {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: string;
  sellerId: string;
  isActive: boolean;
}

export interface OwnerProductDto extends ProductSummaryDto {
  description: string;
  isBlocked: boolean;
  blockReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetailDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: { id: string; name: string } | null;
  seller: { id: string; shopName: string | null };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isBlocked?: boolean;
  blockReason?: string | null;
}

export interface PaginatedDto<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

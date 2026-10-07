export interface OwnerProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: string;
  categoryName?: string;
  sellerId: string;
  isActive: boolean;
  description: string;
  isBlocked: boolean;
  blockReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MyProductsPaginationResponse {
  items: OwnerProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ProductStatusFilter = 'all' | 'selling' | 'hidden' | 'locked';

export interface MyProductsQueryParams {
  page?: number;
  limit?: number;
}

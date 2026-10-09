export interface AdminProductDto {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  isBlocked: boolean;
  blockReason: string | null;
  category: { id: string; name: string } | null;
  seller: {
    id: string;
    fullName: string;
    email: string;
    shopName: string | null;
    isActive: boolean;
  } | null;
  createdAt: string;
}

export interface PaginatedAdminProductsDto {
  items: AdminProductDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

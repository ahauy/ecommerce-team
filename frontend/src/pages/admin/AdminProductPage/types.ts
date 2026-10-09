export interface AdminProductSeller {
  id: string;
  fullName: string;
  email: string;
  shopName: string | null;
  isActive: boolean;
}

export interface AdminProduct {
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
  seller: AdminProductSeller | null;
  createdAt: string;
}

export interface AdminProductsParams {
  page?: number;
  limit?: number;
  isBlocked?: boolean;
  sellerId?: string;
  search?: string;
}

export interface AdminProductsResult {
  items: AdminProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const SELLER_BANNED_REASON = 'seller_banned';

export interface ProductFormValues {
  name: string;
  categoryId: string;
  description: string;
  price: number | '';
  stock: number | '';
  images: string[];
  isActive: boolean;
}

export interface CreateProductPayload {
  name: string;
  categoryId: string;
  description: string;
  price: number;
  stock: number;
  images?: string[];
}

export interface UpdateProductPayload {
  name?: string;
  categoryId?: string;
  description?: string;
  price?: number;
  stock?: number;
  images?: string[];
  isActive?: boolean;
}

export interface ProductDetailResponse {
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
  isBlocked?: boolean;
  blockReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CartItemStatus =
  'available' | 'exceeds_stock' | 'out_of_stock' | 'unavailable';

export interface CartItemDto {
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    price: number;
    stock: number;
  };
  quantity: number;
  status: CartItemStatus;
  lineTotal: number;
}

export interface CartGroupDto {
  seller: { id: string; shopName: string | null };
  items: CartItemDto[];
  subtotal: number;
}

export interface CartResponseDto {
  groups: CartGroupDto[];
  totalAmount: number;
}

import {
  CancelledBy,
  OrderStatus,
  PaymentStatus,
} from '../schemas/order.schema';

export interface OrderLineItemDto {
  productId: string;
  name: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
}

export interface OrderRecipientDto {
  fullName: string;
  phone: string;
  email: string;
  address: string;
}

export interface OrderDto {
  id: string;
  orderCode: string;
  checkoutCode: string | null;
  buyerId: string;
  seller: { id: string; shopName: string };
  items: OrderLineItemDto[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  recipient: OrderRecipientDto;
  cancelReason: string | null;
  cancelledBy: CancelledBy | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedOrdersDto {
  items: OrderDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

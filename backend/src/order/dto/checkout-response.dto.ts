import { CheckoutStatus } from '../schemas/checkout.schema';
import { OrderStatus } from '../schemas/order.schema';

export interface CreatedOrderDto {
  orderId: string;
  orderCode: string;
  seller: { id: string; shopName: string };
  totalAmount: number;
}

export interface CreateCheckoutResponseDto {
  checkoutId: string;
  checkoutCode: string;
  totalAmount: number;
  expiresAt: string;
  orders: CreatedOrderDto[];
  paymentUrl: string;
}

export interface CheckoutResultOrderDto {
  orderCode: string;
  shopName: string;
  totalAmount: number;
  status: OrderStatus;
}

export interface CheckoutResultDto {
  checkoutCode: string;
  status: CheckoutStatus;
  totalAmount: number;
  expiresAt: string;
  paymentUrl: string | null;
  orders: CheckoutResultOrderDto[];
}

export interface StockShortageDto {
  productId: string;
  name: string;
  available: number;
  requested: number;
}

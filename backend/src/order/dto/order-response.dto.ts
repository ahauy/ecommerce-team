export class ResponseOrderDto {
  checkoutId: string;
  checkoutCode: string;
  totalAmount: number;
  expiresAt: Date;
  orders: OrderItemResponseDto[];
  paymentUrl: string;
}

export class OrderItemResponseDto {
  orderId: string;
  orderCode: string;
  seller: {
    id: string;
    shopName: string;
  };
  totalAmount: number;
}

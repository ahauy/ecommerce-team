import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { Recipient, RecipientSchema } from './checkout.schema';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPING = 'shipping',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

export enum CancelledBy {
  SYSTEM = 'system',
  SELLER = 'seller',
  ADMIN = 'admin',
}

export const PAYMENT_METHOD_PAYOS = 'payos';

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, default: null })
  imageUrl: string | null;

  @Prop({ type: Number, required: true, min: 1 })
  price: number;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true, collection: 'orders' })
export class Order extends Document {
  @Prop({ type: String, required: true, unique: true })
  orderCode: string;

  @Prop({ type: Types.ObjectId, ref: 'Checkout', required: true, index: true })
  checkoutId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId: Types.ObjectId;

  @Prop({ type: RecipientSchema, required: true })
  recipient: Recipient;

  @Prop({ type: String, required: true })
  sellerShopName: string;

  @Prop({
    type: [OrderItemSchema],
    required: true,
    validate: {
      validator: (items: OrderItem[]) => items.length > 0,
      message: 'Đơn hàng phải có ít nhất một sản phẩm',
    },
  })
  items: OrderItem[];

  @Prop({ type: Number, required: true, min: 1 })
  totalAmount: number;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: String, default: PAYMENT_METHOD_PAYOS })
  paymentMethod: string;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Prop({ type: String, default: null })
  cancelReason: string | null;

  @Prop({ type: String, enum: CancelledBy, default: null })
  cancelledBy: CancelledBy | null;

  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ status: 1 }, { name: 'idx_order_status' });
OrderSchema.index(
  { userId: 1, createdAt: -1 },
  { name: 'idx_order_user_created' },
);
OrderSchema.index(
  { sellerId: 1, createdAt: -1 },
  { name: 'idx_order_seller_created' },
);

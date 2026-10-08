import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({
  _id: false,
})
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;
  @Prop({ type: String, required: true })
  name: string;
  @Prop({ type: String })
  imageUrl: string;
  @Prop({ type: Number, required: true })
  price: number;
  @Prop({ type: Number, required: true })
  quantity: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({
  timestamps: true,
  collection: 'orders',
})
export class Order {
  @Prop({ type: String, required: true })
  orderCode: string;
  @Prop({ type: Types.ObjectId, ref: 'Checkout', required: true })
  checkoutId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' })
  sellerId: Types.ObjectId;
  @Prop({ type: Object, required: true })
  recipient: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
  };
  @Prop({ type: String, required: true })
  sellerShopName: string;
  @Prop({
    type: [OrderItemSchema],
    required: true,
    default: [],
    validate: {
      validator: (items: OrderItem[]) => items.length > 0,
      message: 'Đơn hàng phải có ít nhất một sản phẩm',
    },
  })
  items: OrderItem[];
  @Prop({ type: Number, required: true })
  totalAmount: number;
  @Prop({ type: String, required: true })
  status: string;
  @Prop({ type: String, required: true })
  paymentMethod: string;
  @Prop({ type: String, required: true })
  paymentStatus: string;
  @Prop({ type: String })
  cancelReason: string;
  @Prop({ type: String })
  cancelledBy: string;
}
export const OrderSchema = SchemaFactory.createForClass(Order);

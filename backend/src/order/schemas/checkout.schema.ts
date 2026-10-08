import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export enum CheckoutStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Schema({ _id: false })
export class Recipient {
  @Prop({ type: String, required: true, trim: true })
  fullName: string;

  @Prop({ type: String, required: true, trim: true })
  phone: string;

  @Prop({ type: String, required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ type: String, required: true, trim: true })
  address: string;
}

export const RecipientSchema = SchemaFactory.createForClass(Recipient);

export type CheckoutDocument = HydratedDocument<Checkout>;

@Schema({ timestamps: true, collection: 'checkouts' })
export class Checkout extends Document {
  @Prop({ type: String, required: true, unique: true })
  checkoutCode: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: RecipientSchema, required: true })
  recipient: Recipient;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Order' }], default: [] })
  orderIds: Types.ObjectId[];

  @Prop({ type: Number, required: true, min: 1 })
  totalAmount: number;

  @Prop({
    type: String,
    enum: CheckoutStatus,
    default: CheckoutStatus.PENDING,
  })
  status: CheckoutStatus;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  paidAt: Date | null;

  @Prop({ type: Number, required: true, unique: true })
  payosOrderCode: number;

  @Prop({ type: String, default: null })
  paymentLinkId: string | null;

  @Prop({ type: String, default: null })
  checkoutUrl: string | null;

  @Prop({ type: String, default: null })
  payosReference: string | null;

  @Prop({ type: Date, default: null })
  lastSyncedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const CheckoutSchema = SchemaFactory.createForClass(Checkout);

CheckoutSchema.index(
  { status: 1, expiresAt: 1 },
  { name: 'idx_checkout_status_expires' },
);

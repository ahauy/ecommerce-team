import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export enum PaymentSource {
  WEBHOOK = 'webhook',
  SYNC = 'sync',
}

export enum PaymentNote {
  PAID = 'paid',
  ALREADY_PROCESSED = 'already_processed',
  LATE_SUCCESS = 'late_success_after_expiry',
  OVERPAID = 'overpaid',
  UNDERPAID = 'underpaid',
  CHECKOUT_NOT_FOUND = 'checkout_not_found',
  INVALID_SIGNATURE = 'invalid_signature',
  NOT_SUCCESS_CODE = 'not_success_code',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({
  collection: 'payments',
  timestamps: { createdAt: true, updatedAt: false },
})
export class Payment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Checkout', default: null, index: true })
  checkoutId: Types.ObjectId | null;

  @Prop({ type: String, enum: PaymentSource, required: true })
  source: PaymentSource;

  @Prop({ type: Object, default: null })
  payosData: unknown;

  @Prop({ type: Boolean, required: true })
  isValidSignature: boolean;

  @Prop({ type: Boolean, required: true })
  isSuccess: boolean;

  @Prop({ type: String, enum: PaymentNote, default: null })
  note: PaymentNote | null;

  createdAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

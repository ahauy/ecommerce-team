import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export class ShopSubDocument {
  @Prop({ type: String, default: null })
  shopName?: string | null;

  @Prop({ type: String, default: null })
  shopSlug?: string | null;

  @Prop({ type: String, default: null })
  pickupAddress?: string | null;

  @Prop({ type: String, default: null })
  phone?: string | null;

  @Prop({ type: Date, default: null })
  joinedAt?: Date | null;

  @Prop({ type: Boolean, default: false })
  isSetupCompleted?: boolean;
}

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ type: String, default: null })
  phone?: string | null;

  @Prop({ type: String, default: null })
  address?: string | null;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.CUSTOMER,
    index: true,
  })
  role: UserRole;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: String, default: null, select: false })
  refreshToken?: string | null;

  @Prop({ type: ShopSubDocument, default: null })
  shop?: ShopSubDocument | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ 'shop.shopSlug': 1 }, { unique: true, sparse: true });

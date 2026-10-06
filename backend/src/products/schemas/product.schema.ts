import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export const MAX_PRODUCT_IMAGES = 5;
export const MAX_PRODUCT_NAME_LENGTH = 120;

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true, collection: 'products' })
export class Product extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, immutable: true })
  sellerId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: MAX_PRODUCT_NAME_LENGTH,
  })
  name: string;

  @Prop({ type: String, required: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: String, required: true, trim: true })
  description: string;

  @Prop({
    type: Number,
    required: true,
    min: 1,
    validate: { validator: Number.isInteger, message: 'Giá phải là số nguyên' },
  })
  price: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Tồn kho phải là số nguyên',
    },
  })
  stock: number;

  @Prop({
    type: [String],
    default: [],
    validate: {
      validator: (v: string[]) => v.length <= MAX_PRODUCT_IMAGES,
      message: `Tối đa ${MAX_PRODUCT_IMAGES} ảnh cho mỗi sản phẩm`,
    },
  })
  images: string[];

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false })
  isBlocked: boolean;

  @Prop({ type: String, default: null })
  blockReason?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ name: 'text' }, { name: 'text_product_name' });
ProductSchema.index({ slug: 1 }, { unique: true, name: 'uniq_product_slug' });
ProductSchema.index(
  { sellerId: 1, createdAt: -1 },
  { name: 'idx_product_seller' },
);
ProductSchema.index({ categoryId: 1 }, { name: 'idx_product_category' });
ProductSchema.index({ price: 1 }, { name: 'idx_product_price' });
ProductSchema.index(
  { isActive: 1, isBlocked: 1, createdAt: -1 },
  { name: 'idx_product_visible' },
);

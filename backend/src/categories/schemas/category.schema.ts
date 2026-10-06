import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({
  timestamps: true,
  collection: 'categories',
})
export class Category extends Document {
  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  })
  slug: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
    maxlength: 500,
    default: '',
  })
  description?: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
    default: null,
  })
  imageUrl?: string | null;

  @Prop({
    type: Boolean,
    required: true,
    default: true,
  })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Indexes
CategorySchema.index(
  { name: 1 },
  {
    unique: true,
    collation: { locale: 'vi', strength: 2 },
    name: 'uniq_category_name_vi',
  },
);
CategorySchema.index({ slug: 1 }, { unique: true, name: 'uniq_category_slug' });
CategorySchema.index({ isActive: 1 }, { name: 'idx_category_is_active' });

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';
import { escapeRegex } from '../common/utils/escape-regex';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { SELLER_BANNED_REASON } from './admin-users.service';
import {
  AdminProductDto,
  PaginatedAdminProductsDto,
} from './dto/admin-product.dto';
import { AdminProductsQueryDto } from './dto/admin-products-query.dto';

export const PRODUCT_NOT_FOUND = 'Không tìm thấy sản phẩm';
export const ALREADY_BLOCKED = 'Sản phẩm đã bị chặn';
export const NOT_BLOCKED = 'Sản phẩm không bị chặn';
export const RESERVED_REASON =
  'Lý do này dành riêng cho hệ thống, vui lòng nhập lý do khác';
export const SELLER_STILL_BANNED =
  'Người bán đang bị khóa, hãy mở khóa tài khoản người bán để mở lại sản phẩm';

const PRODUCT_FIELDS =
  'name slug price stock images isActive isBlocked blockReason categoryId sellerId createdAt';

interface ProductRecord {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: string[];
  isActive: boolean;
  isBlocked: boolean;
  blockReason?: string | null;
  categoryId: Types.ObjectId;
  sellerId: Types.ObjectId;
  createdAt: Date;
}

interface SellerRecord {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  isActive: boolean;
  shop?: { shopName?: string | null } | null;
}

const uniqueIds = (ids: Types.ObjectId[]) =>
  [...new Set(ids.map((id) => id.toString()))].map(
    (id) => new Types.ObjectId(id),
  );

@Injectable()
export class AdminProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async list(query: AdminProductsQueryDto): Promise<PaginatedAdminProductsDto> {
    const { page, limit, isBlocked, sellerId, search } = query;
    const filter: QueryFilter<ProductDocument> = {};
    if (isBlocked !== undefined) filter.isBlocked = isBlocked;
    if (sellerId) filter.sellerId = new Types.ObjectId(sellerId);
    if (search) filter.name = new RegExp(escapeRegex(search), 'i');

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .select(PRODUCT_FIELDS)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<ProductRecord[]>()
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return {
      items: await this.toDtos(products),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async block(productId: string, reason: string): Promise<AdminProductDto> {
    if (reason === SELLER_BANNED_REASON) {
      throw new BadRequestException(RESERVED_REASON);
    }

    const updated = await this.productModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(productId), isBlocked: false },
        { $set: { isBlocked: true, blockReason: reason } },
        { returnDocument: 'after' },
      )
      .select(PRODUCT_FIELDS)
      .lean<ProductRecord>()
      .exec();

    if (!updated) {
      await this.assertExists(productId);
      throw new BadRequestException(ALREADY_BLOCKED);
    }
    const [dto] = await this.toDtos([updated]);
    return dto;
  }

  async unblock(productId: string): Promise<AdminProductDto> {
    const product = await this.productModel
      .findById(productId)
      .select('isBlocked blockReason sellerId')
      .lean<Pick<ProductRecord, 'isBlocked' | 'blockReason' | 'sellerId'>>()
      .exec();
    if (!product) {
      throw new NotFoundException(PRODUCT_NOT_FOUND);
    }
    if (!product.isBlocked) {
      throw new BadRequestException(NOT_BLOCKED);
    }
    if (product.blockReason === SELLER_BANNED_REASON) {
      const seller = await this.userModel
        .findById(product.sellerId)
        .select('isActive')
        .lean<{ isActive: boolean }>()
        .exec();
      if (seller && !seller.isActive) {
        throw new BadRequestException(SELLER_STILL_BANNED);
      }
    }

    const updated = await this.productModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(productId), isBlocked: true },
        { $set: { isBlocked: false, blockReason: null } },
        { returnDocument: 'after' },
      )
      .select(PRODUCT_FIELDS)
      .lean<ProductRecord>()
      .exec();
    if (!updated) {
      throw new BadRequestException(NOT_BLOCKED);
    }
    const [dto] = await this.toDtos([updated]);
    return dto;
  }

  private async assertExists(productId: string): Promise<void> {
    const exists = await this.productModel.exists({ _id: productId }).exec();
    if (!exists) {
      throw new NotFoundException(PRODUCT_NOT_FOUND);
    }
  }

  private async toDtos(products: ProductRecord[]): Promise<AdminProductDto[]> {
    if (products.length === 0) return [];

    const [categories, sellers] = await Promise.all([
      this.categoryModel
        .find({ _id: { $in: uniqueIds(products.map((p) => p.categoryId)) } })
        .select('name')
        .lean<{ _id: Types.ObjectId; name: string }[]>()
        .exec(),
      this.userModel
        .find({ _id: { $in: uniqueIds(products.map((p) => p.sellerId)) } })
        .select('fullName email isActive shop.shopName')
        .lean<SellerRecord[]>()
        .exec(),
    ]);
    const categoryById = new Map(categories.map((c) => [c._id.toString(), c]));
    const sellerById = new Map(sellers.map((s) => [s._id.toString(), s]));

    return products.map((p) => {
      const category = categoryById.get(p.categoryId.toString());
      const seller = sellerById.get(p.sellerId.toString());
      return {
        id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        price: p.price,
        stock: p.stock,
        imageUrl: p.images[0] ?? null,
        isActive: p.isActive,
        isBlocked: p.isBlocked,
        blockReason: p.blockReason ?? null,
        category: category
          ? { id: category._id.toString(), name: category.name }
          : null,
        seller: seller
          ? {
              id: seller._id.toString(),
              fullName: seller.fullName,
              email: seller.email,
              shopName: seller.shop?.shopName ?? null,
              isActive: seller.isActive,
            }
          : null,
        createdAt: p.createdAt.toISOString(),
      };
    });
  }
}

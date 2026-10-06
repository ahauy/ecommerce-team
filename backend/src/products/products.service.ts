import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, SortOrder, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';
import { slugifyVietnamese } from '../categories/utils/slugify.util';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ListProductsQueryDto,
  PaginationQueryDto,
} from './dto/list-products-query.dto';
import {
  OwnerProductDto,
  PaginatedDto,
  ProductDetailDto,
  ProductSummaryDto,
} from './dto/product-response.dto';

export interface AuthUser {
  id: string;
  role: UserRole;
}

const SLUG_RETRIES = 3;

const toSummary = (p: ProductDocument): ProductSummaryDto => ({
  id: p._id.toString(),
  name: p.name,
  slug: p.slug,
  price: p.price,
  stock: p.stock,
  images: p.images,
  categoryId: p.categoryId.toString(),
  sellerId: p.sellerId.toString(),
  isActive: p.isActive,
});

const toOwner = (p: ProductDocument): OwnerProductDto => ({
  ...toSummary(p),
  description: p.description,
  isBlocked: p.isBlocked,
  blockReason: p.blockReason ?? null,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

const isDuplicateKey = (err: unknown): boolean =>
  (err as { code?: number })?.code === 11000;

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly config: ConfigService,
  ) {}

  async create(
    user: AuthUser,
    dto: CreateProductDto,
  ): Promise<OwnerProductDto> {
    await this.assertShopSetup(user.id);
    this.assertCloudinaryImages(dto.images);
    await this.assertCategoryUsable(dto.categoryId);

    const baseSlug = slugifyVietnamese(dto.name) || 'san-pham';

    for (let attempt = 1; ; attempt++) {
      try {
        const product = await this.productModel.create({
          sellerId: new Types.ObjectId(user.id),
          name: dto.name,
          slug: `${baseSlug}-${randomBytes(3).toString('hex')}`,
          description: dto.description,
          price: dto.price,
          stock: dto.stock,
          images: dto.images ?? [],
          categoryId: new Types.ObjectId(dto.categoryId),
        });
        return toOwner(product);
      } catch (err: unknown) {
        if (isDuplicateKey(err) && attempt < SLUG_RETRIES) continue;
        throw err;
      }
    }
  }

  async findPublic(
    query: ListProductsQueryDto,
  ): Promise<PaginatedDto<ProductSummaryDto>> {
    const { page, limit, search, categoryId, sellerId, minPrice, maxPrice } =
      query;

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      throw new BadRequestException('minPrice không được lớn hơn maxPrice');
    }

    const filter: QueryFilter<ProductDocument> = {
      isActive: true,
      isBlocked: false,
    };
    if (search) filter.$text = { $search: search };
    if (categoryId) filter.categoryId = new Types.ObjectId(categoryId);
    if (sellerId) filter.sellerId = new Types.ObjectId(sellerId);
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {
        ...(minPrice !== undefined && { $gte: minPrice }),
        ...(maxPrice !== undefined && { $lte: maxPrice }),
      };
    }

    const sort: Record<string, SortOrder> = {
      [query.sortBy]: query.order === 'asc' ? 1 : -1,
      _id: 1,
    };

    const { docs, total } = await this.paginate(filter, sort, page, limit);
    return this.page(docs.map(toSummary), total, page, limit);
  }

  async findMine(
    user: AuthUser,
    query: PaginationQueryDto,
  ): Promise<PaginatedDto<OwnerProductDto>> {
    const filter: QueryFilter<ProductDocument> = {
      sellerId: new Types.ObjectId(user.id),
    };
    const { docs, total } = await this.paginate(
      filter,
      { createdAt: -1, _id: 1 },
      query.page,
      query.limit,
    );
    return this.page(docs.map(toOwner), total, query.page, query.limit);
  }

  async findOne(
    id: string,
    viewer?: AuthUser | null,
  ): Promise<ProductDetailDto> {
    const product = await this.productModel
      .findById(id)
      .lean<ProductDocument>()
      .exec();

    const canManage = !!product && !!viewer && this.canManage(product, viewer);
    const visible = !!product && product.isActive && !product.isBlocked;

    if (!product || (!visible && !canManage)) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    const [category, seller] = await Promise.all([
      this.categoryModel
        .findById(product.categoryId)
        .select('name')
        .lean<{ _id: Types.ObjectId; name: string }>()
        .exec(),
      this.userModel
        .findById(product.sellerId)
        .select('shop.shopName')
        .lean<{ shop?: { shopName?: string | null } | null }>()
        .exec(),
    ]);

    return {
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      stock: product.stock,
      images: product.images,
      category: category
        ? { id: category._id.toString(), name: category.name }
        : null,
      seller: {
        id: product.sellerId.toString(),
        shopName: seller?.shop?.shopName ?? null,
      },
      isActive: product.isActive,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      ...(canManage && {
        isBlocked: product.isBlocked,
        blockReason: product.blockReason ?? null,
      }),
    };
  }

  async update(
    id: string,
    user: AuthUser,
    dto: UpdateProductDto,
  ): Promise<OwnerProductDto> {
    const product = await this.loadForWrite(id, user);

    if (dto.isActive === true && product.isBlocked) {
      throw new ForbiddenException(
        'Sản phẩm đang bị khóa bởi quản trị viên, không thể hiển thị lại',
      );
    }

    if (dto.images !== undefined) this.assertCloudinaryImages(dto.images);
    if (dto.categoryId !== undefined) {
      await this.assertCategoryUsable(dto.categoryId);
      product.categoryId = new Types.ObjectId(dto.categoryId);
    }

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.images !== undefined) product.images = dto.images;
    if (dto.isActive !== undefined) product.isActive = dto.isActive;

    await product.save();
    return toOwner(product);
  }

  async remove(
    id: string,
    user: AuthUser,
  ): Promise<{ id: string; isActive: false }> {
    const product = await this.loadForWrite(id, user);
    product.isActive = false;
    await product.save();
    return { id: product._id.toString(), isActive: false };
  }

  private async loadForWrite(
    id: string,
    user: AuthUser,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    if (!this.canManage(product, user)) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác trên sản phẩm này',
      );
    }
    return product;
  }

  private canManage(product: ProductDocument, user: AuthUser): boolean {
    return (
      user.role === UserRole.ADMIN || product.sellerId.toString() === user.id
    );
  }

  private async assertShopSetup(userId: string): Promise<void> {
    const owner = await this.userModel
      .findById(userId)
      .select('shop')
      .lean<{ shop?: { shopName?: string; pickupAddress?: string } | null }>()
      .exec();

    if (!owner?.shop?.shopName || !owner.shop.pickupAddress) {
      throw new ForbiddenException(
        'Vui lòng thiết lập thông tin gian hàng trước khi đăng bán',
      );
    }
  }

  private async assertCategoryUsable(categoryId: string): Promise<void> {
    const category = await this.categoryModel
      .findOne({ _id: categoryId, isActive: true })
      .select('_id')
      .lean()
      .exec();

    if (!category) {
      throw new BadRequestException('Danh mục không tồn tại hoặc đã bị ẩn');
    }
  }

  private assertCloudinaryImages(images?: string[]): void {
    if (!images?.length) return;

    const cloud = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const prefix = `https://res.cloudinary.com/${cloud}/`;
    if (!cloud || images.some((url) => !url.startsWith(prefix))) {
      throw new BadRequestException(
        'Ảnh sản phẩm phải được tải lên từ hệ thống (Cloudinary)',
      );
    }
  }

  private async paginate(
    filter: QueryFilter<ProductDocument>,
    sort: Record<string, SortOrder>,
    page: number,
    limit: number,
  ): Promise<{ docs: ProductDocument[]; total: number }> {
    const [docs, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<ProductDocument[]>()
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);
    return { docs, total };
  }

  private page<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedDto<T> {
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

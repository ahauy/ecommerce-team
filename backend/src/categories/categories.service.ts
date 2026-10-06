import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AdminCategoryResponseDto } from './dto/category-response.dto';
import { slugifyVietnamese } from './utils/slugify.util';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async findActive(): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find({ isActive: true })
      .sort({ name: 1 })
      .collation({ locale: 'vi' })
      .lean<CategoryDocument[]>()
      .exec();
  }

  async findBySlug(slug: string): Promise<CategoryDocument> {
    const category = await this.categoryModel
      .findOne({ slug, isActive: true })
      .lean<CategoryDocument>()
      .exec();

    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    return category;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = slugifyVietnamese(name);
    let slug = baseSlug;
    let counter = 1;

    while (await this.categoryModel.findOne({ slug }).exec()) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    const existing = await this.categoryModel
      .findOne({ name: dto.name })
      .collation({ locale: 'vi', strength: 2 })
      .exec();

    if (existing) {
      throw new ConflictException('Tên danh mục đã tồn tại');
    }

    const slug = await this.generateUniqueSlug(dto.name);

    try {
      return await this.categoryModel.create({
        name: dto.name,
        slug,
        description: dto.description || '',
        imageUrl: dto.imageUrl || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      });
    } catch (err: unknown) {
      if ((err as { code?: number })?.code === 11000) {
        throw new ConflictException('Tên danh mục đã tồn tại');
      }
      throw err;
    }
  }

  async findAllAdmin(): Promise<AdminCategoryResponseDto[]> {
    const categories = await this.categoryModel
      .find()
      .sort({ createdAt: -1 })
      .lean<CategoryDocument[]>()
      .exec();

    const ProductModel = this.connection.models?.Product;

    return Promise.all(
      categories.map(async (cat) => {
        let productCount = 0;
        if (ProductModel) {
          const filterId = cat._id.toString();
          productCount = await ProductModel.countDocuments({
            $or: [
              { category: filterId },
              { categoryId: filterId },
              ...(Types.ObjectId.isValid(filterId)
                ? [
                    { category: new Types.ObjectId(filterId) },
                    { categoryId: new Types.ObjectId(filterId) },
                  ]
                : []),
            ],
          }).exec();
        }

        return {
          _id: cat._id.toString(),
          name: cat.name,
          slug: cat.slug,
          description: cat.description || '',
          imageUrl: cat.imageUrl || null,
          isActive: cat.isActive,
          createdAt: cat.createdAt?.toISOString?.() || String(cat.createdAt),
          updatedAt: cat.updatedAt?.toISOString?.() || String(cat.updatedAt),
          productCount,
        };
      }),
    );
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryDocument> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    if (dto.name && dto.name !== category.name) {
      const collision = await this.categoryModel
        .findOne({ name: dto.name, _id: { $ne: id } })
        .collation({ locale: 'vi', strength: 2 })
        .exec();

      if (collision) {
        throw new ConflictException('Tên danh mục đã tồn tại');
      }
      category.name = dto.name;
    }

    if (dto.description !== undefined) category.description = dto.description;
    if (dto.imageUrl !== undefined) category.imageUrl = dto.imageUrl;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;

    try {
      await category.save();
      return category;
    } catch (err: unknown) {
      if ((err as { code?: number })?.code === 11000) {
        throw new ConflictException('Tên danh mục đã tồn tại');
      }
      throw err;
    }
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    const ProductModel = this.connection.models?.Product;
    if (ProductModel) {
      const count = await ProductModel.countDocuments({
        $or: [
          { category: id },
          { categoryId: id },
          ...(Types.ObjectId.isValid(id)
            ? [
                { category: new Types.ObjectId(id) },
                { categoryId: new Types.ObjectId(id) },
              ]
            : []),
        ],
      }).exec();

      if (count > 0) {
        throw new BadRequestException(
          `Không thể xóa danh mục đang có ${count} sản phẩm liên kết`,
        );
      }
    }

    await this.categoryModel.deleteOne({ _id: id }).exec();
    return { success: true, message: 'Xóa danh mục thành công' };
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, QueryFilter, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { AdminUserDto, PaginatedAdminUsersDto } from './dto/admin-user.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';

export const SELLER_BANNED_REASON = 'seller_banned';
export const USER_NOT_FOUND = 'Người dùng không tồn tại';
export const CANNOT_BAN_SELF = 'Bạn không thể khóa chính tài khoản của mình';

const USER_FIELDS = 'email fullName phone role isActive shop createdAt';

interface UserRecord {
  _id: Types.ObjectId;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  shop?: { shopName?: string | null; shopSlug?: string | null } | null;
  createdAt: Date;
}

export const escapeRegex = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async list(query: AdminUsersQueryDto): Promise<PaginatedAdminUsersDto> {
    const { page, limit, role, isActive, search } = query;
    const filter: QueryFilter<UserDocument> = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive;
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { email: pattern },
        { fullName: pattern },
        { 'shop.shopName': pattern },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select(USER_FIELDS)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<UserRecord[]>()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const productCounts = await this.countProducts(users.map((u) => u._id));

    return {
      items: users.map((u) => ({
        id: u._id.toString(),
        email: u.email,
        fullName: u.fullName,
        phone: u.phone ?? null,
        role: u.role,
        isActive: u.isActive,
        shop: u.shop?.shopName
          ? { shopName: u.shop.shopName, shopSlug: u.shop.shopSlug ?? null }
          : null,
        productCount: productCounts.get(u._id.toString()) ?? 0,
        createdAt: u.createdAt.toISOString(),
      })) satisfies AdminUserDto[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async ban(actorId: string, userId: string): Promise<{ message: string }> {
    if (actorId === userId) {
      throw new BadRequestException(CANNOT_BAN_SELF);
    }

    await this.inTransaction(async (session) => {
      const user = await this.userModel
        .findByIdAndUpdate(
          userId,
          { isActive: false },
          { session, returnDocument: 'after' },
        )
        .exec();
      if (!user) {
        throw new NotFoundException(USER_NOT_FOUND);
      }

      await this.productModel
        .updateMany(
          { sellerId: new Types.ObjectId(userId), isBlocked: false },
          { isBlocked: true, blockReason: SELLER_BANNED_REASON },
          { session },
        )
        .exec();
    });

    return { message: 'Đã khóa tài khoản và chặn gian hàng/sản phẩm' };
  }

  async unban(userId: string): Promise<{ message: string }> {
    await this.inTransaction(async (session) => {
      const user = await this.userModel
        .findByIdAndUpdate(
          userId,
          { isActive: true },
          { session, returnDocument: 'after' },
        )
        .exec();
      if (!user) {
        throw new NotFoundException(USER_NOT_FOUND);
      }

      await this.productModel
        .updateMany(
          {
            sellerId: new Types.ObjectId(userId),
            blockReason: SELLER_BANNED_REASON,
          },
          { isBlocked: false, blockReason: null },
          { session },
        )
        .exec();
    });

    return { message: 'Đã mở khóa tài khoản và khôi phục gian hàng/sản phẩm' };
  }

  private async countProducts(
    sellerIds: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    if (sellerIds.length === 0) return new Map();
    const rows = await this.productModel
      .aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { sellerId: { $in: sellerIds } } },
        { $group: { _id: '$sellerId', count: { $sum: 1 } } },
      ])
      .exec();
    return new Map(rows.map((r) => [r._id.toString(), r.count]));
  }

  private async inTransaction(
    work: (session: ClientSession) => Promise<void>,
  ): Promise<void> {
    const session = await this.userModel.db.startSession();
    try {
      await session.withTransaction(() => work(session));
    } finally {
      await session.endSession();
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { PublicShopResponseDto } from './dto/public-shop.dto';

@Injectable()
export class ShopsService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async getPublicShop(sellerId: string): Promise<PublicShopResponseDto> {
    if (!Types.ObjectId.isValid(sellerId)) {
      throw new NotFoundException('Không tìm thấy gian hàng');
    }

    const user = await this.userModel
      .findById(sellerId)
      .select('shop isActive')
      .exec();

    if (!user || !user.shop?.shopName || !user.isActive) {
      throw new NotFoundException('Không tìm thấy gian hàng');
    }

    let productCount = 0;
    if (this.userModel.db.models?.Product) {
      const ProductModel = this.userModel.db.model('Product');
      productCount = await ProductModel.countDocuments({
        sellerId: new Types.ObjectId(sellerId),
        isActive: true,
        isBlocked: false,
      });
    }

    return {
      sellerId: user._id.toString(),
      shopName: user.shop.shopName,
      shopSlug: user.shop.shopSlug!,
      joinedAt: user.shop.joinedAt!,
      productCount,
    };
  }
}

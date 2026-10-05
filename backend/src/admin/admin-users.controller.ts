import {
  Controller,
  Patch,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

@ApiTags('Admin - Users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminUsersController {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  @Patch(':id/ban')
  @ApiOperation({ summary: 'Ban user (cascade to shop and products)' })
  @ApiParam({
    name: 'id',
    description: 'User ID to ban',
    example: '66a1b2c3d4e5f6789012345',
  })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async banUser(@Param('id') id: string): Promise<{ message: string }> {
    const session = await this.userModel.db.startSession();
    session.startTransaction();

    try {
      const user = await this.userModel
        .findByIdAndUpdate(id, { isActive: false }, { new: true, session })
        .exec();

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      const ProductModel = this.userModel.db.models?.Product;
      if (ProductModel) {
        await ProductModel.updateMany(
          { sellerId: new Types.ObjectId(id), isBlocked: false },
          { isBlocked: true, blockReason: 'seller_banned' },
          { session },
        ).exec();
      }

      await session.commitTransaction();
      await session.endSession();

      return { message: 'Đã khóa tài khoản và chặn gian hàng/sản phẩm' };
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
  }

  @Patch(':id/unban')
  @ApiOperation({
    summary: 'Unban user (restore shop and products blocked due to ban)',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to unban',
    example: '66a1b2c3d4e5f6789012345',
  })
  @ApiResponse({ status: 200, description: 'User unbanned successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unbanUser(@Param('id') id: string): Promise<{ message: string }> {
    const session = await this.userModel.db.startSession();
    session.startTransaction();

    try {
      const user = await this.userModel
        .findByIdAndUpdate(id, { isActive: true }, { new: true, session })
        .exec();

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      const ProductModel = this.userModel.db.models?.Product;
      if (ProductModel) {
        await ProductModel.updateMany(
          { sellerId: new Types.ObjectId(id), blockReason: 'seller_banned' },
          { isBlocked: false, blockReason: null },
          { session },
        ).exec();
      }

      await session.commitTransaction();
      await session.endSession();

      return {
        message: 'Đã mở khóa tài khoản và khôi phục gian hàng/sản phẩm',
      };
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
  }
}

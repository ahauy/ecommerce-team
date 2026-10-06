/* eslint-disable prettier/prettier */
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, ShopSubDocument } from './schemas/user.schema';
import { GetProfileResponseDto } from './dto/get-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SetupShopDto } from './dto/setup-shop.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) { }

  async create(data: {
    email: string;
    password: string;
    fullName: string;
    role?: UserRole;
  }): Promise<UserDocument> {
    const existing = await this.userModel.findOne({
      email: data.email.toLowerCase(),
    });
    if (existing) {
      throw new ConflictException('Email đã tồn tại trên hệ thống');
    }

    const createdUser = new this.userModel({
      ...data,
      email: data.email.toLowerCase(),
      role: data.role || UserRole.CUSTOMER,
      isActive: true,
      version: 0,
    });

    try {
      return await createdUser.save();
    } catch (error: unknown) {
      if ((error as { code?: number })?.code === 11000) {
        throw new ConflictException('Email đã tồn tại trên hệ thống');
      }
      throw error;
    }
  }

  async findByEmail(
    email: string,
    includeSecrets = false,
  ): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (includeSecrets) {
      query.select('+password +refreshToken');
    }
    return query.exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByRefreshTokenHash(hash: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ refreshToken: hash })
      .select('+refreshToken')
      .exec();
  }

  async updateRefreshToken(
    id: string,
    hashedToken: string | null,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { refreshToken: hashedToken })
      .exec();
  }

  async getProfile(userId: string): Promise<GetProfileResponseDto> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return this.mapToProfileResponse(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<GetProfileResponseDto> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const updateData: Record<string, unknown> = {};

    if (dto.fullName !== undefined) {
      updateData.fullName = dto.fullName;
    }
    if (dto.phone !== undefined) {
      updateData.phone = dto.phone;
    }
    if (dto.address !== undefined) {
      updateData.address = dto.address;
    }

    const updatedUser = await this.userModel
      .findOneAndUpdate({ _id: userId }, { $set: updateData }, { new: true })
      .exec();

    if (!updatedUser) {
      throw new ConflictException(
        'Thông tin đã bị thay đổi bởi người khác, vui lòng tải lại trang',
      );
    }

    return this.mapToProfileResponse(updatedUser);
  }

  async setupShop(
    userId: string,
    dto: SetupShopDto,
  ): Promise<GetProfileResponseDto> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    const isFirstSetup = !user.shop?.shopName;

    const shopSlug = this.generateSlug(dto.shopName);
    let finalSlug = shopSlug;
    let suffix = 2;

    while (true) {
      const existing = await this.userModel
        .findOne({ 'shop.shopSlug': finalSlug, _id: { $ne: userId } })
        .exec();
      if (!existing) break;
      finalSlug = `${shopSlug}-${suffix}`;
      suffix++;
    }

    const shopData: ShopSubDocument = {
      shopName: dto.shopName,
      shopSlug: finalSlug,
      pickupAddress: dto.pickupAddress,
      phone: dto.phone,
      joinedAt: isFirstSetup ? new Date() : user.shop?.joinedAt || new Date(),
    };

    const updateData: Record<string, unknown> = {
      shop: shopData,
    };

    const updatedUser = await this.userModel
      .findOneAndUpdate({ _id: userId }, { $set: updateData }, { new: true })
      .exec();

    if (!updatedUser) {
      throw new ConflictException(
        'Thông tin đã bị thay đổi bởi người khác, vui lòng tải lại trang',
      );
    }

    return this.mapToProfileResponse(updatedUser);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/đ/g, 'd')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private mapToProfileResponse(user: UserDocument): GetProfileResponseDto {
    return {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      role: user.role,
      isActive: user.isActive,
      shop: user.shop ? {
        shopName: user.shop.shopName!,
        shopSlug: user.shop.shopSlug!,
        pickupAddress: user.shop.pickupAddress!,
        joinedAt: user.shop.joinedAt!,
      } : null,
    };
  }
}

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

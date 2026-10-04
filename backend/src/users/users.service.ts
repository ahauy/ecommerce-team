import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

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

  async updateRefreshToken(
    id: string,
    hashedToken: string | null,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { refreshToken: hashedToken })
      .exec();
  }
}

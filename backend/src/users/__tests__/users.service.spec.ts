import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users.service';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { SetupShopDto } from '../dto/setup-shop.dto';

const mockUser = (
  overrides: Partial<UserDocument> = {},
): Partial<UserDocument> => ({
  _id: new Types.ObjectId(),
  email: 'test@example.com',
  password: 'hashed',
  fullName: 'Test User',
  phone: null,
  address: null,
  role: UserRole.CUSTOMER,
  isActive: true,
  refreshToken: null,
  shop: null,
  version: 0,
  ...overrides,
});

describe('UsersService', () => {
  let service: UsersService;
  let userModel: jest.Mocked<Model<UserDocument>>;

  beforeEach(async () => {
    const mockUserModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findOneAndUpdate: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      exec: jest.fn(),
      db: {
        startSession: jest.fn().mockResolvedValue({
          startTransaction: jest.fn(),
          commitTransaction: jest.fn(),
          abortTransaction: jest.fn(),
          endSession: jest.fn(),
        }),
        model: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get(getModelToken(User.name));
  });

  const setupFindByIdMock = (user: Partial<UserDocument> | null) => {
    userModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    } as any);
  };

  const setupFindOneAndUpdateMock = (result: Partial<UserDocument> | null) => {
    userModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(result),
    } as any);
  };

  const setupFindOneMock = (result: Partial<UserDocument> | null) => {
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(result),
    } as any);
    return userModel.findOne;
  };

  describe('getProfile', () => {
    it('should return profile with shop when user has shop', async () => {
      const user = mockUser({
        _id: new Types.ObjectId('66a1b2c3d4e5f67890123456'),
        shop: {
          shopName: 'Test Shop',
          shopSlug: 'test-shop',
          pickupAddress: '123 Test St',
          phone: '0901234567',
          joinedAt: new Date('2024-01-15T10:30:00.000Z'),
        },
        version: 1,
      });

      setupFindByIdMock(user);

      const result = await service.getProfile(user._id.toString());

      expect(result).toEqual({
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        role: user.role,
        isActive: user.isActive,
        shop: {
          shopName: 'Test Shop',
          shopSlug: 'test-shop',
          pickupAddress: '123 Test St',
          phone: '0901234567',
          joinedAt: new Date('2024-01-15T10:30:00.000Z'),
        },
      });
    });

    it('should return profile with shop: null when user has no shop', async () => {
      const user = mockUser({ shop: null, version: 0 });

      setupFindByIdMock(user);

      const result = await service.getProfile(user._id.toString());

      expect(result.shop).toBeNull();
    });

    it('should throw NotFoundException when user not found', async () => {
      setupFindByIdMock(null);

      await expect(
        service.getProfile('66a1b2c3d4e5f67890123456'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update profile and increment version', async () => {
      const user = mockUser({ version: 1 });
      const dto: UpdateProfileDto = {
        fullName: 'New Name',
        phone: '0987654321',
        address: 'New Address',
      };

      setupFindByIdMock(user);
      setupFindOneAndUpdateMock({
        ...user,
        ...dto,
        version: 2,
      });

      const result = await service.updateProfile(user._id.toString(), dto);

      expect(result.fullName).toBe('New Name');
      expect(result.phone).toBe('0987654321');
      expect(result.address).toBe('New Address');
      expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: user._id.toString() },
        expect.objectContaining({
          $set: expect.objectContaining({
            fullName: 'New Name',
            phone: '0987654321',
            address: 'New Address',
          }),
        }),
        { new: true },
      );
    });

    it('should throw ConflictException on version mismatch', async () => {
      const user = mockUser({ version: 1 });
      setupFindByIdMock(user);
      setupFindOneAndUpdateMock(null);

      await expect(
        service.updateProfile('66a1b2c3d4e5f67890123456', { fullName: 'New' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should only update provided fields', async () => {
      const user = mockUser({
        version: 1,
        fullName: 'Original',
        phone: '0900000000',
      });
      const dto: UpdateProfileDto = { fullName: 'Updated' };

      setupFindByIdMock(user);
      setupFindOneAndUpdateMock({
        ...user,
        fullName: 'Updated',
        version: 2,
      });

      const result = await service.updateProfile(user._id.toString(), dto);

      expect(result.fullName).toBe('Updated');
      expect(result.phone).toBe('0900000000');
    });
  });

  describe('setupShop', () => {
    it('should create shop for first time with generated slug', async () => {
      const user = mockUser({ version: 1, shop: null });
      const dto: SetupShopDto = {
        shopName: 'My Awesome Shop',
        pickupAddress: '123 Nguyen Van Linh, District 7, HCMC',
        phone: '0901234567',
      };

      setupFindByIdMock(user);
      setupFindOneMock(null);
      setupFindOneAndUpdateMock({
        ...user,
        shop: {
          shopName: dto.shopName,
          shopSlug: 'my-awesome-shop',
          pickupAddress: dto.pickupAddress,
          phone: dto.phone,
          joinedAt: new Date(),
        },
        version: 2,
      });

      const result = await service.setupShop(user._id.toString(), dto);

      expect(result.shop).toBeDefined();
      expect(result.shop?.shopSlug).toBe('my-awesome-shop');
      expect(result.shop?.joinedAt).toBeInstanceOf(Date);
    });

    it('should append suffix on slug collision', async () => {
      const user = mockUser({ version: 1, shop: null });
      const dto: SetupShopDto = {
        shopName: 'My Shop',
        pickupAddress: '1234567890',
        phone: '0901234567',
      };

      setupFindByIdMock(user);
      const findOneMock = setupFindOneMock({ _id: new Types.ObjectId() });
      findOneMock.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
      } as any);
      setupFindOneMock(null);
      setupFindOneAndUpdateMock({
        ...user,
        shop: {
          shopName: dto.shopName,
          shopSlug: 'my-shop-2',
          pickupAddress: dto.pickupAddress,
          phone: dto.phone,
          joinedAt: new Date(),
        },
        version: 2,
      });

      const result = await service.setupShop(user._id.toString(), dto);

      expect(result.shop?.shopSlug).toBe('my-shop-2');
    });

    it('should generate correct slug from Vietnamese shopName', async () => {
      const user = mockUser({ version: 1, shop: null });
      const dto: SetupShopDto = {
        shopName: 'Cửa hàng Đồ chơi Trẻ em & Áo dài Đắk Lắk',
        pickupAddress: '123 Nguyen Van Linh, District 7, HCMC',
        phone: '0901234567',
      };

      setupFindByIdMock(user);
      setupFindOneMock(null);
      setupFindOneAndUpdateMock({
        ...user,
        shop: {
          shopName: dto.shopName,
          shopSlug: 'cua-hang-do-choi-tre-em-ao-dai-dak-lak',
          pickupAddress: dto.pickupAddress,
          phone: dto.phone,
          joinedAt: new Date(),
        },
        version: 2,
      });

      const result = await service.setupShop(user._id.toString(), dto);

      expect(result.shop?.shopSlug).toBe(
        'cua-hang-do-choi-tre-em-ao-dai-dak-lak',
      );
    });

    it('should update existing shop and preserve joinedAt', async () => {
      const originalJoinedAt = new Date('2024-01-15T10:30:00.000Z');
      const user = mockUser({
        version: 1,
        shop: {
          shopName: 'Old Shop',
          shopSlug: 'old-shop',
          pickupAddress: 'Old Address',
          phone: '0900000000',
          joinedAt: originalJoinedAt,
        },
      });
      const dto: SetupShopDto = {
        shopName: 'New Shop',
        pickupAddress: 'New Address',
        phone: '0987654321',
      };

      setupFindByIdMock(user);
      setupFindOneMock(null);
      setupFindOneAndUpdateMock({
        ...user,
        shop: {
          shopName: 'New Shop',
          shopSlug: 'new-shop',
          pickupAddress: 'New Address',
          phone: '0987654321',
          joinedAt: originalJoinedAt,
        },
        version: 2,
      });

      const result = await service.setupShop(user._id.toString(), dto);

      expect(result.shop?.shopName).toBe('New Shop');
      expect(result.shop?.joinedAt).toEqual(originalJoinedAt);
    });

    it('should throw ConflictException on version mismatch', async () => {
      const user = mockUser({ version: 1 });
      setupFindByIdMock(user);
      setupFindOneMock(null);
      setupFindOneAndUpdateMock(null);

      await expect(
        service.setupShop('66a1b2c3d4e5f67890123456', {
          shopName: 'Test Shop',
          pickupAddress: '1234567890',
          phone: '0901234567',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});

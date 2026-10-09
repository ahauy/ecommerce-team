import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { UserRole } from '../../users/schemas/user.schema';
import { ListOrdersQueryDto } from '../dto/order-query.dto';
import { OrderService, ORDER_CHANGED, ORDER_NOT_FOUND } from '../order.service';
import { PaymentResultService } from '../payment-result.service';
import { Checkout } from '../schemas/checkout.schema';
import {
  CancelledBy,
  Order,
  OrderStatus,
  PaymentStatus,
} from '../schemas/order.schema';
import { chain } from './order-test.helper';

const BUYER = new Types.ObjectId();
const SELLER = new Types.ObjectId();
const OTHER = new Types.ObjectId();
const CHECKOUT_ID = new Types.ObjectId();
const ORDER_ID = new Types.ObjectId();
const PRODUCT_ID = new Types.ObjectId();

const seller = { id: SELLER.toString(), role: UserRole.CUSTOMER };
const stranger = { id: OTHER.toString(), role: UserRole.CUSTOMER };
const admin = { id: OTHER.toString(), role: UserRole.ADMIN };

const makeOrder = (overrides: Record<string, unknown> = {}) => ({
  _id: ORDER_ID,
  orderCode: 'ORD-20261002-4M8TQ2ZP6C',
  checkoutId: CHECKOUT_ID,
  userId: BUYER,
  sellerId: SELLER,
  recipient: {
    fullName: 'Nguyễn Văn A',
    phone: '0901234567',
    email: 'a@example.com',
    address: '123 Nguyễn Huệ',
  },
  sellerShopName: 'Shop A',
  items: [
    {
      productId: PRODUCT_ID,
      name: 'Áo thun',
      imageUrl: null,
      price: 100000,
      quantity: 2,
    },
  ],
  totalAmount: 200000,
  status: OrderStatus.CONFIRMED,
  paymentMethod: 'payos',
  paymentStatus: PaymentStatus.PAID,
  cancelReason: null,
  cancelledBy: null,
  createdAt: new Date('2026-10-02T10:00:00.000Z'),
  updatedAt: new Date('2026-10-02T10:05:00.000Z'),
  ...overrides,
});

const query = (overrides: Partial<ListOrdersQueryDto> = {}) =>
  Object.assign(new ListOrdersQueryDto(), overrides);

describe('OrderService', () => {
  let service: OrderService;
  const orderModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  };
  const checkoutModel = { find: jest.fn() };
  const paymentResult = {
    inTransaction: jest.fn(async (work: (s: unknown) => Promise<void>) => {
      await work('session');
    }),
    restockAndCancel: jest.fn(),
  };

  const findChain = (value: unknown) => {
    const q = chain(value);
    q.skip = jest.fn().mockReturnValue(q);
    return q;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    checkoutModel.find.mockReturnValue(
      chain([{ _id: CHECKOUT_ID, checkoutCode: 'CHK-20261002-7F3K9QX2AB' }]),
    );

    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(Checkout.name), useValue: checkoutModel },
        { provide: PaymentResultService, useValue: paymentResult },
      ],
    }).compile();
    service = module.get(OrderService);
  });

  describe('xem đơn', () => {
    it('listForBuyer: chỉ đơn của người mua, lọc status, phân trang, kèm checkoutCode', async () => {
      const q = findChain([makeOrder()]);
      orderModel.find.mockReturnValue(q);
      orderModel.countDocuments.mockReturnValue(chain(11));

      const result = await service.listForBuyer(
        BUYER.toString(),
        query({ page: 2, limit: 5, status: OrderStatus.CONFIRMED }),
      );

      expect(orderModel.find).toHaveBeenCalledWith({
        userId: BUYER,
        status: OrderStatus.CONFIRMED,
      });
      expect(q.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
      expect(q.skip).toHaveBeenCalledWith(5);
      expect(q.limit).toHaveBeenCalledWith(5);
      expect(result).toMatchObject({
        total: 11,
        page: 2,
        limit: 5,
        totalPages: 3,
      });
      expect(result.items[0]).toEqual({
        id: ORDER_ID.toString(),
        orderCode: 'ORD-20261002-4M8TQ2ZP6C',
        checkoutCode: 'CHK-20261002-7F3K9QX2AB',
        buyerId: BUYER.toString(),
        seller: { id: SELLER.toString(), shopName: 'Shop A' },
        items: [
          {
            productId: PRODUCT_ID.toString(),
            name: 'Áo thun',
            imageUrl: null,
            price: 100000,
            quantity: 2,
          },
        ],
        totalAmount: 200000,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: 'payos',
        recipient: {
          fullName: 'Nguyễn Văn A',
          phone: '0901234567',
          email: 'a@example.com',
          address: '123 Nguyễn Huệ',
        },
        cancelReason: null,
        cancelledBy: null,
        createdAt: '2026-10-02T10:00:00.000Z',
        updatedAt: '2026-10-02T10:05:00.000Z',
      });
    });

    it('listForSeller: chỉ đơn có sellerId của mình', async () => {
      orderModel.find.mockReturnValue(findChain([]));
      orderModel.countDocuments.mockReturnValue(chain(0));

      const result = await service.listForSeller(SELLER.toString(), query());

      expect(orderModel.find).toHaveBeenCalledWith({ sellerId: SELLER });
      expect(result).toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
      expect(checkoutModel.find).not.toHaveBeenCalled();
    });

    it('listForAdmin: lọc theo sellerId / userId', async () => {
      orderModel.find.mockReturnValue(findChain([]));
      orderModel.countDocuments.mockReturnValue(chain(0));

      await service.listForAdmin(
        Object.assign(query(), {
          sellerId: SELLER.toString(),
          userId: BUYER.toString(),
        }),
      );

      expect(orderModel.find).toHaveBeenCalledWith({
        sellerId: SELLER,
        userId: BUYER,
      });
    });

    it('getForBuyer: đơn của người khác → 404 (lọc theo userId)', async () => {
      orderModel.findOne.mockReturnValue(chain(null));

      await expect(
        service.getForBuyer(OTHER.toString(), ORDER_ID.toString()),
      ).rejects.toThrow(new NotFoundException(ORDER_NOT_FOUND));
      expect(orderModel.findOne).toHaveBeenCalledWith({
        _id: ORDER_ID,
        userId: OTHER,
      });
    });

    it('getForSeller: lọc theo sellerId', async () => {
      orderModel.findOne.mockReturnValue(chain(makeOrder()));

      const dto = await service.getForSeller(
        SELLER.toString(),
        ORDER_ID.toString(),
      );

      expect(orderModel.findOne).toHaveBeenCalledWith({
        _id: ORDER_ID,
        sellerId: SELLER,
      });
      expect(dto.recipient.phone).toBe('0901234567');
    });
  });

  describe('updateStatus', () => {
    const givenOrder = (overrides: Record<string, unknown> = {}) => {
      orderModel.findById.mockReturnValue(chain(makeOrder(overrides)));
      orderModel.findOne.mockReturnValue(chain(makeOrder(overrides)));
    };

    it('không tồn tại → 404', async () => {
      orderModel.findById.mockReturnValue(chain(null));

      await expect(
        service.updateStatus(seller, ORDER_ID.toString(), {
          status: OrderStatus.SHIPPING,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('không phải người bán của đơn → 403', async () => {
      givenOrder();

      await expect(
        service.updateStatus(stranger, ORDER_ID.toString(), {
          status: OrderStatus.SHIPPING,
        }),
      ).rejects.toThrow(
        new ForbiddenException('Bạn không có quyền cập nhật đơn hàng này'),
      );
    });

    it('Seller đặt refunded → 403', async () => {
      givenOrder({ status: OrderStatus.CANCELLED });

      await expect(
        service.updateStatus(seller, ORDER_ID.toString(), {
          status: OrderStatus.REFUNDED,
        }),
      ).rejects.toThrow(
        new ForbiddenException('Chỉ quản trị viên được xác nhận hoàn tiền'),
      );
    });

    it.each([
      [OrderStatus.CONFIRMED, OrderStatus.SHIPPING],
      [OrderStatus.SHIPPING, OrderStatus.DELIVERED],
    ])('%s → %s: cập nhật có điều kiện', async (from, target) => {
      givenOrder({ status: from });
      orderModel.findOneAndUpdate.mockReturnValue(chain({ _id: ORDER_ID }));

      await service.updateStatus(seller, ORDER_ID.toString(), {
        status: target as OrderStatus.SHIPPING | OrderStatus.DELIVERED,
      });

      expect(orderModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: ORDER_ID, status: from },
        { $set: { status: target } },
        { returnDocument: 'after' },
      );
    });

    it.each([
      [
        OrderStatus.DELIVERED,
        OrderStatus.SHIPPING,
        'Không thể chuyển đơn từ "Đã giao" sang "Đang giao"',
      ],
      [
        OrderStatus.PENDING,
        OrderStatus.CANCELLED,
        'Không thể chuyển đơn từ "Chờ thanh toán" sang "Đã hủy"',
      ],
      [
        OrderStatus.SHIPPING,
        OrderStatus.CANCELLED,
        'Không thể chuyển đơn từ "Đang giao" sang "Đã hủy"',
      ],
      [
        OrderStatus.CONFIRMED,
        OrderStatus.DELIVERED,
        'Không thể chuyển đơn từ "Đã thanh toán" sang "Đã giao"',
      ],
    ])('%s → %s: sai chiều → 400', async (from, target, message) => {
      givenOrder({ status: from });

      await expect(
        service.updateStatus(seller, ORDER_ID.toString(), {
          status: target as OrderStatus.SHIPPING,
          reason: 'x',
        }),
      ).rejects.toThrow(new BadRequestException(message));
      expect(orderModel.findOneAndUpdate).not.toHaveBeenCalled();
      expect(paymentResult.restockAndCancel).not.toHaveBeenCalled();
    });

    it('Seller hủy đơn confirmed: restockAndCancel trong transaction, cancelledBy seller', async () => {
      givenOrder();
      paymentResult.restockAndCancel.mockResolvedValue(true);

      await service.updateStatus(seller, ORDER_ID.toString(), {
        status: OrderStatus.CANCELLED,
        reason: 'Hết hàng thực tế',
      });

      expect(paymentResult.inTransaction).toHaveBeenCalled();
      expect(paymentResult.restockAndCancel).toHaveBeenCalledWith(
        ORDER_ID,
        {
          from: OrderStatus.CONFIRMED,
          cancelledBy: CancelledBy.SELLER,
          reason: 'Hết hàng thực tế',
        },
        'session',
      );
    });

    it('Admin hủy đơn: cancelledBy admin', async () => {
      givenOrder();
      paymentResult.restockAndCancel.mockResolvedValue(true);

      await service.updateStatus(admin, ORDER_ID.toString(), {
        status: OrderStatus.CANCELLED,
        reason: 'Vi phạm chính sách',
      });

      expect(paymentResult.restockAndCancel.mock.calls[0][1].cancelledBy).toBe(
        CancelledBy.ADMIN,
      );
    });

    it('hủy 2 lần cùng lúc: lần sau không hoàn kho lại → 409', async () => {
      givenOrder();
      paymentResult.restockAndCancel.mockResolvedValue(false);

      await expect(
        service.updateStatus(seller, ORDER_ID.toString(), {
          status: OrderStatus.CANCELLED,
          reason: 'x',
        }),
      ).rejects.toThrow(new ConflictException(ORDER_CHANGED));
    });

    it('trạng thái đổi giữa lúc đọc và ghi → 409', async () => {
      givenOrder();
      orderModel.findOneAndUpdate.mockReturnValue(chain(null));

      await expect(
        service.updateStatus(seller, ORDER_ID.toString(), {
          status: OrderStatus.SHIPPING,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('Admin hoàn tiền đơn đã hủy và đã thanh toán: paymentStatus → refunded', async () => {
      givenOrder({ status: OrderStatus.CANCELLED });
      orderModel.findOneAndUpdate.mockReturnValue(chain({ _id: ORDER_ID }));

      await service.updateStatus(admin, ORDER_ID.toString(), {
        status: OrderStatus.REFUNDED,
      });

      expect(orderModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: ORDER_ID, status: OrderStatus.CANCELLED },
        {
          $set: {
            status: OrderStatus.REFUNDED,
            paymentStatus: PaymentStatus.REFUNDED,
          },
        },
        { returnDocument: 'after' },
      );
    });

    it('Admin hoàn tiền đơn chưa thanh toán (hủy do hết hạn) → 400', async () => {
      givenOrder({
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.UNPAID,
      });

      await expect(
        service.updateStatus(admin, ORDER_ID.toString(), {
          status: OrderStatus.REFUNDED,
        }),
      ).rejects.toThrow(
        new BadRequestException('Chỉ hoàn tiền cho đơn đã thanh toán'),
      );
    });

    it('trả về đơn sau khi cập nhật', async () => {
      orderModel.findById.mockReturnValue(chain(makeOrder()));
      orderModel.findOneAndUpdate.mockReturnValue(chain({ _id: ORDER_ID }));
      orderModel.findOne.mockReturnValue(
        chain(makeOrder({ status: OrderStatus.SHIPPING })),
      );

      const dto = await service.updateStatus(seller, ORDER_ID.toString(), {
        status: OrderStatus.SHIPPING,
      });

      expect(dto.status).toBe(OrderStatus.SHIPPING);
    });
  });
});

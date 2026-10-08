import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { PayosService } from '../../payments/payos.service';
import { Product } from '../../products/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';
import {
  CheckoutService,
  PAYMENT_LINK_FAILED_REASON,
  SHORTAGE_MESSAGE,
} from '../checkout.service';
import { CreateCheckoutDto } from '../dto/create-checkout.dto';
import { PaymentReconcileService } from '../payment-reconcile.service';
import { PaymentResultService } from '../payment-result.service';
import { Checkout, CheckoutStatus } from '../schemas/checkout.schema';
import { Order, OrderStatus } from '../schemas/order.schema';
import { chain, execOnly, mockConnection } from './order-test.helper';

const BUYER = new Types.ObjectId().toString();
const SELLER_A = new Types.ObjectId();
const SELLER_B = new Types.ObjectId();

const makeProduct = (overrides: Record<string, unknown> = {}) => ({
  _id: new Types.ObjectId(),
  sellerId: SELLER_A,
  name: 'Áo thun',
  images: ['https://res.cloudinary.com/demo/a.jpg'],
  price: 100000,
  stock: 10,
  isActive: true,
  isBlocked: false,
  ...overrides,
});
type TestProduct = ReturnType<typeof makeProduct>;

const buyer = {
  fullName: 'Nguyễn Văn A',
  email: 'a@example.com',
  phone: '0901234567',
  address: '123 Nguyễn Huệ, Q1',
};

const line = (p: TestProduct, quantity: number) => ({
  productId: p._id.toString(),
  quantity,
});

describe('CheckoutService', () => {
  let service: CheckoutService;
  const { connection, session } = mockConnection();
  const checkoutModel = {
    create: jest.fn(),
    updateOne: jest.fn(),
    findOne: jest.fn(),
  };
  const orderModel = { create: jest.fn(), find: jest.fn() };
  const productModel = { find: jest.fn(), findOneAndUpdate: jest.fn() };
  const userModel = { findById: jest.fn(), find: jest.fn() };
  const payos = { createPaymentLink: jest.fn() };
  const paymentResult = { cancelCheckout: jest.fn() };
  const reconcile = { syncCheckout: jest.fn() };
  const config = {
    get: jest.fn((key: string, fallback?: unknown) =>
      key === 'FRONTEND_URL'
        ? 'http://localhost:5173/'
        : key === 'CHECKOUT_EXPIRE_MINUTES'
          ? '30'
          : fallback,
    ),
  };

  const givenProducts = (...products: TestProduct[]) => {
    productModel.find.mockReturnValue(chain(products));
    productModel.findOneAndUpdate.mockImplementation(
      (filter: { _id: Types.ObjectId; stock: { $gte: number } }) => {
        const p = products.find((x) => x._id.equals(filter._id));
        const ok =
          p && p.isActive && !p.isBlocked && p.stock >= filter.stock.$gte;
        return chain(ok ? { ...p, stock: p.stock - filter.stock.$gte } : null);
      },
    );
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    userModel.findById.mockReturnValue(chain(buyer));
    userModel.find.mockReturnValue(
      chain([
        { _id: SELLER_A, shop: { shopName: 'Shop A' } },
        { _id: SELLER_B, shop: { shopName: 'Shop B' } },
      ]),
    );
    checkoutModel.create.mockResolvedValue([{}]);
    orderModel.create.mockResolvedValue([]);
    checkoutModel.updateOne.mockReturnValue(execOnly({}));
    payos.createPaymentLink.mockResolvedValue({
      paymentLinkId: 'link-1',
      checkoutUrl: 'https://pay.payos.vn/web/link-1',
    });
    paymentResult.cancelCheckout.mockResolvedValue(true);

    const module = await Test.createTestingModule({
      providers: [
        CheckoutService,
        { provide: getConnectionToken(), useValue: connection },
        { provide: getModelToken(Checkout.name), useValue: checkoutModel },
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(Product.name), useValue: productModel },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: PayosService, useValue: payos },
        { provide: PaymentResultService, useValue: paymentResult },
        { provide: PaymentReconcileService, useValue: reconcile },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get(CheckoutService);
  });

  describe('createCheckout', () => {
    it('giỏ có SP của 2 shop: 1 Checkout + 2 Order, tổng tiền đúng, trả paymentUrl', async () => {
      const a1 = makeProduct({ price: 100000 });
      const a2 = makeProduct({ price: 50000 });
      const b1 = makeProduct({ sellerId: SELLER_B, price: 200000 });
      givenProducts(a1, a2, b1);

      const result = await service.createCheckout(BUYER, {
        items: [line(a1, 2), line(a2, 1), line(b1, 1)],
      });

      expect(result.totalAmount).toBe(450000);
      expect(result.orders).toHaveLength(2);
      expect(
        result.orders.map((o) => [o.seller.shopName, o.totalAmount]),
      ).toEqual([
        ['Shop A', 250000],
        ['Shop B', 200000],
      ]);
      expect(result.checkoutCode).toMatch(/^CHK-\d{8}-[A-Z2-9]{10}$/);
      expect(result.orders[0].orderCode).toMatch(/^ORD-\d{8}-[A-Z2-9]{10}$/);
      expect(result.paymentUrl).toBe('https://pay.payos.vn/web/link-1');

      const [orders, opts] = orderModel.create.mock.calls[0];
      expect(opts).toMatchObject({ session });
      expect(orders[0]).toMatchObject({
        sellerShopName: 'Shop A',
        recipient: buyer,
        items: [
          {
            name: 'Áo thun',
            price: 100000,
            quantity: 2,
            imageUrl: 'https://res.cloudinary.com/demo/a.jpg',
          },
          { price: 50000, quantity: 1 },
        ],
      });
      const [[checkoutDoc]] = checkoutModel.create.mock.calls[0];
      expect(checkoutDoc).toMatchObject({
        totalAmount: 450000,
        recipient: buyer,
      });
      expect(checkoutDoc.orderIds).toHaveLength(2);
      expect(Number.isSafeInteger(checkoutDoc.payosOrderCode)).toBe(true);
    });

    it('trừ stock nguyên tử có điều kiện trong transaction', async () => {
      const p = makeProduct();
      givenProducts(p);

      await service.createCheckout(BUYER, { items: [line(p, 3)] });

      expect(productModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: p._id, isActive: true, isBlocked: false, stock: { $gte: 3 } },
        { $inc: { stock: -3 } },
        expect.objectContaining({ session }),
      );
      expect(session.withTransaction).toHaveBeenCalled();
    });

    it('gộp các dòng trùng productId trước khi trừ stock', async () => {
      const p = makeProduct();
      givenProducts(p);

      await service.createCheckout(BUYER, { items: [line(p, 1), line(p, 2)] });

      expect(productModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
      expect(productModel.findOneAndUpdate.mock.calls[0][0].stock).toEqual({
        $gte: 3,
      });
    });

    it('lấy giá từ DB trong transaction, không phải giá đọc trước đó', async () => {
      const p = makeProduct({ price: 100000 });
      productModel.find.mockReturnValue(chain([p]));
      productModel.findOneAndUpdate.mockReturnValue(
        chain({ ...p, price: 120000 }),
      );

      const result = await service.createCheckout(BUYER, {
        items: [line(p, 1)],
      });

      expect(result.totalAmount).toBe(120000);
    });

    it('tạo payment link đúng tham số PayOS', async () => {
      const p = makeProduct({ price: 2000 });
      givenProducts(p);

      const result = await service.createCheckout(BUYER, {
        items: [line(p, 1)],
      });

      const request = payos.createPaymentLink.mock.calls[0][0];
      expect(request).toMatchObject({
        amount: 2000,
        description: result.checkoutCode.slice(-9),
        returnUrl: `http://localhost:5173/checkout/result?checkoutCode=${result.checkoutCode}`,
        cancelUrl: `http://localhost:5173/checkout/result?checkoutCode=${result.checkoutCode}`,
        expiredAt: Math.floor(new Date(result.expiresAt).getTime() / 1000),
      });
      expect(request.description).toHaveLength(9);
      expect(checkoutModel.updateOne).toHaveBeenCalledWith(
        { _id: expect.any(Types.ObjectId) },
        {
          $set: {
            paymentLinkId: 'link-1',
            checkoutUrl: 'https://pay.payos.vn/web/link-1',
          },
        },
      );
    });

    it('người nhận: body ghi đè từng field, còn lại lấy từ profile', async () => {
      const p = makeProduct();
      givenProducts(p);

      await service.createCheckout(BUYER, {
        recipient: { address: '456 Lê Lợi, Q1' },
        items: [line(p, 1)],
      });

      const [[checkoutDoc]] = checkoutModel.create.mock.calls[0];
      expect(checkoutDoc.recipient).toEqual({
        ...buyer,
        address: '456 Lê Lợi, Q1',
      });
    });

    it('profile thiếu phone/address và body không bổ sung: 400', async () => {
      userModel.findById.mockReturnValue(
        chain({ ...buyer, phone: null, address: null }),
      );

      await expect(
        service.createCheckout(BUYER, { items: [line(makeProduct(), 1)] }),
      ).rejects.toThrow(
        new BadRequestException(
          'Vui lòng bổ sung số điện thoại và địa chỉ nhận hàng',
        ),
      );
      expect(session.withTransaction).not.toHaveBeenCalled();
    });

    it('mua SP của chính mình: 400', async () => {
      const own = makeProduct({ sellerId: new Types.ObjectId(BUYER) });
      givenProducts(own);

      await expect(
        service.createCheckout(BUYER, { items: [line(own, 1)] }),
      ).rejects.toThrow(
        new BadRequestException('Bạn không thể mua sản phẩm của chính mình'),
      );
    });

    it('thiếu hàng / SP ẩn / không tồn tại: 400 kèm toàn bộ danh sách, không tạo gì', async () => {
      const short = makeProduct({ name: 'iPhone', stock: 1 });
      const hidden = makeProduct({ name: 'Ẩn', isActive: false });
      const ok = makeProduct();
      const ghostId = new Types.ObjectId().toString();
      givenProducts(short, hidden, ok);

      const dto: CreateCheckoutDto = {
        items: [
          line(short, 3),
          line(hidden, 1),
          line(ok, 1),
          { productId: ghostId, quantity: 1 },
        ],
      };
      const error = await service
        .createCheckout(BUYER, dto)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        message: SHORTAGE_MESSAGE,
        errors: [
          {
            productId: short._id.toString(),
            name: 'iPhone',
            available: 1,
            requested: 3,
          },
          {
            productId: hidden._id.toString(),
            name: 'Ẩn',
            available: 0,
            requested: 1,
          },
          {
            productId: ghostId,
            name: 'Sản phẩm không tồn tại',
            available: 0,
            requested: 1,
          },
        ],
      });
      expect(session.withTransaction).not.toHaveBeenCalled();
      expect(checkoutModel.create).not.toHaveBeenCalled();
    });

    it('hết hàng giữa chừng trong transaction: abort và báo lại danh sách thiếu hàng mới nhất', async () => {
      const p1 = makeProduct({ name: 'A', stock: 5 });
      const p2 = makeProduct({ name: 'B', stock: 5 });
      productModel.find
        .mockReturnValueOnce(chain([p1, p2]))
        .mockReturnValueOnce(chain([p1, { ...p2, stock: 0 }]));
      productModel.findOneAndUpdate
        .mockReturnValueOnce(chain({ ...p1, stock: 4 }))
        .mockReturnValueOnce(chain(null));

      const error = await service
        .createCheckout(BUYER, { items: [line(p1, 1), line(p2, 1)] })
        .catch((e: unknown) => e);

      expect((error as BadRequestException).getResponse()).toEqual({
        message: SHORTAGE_MESSAGE,
        errors: [
          {
            productId: p2._id.toString(),
            name: 'B',
            available: 0,
            requested: 1,
          },
        ],
      });
      expect(checkoutModel.create).not.toHaveBeenCalled();
      expect(payos.createPaymentLink).not.toHaveBeenCalled();
      expect(session.endSession).toHaveBeenCalled();
    });

    it('trùng mã (11000): thử lại với mã mới', async () => {
      const p = makeProduct();
      givenProducts(p);
      checkoutModel.create
        .mockRejectedValueOnce({ code: 11000 })
        .mockResolvedValueOnce([{}]);

      const result = await service.createCheckout(BUYER, {
        items: [line(p, 1)],
      });

      expect(checkoutModel.create).toHaveBeenCalledTimes(2);
      const firstCode = checkoutModel.create.mock.calls[0][0][0].checkoutCode;
      const secondCode = checkoutModel.create.mock.calls[1][0][0].checkoutCode;
      expect(secondCode).not.toBe(firstCode);
      expect(result.checkoutCode).toBe(secondCode);
    });

    it('PayOS lỗi khi tạo link: hủy Checkout + hoàn stock, trả 502', async () => {
      const p = makeProduct();
      givenProducts(p);
      payos.createPaymentLink.mockRejectedValue(new Error('PayOS down'));

      await expect(
        service.createCheckout(BUYER, { items: [line(p, 1)] }),
      ).rejects.toThrow(BadGatewayException);

      expect(paymentResult.cancelCheckout).toHaveBeenCalledWith(
        expect.any(Types.ObjectId),
        CheckoutStatus.FAILED,
        PAYMENT_LINK_FAILED_REASON,
      );
      expect(checkoutModel.updateOne).not.toHaveBeenCalled();
    });
  });

  describe('getCheckoutResult', () => {
    const CODE = 'CHK-20261002-7F3K9QX2AB';
    const stored = (status: CheckoutStatus) => ({
      _id: new Types.ObjectId(),
      checkoutCode: CODE,
      status,
      totalAmount: 300000,
      payosOrderCode: 1,
      expiresAt: new Date('2026-10-02T10:30:00.000Z'),
      checkoutUrl: 'https://pay.payos.vn/web/link-1',
    });

    beforeEach(() => {
      orderModel.find.mockReturnValue(
        chain([
          {
            orderCode: 'ORD-1',
            sellerShopName: 'Shop A',
            totalAmount: 300000,
            status: OrderStatus.CONFIRMED,
          },
        ]),
      );
    });

    it('không phải của mình / không tồn tại: 404', async () => {
      checkoutModel.findOne.mockReturnValue(chain(null));

      await expect(service.getCheckoutResult(BUYER, CODE)).rejects.toThrow(
        NotFoundException,
      );
      expect(checkoutModel.findOne).toHaveBeenCalledWith({
        checkoutCode: CODE,
        userId: new Types.ObjectId(BUYER),
      });
    });

    it('còn pending: đồng bộ PayOS rồi trả trạng thái mới', async () => {
      const pending = stored(CheckoutStatus.PENDING);
      checkoutModel.findOne
        .mockReturnValueOnce(chain(pending))
        .mockReturnValueOnce(
          chain({ ...pending, status: CheckoutStatus.PAID }),
        );

      const result = await service.getCheckoutResult(BUYER, CODE);

      expect(reconcile.syncCheckout).toHaveBeenCalledWith(pending);
      expect(result).toEqual({
        checkoutCode: CODE,
        status: CheckoutStatus.PAID,
        totalAmount: 300000,
        expiresAt: '2026-10-02T10:30:00.000Z',
        paymentUrl: null,
        orders: [
          {
            orderCode: 'ORD-1',
            shopName: 'Shop A',
            totalAmount: 300000,
            status: OrderStatus.CONFIRMED,
          },
        ],
      });
    });

    it('vẫn pending sau đồng bộ: trả paymentUrl để thanh toán tiếp', async () => {
      const pending = stored(CheckoutStatus.PENDING);
      checkoutModel.findOne.mockReturnValue(chain(pending));

      const result = await service.getCheckoutResult(BUYER, CODE);

      expect(result.paymentUrl).toBe('https://pay.payos.vn/web/link-1');
    });

    it('đã kết thúc: không gọi PayOS', async () => {
      checkoutModel.findOne.mockReturnValue(
        chain(stored(CheckoutStatus.EXPIRED)),
      );

      const result = await service.getCheckoutResult(BUYER, CODE);

      expect(reconcile.syncCheckout).not.toHaveBeenCalled();
      expect(result.status).toBe(CheckoutStatus.EXPIRED);
    });
  });
});

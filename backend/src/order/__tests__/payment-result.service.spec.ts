import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Cart } from '../../cart/schemas/cart.schema';
import { Product } from '../../products/schemas/product.schema';
import { PaymentResultService } from '../payment-result.service';
import { Checkout, CheckoutStatus } from '../schemas/checkout.schema';
import {
  CancelledBy,
  Order,
  OrderStatus,
  PaymentStatus,
} from '../schemas/order.schema';
import { chain, execOnly, mockConnection } from './order-test.helper';

const CHECKOUT_ID = new Types.ObjectId();
const BUYER_ID = new Types.ObjectId();
const P1 = new Types.ObjectId();
const P2 = new Types.ObjectId();

describe('PaymentResultService', () => {
  let service: PaymentResultService;
  const { connection, session } = mockConnection();
  const checkoutModel = { findOneAndUpdate: jest.fn() };
  const orderModel = {
    find: jest.fn(),
    updateMany: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  const productModel = { updateOne: jest.fn() };
  const cartModel = { updateOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    orderModel.updateMany.mockReturnValue(execOnly({}));
    productModel.updateOne.mockReturnValue(execOnly({}));
    cartModel.updateOne.mockReturnValue(execOnly({}));

    const module = await Test.createTestingModule({
      providers: [
        PaymentResultService,
        { provide: getConnectionToken(), useValue: connection },
        { provide: getModelToken(Checkout.name), useValue: checkoutModel },
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(Product.name), useValue: productModel },
        { provide: getModelToken(Cart.name), useValue: cartModel },
      ],
    }).compile();
    service = module.get(PaymentResultService);
  });

  describe('markPaid', () => {
    it('chuyển Checkout paid, mọi Order con confirmed + paid, xóa SP đã mua khỏi giỏ', async () => {
      checkoutModel.findOneAndUpdate.mockReturnValue(
        execOnly({ _id: CHECKOUT_ID, userId: BUYER_ID }),
      );
      orderModel.find.mockReturnValue(
        chain([
          { items: [{ productId: P1, quantity: 1 }] },
          { items: [{ productId: P2, quantity: 2 }] },
        ]),
      );

      await expect(service.markPaid(CHECKOUT_ID, 'FT123')).resolves.toBe(
        'paid',
      );

      expect(checkoutModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: CHECKOUT_ID, status: CheckoutStatus.PENDING },
        {
          $set: expect.objectContaining({
            status: CheckoutStatus.PAID,
            payosReference: 'FT123',
          }),
        },
        expect.objectContaining({ session }),
      );
      expect(orderModel.updateMany).toHaveBeenCalledWith(
        { checkoutId: CHECKOUT_ID, status: OrderStatus.PENDING },
        {
          $set: {
            status: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
          },
        },
        { session },
      );
      expect(cartModel.updateOne).toHaveBeenCalledWith(
        { userId: BUYER_ID },
        { $pull: { items: { productId: { $in: [P1, P2] } } } },
        { session },
      );
      expect(session.endSession).toHaveBeenCalled();
    });

    it('Checkout không còn pending: không đụng tới Order / giỏ', async () => {
      checkoutModel.findOneAndUpdate.mockReturnValue(execOnly(null));

      await expect(service.markPaid(CHECKOUT_ID, null)).resolves.toBe(
        'not_pending',
      );
      expect(orderModel.updateMany).not.toHaveBeenCalled();
      expect(cartModel.updateOne).not.toHaveBeenCalled();
    });
  });

  describe('cancelCheckout', () => {
    it('hủy mọi Order pending và hoàn stock từng item', async () => {
      const o1 = new Types.ObjectId();
      const o2 = new Types.ObjectId();
      checkoutModel.findOneAndUpdate.mockReturnValue(
        execOnly({ _id: CHECKOUT_ID }),
      );
      orderModel.find.mockReturnValue(chain([{ _id: o1 }, { _id: o2 }]));
      orderModel.findOneAndUpdate
        .mockReturnValueOnce(chain({ items: [{ productId: P1, quantity: 3 }] }))
        .mockReturnValueOnce(
          chain({ items: [{ productId: P2, quantity: 1 }] }),
        );

      await expect(
        service.cancelCheckout(CHECKOUT_ID, CheckoutStatus.EXPIRED, 'Hết hạn'),
      ).resolves.toBe(true);

      expect(orderModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: o1, status: OrderStatus.PENDING },
        {
          $set: {
            status: OrderStatus.CANCELLED,
            cancelledBy: CancelledBy.SYSTEM,
            cancelReason: 'Hết hạn',
          },
        },
        expect.objectContaining({ session }),
      );
      expect(productModel.updateOne).toHaveBeenCalledWith(
        { _id: P1 },
        { $inc: { stock: 3 } },
        { session },
      );
      expect(productModel.updateOne).toHaveBeenCalledWith(
        { _id: P2 },
        { $inc: { stock: 1 } },
        { session },
      );
    });

    it('Order đã bị bên khác hủy: không hoàn stock lần nữa', async () => {
      checkoutModel.findOneAndUpdate.mockReturnValue(
        execOnly({ _id: CHECKOUT_ID }),
      );
      orderModel.find.mockReturnValue(chain([{ _id: new Types.ObjectId() }]));
      orderModel.findOneAndUpdate.mockReturnValue(chain(null));

      await service.cancelCheckout(
        CHECKOUT_ID,
        CheckoutStatus.FAILED,
        'Người mua hủy',
      );

      expect(productModel.updateOne).not.toHaveBeenCalled();
    });

    it('Checkout không còn pending: trả false, không làm gì', async () => {
      checkoutModel.findOneAndUpdate.mockReturnValue(execOnly(null));

      await expect(
        service.cancelCheckout(CHECKOUT_ID, CheckoutStatus.FAILED, 'x'),
      ).resolves.toBe(false);
      expect(orderModel.find).not.toHaveBeenCalled();
    });
  });
});

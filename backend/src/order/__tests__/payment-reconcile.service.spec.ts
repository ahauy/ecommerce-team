import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { PayosService } from '../../payments/payos.service';
import {
  Payment,
  PaymentNote,
  PaymentSource,
} from '../../payments/schemas/payment.schema';
import {
  CANCEL_REASON_BUYER,
  CANCEL_REASON_EXPIRED,
  EXPIRY_HARD_LIMIT_MS,
  PaymentReconcileService,
  ReconcileCheckout,
} from '../payment-reconcile.service';
import { PaymentResultService } from '../payment-result.service';
import { Checkout, CheckoutStatus } from '../schemas/checkout.schema';
import { chain } from './order-test.helper';

const ORDER_CODE = 1791277078123;

const makeCheckout = (
  overrides: Partial<ReconcileCheckout> = {},
): ReconcileCheckout => ({
  _id: new Types.ObjectId(),
  status: CheckoutStatus.PENDING,
  totalAmount: 300000,
  payosOrderCode: ORDER_CODE,
  expiresAt: new Date('2026-10-02T10:30:00.000Z'),
  ...overrides,
});

const webhookBody = (amount = 300000, code = '00') => ({
  code,
  desc: 'success',
  success: code === '00',
  data: {
    orderCode: ORDER_CODE,
    amount,
    reference: 'FT123',
    code,
    counterAccountName: 'NGUYEN VAN A',
  },
  signature: 'sig',
});

const paymentLink = (status: string, amountPaid = 300000) => ({
  id: 'link-1',
  orderCode: ORDER_CODE,
  amount: 300000,
  amountPaid,
  amountRemaining: 300000 - amountPaid,
  status,
  createdAt: '2026-10-02T10:00:00.000Z',
  transactions: status === 'PAID' ? [{ reference: 'FT999' }] : [],
  cancellationReason: null,
  canceledAt: null,
});

describe('PaymentReconcileService', () => {
  let service: PaymentReconcileService;
  const checkoutModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  const paymentModel = { create: jest.fn(), exists: jest.fn() };
  const payos = {
    verifyWebhook: jest.fn(),
    getPaymentLink: jest.fn(),
    cancelPaymentLink: jest.fn(),
  };
  const paymentResult = { markPaid: jest.fn(), cancelCheckout: jest.fn() };

  const loggedNote = () => paymentModel.create.mock.calls.at(-1)?.[0]?.note;

  beforeEach(async () => {
    jest.resetAllMocks();
    paymentModel.create.mockResolvedValue({});
    paymentModel.exists.mockReturnValue(chain(null));
    paymentResult.cancelCheckout.mockResolvedValue(true);
    checkoutModel.findOneAndUpdate.mockReturnValue(chain({ _id: 'claimed' }));

    const module = await Test.createTestingModule({
      providers: [
        PaymentReconcileService,
        { provide: getModelToken(Checkout.name), useValue: checkoutModel },
        { provide: getModelToken(Payment.name), useValue: paymentModel },
        { provide: PayosService, useValue: payos },
        { provide: PaymentResultService, useValue: paymentResult },
      ],
    }).compile();
    service = module.get(PaymentReconcileService);
  });

  describe('handleWebhook', () => {
    it('sai chữ ký: 400 và vẫn ghi log', async () => {
      payos.verifyWebhook.mockRejectedValue(new Error('Data not integrity'));

      await expect(service.handleWebhook(webhookBody())).rejects.toThrow(
        BadRequestException,
      );
      expect(paymentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          source: PaymentSource.WEBHOOK,
          isValidSignature: false,
          note: PaymentNote.INVALID_SIGNATURE,
        }),
      );
      expect(paymentResult.markPaid).not.toHaveBeenCalled();
    });

    it('thanh toán đủ tiền: markPaid với reference của webhook', async () => {
      const body = webhookBody();
      const checkout = makeCheckout();
      payos.verifyWebhook.mockResolvedValue(body.data);
      checkoutModel.findOne.mockReturnValue(chain(checkout));
      paymentResult.markPaid.mockResolvedValue('paid');

      await service.handleWebhook(body);

      expect(paymentResult.markPaid).toHaveBeenCalledWith(
        checkout._id,
        'FT123',
      );
      expect(paymentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          checkoutId: checkout._id,
          isValidSignature: true,
          isSuccess: true,
          note: PaymentNote.PAID,
          payosData: body,
        }),
      );
    });

    it('không tìm thấy orderCode (vd request thử khi đăng ký webhook): không lỗi', async () => {
      const body = webhookBody();
      payos.verifyWebhook.mockResolvedValue(body.data);
      checkoutModel.findOne.mockReturnValue(chain(null));

      await expect(service.handleWebhook(body)).resolves.toBeUndefined();
      expect(loggedNote()).toBe(PaymentNote.CHECKOUT_NOT_FOUND);
    });

    it('chuyển dư tiền: vẫn xác nhận đơn, ghi overpaid để Admin hoàn phần dư', async () => {
      const body = webhookBody(400000);
      const checkout = makeCheckout();
      payos.verifyWebhook.mockResolvedValue(body.data);
      checkoutModel.findOne.mockReturnValue(chain(checkout));
      paymentResult.markPaid.mockResolvedValue('paid');

      await service.handleWebhook(body);

      expect(paymentResult.markPaid).toHaveBeenCalledWith(
        checkout._id,
        'FT123',
      );
      expect(loggedNote()).toBe(PaymentNote.OVERPAID);
    });

    it('chuyển thiếu: không xác nhận, tra cứu PayOS ngay để cộng dồn các lần chuyển', async () => {
      const body = webhookBody(100000);
      const checkout = makeCheckout();
      payos.verifyWebhook.mockResolvedValue(body.data);
      checkoutModel.findOne.mockReturnValue(chain(checkout));
      payos.getPaymentLink.mockResolvedValue(paymentLink('UNDERPAID', 100000));
      paymentModel.exists.mockReturnValue(chain({ _id: 'logged' }));

      await service.handleWebhook(body);

      expect(paymentResult.markPaid).not.toHaveBeenCalled();
      expect(paymentModel.create.mock.calls[0][0].note).toBe(
        PaymentNote.UNDERPAID,
      );
      expect(payos.getPaymentLink).toHaveBeenCalledWith(ORDER_CODE);
      expect(paymentModel.create).toHaveBeenCalledTimes(1);
    });

    it('lần chuyển thứ hai đủ tổng tiền: PayOS báo PAID → xác nhận đơn', async () => {
      const body = webhookBody(200000);
      const checkout = makeCheckout();
      payos.verifyWebhook.mockResolvedValue(body.data);
      checkoutModel.findOne.mockReturnValue(chain(checkout));
      payos.getPaymentLink.mockResolvedValue(paymentLink('PAID', 300000));
      paymentResult.markPaid.mockResolvedValue('paid');

      await service.handleWebhook(body);

      expect(paymentResult.markPaid).toHaveBeenCalledWith(
        checkout._id,
        'FT999',
      );
    });

    it('code khác "00": chỉ ghi log', async () => {
      const body = webhookBody(300000, '01');
      payos.verifyWebhook.mockResolvedValue(body.data);
      checkoutModel.findOne.mockReturnValue(chain(makeCheckout()));

      await service.handleWebhook(body);

      expect(paymentResult.markPaid).not.toHaveBeenCalled();
      expect(loggedNote()).toBe(PaymentNote.NOT_SUCCESS_CODE);
    });

    it.each([
      [CheckoutStatus.PAID, PaymentNote.ALREADY_PROCESSED],
      [CheckoutStatus.EXPIRED, PaymentNote.LATE_SUCCESS],
      [CheckoutStatus.FAILED, PaymentNote.LATE_SUCCESS],
    ])('Checkout đã %s: ghi %s', async (status, note) => {
      const body = webhookBody();
      payos.verifyWebhook.mockResolvedValue(body.data);
      checkoutModel.findOne.mockReturnValue(chain(makeCheckout()));
      paymentResult.markPaid.mockResolvedValue('not_pending');
      checkoutModel.findById.mockReturnValue(chain({ status }));

      await service.handleWebhook(body);

      expect(loggedNote()).toBe(note);
    });
  });

  describe('syncCheckout', () => {
    it('PAID: markPaid với số tiền đã trả và reference giao dịch', async () => {
      const checkout = makeCheckout();
      payos.getPaymentLink.mockResolvedValue(paymentLink('PAID'));
      paymentResult.markPaid.mockResolvedValue('paid');

      await service.syncCheckout(checkout);

      expect(payos.getPaymentLink).toHaveBeenCalledWith(ORDER_CODE);
      expect(paymentResult.markPaid).toHaveBeenCalledWith(
        checkout._id,
        'FT999',
      );
      expect(paymentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          source: PaymentSource.SYNC,
          note: PaymentNote.PAID,
        }),
      );
    });

    it('PAID với amountPaid lớn hơn tổng tiền: vẫn xác nhận, ghi overpaid', async () => {
      const checkout = makeCheckout();
      payos.getPaymentLink.mockResolvedValue(paymentLink('PAID', 350000));
      paymentResult.markPaid.mockResolvedValue('paid');

      await service.syncCheckout(checkout);

      expect(paymentResult.markPaid).toHaveBeenCalledWith(
        checkout._id,
        'FT999',
      );
      expect(loggedNote()).toBe(PaymentNote.OVERPAID);
    });

    it.each([
      ['CANCELLED', CheckoutStatus.FAILED, CANCEL_REASON_BUYER],
      ['FAILED', CheckoutStatus.FAILED, CANCEL_REASON_BUYER],
      ['EXPIRED', CheckoutStatus.EXPIRED, CANCEL_REASON_EXPIRED],
    ])('%s: hủy Checkout (%s)', async (payosStatus, status, reason) => {
      const checkout = makeCheckout();
      payos.getPaymentLink.mockResolvedValue(paymentLink(payosStatus, 0));

      await service.syncCheckout(checkout);

      expect(paymentResult.cancelCheckout).toHaveBeenCalledWith(
        checkout._id,
        status,
        reason,
      );
    });

    it.each(['PENDING', 'PROCESSING'])(
      '%s: không làm gì, không ghi log',
      async (s) => {
        payos.getPaymentLink.mockResolvedValue(paymentLink(s, 0));

        await service.syncCheckout(makeCheckout());

        expect(paymentResult.markPaid).not.toHaveBeenCalled();
        expect(paymentResult.cancelCheckout).not.toHaveBeenCalled();
        expect(paymentModel.create).not.toHaveBeenCalled();
      },
    );

    it('UNDERPAID: ghi log 1 lần để Admin hoàn tiền, không ghi trùng', async () => {
      payos.getPaymentLink.mockResolvedValue(paymentLink('UNDERPAID', 100000));

      await service.syncCheckout(makeCheckout());
      expect(loggedNote()).toBe(PaymentNote.UNDERPAID);

      paymentModel.create.mockClear();
      paymentModel.exists.mockReturnValue(chain({ _id: 'existing' }));
      await service.syncCheckout(makeCheckout());
      expect(paymentModel.create).not.toHaveBeenCalled();
    });

    it('vừa đồng bộ trong 10 giây: bỏ qua, không gọi PayOS', async () => {
      checkoutModel.findOneAndUpdate.mockReturnValue(chain(null));

      await service.syncCheckout(makeCheckout());

      expect(payos.getPaymentLink).not.toHaveBeenCalled();
    });

    it('force bỏ qua giới hạn tần suất', async () => {
      checkoutModel.findOneAndUpdate.mockReturnValue(chain(null));
      payos.getPaymentLink.mockResolvedValue(paymentLink('PENDING', 0));

      await service.syncCheckout(makeCheckout(), { force: true });

      expect(payos.getPaymentLink).toHaveBeenCalled();
    });

    it('Checkout không còn pending: không gọi PayOS', async () => {
      await service.syncCheckout(makeCheckout({ status: CheckoutStatus.PAID }));

      expect(payos.getPaymentLink).not.toHaveBeenCalled();
    });

    it('PayOS lỗi mạng: nuốt lỗi, giữ nguyên trạng thái', async () => {
      payos.getPaymentLink.mockRejectedValue(new Error('timeout'));

      await expect(
        service.syncCheckout(makeCheckout()),
      ).resolves.toBeUndefined();
      expect(paymentResult.cancelCheckout).not.toHaveBeenCalled();
    });
  });

  describe('expireOverdue', () => {
    const now = new Date('2026-10-02T10:35:00.000Z');

    it('chưa thanh toán: hủy link PayOS rồi chuyển expired', async () => {
      const checkout = makeCheckout();
      checkoutModel.find.mockReturnValue(chain([checkout]));
      payos.getPaymentLink.mockResolvedValue(paymentLink('PENDING', 0));
      checkoutModel.findById.mockReturnValue(
        chain({ status: CheckoutStatus.PENDING }),
      );
      payos.cancelPaymentLink.mockResolvedValue(paymentLink('CANCELLED', 0));

      await expect(service.expireOverdue(now)).resolves.toBe(1);

      expect(payos.cancelPaymentLink).toHaveBeenCalledWith(
        ORDER_CODE,
        CANCEL_REASON_EXPIRED,
      );
      expect(paymentResult.cancelCheckout).toHaveBeenCalledWith(
        checkout._id,
        CheckoutStatus.EXPIRED,
        CANCEL_REASON_EXPIRED,
      );
    });

    it.each([300000, 350000])(
      'PayOS báo đã trả %i lúc quét: chuyển paid, không bao giờ hủy',
      async (amountPaid) => {
        const checkout = makeCheckout();
        checkoutModel.find.mockReturnValue(chain([checkout]));
        payos.getPaymentLink.mockResolvedValue(paymentLink('PAID', amountPaid));
        paymentResult.markPaid.mockResolvedValue('paid');
        checkoutModel.findById.mockReturnValue(
          chain({ status: CheckoutStatus.PAID }),
        );

        await expect(service.expireOverdue(now)).resolves.toBe(0);

        expect(payos.cancelPaymentLink).not.toHaveBeenCalled();
        expect(paymentResult.cancelCheckout).not.toHaveBeenCalled();
      },
    );

    it('hủy link lỗi khi mới quá hạn: để lần sau thử lại', async () => {
      checkoutModel.find.mockReturnValue(chain([makeCheckout()]));
      payos.getPaymentLink.mockResolvedValue(paymentLink('PENDING', 0));
      checkoutModel.findById.mockReturnValue(
        chain({ status: CheckoutStatus.PENDING }),
      );
      payos.cancelPaymentLink.mockRejectedValue(new Error('timeout'));

      await expect(service.expireOverdue(now)).resolves.toBe(0);
      expect(paymentResult.cancelCheckout).not.toHaveBeenCalled();
    });

    it('hủy link vẫn lỗi sau giới hạn: vẫn expired để trả stock', async () => {
      const checkout = makeCheckout();
      const late = new Date(
        checkout.expiresAt.getTime() + EXPIRY_HARD_LIMIT_MS + 1000,
      );
      checkoutModel.find.mockReturnValue(chain([checkout]));
      payos.getPaymentLink.mockRejectedValue(new Error('down'));
      checkoutModel.findById.mockReturnValue(
        chain({ status: CheckoutStatus.PENDING }),
      );
      payos.cancelPaymentLink.mockRejectedValue(new Error('down'));

      await expect(service.expireOverdue(late)).resolves.toBe(1);
      expect(paymentResult.cancelCheckout).toHaveBeenCalled();
    });
  });
});

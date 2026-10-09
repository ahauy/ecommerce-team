import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentLink, WebhookData } from '@payos/node';
import { PayosService } from '../payments/payos.service';
import {
  Payment,
  PaymentDocument,
  PaymentNote,
  PaymentSource,
} from '../payments/schemas/payment.schema';
import {
  Checkout,
  CheckoutDocument,
  CheckoutStatus,
} from './schemas/checkout.schema';
import { PaymentResultService } from './payment-result.service';

export const SYNC_THROTTLE_MS = 10_000;
export const EXPIRY_BATCH_SIZE = 50;
export const EXPIRY_HARD_LIMIT_MS = 10 * 60 * 1000;

export const CANCEL_REASON_BUYER = 'Người mua hủy thanh toán';
export const CANCEL_REASON_EXPIRED = 'Hết hạn thanh toán';

export interface ReconcileCheckout {
  _id: Types.ObjectId;
  status: CheckoutStatus;
  totalAmount: number;
  payosOrderCode: number;
  expiresAt: Date;
}

const SUCCESS_CODE = '00';

@Injectable()
export class PaymentReconcileService {
  private readonly logger = new Logger(PaymentReconcileService.name);

  constructor(
    @InjectModel(Checkout.name)
    private readonly checkoutModel: Model<CheckoutDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    private readonly payos: PayosService,
    private readonly paymentResult: PaymentResultService,
  ) {}

  async handleWebhook(body: unknown): Promise<void> {
    let data: WebhookData;
    try {
      data = await this.payos.verifyWebhook(body);
    } catch {
      await this.log({
        source: PaymentSource.WEBHOOK,
        payosData: body,
        isValidSignature: false,
        isSuccess: false,
        note: PaymentNote.INVALID_SIGNATURE,
      });
      throw new BadRequestException('Chữ ký webhook không hợp lệ');
    }

    const isSuccess =
      (body as { code?: unknown }).code === SUCCESS_CODE &&
      data.code === SUCCESS_CODE;
    const checkout = await this.findByOrderCode(data.orderCode);

    let note: PaymentNote;
    if (!isSuccess) note = PaymentNote.NOT_SUCCESS_CODE;
    else if (!checkout) note = PaymentNote.CHECKOUT_NOT_FOUND;
    else note = await this.applyPayment(checkout, data.amount, data.reference);

    await this.log({
      checkoutId: checkout?._id ?? null,
      source: PaymentSource.WEBHOOK,
      payosData: body,
      isValidSignature: true,
      isSuccess,
      note,
    });

    if (checkout && note === PaymentNote.UNDERPAID) {
      await this.syncCheckout(checkout, { force: true });
    }
  }

  async syncCheckout(
    checkout: ReconcileCheckout,
    options: { force?: boolean } = {},
  ): Promise<void> {
    if (checkout.status !== CheckoutStatus.PENDING) return;
    if (!options.force && !(await this.claimSyncSlot(checkout._id))) return;

    let link: PaymentLink;
    try {
      link = await this.payos.getPaymentLink(checkout.payosOrderCode);
    } catch (err: unknown) {
      this.logger.warn(
        `Không tra cứu được PayOS cho orderCode ${checkout.payosOrderCode}: ${String(err)}`,
      );
      return;
    }

    let note: PaymentNote;
    switch (link.status) {
      case 'PAID':
        note = await this.applyPayment(
          checkout,
          link.amountPaid,
          link.transactions[0]?.reference ?? null,
        );
        break;
      case 'CANCELLED':
      case 'FAILED':
        await this.paymentResult.cancelCheckout(
          checkout._id,
          CheckoutStatus.FAILED,
          CANCEL_REASON_BUYER,
        );
        note = PaymentNote.CANCELLED;
        break;
      case 'EXPIRED':
        await this.paymentResult.cancelCheckout(
          checkout._id,
          CheckoutStatus.EXPIRED,
          CANCEL_REASON_EXPIRED,
        );
        note = PaymentNote.EXPIRED;
        break;
      case 'UNDERPAID':
        if (await this.hasNote(checkout._id, PaymentNote.UNDERPAID)) return;
        note = PaymentNote.UNDERPAID;
        break;
      default:
        return;
    }

    await this.log({
      checkoutId: checkout._id,
      source: PaymentSource.SYNC,
      payosData: link,
      isValidSignature: true,
      isSuccess: link.status === 'PAID',
      note,
    });
  }

  async expireOverdue(now = new Date()): Promise<number> {
    const overdue = await this.checkoutModel
      .find({ status: CheckoutStatus.PENDING, expiresAt: { $lt: now } })
      .sort({ expiresAt: 1 })
      .limit(EXPIRY_BATCH_SIZE)
      .select('status totalAmount payosOrderCode expiresAt')
      .lean<ReconcileCheckout[]>()
      .exec();

    let expired = 0;
    for (const checkout of overdue) {
      await this.syncCheckout(checkout, { force: true });

      const fresh = await this.checkoutModel
        .findById(checkout._id)
        .select('status')
        .lean<{ status: CheckoutStatus }>()
        .exec();
      if (fresh?.status !== CheckoutStatus.PENDING) continue;

      try {
        await this.payos.cancelPaymentLink(
          checkout.payosOrderCode,
          CANCEL_REASON_EXPIRED,
        );
      } catch (err: unknown) {
        const overdueMs = now.getTime() - checkout.expiresAt.getTime();
        if (overdueMs < EXPIRY_HARD_LIMIT_MS) {
          this.logger.warn(
            `Chưa hủy được link PayOS ${checkout.payosOrderCode}, thử lại lần sau: ${String(err)}`,
          );
          continue;
        }
      }

      const cancelled = await this.paymentResult.cancelCheckout(
        checkout._id,
        CheckoutStatus.EXPIRED,
        CANCEL_REASON_EXPIRED,
      );
      if (cancelled) expired++;
    }

    return expired;
  }

  private async applyPayment(
    checkout: ReconcileCheckout,
    amount: number,
    reference: string | null,
  ): Promise<PaymentNote> {
    if (amount < checkout.totalAmount) return PaymentNote.UNDERPAID;

    const outcome = await this.paymentResult.markPaid(checkout._id, reference);
    if (outcome === 'paid') {
      return amount > checkout.totalAmount
        ? PaymentNote.OVERPAID
        : PaymentNote.PAID;
    }

    const current = await this.checkoutModel
      .findById(checkout._id)
      .select('status')
      .lean<{ status: CheckoutStatus }>()
      .exec();
    return current?.status === CheckoutStatus.PAID
      ? PaymentNote.ALREADY_PROCESSED
      : PaymentNote.LATE_SUCCESS;
  }

  private async claimSyncSlot(checkoutId: Types.ObjectId): Promise<boolean> {
    const now = new Date();
    const claimed = await this.checkoutModel
      .findOneAndUpdate(
        {
          _id: checkoutId,
          status: CheckoutStatus.PENDING,
          $or: [
            { lastSyncedAt: null },
            {
              lastSyncedAt: {
                $lt: new Date(now.getTime() - SYNC_THROTTLE_MS),
              },
            },
          ],
        },
        { $set: { lastSyncedAt: now } },
      )
      .select('_id')
      .lean()
      .exec();
    return claimed !== null;
  }

  private findByOrderCode(orderCode: number) {
    return this.checkoutModel
      .findOne({ payosOrderCode: orderCode })
      .select('status totalAmount payosOrderCode expiresAt')
      .lean<ReconcileCheckout>()
      .exec();
  }

  private async hasNote(
    checkoutId: Types.ObjectId,
    note: PaymentNote,
  ): Promise<boolean> {
    const found = await this.paymentModel.exists({ checkoutId, note }).exec();
    return found !== null;
  }

  private async log(entry: {
    checkoutId?: Types.ObjectId | null;
    source: PaymentSource;
    payosData: unknown;
    isValidSignature: boolean;
    isSuccess: boolean;
    note: PaymentNote;
  }): Promise<void> {
    try {
      await this.paymentModel.create({ checkoutId: null, ...entry });
    } catch (err: unknown) {
      this.logger.error(`Không ghi được log thanh toán: ${String(err)}`);
    }
  }
}

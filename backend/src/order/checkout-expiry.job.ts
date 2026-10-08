import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentReconcileService } from './payment-reconcile.service';

@Injectable()
export class CheckoutExpiryJob {
  private readonly logger = new Logger(CheckoutExpiryJob.name);
  private running = false;

  constructor(private readonly reconcile: PaymentReconcileService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async run(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const expired = await this.reconcile.expireOverdue();
      if (expired > 0) {
        this.logger.log(`Đã hủy ${expired} checkout quá hạn thanh toán`);
      }
    } catch (err: unknown) {
      this.logger.error(`Lỗi khi xử lý checkout quá hạn: ${String(err)}`);
    } finally {
      this.running = false;
    }
  }
}

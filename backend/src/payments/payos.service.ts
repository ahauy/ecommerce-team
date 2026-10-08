import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreatePaymentLinkRequest,
  CreatePaymentLinkResponse,
  PaymentLink,
  PayOS,
  Webhook,
  WebhookData,
} from '@payos/node';

export const PAYOS_TIMEOUT_MS = 15_000;

@Injectable()
export class PayosService {
  private readonly client: PayOS;

  constructor(config: ConfigService) {
    this.client = new PayOS({
      clientId: config.getOrThrow<string>('PAYOS_CLIENT_ID'),
      apiKey: config.getOrThrow<string>('PAYOS_API_KEY'),
      checksumKey: config.getOrThrow<string>('PAYOS_CHECKSUM_KEY'),
      timeout: PAYOS_TIMEOUT_MS,
    });
  }

  createPaymentLink(
    request: CreatePaymentLinkRequest,
  ): Promise<CreatePaymentLinkResponse> {
    return this.client.paymentRequests.create(request);
  }

  getPaymentLink(orderCode: number): Promise<PaymentLink> {
    return this.client.paymentRequests.get(orderCode);
  }

  cancelPaymentLink(orderCode: number, reason: string): Promise<PaymentLink> {
    return this.client.paymentRequests.cancel(orderCode, reason);
  }

  verifyWebhook(body: unknown): Promise<WebhookData> {
    return this.client.webhooks.verify(body as Webhook);
  }
}

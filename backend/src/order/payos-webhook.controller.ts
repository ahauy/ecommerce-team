import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentReconcileService } from './payment-reconcile.service';

@ApiTags('Payments')
@Controller('payments/payos')
export class PayosWebhookController {
  constructor(private readonly reconcile: PaymentReconcileService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PayOS webhook (server-to-server)' })
  @ApiResponse({ status: 200, description: 'Signature valid' })
  @ApiResponse({ status: 400, description: 'Invalid signature' })
  async handle(@Body() body: unknown): Promise<{ success: true }> {
    await this.reconcile.handleWebhook(body);
    return { success: true };
  }
}

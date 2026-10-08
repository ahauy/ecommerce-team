import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckoutService } from './checkout.service';
import { CheckoutResultDto } from './dto/checkout-response.dto';

interface AuthRequest {
  user: { id: string };
}

@ApiTags('Orders')
@Controller('checkouts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CheckoutsController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Get(':checkoutCode')
  @ApiOperation({ summary: 'Checkout result (syncs with PayOS when pending)' })
  @ApiResponse({ status: 200, description: 'Checkout status and orders' })
  @ApiResponse({ status: 404, description: 'Not found or not owner' })
  getResult(
    @Request() req: AuthRequest,
    @Param('checkoutCode') checkoutCode: string,
  ): Promise<CheckoutResultDto> {
    return this.checkoutService.getCheckoutResult(req.user.id, checkoutCode);
  }
}

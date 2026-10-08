import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateCheckoutResponseDto } from './dto/checkout-response.dto';

interface AuthRequest {
  user: { id: string };
}

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a checkout (N orders, one per seller)' })
  @ApiResponse({ status: 201, description: 'Checkout created, paymentUrl' })
  @ApiResponse({ status: 400, description: 'Validation / stock shortage' })
  @ApiResponse({ status: 403, description: 'Admin cannot buy' })
  @ApiResponse({ status: 502, description: 'PayOS payment link failed' })
  create(
    @Request() req: AuthRequest,
    @Body() dto: CreateCheckoutDto,
  ): Promise<CreateCheckoutResponseDto> {
    return this.checkoutService.createCheckout(req.user.id, dto);
  }
}

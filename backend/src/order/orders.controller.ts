import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { UserRole } from '../users/schemas/user.schema';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateCheckoutResponseDto } from './dto/checkout-response.dto';
import {
  AdminListOrdersQueryDto,
  ListOrdersQueryDto,
} from './dto/order-query.dto';
import { OrderDto, PaginatedOrdersDto } from './dto/order-response.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderActor, OrderService } from './order.service';

interface AuthRequest {
  user: OrderActor;
}

const orderId = () => new ParseObjectIdPipe('Mã đơn hàng không hợp lệ');

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Not logged in' })
export class OrdersController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly orderService: OrderService,
  ) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
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

  @Get('my')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'My purchased orders (newest first)' })
  getMyOrders(
    @Request() req: AuthRequest,
    @Query() query: ListOrdersQueryDto,
  ): Promise<PaginatedOrdersDto> {
    return this.orderService.listForBuyer(req.user.id, query);
  }

  @Get('my/:id')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'My purchased order detail' })
  @ApiResponse({ status: 404, description: 'Not found or not mine' })
  getMyOrder(
    @Request() req: AuthRequest,
    @Param('id', orderId()) id: string,
  ): Promise<OrderDto> {
    return this.orderService.getForBuyer(req.user.id, id);
  }

  @Get('selling')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Orders of my shop (newest first)' })
  getSellingOrders(
    @Request() req: AuthRequest,
    @Query() query: ListOrdersQueryDto,
  ): Promise<PaginatedOrdersDto> {
    return this.orderService.listForSeller(req.user.id, query);
  }

  @Get('selling/:id')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Order detail of my shop' })
  @ApiResponse({ status: 404, description: 'Not found or other shop' })
  getSellingOrder(
    @Request() req: AuthRequest,
    @Param('id', orderId()) id: string,
  ): Promise<OrderDto> {
    return this.orderService.getForSeller(req.user.id, id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'All orders (admin, filter status/sellerId/userId)',
  })
  @ApiResponse({ status: 403, description: 'Admin only' })
  getAllOrders(
    @Query() query: AdminListOrdersQueryDto,
  ): Promise<PaginatedOrdersDto> {
    return this.orderService.listForAdmin(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Any order detail (admin)' })
  @ApiResponse({ status: 403, description: 'Admin only' })
  @ApiResponse({ status: 404, description: 'Not found' })
  getOrder(@Param('id', orderId()) id: string): Promise<OrderDto> {
    return this.orderService.getForAdmin(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update order status (seller of the order or admin)',
  })
  @ApiResponse({ status: 200, description: 'Updated order' })
  @ApiResponse({
    status: 400,
    description: 'Invalid transition / missing reason',
  })
  @ApiResponse({
    status: 403,
    description: 'Not the seller / refund by seller',
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Status changed concurrently' })
  updateStatus(
    @Request() req: AuthRequest,
    @Param('id', orderId()) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderDto> {
    return this.orderService.updateStatus(req.user, id, dto);
  }
}

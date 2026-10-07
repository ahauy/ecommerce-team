import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
import { CartService } from './cart.service';
import {
  AddCartItemDto,
  MergeCartDto,
  UpdateCartItemDto,
} from './dto/cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';

interface AuthRequest {
  user: { id: string };
}

const productId = () => new ParseObjectIdPipe('Mã sản phẩm không hợp lệ');

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Not logged in' })
@ApiResponse({ status: 403, description: 'Admin cannot use cart' })
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get cart grouped by seller' })
  getCart(@Request() req: AuthRequest): Promise<CartResponseDto> {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add a product (quantity is accumulated)' })
  @ApiResponse({ status: 400, description: 'Own / unavailable / over stock' })
  addItem(
    @Request() req: AuthRequest,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addItem(req.user.id, dto);
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Set quantity of a cart item' })
  @ApiResponse({ status: 400, description: 'Unavailable / over stock' })
  @ApiResponse({ status: 404, description: 'Item not in cart' })
  updateItem(
    @Request() req: AuthRequest,
    @Param('productId', productId()) id: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItem(req.user.id, id, dto);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove a cart item (idempotent)' })
  removeItem(
    @Request() req: AuthRequest,
    @Param('productId', productId()) id: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(req.user.id, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear the cart' })
  clear(@Request() req: AuthRequest): Promise<CartResponseDto> {
    return this.cartService.clear(req.user.id);
  }

  @Post('merge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Merge guest localStorage cart after login' })
  merge(
    @Request() req: AuthRequest,
    @Body() dto: MergeCartDto,
  ): Promise<CartResponseDto> {
    return this.cartService.merge(req.user.id, dto);
  }
}

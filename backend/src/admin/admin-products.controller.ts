import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { UserRole } from '../users/schemas/user.schema';
import { AdminProductsService } from './admin-products.service';
import {
  AdminProductDto,
  PaginatedAdminProductsDto,
} from './dto/admin-product.dto';
import { AdminProductsQueryDto } from './dto/admin-products-query.dto';
import { BlockProductDto } from './dto/block-product.dto';

const productId = () => new ParseObjectIdPipe('Mã sản phẩm không hợp lệ');

@ApiTags('Admin - Products')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Not logged in' })
@ApiResponse({ status: 403, description: 'Admin only' })
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'All products incl. hidden / blocked (filter isBlocked, sellerId)',
  })
  @ApiResponse({ status: 200, description: 'Paginated products' })
  list(
    @Query() query: AdminProductsQueryDto,
  ): Promise<PaginatedAdminProductsDto> {
    return this.adminProductsService.list(query);
  }

  @Patch(':id/block')
  @ApiOperation({ summary: 'Block a violating product (reason required)' })
  @ApiParam({ name: 'id', example: '66a1b2c3d4e5f67890123456' })
  @ApiResponse({ status: 200, description: 'Product blocked' })
  @ApiResponse({ status: 400, description: 'Missing reason / already blocked' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  block(
    @Param('id', productId()) id: string,
    @Body() dto: BlockProductDto,
  ): Promise<AdminProductDto> {
    return this.adminProductsService.block(id, dto.reason);
  }

  @Patch(':id/unblock')
  @ApiOperation({ summary: 'Unblock a product' })
  @ApiParam({ name: 'id', example: '66a1b2c3d4e5f67890123456' })
  @ApiResponse({ status: 200, description: 'Product unblocked' })
  @ApiResponse({
    status: 400,
    description: 'Not blocked / seller still banned',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  unblock(@Param('id', productId()) id: string): Promise<AdminProductDto> {
    return this.adminProductsService.unblock(id);
  }
}

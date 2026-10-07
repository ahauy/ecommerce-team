import {
  Body,
  Controller,
  Delete,
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
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { ShopRequiredGuard } from '../auth/guards/shop-required.guard';
import { UserRole } from '../users/schemas/user.schema';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { AuthUser, ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ListProductsQueryDto,
  PaginationQueryDto,
} from './dto/list-products-query.dto';

interface AuthRequest {
  user: AuthUser;
}
interface OptionalAuthRequest {
  user?: AuthUser | null;
}

const productId = () => new ParseObjectIdPipe('Mã sản phẩm không hợp lệ');

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List visible products (search, filter, paginate)' })
  @ApiResponse({ status: 200, description: 'Paginated visible products' })
  @ApiResponse({ status: 400, description: 'Invalid query params' })
  findAll(@Query() query: ListProductsQueryDto) {
    return this.productsService.findPublic(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my products (incl. hidden / blocked)' })
  @ApiResponse({ status: 200, description: 'Paginated own products' })
  findMine(@Request() req: AuthRequest, @Query() query: PaginationQueryDto) {
    return this.productsService.findMine(req.user, query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Product detail (hidden/blocked: owner/admin only)',
  })
  @ApiResponse({ status: 200, description: 'Product detail' })
  @ApiResponse({ status: 404, description: 'Not found or not visible' })
  findOne(
    @Param('id', productId()) id: string,
    @Request() req: OptionalAuthRequest,
  ) {
    return this.productsService.findOne(id, req.user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, ShopRequiredGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product (requires shop setup)' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Admin / shop not set up' })
  create(@Request() req: AuthRequest, @Body() dto: CreateProductDto) {
    return this.productsService.create(req.user, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (owner or admin)' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 403, description: 'Not owner / product is blocked' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id', productId()) id: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, req.user, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hide a product (soft delete, owner or admin)' })
  @ApiResponse({ status: 200, description: 'Product hidden' })
  @ApiResponse({ status: 403, description: 'Not owner' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id', productId()) id: string, @Request() req: AuthRequest) {
    return this.productsService.remove(id, req.user);
  }
}

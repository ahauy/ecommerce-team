import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ShopsService } from './shops.service';
import { PublicShopResponseDto } from './dto/public-shop.dto';

@ApiTags('Shops')
@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get(':sellerId')
  @ApiOperation({ summary: 'Get public shop information' })
  @ApiParam({
    name: 'sellerId',
    description: 'Seller user ID',
    example: '66a1b2c3d4e5f6789012345',
  })
  @ApiResponse({ status: 200, type: PublicShopResponseDto })
  @ApiResponse({ status: 404, description: 'Shop not found or seller banned' })
  async getPublicShop(
    @Param('sellerId') sellerId: string,
  ): Promise<PublicShopResponseDto> {
    return this.shopsService.getPublicShop(sellerId);
  }
}

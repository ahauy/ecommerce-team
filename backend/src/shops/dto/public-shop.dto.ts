import { ApiProperty } from '@nestjs/swagger';

export class PublicShopResponseDto {
  @ApiProperty({ example: '66a1b2c3d4e5f6789012345' })
  sellerId: string;

  @ApiProperty({ example: 'My Awesome Shop' })
  shopName: string;

  @ApiProperty({ example: 'my-awesome-shop' })
  shopSlug: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  joinedAt: Date;

  @ApiProperty({ example: 5 })
  productCount: number;
}

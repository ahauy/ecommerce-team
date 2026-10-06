import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

export class ShopProfileDto {
  @ApiProperty({ example: 'My Awesome Shop' })
  shopName: string;

  @ApiProperty({ example: 'my-awesome-shop' })
  shopSlug: string;

  @ApiProperty({ example: '123 Nguyen Van Linh, District 7, HCMC' })
  pickupAddress: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  joinedAt: Date;
}

export class GetProfileResponseDto {
  @ApiProperty({ example: '66a1b2c3d4e5f6789012345' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  fullName: string;

  @ApiPropertyOptional({ example: '0987654321' })
  phone?: string | null;

  @ApiPropertyOptional({ example: '123 Le Loi, District 1, HCMC' })
  address?: string | null;

  @ApiProperty({ example: 'customer', enum: ['customer', 'admin'] })
  role: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ type: ShopProfileDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => ShopProfileDto)
  shop: ShopProfileDto | null;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { OrderStatus } from '../schemas/order.schema';

export class ListOrdersQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page phải là số nguyên' })
  @Min(1, { message: 'page phải >= 1' })
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit phải >= 1' })
  @Max(100, { message: 'limit tối đa là 100' })
  limit: number = 10;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Trạng thái đơn hàng không hợp lệ' })
  status?: OrderStatus;
}

export class AdminListOrdersQueryDto extends ListOrdersQueryDto {
  @ApiPropertyOptional({ description: 'Lọc theo người bán' })
  @IsOptional()
  @IsMongoId({ message: 'sellerId không hợp lệ' })
  sellerId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo người mua' })
  @IsOptional()
  @IsMongoId({ message: 'userId không hợp lệ' })
  userId?: string;
}

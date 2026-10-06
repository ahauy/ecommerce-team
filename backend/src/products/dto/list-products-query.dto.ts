import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export const PRODUCT_SORT_FIELDS = ['price', 'createdAt', 'name'] as const;
export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number];

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page phải là số nguyên' })
  @Min(1, { message: 'page phải >= 1' })
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit phải >= 1' })
  @Max(100, { message: 'limit tối đa là 100' })
  limit: number = 20;
}

export class ListProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Tìm theo tên (text search)' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId({ message: 'categoryId không hợp lệ' })
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo người bán (trang shop)' })
  @IsOptional()
  @IsMongoId({ message: 'sellerId không hợp lệ' })
  sellerId?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'minPrice phải là số nguyên' })
  @Min(0, { message: 'minPrice phải >= 0' })
  minPrice?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'maxPrice phải là số nguyên' })
  @Min(0, { message: 'maxPrice phải >= 0' })
  maxPrice?: number;

  @ApiPropertyOptional({ enum: PRODUCT_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(PRODUCT_SORT_FIELDS, {
    message: `sortBy phải là một trong: ${PRODUCT_SORT_FIELDS.join(', ')}`,
  })
  sortBy: ProductSortField = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'order phải là asc hoặc desc' })
  order: 'asc' | 'desc' = 'desc';
}

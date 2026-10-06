import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  MAX_PRODUCT_IMAGES,
  MAX_PRODUCT_NAME_LENGTH,
} from '../schemas/product.schema';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateProductDto {
  @ApiPropertyOptional({ maxLength: MAX_PRODUCT_NAME_LENGTH })
  @IsOptional()
  @IsString({ message: 'Tên sản phẩm phải là chuỗi ký tự' })
  @Transform(trim)
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @MaxLength(MAX_PRODUCT_NAME_LENGTH, {
    message: `Tên sản phẩm không được vượt quá ${MAX_PRODUCT_NAME_LENGTH} ký tự`,
  })
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @Transform(trim)
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @MaxLength(5000, { message: 'Mô tả không được vượt quá 5000 ký tự' })
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: 'Giá phải là số nguyên (VNĐ)' })
  @Min(1, { message: 'Giá phải lớn hơn 0' })
  @Max(1_000_000_000, { message: 'Giá quá lớn' })
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: 'Tồn kho phải là số nguyên' })
  @Min(0, { message: 'Tồn kho không được âm' })
  @Max(1_000_000, { message: 'Tồn kho quá lớn' })
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId({ message: 'Mã danh mục không hợp lệ' })
  categoryId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray({ message: 'Ảnh phải là một mảng URL' })
  @ArrayMaxSize(MAX_PRODUCT_IMAGES, {
    message: `Tối đa ${MAX_PRODUCT_IMAGES} ảnh cho mỗi sản phẩm`,
  })
  @IsString({ each: true, message: 'URL ảnh phải là chuỗi ký tự' })
  images?: string[];

  @ApiPropertyOptional({ description: 'false = ẩn SP, true = hiện lại' })
  @IsOptional()
  @IsBoolean({ message: 'Trạng thái hiển thị phải là kiểu boolean' })
  isActive?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Tên danh mục (duy nhất, không phân biệt hoa thường/dấu)',
    example: 'Thiết Bị Điện Tử',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'Tên danh mục phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(2, { message: 'Tên danh mục phải có ít nhất 2 ký tự' })
  @MaxLength(50, { message: 'Tên danh mục không được vượt quá 50 ký tự' })
  name: string;

  @ApiPropertyOptional({
    description: 'Mô tả chi tiết danh mục',
    example: 'Điện thoại, máy tính bảng và phụ kiện công nghệ',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MaxLength(500, { message: 'Mô tả không được vượt quá 500 ký tự' })
  description?: string;

  @ApiPropertyOptional({
    description: 'URL ảnh đại diện hoặc icon của danh mục',
    example: 'https://res.cloudinary.com/teamshop/image/upload/electronics.png',
  })
  @IsOptional()
  @IsString({ message: 'Đường dẫn ảnh phải là chuỗi ký tự' })
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    { message: 'Đường dẫn ảnh không hợp lệ' },
  )
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái hiển thị công khai (mặc định: true)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Trạng thái kích hoạt phải là kiểu boolean' })
  isActive?: boolean;
}

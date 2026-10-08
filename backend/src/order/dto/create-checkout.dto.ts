import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { MAX_CART_ITEMS } from '../../cart/schemas/cart.schema';

export const MAX_ITEM_QUANTITY = 1_000_000;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CheckoutRecipientDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @Transform(trim)
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @MaxLength(100, { message: 'Họ tên không được vượt quá 100 ký tự' })
  fullName?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Transform(trim)
  @Matches(/^(\+84|0)[0-9]{9,10}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @ApiPropertyOptional({ example: 'a@example.com' })
  @IsOptional()
  @Transform(trim)
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email?: string;

  @ApiPropertyOptional({ example: '123 Nguyễn Huệ, Q1, TP.HCM' })
  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  @Transform(trim)
  @MinLength(5, { message: 'Địa chỉ nhận hàng quá ngắn' })
  @MaxLength(255, { message: 'Địa chỉ không được vượt quá 255 ký tự' })
  address?: string;
}

export class CheckoutItemDto {
  @ApiProperty({ example: '66a1b2c3d4e5f67890123456' })
  @IsMongoId({ message: 'Mã sản phẩm không hợp lệ' })
  productId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  @Max(MAX_ITEM_QUANTITY, { message: 'Số lượng quá lớn' })
  quantity: number;
}

export class CreateCheckoutDto {
  @ApiPropertyOptional({ type: CheckoutRecipientDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CheckoutRecipientDto)
  recipient?: CheckoutRecipientDto;

  @ApiProperty({ type: [CheckoutItemDto] })
  @IsArray({ message: 'Danh sách sản phẩm phải là một mảng' })
  @ArrayMinSize(1, { message: 'Vui lòng chọn ít nhất một sản phẩm' })
  @ArrayMaxSize(MAX_CART_ITEMS, {
    message: `Mỗi lần đặt tối đa ${MAX_CART_ITEMS} sản phẩm`,
  })
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];
}

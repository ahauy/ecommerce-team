import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsMongoId,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { MAX_CART_ITEMS } from '../schemas/cart.schema';

export const MAX_ITEM_QUANTITY = 1_000_000;

export class UpdateCartItemDto {
  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  @Max(MAX_ITEM_QUANTITY, { message: 'Số lượng quá lớn' })
  quantity: number;
}

export class AddCartItemDto extends UpdateCartItemDto {
  @ApiProperty({ example: '66a1b2c3d4e5f67890123456' })
  @IsMongoId({ message: 'Mã sản phẩm không hợp lệ' })
  productId: string;
}

export class MergeCartDto {
  @ApiProperty({ type: [AddCartItemDto] })
  @IsArray({ message: 'Danh sách sản phẩm phải là một mảng' })
  @ArrayMaxSize(MAX_CART_ITEMS, {
    message: `Giỏ hàng tối đa ${MAX_CART_ITEMS} sản phẩm`,
  })
  @ValidateNested({ each: true })
  @Type(() => AddCartItemDto)
  items: AddCartItemDto[];
}

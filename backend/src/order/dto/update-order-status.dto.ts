import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { OrderStatus } from '../schemas/order.schema';

export const MANUAL_TARGET_STATUSES = [
  OrderStatus.SHIPPING,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
] as const;

export type ManualTargetStatus = (typeof MANUAL_TARGET_STATUSES)[number];

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: MANUAL_TARGET_STATUSES, example: OrderStatus.SHIPPING })
  @IsIn(MANUAL_TARGET_STATUSES, {
    message:
      'Chỉ được chuyển đơn sang: shipping, delivered, cancelled hoặc refunded',
  })
  status: ManualTargetStatus;

  @ApiPropertyOptional({
    description: 'Bắt buộc khi hủy đơn',
    example: 'Hết hàng thực tế',
    maxLength: 500,
  })
  @ValidateIf(
    (dto: UpdateOrderStatusDto) => dto.status === OrderStatus.CANCELLED,
  )
  @IsString({ message: 'Lý do hủy phải là chuỗi ký tự' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'Vui lòng nhập lý do hủy đơn' })
  @MaxLength(500, { message: 'Lý do hủy không được vượt quá 500 ký tự' })
  reason?: string;
}

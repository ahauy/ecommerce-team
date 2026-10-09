import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class BlockProductDto {
  @ApiProperty({ example: 'Hàng giả, vi phạm chính sách sàn', maxLength: 500 })
  @IsString({ message: 'Lý do chặn phải là chuỗi ký tự' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'Vui lòng nhập lý do chặn sản phẩm' })
  @MinLength(5, { message: 'Lý do chặn phải có ít nhất 5 ký tự' })
  @MaxLength(500, { message: 'Lý do chặn không được vượt quá 500 ký tự' })
  reason: string;
}

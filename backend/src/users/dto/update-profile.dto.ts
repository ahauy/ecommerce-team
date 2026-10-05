import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Nguyen Van B',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'Họ tên phải từ 2-100 ký tự' })
  fullName?: string;

  @ApiPropertyOptional({
    example: '0987654321',
    pattern: '^(\\+84|0)[0-9]{9,10}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(\+84|0)[0-9]{9,10}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @ApiPropertyOptional({
    example: '456 Nguyen Hue, District 1, HCMC',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Địa chỉ tối đa 500 ký tự' })
  address?: string;
}

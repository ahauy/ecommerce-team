import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches, MinLength } from 'class-validator';

export class SetupShopDto {
  @ApiProperty({ example: 'My Awesome Shop', minLength: 3, maxLength: 50 })
  @IsString()
  @Length(3, 50, { message: 'Tên gian hàng phải từ 3-50 ký tự' })
  shopName: string;

  @ApiProperty({
    example: '123 Nguyen Van Linh, District 7, HCMC',
    minLength: 10,
  })
  @IsString()
  @MinLength(10, { message: 'Địa chỉ lấy hàng tối thiểu 10 ký tự' })
  pickupAddress: string;

  @ApiProperty({ example: '0901234567', pattern: '^(\\+84|0)[0-9]{9,10}$' })
  @IsString()
  @Matches(/^(\+84|0)[0-9]{9,10}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;
}

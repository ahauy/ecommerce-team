import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SetupShopDto } from '../setup-shop.dto';

describe('SetupShopDto', () => {
  it('should pass with valid shopName, pickupAddress, phone', async () => {
    const dto = plainToInstance(SetupShopDto, {
      shopName: 'My Awesome Shop',
      pickupAddress: '123 Nguyen Van Linh, District 7, HCMC',
      phone: '0901234567',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when shopName is too short', async () => {
    const dto = plainToInstance(SetupShopDto, {
      shopName: 'ab',
      pickupAddress: '1234567890',
      phone: '0901234567',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('shopName');
    expect(errors[0].constraints?.isLength).toContain('3-50 ký tự');
  });

  it('should fail when shopName is too long', async () => {
    const dto = plainToInstance(SetupShopDto, {
      shopName: 'a'.repeat(51),
      pickupAddress: '1234567890',
      phone: '0901234567',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('shopName');
  });

  it('should fail when pickupAddress is too short', async () => {
    const dto = plainToInstance(SetupShopDto, {
      shopName: 'Valid Name',
      pickupAddress: '123',
      phone: '0901234567',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('pickupAddress');
    expect(errors[0].constraints?.minLength).toContain('10 ký tự');
  });

  it('should fail with invalid phone', async () => {
    const dto = plainToInstance(SetupShopDto, {
      shopName: 'Valid Name',
      pickupAddress: '1234567890',
      phone: '123',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('phone');
    expect(errors[0].constraints?.matches).toContain('không hợp lệ');
  });

  it('should pass with valid VN phone (+84)', async () => {
    const dto = plainToInstance(SetupShopDto, {
      shopName: 'Valid Name',
      pickupAddress: '1234567890',
      phone: '+84901234567',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject unknown properties', async () => {
    const dto = plainToInstance(SetupShopDto, {
      shopName: 'Valid Name',
      pickupAddress: '1234567890',
      phone: '0901234567',
      unknownField: 'test',
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});

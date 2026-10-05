import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateProfileDto } from '../update-profile.dto';

describe('UpdateProfileDto', () => {
  it('should pass with valid fullName, phone, address', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      fullName: 'Nguyen Van B',
      phone: '0987654321',
      address: '456 Nguyen Hue, District 1, HCMC',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with only fullName', async () => {
    const dto = plainToInstance(UpdateProfileDto, { fullName: 'Nguyen Van B' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when fullName is too short', async () => {
    const dto = plainToInstance(UpdateProfileDto, { fullName: 'a' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('fullName');
    expect(errors[0].constraints?.isLength).toContain('2-100 ký tự');
  });

  it('should fail when fullName is too long', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      fullName: 'a'.repeat(101),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('fullName');
  });

  it('should fail with invalid phone format', async () => {
    const dto = plainToInstance(UpdateProfileDto, { phone: '123' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('phone');
    expect(errors[0].constraints?.matches).toContain('không hợp lệ');
  });

  it('should pass with valid VN phone (+84)', async () => {
    const dto = plainToInstance(UpdateProfileDto, { phone: '+84987654321' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with valid VN phone (0)', async () => {
    const dto = plainToInstance(UpdateProfileDto, { phone: '0987654321' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when address exceeds max length', async () => {
    const dto = plainToInstance(UpdateProfileDto, { address: 'a'.repeat(501) });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('address');
  });

  it('should reject unknown properties', async () => {
    const dto = plainToInstance(UpdateProfileDto, { unknownField: 'test' });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});

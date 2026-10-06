import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateCategoryDto } from '../create-category.dto';
import { UpdateCategoryDto } from '../update-category.dto';

describe('CreateCategoryDto', () => {
  it('should pass with valid name, description, imageUrl, isActive', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: 'Điện Thoại',
      description: 'Các dòng điện thoại thông minh',
      imageUrl: 'https://example.com/phone.png',
      isActive: true,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with only required name field', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: 'Đồ Gia Dụng',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when name is empty', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: '',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should fail when name is shorter than 2 characters', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: 'A',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should fail when name exceeds 50 characters', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: 'A'.repeat(51),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should fail when imageUrl is not a valid URL', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: 'Thời Trang',
      imageUrl: 'not-a-valid-url',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'imageUrl')).toBe(true);
  });

  it('should fail when description exceeds 500 characters', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: 'Thời Trang',
      description: 'D'.repeat(501),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'description')).toBe(true);
  });

  it('should reject unknown fields when whitelist is enforced', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: 'Thời Trang',
      slug: 'custom-slug',
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('slug');
  });
});

describe('UpdateCategoryDto', () => {
  it('should pass with partial valid fields', async () => {
    const dto = plainToInstance(UpdateCategoryDto, {
      name: 'Thời Trang Nam',
      isActive: false,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail if slug is provided when whitelist is enabled', async () => {
    const dto = plainToInstance(UpdateCategoryDto, {
      slug: 'forbidden-slug-edit',
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('slug');
  });
});

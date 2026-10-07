import { describe, it, expect } from 'vitest';
import { productValidationSchema } from './product.schema';

describe('productValidationSchema', () => {
  const validValues = {
    name: 'Nến thơm Mộc Miên',
    categoryId: '66a1b2c3d4e5f67890123456',
    description: 'Nến thơm tự nhiên làm từ sáp đậu nành',
    price: 350000,
    stock: 20,
    images: ['https://res.cloudinary.com/demo/image/upload/v1/sample.jpg'],
    isActive: true,
  };

  it('validates correct product form values successfully', async () => {
    await expect(productValidationSchema.validate(validValues)).resolves.toBeTruthy();
  });

  it('fails when name is empty', async () => {
    await expect(
      productValidationSchema.validate({ ...validValues, name: '' })
    ).rejects.toThrow('Tên sản phẩm không được để trống');
  });

  it('fails when name exceeds 120 characters', async () => {
    const longName = 'A'.repeat(121);
    await expect(
      productValidationSchema.validate({ ...validValues, name: longName })
    ).rejects.toThrow('Tên sản phẩm không được vượt quá 120 ký tự');
  });

  it('fails when categoryId is empty', async () => {
    await expect(
      productValidationSchema.validate({ ...validValues, categoryId: '' })
    ).rejects.toThrow('Vui lòng chọn danh mục sản phẩm');
  });

  it('fails when description is empty', async () => {
    await expect(
      productValidationSchema.validate({ ...validValues, description: '' })
    ).rejects.toThrow('Mô tả sản phẩm không được để trống');
  });

  it('fails when price is 0 or negative', async () => {
    await expect(
      productValidationSchema.validate({ ...validValues, price: 0 })
    ).rejects.toThrow('Giá phải lớn hơn 0');

    await expect(
      productValidationSchema.validate({ ...validValues, price: -5000 })
    ).rejects.toThrow('Giá phải lớn hơn 0');
  });

  it('fails when stock is negative', async () => {
    await expect(
      productValidationSchema.validate({ ...validValues, stock: -1 })
    ).rejects.toThrow('Tồn kho không được âm');
  });

  it('allows stock to be 0 (out of stock)', async () => {
    await expect(
      productValidationSchema.validate({ ...validValues, stock: 0 })
    ).resolves.toBeTruthy();
  });

  it('fails when images array exceeds 5 items', async () => {
    const sixImages = [
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
      'https://example.com/3.jpg',
      'https://example.com/4.jpg',
      'https://example.com/5.jpg',
      'https://example.com/6.jpg',
    ];
    await expect(
      productValidationSchema.validate({ ...validValues, images: sixImages })
    ).rejects.toThrow('Tối đa 5 ảnh cho mỗi sản phẩm');
  });
});

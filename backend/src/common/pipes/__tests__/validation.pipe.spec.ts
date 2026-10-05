import { IsString, Length, Matches } from 'class-validator';
import { ValidationPipe } from '../validation.pipe';
import { BadRequestException } from '@nestjs/common';

class TestDto {
  @IsString()
  @Length(2, 10)
  name: string;

  @IsString()
  @Matches(/^\d+$/)
  code: string;
}

describe('ValidationPipe', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe();
  });

  it('should transform and validate valid input', async () => {
    const result = await pipe.transform({ name: 'Valid', code: '123' }, {
      metatype: TestDto,
    } as any);
    expect(result).toBeInstanceOf(TestDto);
    expect(result.name).toBe('Valid');
    expect(result.code).toBe('123');
  });

  it('should throw BadRequestException on validation failure', async () => {
    await expect(
      pipe.transform({ name: 'a', code: 'abc' }, { metatype: TestDto } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should include validation error messages in exception', async () => {
    try {
      await pipe.transform({ name: 'a', code: 'abc' }, {
        metatype: TestDto,
      } as any);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      const response = e.getResponse();
      expect(response.statusCode).toBe(400);
      expect(response.message).toBeDefined();
      expect(
        Array.isArray(response.message) || typeof response.message === 'string',
      ).toBe(true);
    }
  });

  it('should return value as-is for primitive types', async () => {
    const result = await pipe.transform('string', { metatype: String } as any);
    expect(result).toBe('string');
  });

  it('should reject unknown properties', async () => {
    await expect(
      pipe.transform({ name: 'Valid', code: '123', unknown: 'field' }, {
        metatype: TestDto,
      } as any),
    ).rejects.toThrow(BadRequestException);
  });
});

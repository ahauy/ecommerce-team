import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from '../parse-object-id.pipe';

describe('ParseObjectIdPipe', () => {
  let pipe: ParseObjectIdPipe;

  beforeEach(() => {
    pipe = new ParseObjectIdPipe();
  });

  it('should accept valid 24-character hexadecimal ObjectId string', () => {
    const validId = new Types.ObjectId().toHexString();
    expect(pipe.transform(validId)).toBe(validId);
  });

  it('should throw BadRequestException for non-hex string', () => {
    expect(() => pipe.transform('invalid-id')).toThrow(BadRequestException);
    expect(() => pipe.transform('invalid-id')).toThrow(
      'Mã danh mục không hợp lệ (Invalid ObjectId)',
    );
  });

  it('should throw BadRequestException for 12-byte non-hex string', () => {
    expect(() => pipe.transform('123456789012')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for short string', () => {
    expect(() => pipe.transform('abc')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for empty string', () => {
    expect(() => pipe.transform('')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for non-string value', () => {
    expect(() => pipe.transform(null as unknown as string)).toThrow(
      BadRequestException,
    );
    expect(() => pipe.transform(undefined as unknown as string)).toThrow(
      BadRequestException,
    );
    expect(() => pipe.transform(12345 as unknown as string)).toThrow(
      BadRequestException,
    );
  });

  it('should allow custom error message', () => {
    const customPipe = new ParseObjectIdPipe('Custom invalid ID error');
    expect(() => customPipe.transform('bad-id')).toThrow(
      'Custom invalid ID error',
    );
  });
});

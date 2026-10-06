import {
  PipeTransform,
  Injectable,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  private readonly message: string;

  constructor(@Optional() errorMessage?: string) {
    this.message =
      errorMessage ?? 'Mã danh mục không hợp lệ (Invalid ObjectId)';
  }

  transform(value: string): string {
    if (
      typeof value !== 'string' ||
      !Types.ObjectId.isValid(value) ||
      value.length !== 24
    ) {
      throw new BadRequestException(this.message);
    }
    return value;
  }
}

import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  Type,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform<
  unknown,
  Promise<unknown>
> {
  async transform(
    value: unknown,
    { metatype }: ArgumentMetadata,
  ): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value) as object;
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = this.collectMessages(errors);
      throw new BadRequestException({
        statusCode: 400,
        message: messages,
        error: 'Bad Request',
      });
    }

    return object;
  }

  private collectMessages(errors: ValidationError[]): string[] {
    return errors.flatMap((error) => {
      const own = Object.values(error.constraints ?? {});
      return [
        ...(own.length > 0 ? [own.join(', ')] : []),
        ...this.collectMessages(error.children ?? []),
      ];
    });
  }

  private toValidate(metatype: Type<unknown>): boolean {
    const types: Type<unknown>[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

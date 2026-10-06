import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import { Observable } from 'rxjs';

export const IMAGE_FIELD = 'file';
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const toHttpError = (err: unknown): HttpException => {
  if (err instanceof HttpException) return err;
  if (err instanceof MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return new BadRequestException('Ảnh không được vượt quá 5MB');
      case 'LIMIT_FILE_COUNT':
      case 'LIMIT_UNEXPECTED_FILE':
        return new BadRequestException(
          `Chỉ được gửi 1 ảnh trong trường "${IMAGE_FIELD}"`,
        );
    }
  }
  return new BadRequestException('Dữ liệu tải lên không hợp lệ');
};

@Injectable()
export class ImageUploadInterceptor implements NestInterceptor {
  private readonly upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new BadRequestException(
            'Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP',
          ),
        );
      }
    },
  }).single(IMAGE_FIELD);

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    await new Promise<void>((resolve, reject) => {
      this.upload(req, res, (err: unknown) =>
        err ? reject(toHttpError(err)) : resolve(),
      );
    });

    return next.handle();
  }
}

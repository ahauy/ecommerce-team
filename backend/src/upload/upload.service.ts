import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export const UPLOAD_FOLDER = 'ecommerce';

@Injectable()
export class UploadService {
  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  uploadImage(file?: Express.Multer.File): Promise<{ url: string }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Vui lòng chọn ảnh để tải lên');
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: UPLOAD_FOLDER,
            resource_type: 'image',
            allowed_formats: ['jpg', 'png', 'webp'],
          },
          (error, result?: UploadApiResponse) => {
            if (result?.secure_url) {
              resolve({ url: result.secure_url });
            } else if (error?.http_code === 400) {
              reject(new BadRequestException('File không phải ảnh hợp lệ'));
            } else {
              reject(
                new BadGatewayException(
                  'Không thể tải ảnh lên, vui lòng thử lại sau',
                ),
              );
            }
          },
        )
        .end(file.buffer);
    });
  }
}

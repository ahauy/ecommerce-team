import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ImageUploadInterceptor,
  IMAGE_FIELD,
} from './image-upload.interceptor';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(ImageUploadInterceptor)
  @ApiOperation({ summary: 'Upload an image to Cloudinary, returns its URL' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [IMAGE_FIELD],
      properties: { [IMAGE_FIELD]: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: '{ url }' })
  @ApiResponse({ status: 400, description: 'Missing file / wrong type / >5MB' })
  @ApiResponse({ status: 502, description: 'Cloudinary unavailable' })
  uploadImage(@UploadedFile() file?: Express.Multer.File) {
    return this.uploadService.uploadImage(file);
  }
}

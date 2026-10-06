import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from '../../common/filters/global-exception.filter';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { MAX_IMAGE_SIZE } from '../image-upload.interceptor';
import { UploadController } from '../upload.controller';
import { UploadService } from '../upload.service';

const URL = 'https://res.cloudinary.com/demo/image/upload/ecommerce/a.png';
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('UploadController (HTTP)', () => {
  let app: INestApplication<App>;
  let allow: boolean;
  const uploadService = { uploadImage: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [{ provide: UploadService, useValue: uploadService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => allow })
      .compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => {
    allow = true;
    uploadService.uploadImage.mockReset();
    uploadService.uploadImage.mockImplementation(
      (file?: Express.Multer.File) =>
        file ? Promise.resolve({ url: URL }) : Promise.reject(new Error()),
    );
  });

  const post = () => request(app.getHttpServer()).post('/upload/image');

  it('201: trả về URL Cloudinary', async () => {
    const res = await post()
      .attach('file', PNG, { filename: 'a.png', contentType: 'image/png' })
      .expect(201);

    expect(res.body).toEqual({
      success: true,
      data: { url: URL },
      message: 'Thành công',
    });
    const file = uploadService.uploadImage.mock.calls[0][0];
    expect(file.buffer.equals(PNG)).toBe(true);
  });

  it('403 khi guard từ chối, không gọi Cloudinary', async () => {
    allow = false;

    await post()
      .attach('file', PNG, { filename: 'a.png', contentType: 'image/png' })
      .expect(403);
    expect(uploadService.uploadImage).not.toHaveBeenCalled();
  });

  it('400 khi sai định dạng', async () => {
    const res = await post()
      .attach('file', Buffer.from('GIF89a'), {
        filename: 'a.gif',
        contentType: 'image/gif',
      })
      .expect(400);

    expect(res.body.message).toBe(
      'Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP',
    );
    expect(uploadService.uploadImage).not.toHaveBeenCalled();
  });

  it('400 khi ảnh vượt quá 5MB', async () => {
    const res = await post()
      .attach('file', Buffer.alloc(MAX_IMAGE_SIZE + 1), {
        filename: 'big.jpg',
        contentType: 'image/jpeg',
      })
      .expect(400);

    expect(res.body.message).toBe('Ảnh không được vượt quá 5MB');
  });

  it('400 khi gửi sai tên trường', async () => {
    const res = await post()
      .attach('image', PNG, { filename: 'a.png', contentType: 'image/png' })
      .expect(400);

    expect(res.body.message).toBe('Chỉ được gửi 1 ảnh trong trường "file"');
  });
});

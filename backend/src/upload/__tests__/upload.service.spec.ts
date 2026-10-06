import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { UPLOAD_FOLDER, UploadService } from '../upload.service';

jest.mock('cloudinary', () => ({
  v2: { config: jest.fn(), uploader: { upload_stream: jest.fn() } },
}));

type StreamCallback = (
  error?: { http_code?: number },
  result?: unknown,
) => void;

const env: Record<string, string> = {
  CLOUDINARY_CLOUD_NAME: 'demo',
  CLOUDINARY_API_KEY: 'key',
  CLOUDINARY_API_SECRET: 'secret',
};
const config = {
  getOrThrow: (key: string) => env[key],
} as unknown as ConfigService;

const file = (buffer = Buffer.from([1, 2, 3])) =>
  ({ buffer }) as Express.Multer.File;

const mockStream = (respond: (cb: StreamCallback) => void) => {
  const end = jest.fn();
  (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
    (_options: unknown, cb: StreamCallback) => {
      end.mockImplementation(() => respond(cb));
      return { end };
    },
  );
  return end;
};

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UploadService(config);
  });

  it('cấu hình Cloudinary từ biến môi trường', () => {
    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'demo',
      api_key: 'key',
      api_secret: 'secret',
      secure: true,
    });
  });

  it('upload thành công trả về secure_url', async () => {
    const end = mockStream((cb) =>
      cb(undefined, { secure_url: 'https://res.cloudinary.com/demo/x.png' }),
    );

    await expect(service.uploadImage(file())).resolves.toEqual({
      url: 'https://res.cloudinary.com/demo/x.png',
    });
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: UPLOAD_FOLDER,
        resource_type: 'image',
        allowed_formats: ['jpg', 'png', 'webp'],
      }),
      expect.any(Function),
    );
    expect(end).toHaveBeenCalledWith(Buffer.from([1, 2, 3]));
  });

  it('400 khi không có file', () => {
    expect(() => service.uploadImage(undefined)).toThrow(
      new BadRequestException('Vui lòng chọn ảnh để tải lên'),
    );
    expect(() => service.uploadImage(file(Buffer.alloc(0)))).toThrow(
      BadRequestException,
    );
  });

  it('400 khi Cloudinary từ chối nội dung file', async () => {
    mockStream((cb) => cb({ http_code: 400 }));

    await expect(service.uploadImage(file())).rejects.toThrow(
      new BadRequestException('File không phải ảnh hợp lệ'),
    );
  });

  it('502 khi Cloudinary lỗi', async () => {
    mockStream((cb) => cb({ http_code: 500 }));

    await expect(service.uploadImage(file())).rejects.toThrow(
      BadGatewayException,
    );
  });
});

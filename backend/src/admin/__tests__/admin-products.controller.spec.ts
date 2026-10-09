import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { GlobalExceptionFilter } from '../../common/filters/global-exception.filter';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { ValidationPipe } from '../../common/pipes/validation.pipe';
import { UserRole } from '../../users/schemas/user.schema';
import { AdminProductsController } from '../admin-products.controller';
import { AdminProductsService } from '../admin-products.service';

const PRODUCT_ID = '66a1b2c3d4e5f67890123456';

describe('AdminProductsController (HTTP)', () => {
  let app: INestApplication<App>;
  let currentUser: { id: string; role: UserRole } | null;
  const service = { list: jest.fn(), block: jest.fn(), unblock: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AdminProductsController],
      providers: [
        { provide: AdminProductsService, useValue: service },
        RolesGuard,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          if (!currentUser) throw new UnauthorizedException();
          ctx.switchToHttp().getRequest<{ user: unknown }>().user = currentUser;
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new NestValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
      new ValidationPipe(),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => {
    jest.resetAllMocks();
    currentUser = { id: 'admin-1', role: UserRole.ADMIN };
    service.list.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    service.block.mockResolvedValue({ id: PRODUCT_ID, isBlocked: true });
    service.unblock.mockResolvedValue({ id: PRODUCT_ID, isBlocked: false });
  });

  const http = () => request(app.getHttpServer());

  it('chưa đăng nhập → 401; Customer → 403', async () => {
    currentUser = null;
    await http().get('/admin/products').expect(401);

    currentUser = { id: 'user-1', role: UserRole.CUSTOMER };
    await http().get('/admin/products').expect(403);
    await http()
      .patch(`/admin/products/${PRODUCT_ID}/block`)
      .send({ reason: 'Hàng giả' })
      .expect(403);
    await http().patch(`/admin/products/${PRODUCT_ID}/unblock`).expect(403);
    expect(service.block).not.toHaveBeenCalled();
  });

  it('GET: mặc định page 1 limit 20; ?isBlocked=false hiểu đúng là false', async () => {
    await http().get('/admin/products').expect(200);
    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );

    await http()
      .get(
        `/admin/products?isBlocked=false&sellerId=${PRODUCT_ID}&search=%20ao%20`,
      )
      .expect(200);
    expect(service.list.mock.calls[1][0]).toMatchObject({
      isBlocked: false,
      sellerId: PRODUCT_ID,
      search: 'ao',
    });
  });

  it.each([
    ['isBlocked=yes', 'isBlocked phải là true hoặc false'],
    ['sellerId=abc', 'sellerId không hợp lệ'],
  ])('query sai (%s) → 400', async (qs, message) => {
    const res = await http().get(`/admin/products?${qs}`).expect(400);

    expect(res.body.errors).toContain(message);
  });

  it('block: lý do được trim và truyền vào service', async () => {
    await http()
      .patch(`/admin/products/${PRODUCT_ID}/block`)
      .send({ reason: '  Hàng giả, vi phạm  ' })
      .expect(200);

    expect(service.block).toHaveBeenCalledWith(PRODUCT_ID, 'Hàng giả, vi phạm');
  });

  it.each([
    [{}, 'Vui lòng nhập lý do chặn sản phẩm'],
    [{ reason: '   ' }, 'Vui lòng nhập lý do chặn sản phẩm'],
    [{ reason: 'abc' }, 'Lý do chặn phải có ít nhất 5 ký tự'],
  ])('block thiếu / lý do quá ngắn %j → 400', async (body, message) => {
    const res = await http()
      .patch(`/admin/products/${PRODUCT_ID}/block`)
      .send(body)
      .expect(400);

    expect(res.body.errors).toContain(message);
    expect(service.block).not.toHaveBeenCalled();
  });

  it('id sai định dạng → 400', async () => {
    const res = await http().patch('/admin/products/abc/unblock').expect(400);

    expect(res.body.message).toBe('Mã sản phẩm không hợp lệ');
  });

  it('unblock', async () => {
    await http().patch(`/admin/products/${PRODUCT_ID}/unblock`).expect(200);

    expect(service.unblock).toHaveBeenCalledWith(PRODUCT_ID);
  });
});

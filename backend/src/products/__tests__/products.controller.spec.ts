import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { GlobalExceptionFilter } from '../../common/filters/global-exception.filter';
import { ValidationPipe } from '../../common/pipes/validation.pipe';
import { UserRole } from '../../users/schemas/user.schema';
import { ProductsController } from '../products.controller';
import { ProductsService } from '../products.service';

const VALID_BODY = {
  name: 'iPhone 15 Pro',
  description: 'Mô tả',
  price: 100000,
  stock: 5,
  categoryId: '66a1b2c3d4e5f67890123456',
};

describe('ProductsController POST /products (HTTP)', () => {
  let app: INestApplication<App>;
  let currentUser: { id: string; role: UserRole; hasShop: boolean };
  const productsService = { create: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: productsService },
        RolesGuard,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          ctx.switchToHttp().getRequest<{ user: unknown }>().user = currentUser;
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => {
    productsService.create.mockReset();
    productsService.create.mockResolvedValue({ id: 'p1' });
    currentUser = { id: 'u1', role: UserRole.CUSTOMER, hasShop: true };
  });

  const post = (body: object) =>
    request(app.getHttpServer()).post('/products').send(body);

  it('Customer đã có gian hàng: 201', async () => {
    await post(VALID_BODY).expect(201);

    expect(productsService.create).toHaveBeenCalledWith(
      currentUser,
      VALID_BODY,
    );
  });

  it('Admin: 403, không gọi service', async () => {
    currentUser = { id: 'a1', role: UserRole.ADMIN, hasShop: true };

    await post(VALID_BODY).expect(403);
    expect(productsService.create).not.toHaveBeenCalled();
  });

  it('chưa thiết lập gian hàng: 403 kể cả khi body sai (guard chạy trước validation)', async () => {
    currentUser = { id: 'u1', role: UserRole.CUSTOMER, hasShop: false };

    const res = await post({ name: '' }).expect(403);

    expect(res.body.message).toBe(
      'Vui lòng thiết lập thông tin gian hàng trước khi đăng bán',
    );
    expect(productsService.create).not.toHaveBeenCalled();
  });

  it('đã có gian hàng nhưng body sai: 400', async () => {
    await post({ ...VALID_BODY, price: 0 }).expect(400);
  });
});

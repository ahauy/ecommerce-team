import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from '../../common/filters/global-exception.filter';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { ValidationPipe } from '../../common/pipes/validation.pipe';
import { UserRole } from '../../users/schemas/user.schema';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CartController } from '../cart.controller';
import { CartService } from '../cart.service';

const PRODUCT_ID = '66a1b2c3d4e5f67890123456';
const EMPTY = { groups: [], totalAmount: 0 };

describe('CartController (HTTP)', () => {
  let app: INestApplication<App>;
  let currentUser: { id: string; role: UserRole } | null;
  const cartService = {
    getCart: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    merge: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [CartController],
      providers: [{ provide: CartService, useValue: cartService }, RolesGuard],
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
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => {
    jest.resetAllMocks();
    currentUser = { id: 'buyer-1', role: UserRole.CUSTOMER };
    Object.values(cartService).forEach((fn) => fn.mockResolvedValue(EMPTY));
  });

  const http = () => request(app.getHttpServer());

  it('chưa đăng nhập: 401', async () => {
    currentUser = null;
    await http().get('/cart').expect(401);
  });

  it('Admin dùng giỏ hàng: 403', async () => {
    currentUser = { id: 'admin-1', role: UserRole.ADMIN };

    await http()
      .post('/cart/items')
      .send({ productId: PRODUCT_ID, quantity: 1 })
      .expect(403);
    expect(cartService.addItem).not.toHaveBeenCalled();
  });

  it('GET /cart trả giỏ của user trong token', async () => {
    const res = await http().get('/cart').expect(200);

    expect(res.body.data).toEqual(EMPTY);
    expect(cartService.getCart).toHaveBeenCalledWith('buyer-1');
  });

  it('POST /cart/items: 201', async () => {
    await http()
      .post('/cart/items')
      .send({ productId: PRODUCT_ID, quantity: 2 })
      .expect(201);

    expect(cartService.addItem).toHaveBeenCalledWith('buyer-1', {
      productId: PRODUCT_ID,
      quantity: 2,
    });
  });

  it('POST /cart/items: quantity không hợp lệ → 400 tiếng Việt', async () => {
    const res = await http()
      .post('/cart/items')
      .send({ productId: PRODUCT_ID, quantity: 0 })
      .expect(400);

    expect(res.body.errors).toContain('Số lượng phải lớn hơn 0');
  });

  it('POST /cart/items: không nhận field lạ', async () => {
    await http()
      .post('/cart/items')
      .send({ productId: PRODUCT_ID, quantity: 1, price: 1 })
      .expect(400);
  });

  it('PATCH /cart/items/:productId: id sai định dạng → 400', async () => {
    const res = await http()
      .patch('/cart/items/abc')
      .send({ quantity: 1 })
      .expect(400);

    expect(res.body.message).toBe('Mã sản phẩm không hợp lệ');
  });

  it('DELETE /cart/items/:productId và DELETE /cart: 200', async () => {
    await http().delete(`/cart/items/${PRODUCT_ID}`).expect(200);
    await http().delete('/cart').expect(200);

    expect(cartService.removeItem).toHaveBeenCalledWith('buyer-1', PRODUCT_ID);
    expect(cartService.clear).toHaveBeenCalledWith('buyer-1');
  });

  it('POST /cart/merge: 200', async () => {
    await http()
      .post('/cart/merge')
      .send({ items: [{ productId: PRODUCT_ID, quantity: 1 }] })
      .expect(200);
  });

  it('POST /cart/merge: lỗi trong item lồng nhau được báo rõ', async () => {
    const res = await http()
      .post('/cart/merge')
      .send({ items: [{ productId: 'abc', quantity: 1.5 }] })
      .expect(400);

    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        'Mã sản phẩm không hợp lệ',
        'Số lượng phải là số nguyên',
      ]),
    );
  });
});

import {
  BadRequestException,
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
import { CheckoutService, SHORTAGE_MESSAGE } from '../checkout.service';
import { CheckoutsController } from '../checkouts.controller';
import { OrdersController } from '../orders.controller';
import { PaymentReconcileService } from '../payment-reconcile.service';
import { PayosWebhookController } from '../payos-webhook.controller';

const PRODUCT_ID = '66a1b2c3d4e5f67890123456';

describe('Order / Checkout / Webhook controllers (HTTP)', () => {
  let app: INestApplication<App>;
  let currentUser: { id: string; role: UserRole } | null;
  const checkoutService = {
    createCheckout: jest.fn(),
    getCheckoutResult: jest.fn(),
  };
  const reconcile = { handleWebhook: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        OrdersController,
        CheckoutsController,
        PayosWebhookController,
      ],
      providers: [
        { provide: CheckoutService, useValue: checkoutService },
        { provide: PaymentReconcileService, useValue: reconcile },
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
    currentUser = { id: 'buyer-1', role: UserRole.CUSTOMER };
    checkoutService.createCheckout.mockResolvedValue({ checkoutCode: 'CHK-1' });
    checkoutService.getCheckoutResult.mockResolvedValue({ status: 'paid' });
    reconcile.handleWebhook.mockResolvedValue(undefined);
  });

  const http = () => request(app.getHttpServer());

  describe('POST /orders', () => {
    const body = { items: [{ productId: PRODUCT_ID, quantity: 1 }] };

    it('Customer: 201', async () => {
      await http().post('/orders').send(body).expect(201);
      expect(checkoutService.createCheckout).toHaveBeenCalledWith(
        'buyer-1',
        body,
      );
    });

    it('chưa đăng nhập: 401', async () => {
      currentUser = null;
      await http().post('/orders').send(body).expect(401);
    });

    it('Admin: 403', async () => {
      currentUser = { id: 'admin-1', role: UserRole.ADMIN };
      await http().post('/orders').send(body).expect(403);
      expect(checkoutService.createCheckout).not.toHaveBeenCalled();
    });

    it('không nhận price / sellerId từ client', async () => {
      await http()
        .post('/orders')
        .send({ items: [{ productId: PRODUCT_ID, quantity: 1, price: 1 }] })
        .expect(400);
      await http()
        .post('/orders')
        .send({ ...body, sellerId: 'x' })
        .expect(400);
    });

    it('giỏ rỗng / quantity sai: 400', async () => {
      await http().post('/orders').send({ items: [] }).expect(400);
      await http()
        .post('/orders')
        .send({ items: [{ productId: PRODUCT_ID, quantity: 0 }] })
        .expect(400);
    });

    it('thiếu hàng: response giữ nguyên danh sách errors cho FE', async () => {
      const errors = [
        { productId: PRODUCT_ID, name: 'iPhone', available: 1, requested: 3 },
      ];
      checkoutService.createCheckout.mockRejectedValue(
        new BadRequestException({ message: SHORTAGE_MESSAGE, errors }),
      );

      const res = await http().post('/orders').send(body).expect(400);

      expect(res.body).toEqual({
        success: false,
        message: SHORTAGE_MESSAGE,
        errors,
      });
    });
  });

  describe('GET /checkouts/:checkoutCode', () => {
    it('trả kết quả của user trong token', async () => {
      const res = await http().get('/checkouts/CHK-1').expect(200);

      expect(res.body.data).toEqual({ status: 'paid' });
      expect(checkoutService.getCheckoutResult).toHaveBeenCalledWith(
        'buyer-1',
        'CHK-1',
      );
    });

    it('chưa đăng nhập: 401', async () => {
      currentUser = null;
      await http().get('/checkouts/CHK-1').expect(401);
    });
  });

  describe('POST /payments/payos/webhook', () => {
    const payosBody = {
      code: '00',
      desc: 'success',
      success: true,
      data: {
        orderCode: 123,
        amount: 3000,
        counterAccountBankId: '',
        virtualAccountName: '',
        anyNewField: 'PayOS có thể thêm field mới',
      },
      signature: 'abc',
    };

    it('không cần đăng nhập, không bị pipe chặn field lạ, trả 200', async () => {
      currentUser = null;

      await http().post('/payments/payos/webhook').send(payosBody).expect(200);

      expect(reconcile.handleWebhook).toHaveBeenCalledWith(payosBody);
    });

    it('sai chữ ký: 400', async () => {
      reconcile.handleWebhook.mockRejectedValue(
        new BadRequestException('Chữ ký webhook không hợp lệ'),
      );

      const res = await http()
        .post('/payments/payos/webhook')
        .send(payosBody)
        .expect(400);

      expect(res.body.message).toBe('Chữ ký webhook không hợp lệ');
    });
  });
});

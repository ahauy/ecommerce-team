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
import { AdminUsersController } from '../admin-users.controller';
import { AdminUsersService } from '../admin-users.service';

const USER_ID = '66a1b2c3d4e5f67890123456';

describe('AdminUsersController (HTTP)', () => {
  let app: INestApplication<App>;
  let currentUser: { id: string; role: UserRole } | null;
  const service = { list: jest.fn(), ban: jest.fn(), unban: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        { provide: AdminUsersService, useValue: service },
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
    service.ban.mockResolvedValue({ message: 'ok' });
    service.unban.mockResolvedValue({ message: 'ok' });
  });

  const http = () => request(app.getHttpServer());

  it('chưa đăng nhập → 401', async () => {
    currentUser = null;
    await http().get('/admin/users').expect(401);
  });

  it('Customer gọi bất kỳ API admin users nào → 403', async () => {
    currentUser = { id: 'user-1', role: UserRole.CUSTOMER };

    await http().get('/admin/users').expect(403);
    await http().patch(`/admin/users/${USER_ID}/ban`).expect(403);
    await http().patch(`/admin/users/${USER_ID}/unban`).expect(403);

    expect(service.ban).not.toHaveBeenCalled();
    expect(service.unban).not.toHaveBeenCalled();
  });

  it('GET mặc định page 1, limit 20', async () => {
    await http().get('/admin/users').expect(200);

    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });

  it.each([
    ['false', false],
    ['true', true],
  ])('?isActive=%s được hiểu đúng là %s', async (raw, expected) => {
    await http().get(`/admin/users?isActive=${raw}`).expect(200);

    expect(service.list.mock.calls[0][0].isActive).toBe(expected);
  });

  it('lọc role + search + phân trang', async () => {
    await http()
      .get('/admin/users?role=customer&search=%20shop%20a%20&page=2&limit=10')
      .expect(200);

    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'customer',
        search: 'shop a',
        page: 2,
        limit: 10,
      }),
    );
  });

  it.each([
    ['role=seller', 'Vai trò không hợp lệ'],
    ['isActive=yes', 'isActive phải là true hoặc false'],
    ['limit=500', 'limit tối đa là 100'],
  ])('query sai (%s) → 400', async (qs, message) => {
    const res = await http().get(`/admin/users?${qs}`).expect(400);

    expect(res.body.errors).toContain(message);
    expect(service.list).not.toHaveBeenCalled();
  });

  it('ban: truyền id admin đang đăng nhập để chặn tự khóa', async () => {
    await http().patch(`/admin/users/${USER_ID}/ban`).expect(200);

    expect(service.ban).toHaveBeenCalledWith('admin-1', USER_ID);
  });

  it('id sai định dạng → 400 thay vì 500', async () => {
    const res = await http().patch('/admin/users/abc/ban').expect(400);

    expect(res.body.message).toBe('Mã người dùng không hợp lệ');
    expect(service.ban).not.toHaveBeenCalled();
  });

  it('unban', async () => {
    await http().patch(`/admin/users/${USER_ID}/unban`).expect(200);

    expect(service.unban).toHaveBeenCalledWith(USER_ID);
  });
});

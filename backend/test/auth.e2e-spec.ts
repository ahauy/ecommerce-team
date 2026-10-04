import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { UsersService } from '../src/users/users.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let usersService: UsersService;

  const uniqueId = Date.now();
  const testEmail = `testuser_${uniqueId}@example.com`;
  const testPassword = 'Password123';
  const testFullName = 'E2E Test User';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());

    await app.init();
    usersService = app.get<UsersService>(UsersService);
  });

  afterAll(async () => {
    // Cleanup created test user if needed
    const user = await usersService.findByEmail(testEmail);
    if (user) {
      await user.deleteOne();
    }
    await app.close();
  });

  interface TestApiResponse<T = Record<string, unknown>> {
    success: boolean;
    data?: T;
    message: string;
    errors?: string[];
  }

  it('TC-012: POST /api/v1/auth/register fails validation on password < 8 chars (400)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'invalid@example.com',
        password: 'short',
        fullName: 'Short Pass User',
      })
      .expect(400);

    const body = res.body as TestApiResponse;
    expect(body.success).toBe(false);
    expect(body.message).toBe('Validation failed');
    expect(body.errors).toBeDefined();
  });

  it('TC-010: POST /api/v1/auth/register creates user and returns 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        fullName: testFullName,
      })
      .expect(201);

    const body = res.body as TestApiResponse<{
      email: string;
      fullName: string;
      userId: string;
      password?: string;
    }>;
    expect(body.success).toBe(true);
    expect(body.data?.email).toBe(testEmail.toLowerCase());
    expect(body.data?.fullName).toBe(testFullName);
    expect(body.data?.userId).toBeDefined();
    expect(body.data?.password).toBeUndefined();
  });

  it('TC-013: POST /api/v1/auth/register with duplicate email returns 409 Conflict', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        fullName: 'Duplicate User',
      })
      .expect(409);

    const body = res.body as TestApiResponse;
    expect(body.success).toBe(false);
    expect(body.message).toContain('Email đã tồn tại');
  });

  it('TC-014: POST /api/v1/auth/login with wrong password returns 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword!',
      })
      .expect(401);

    const body = res.body as TestApiResponse;
    expect(body.success).toBe(false);
    expect(body.message).toContain('không chính xác');
  });

  it('TC-011: POST /api/v1/auth/login sets cookie and returns 200 with accessToken', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    const body = res.body as TestApiResponse<{
      accessToken: string;
      user: { email: string; role: string };
    }>;
    expect(body.success).toBe(true);
    expect(body.data?.accessToken).toBeDefined();
    expect(body.data?.user).toBeDefined();
    expect(body.data?.user.email).toBe(testEmail.toLowerCase());
    expect(body.data?.user.role).toBe('customer');

    // Check Set-Cookie header contains refreshToken and HttpOnly
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
  });
});

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.set('trust proxy', 1);

  // Global prefix: /api/v1/...
  app.setGlobalPrefix('api/v1');

  // CORS — allow frontend origin
  const rawOrigins = config.get<string>('FRONTEND_URL', 'ecommerce-team.vercel.app');
  const allowedOrigins = rawOrigins
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  });

  app.use(cookieParser());

  // Global pipes, filters, interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on: http://localhost:${port}/api/v1`);
}
void bootstrap();

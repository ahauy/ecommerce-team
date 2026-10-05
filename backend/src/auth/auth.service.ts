import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Shared hash helper — used by login, refresh, and logout
const sha256 = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
    });

    return {
      userId: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
    };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.usersService.findByEmail(dto.email, true);

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'default_access_secret',
    );
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'default_refresh_secret',
    );
    const accessExpiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    );
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );

    const accessToken = this.jwtService.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      {
        secret: accessSecret,
        expiresIn: accessExpiresIn as never,
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user._id.toString(),
      },
      {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as never,
      },
    );

    // Hash refresh token using SHA-256 before saving to DB (BR-AUTH-010)
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      sha256(refreshToken),
    );

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        shopName: user.shopName ?? null,
      },
    };
  }

  async refresh(rawRefreshToken: string): Promise<{ accessToken: string }> {
    const hash = sha256(rawRefreshToken);
    const user = await this.usersService.findByRefreshTokenHash(hash);

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }

    const accessToken = this.jwtService.sign(
      { sub: user._id.toString(), email: user.email, role: user.role },
      {
        secret: this.configService.get<string>(
          'JWT_ACCESS_SECRET',
          'default_access_secret',
        ),
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_EXPIRES_IN',
          '15m',
        ) as never,
      },
    );

    return { accessToken };
  }

  async logout(userId: string, res: Response): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  }
}

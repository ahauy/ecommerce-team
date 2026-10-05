import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

export interface JwtRefreshPayload {
  sub: string;
}

// Extracts the raw refresh token from the httpOnly cookie (Path=/api/v1/auth)
const fromCookie = (req: Request): string | null =>
  req?.cookies?.refreshToken ?? null;

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookie]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_REFRESH_SECRET',
        'default_refresh_secret',
      ),
      passReqToCallback: true,
    });
  }

  // Passport validates JWT signature/expiry; we attach rawToken for the hash lookup
  async validate(req: Request, payload: JwtRefreshPayload) {
    const rawToken: string | undefined = req.cookies?.refreshToken;
    if (!rawToken)
      throw new UnauthorizedException('Refresh token không tìm thấy');
    return { id: payload.sub, rawToken };
  }
}

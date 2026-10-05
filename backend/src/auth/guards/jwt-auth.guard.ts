import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface RequestWithUser {
  user?: {
    isActive?: boolean;
  };
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(context)) as boolean;
    if (!result) {
      return false;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user?.isActive) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    return true;
  }
}

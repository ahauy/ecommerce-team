import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

interface RequestWithUser {
  user?: { hasShop?: boolean };
}

@Injectable()
export class ShopRequiredGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<RequestWithUser>();

    if (!user?.hasShop) {
      throw new ForbiddenException(
        'Vui lòng thiết lập thông tin gian hàng trước khi đăng bán',
      );
    }

    return true;
  }
}

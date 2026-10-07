import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ShopRequiredGuard } from '../shop-required.guard';

const contextWith = (user: unknown) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('ShopRequiredGuard', () => {
  const guard = new ShopRequiredGuard();

  it('cho qua khi user đã thiết lập gian hàng', () => {
    expect(guard.canActivate(contextWith({ hasShop: true }))).toBe(true);
  });

  it.each([[{ hasShop: false }], [{}], [undefined]])(
    'chặn 403 khi chưa thiết lập gian hàng (%o)',
    (user) => {
      expect(() => guard.canActivate(contextWith(user))).toThrow(
        new ForbiddenException(
          'Vui lòng thiết lập thông tin gian hàng trước khi đăng bán',
        ),
      );
    },
  );
});

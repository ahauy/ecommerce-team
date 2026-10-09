import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Store, User as UserIcon } from 'lucide-react';
import BaseUrl from '@/consts/baseUrl';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { userService } from '@/services/user.service';

const itemBase =
  'flex items-center gap-2.5 rounded-full px-3 py-2 text-xs font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black';

/**
 * Menu tài khoản của người mua (Hồ sơ · Đơn mua · Kênh người bán) — cột trái trang "Đơn mua".
 * `end={false}` để "Đơn mua" vẫn sáng khi đang ở trang chi tiết `/account/orders/:id`.
 */
const AccountSidebar: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const { data: profile } = userService.useGetProfile(!!user);
  const name = user?.fullName ?? profile?.fullName ?? '';
  const initial = name.charAt(0).toUpperCase() || 'U';

  return (
    <aside
      data-testid="account-sidebar"
      aria-label="Menu tài khoản"
      className="w-full rounded-2xl border border-hairline-light bg-white p-4 shadow-card lg:sticky lg:top-24 lg:w-[240px] lg:shrink-0"
    >
      <div className="flex items-center gap-3 px-2 pb-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline-light bg-zinc-100 text-sm font-semibold text-zinc-900">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Tài khoản</p>
          <p className="truncate text-sm font-semibold text-zinc-900">{name}</p>
        </div>
      </div>

      <nav className="flex flex-row gap-1 overflow-x-auto no-scrollbar lg:flex-col">
        <NavLink
          to={BaseUrl.AccountProfile}
          className={({ isActive }) =>
            cn(itemBase, 'whitespace-nowrap', isActive ? 'bg-aloe text-black' : 'text-zinc-600 hover:bg-zinc-50 hover:text-black')
          }
        >
          <UserIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Hồ sơ</span>
        </NavLink>

        <NavLink
          to={BaseUrl.AccountOrders}
          className={({ isActive }) =>
            cn(itemBase, 'whitespace-nowrap', isActive ? 'bg-aloe text-black' : 'text-zinc-600 hover:bg-zinc-50 hover:text-black')
          }
        >
          <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Đơn mua</span>
        </NavLink>

        <NavLink
          to={profile?.shop ? BaseUrl.SellerProducts : BaseUrl.ShopSetup}
          className={cn(itemBase, 'whitespace-nowrap text-zinc-600 hover:bg-zinc-50 hover:text-black')}
        >
          <Store className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{profile?.shop ? 'Kênh người bán' : 'Đăng bán'}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
        </NavLink>
      </nav>
    </aside>
  );
};

export default AccountSidebar;

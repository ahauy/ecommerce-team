import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShoppingBag } from 'lucide-react';
import BaseUrl from '@/consts/baseUrl';

const primary =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-7 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black';
const secondary =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e4e4e7] bg-white px-7 text-xs font-semibold text-black transition-colors hover:border-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black';

/** Thanh toán thành công: Xem đơn mua · Tiếp tục mua sắm. */
export const SuccessActions: React.FC = () => (
  <div className="flex flex-wrap items-center justify-center gap-3">
    <Link to={BaseUrl.AccountOrders} className={primary}>
      Xem đơn mua
    </Link>
    <Link to={BaseUrl.Homepage} className={secondary}>
      Tiếp tục mua sắm
    </Link>
  </div>
);

/** Thất bại / hết hạn: Quay lại giỏ hàng · Về trang chủ. */
export const FailureActions: React.FC = () => (
  <div className="flex flex-wrap items-center justify-center gap-3">
    <Link to={BaseUrl.Cart} className={primary}>
      <ShoppingBag className="h-4 w-4" aria-hidden="true" />
      Quay lại giỏ hàng
    </Link>
    <Link to={BaseUrl.Homepage} className={secondary}>
      <Home className="h-4 w-4" aria-hidden="true" />
      Về trang chủ
    </Link>
  </div>
);

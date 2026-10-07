import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Store } from 'lucide-react';
import BaseUrl from '@/consts/baseUrl';

export const ShopNotSetupBanner: React.FC = () => {
  return (
    <div
      data-testid="shop-not-setup-banner"
      className="w-full bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-[#fef3c7] text-[#b45309] flex items-center justify-center shrink-0">
          <Store className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-base text-zinc-900 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-[#b45309]" />
            Chưa thiết lập gian hàng
          </h3>
          <p className="text-sm text-zinc-600 mt-1 max-w-xl">
            Vui lòng thiết lập thông tin gian hàng (tên shop và địa chỉ lấy hàng)
            trước khi bắt đầu đăng bán sản phẩm.
          </p>
        </div>
      </div>
      <Link
        to={BaseUrl.ShopSetup}
        className="shrink-0 h-10 px-6 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-semibold flex items-center justify-center transition-colors shadow-sm"
      >
        Thiết lập ngay
      </Link>
    </div>
  );
};

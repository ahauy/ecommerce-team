import React from 'react';
import { userService } from '@/services/user.service';
import ShopSetupForm from './components/ShopSetupForm';
import { Store, ShieldCheck } from 'lucide-react';

const ShopSetupPage: React.FC = () => {
  const { data: profile, isPending } = userService.useGetProfile();

  return (
    <div
      data-testid="shop-setup-page"
      className="w-full flex items-start justify-center py-4 md:py-8"
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      <div className="w-full max-w-[640px] bg-white rounded-2xl p-6 sm:p-10 shadow-card border border-hairline-light space-y-8">
        <header className="space-y-2">
          <div className="w-12 h-12 rounded-full bg-pistachio flex items-center justify-center text-black mb-2">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-zinc-900">
            Thiết lập gian hàng
          </h1>
          <p className="text-sm text-zinc-500 font-normal">
            Không cần xác minh phức tạp, lưu thông tin là bạn có thể bắt đầu đăng bán sản phẩm ngay lập tức.
          </p>
        </header>

        {isPending ? (
          <div className="flex h-48 w-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
          </div>
        ) : (
          <ShopSetupForm
            initialValues={{
              shopName: profile?.shop?.shopName || '',
              pickupAddress: profile?.shop?.pickupAddress || profile?.address || '',
              phone: profile?.shop?.phone || '',
            }}
          />
        )}

        <footer className="pt-2 border-t border-hairline-light">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-zinc-600 shrink-0" />
            <span>Thông tin gian hàng sẽ được hiển thị công khai tới người mua trên toàn hệ thống.</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ShopSetupPage;

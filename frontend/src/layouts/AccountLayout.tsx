import { Outlet } from 'react-router-dom';
import AccountSidebar from '@/components/AccountSidebar';

/**
 * Khung chung cho khu vực tài khoản của người mua (Hồ sơ · Đơn mua · Chi tiết đơn):
 * menu tài khoản bên trái + nội dung full-width bên phải. Nằm trong StorefrontLayout
 * nên dùng chung header/footer; padding & nền khớp trang Hồ sơ.
 */
const AccountLayout = () => (
  <div
    data-testid="account-layout"
    className="w-full bg-[#fbfbf5] px-4 py-6 sm:px-6 md:py-8 lg:px-8"
    style={{ fontFeatureSettings: '"ss03"' }}
  >
    <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <AccountSidebar />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  </div>
);

export default AccountLayout;

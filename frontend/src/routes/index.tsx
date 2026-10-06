import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import BaseUrl from '@/consts/baseUrl';
import Loading from '@/components/ui/loading';
import DefaultLayout from '@/layouts/DefaultLayout';
import RequireAuth from '@/routes/RequireAuth';

import Page404 from '@/pages/errors/Page404';
import Homepage from '@/pages/home/Homepage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import ShopSetupPage from '@/pages/seller/ShopSetupPage';
import PublicShopPage from '@/pages/shop/PublicShopPage';
import AdminCategoryPage from '@/pages/admin/AdminCategoryPage';

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div role="alert" className="p-6 text-center">
    <p className="font-medium">Đã có lỗi xảy ra.</p>
    <pre className="mt-2 text-xs text-zinc-500">{error instanceof Error ? error.message : String(error)}</pre>
    <button
      type="button"
      onClick={resetErrorBoundary}
      className="mt-4 rounded-full border px-4 py-2 text-sm"
    >
      Thử lại
    </button>
  </div>
);

const SuspenseFallback = () => (
  <div className="p-2">
    <Loading />
  </div>
);

const AppRoutes = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          {/* Public — auth */}
          <Route path={BaseUrl.Login} element={<LoginPage />} />
          <Route path={BaseUrl.Register} element={<RegisterPage />} />

          {/* Public — gian hàng (BR-AUTH-012: Guest được xem) */}
          <Route path={BaseUrl.PublicShop} element={<PublicShopPage />} />

          <Route element={<DefaultLayout />}>
            {/* Public — Guest xem được */}
            <Route index element={<Homepage />} />

            {/* Cần đăng nhập */}
            <Route element={<RequireAuth />}>
              <Route path={BaseUrl.Profile} element={<ProfilePage />} />
              <Route path={BaseUrl.ShopSetup} element={<ShopSetupPage />} />
            </Route>

            {/* Chỉ admin */}
            <Route element={<RequireAuth role="admin" />}>
              <Route path={BaseUrl.AdminCategories} element={<AdminCategoryPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Page404 />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;

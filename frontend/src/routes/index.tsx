import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import BaseUrl from '@/consts/baseUrl';
import Loading from '@/components/ui/loading';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import AdminLayout from '@/layouts/AdminLayout';
import AccountLayout from '@/layouts/AccountLayout';
import SellerLayout from '@/layouts/SellerLayout';
import RequireAuth from '@/routes/RequireAuth';

import Page404 from '@/pages/errors/Page404';
import Homepage from '@/pages/home/Homepage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import PublicShopPage from '@/pages/shop/PublicShopPage';
import ProductDetailPage from '@/pages/products/ProductDetailPage';
import CartPage from '@/pages/cart/CartPage';
import CheckoutPage from '@/pages/checkout/CheckoutPage';
import CheckoutResultPage from '@/pages/checkout/CheckoutResultPage';
import OrderHistoryPage from '@/pages/orders/OrderHistoryPage';
import OrderDetailPage from '@/pages/orders/OrderDetailPage';
import SellerLoginPage from '@/pages/seller/SellerLoginPage';
import SellerRegisterPage from '@/pages/seller/SellerRegisterPage';
import SellerProfilePage from '@/pages/seller/SellerProfilePage';
import ShopSetupPage from '@/pages/seller/ShopSetupPage';
import MyProductsPage from '@/pages/seller/MyProductsPage';
import ProductFormPage from '@/pages/seller/ProductFormPage';
import SellerOrdersPage from '@/pages/seller/SellerOrdersPage';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminProfilePage from '@/pages/admin/AdminProfilePage';
import AdminCategoryPage from '@/pages/admin/AdminCategoryPage';
import AdminProductPage from '@/pages/admin/AdminProductPage';
import { AdminUserPage } from '@/pages/admin/AdminUserPage';

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
          {/* ── Cổng xác thực riêng cho từng phân quyền (không layout) ───────── */}
          <Route path={BaseUrl.Login} element={<LoginPage />} />
          <Route path={BaseUrl.Register} element={<RegisterPage />} />
          <Route path={BaseUrl.SellerLogin} element={<SellerLoginPage />} />
          <Route path={BaseUrl.SellerRegister} element={<SellerRegisterPage />} />
          <Route path={BaseUrl.AdminLogin} element={<AdminLoginPage />} />

          {/* ── Redirect cho đường dẫn cũ ─────────────────────────────────────── */}
          <Route path={BaseUrl.LegacyProfile} element={<Navigate to={BaseUrl.AccountProfile} replace />} />
          <Route path={BaseUrl.LegacyShopSetup} element={<Navigate to={BaseUrl.ShopSetup} replace />} />

          {/* ── 1. Storefront (Guest & Customer) ──────────────────────────────── */}
          <Route element={<StorefrontLayout />}>
            <Route index element={<Homepage />} />
            <Route path={BaseUrl.PublicShop} element={<PublicShopPage />} />
            <Route path={BaseUrl.ProductDetail} element={<ProductDetailPage />} />
            {/* Giỏ hàng: Guest (localStorage) và Customer (DB) đều vào được; Admin thấy thông báo không có giỏ. */}
            <Route path={BaseUrl.Cart} element={<CartPage />} />

            {/* Thanh toán: dùng chung header/footer storefront; không có Guest checkout → chưa đăng nhập về /login. */}
            <Route
              element={
                <RequireAuth
                  role="customer"
                  loginPath={BaseUrl.Login}
                  forbiddenPath={BaseUrl.AdminProfile}
                />
              }
            >
              <Route path={BaseUrl.Checkout} element={<CheckoutPage />} />
              <Route path={BaseUrl.CheckoutResult} element={<CheckoutResultPage />} />
            </Route>

            {/* Hồ sơ người mua: chưa đăng nhập → /login; admin → hồ sơ admin */}
            <Route
              element={
                <RequireAuth
                  role="customer"
                  loginPath={BaseUrl.Login}
                  forbiddenPath={BaseUrl.AdminProfile}
                />
              }
            >
              <Route element={<AccountLayout />}>
                <Route path={BaseUrl.AccountProfile} element={<ProfilePage />} />
                <Route path={BaseUrl.AccountOrders} element={<OrderHistoryPage />} />
                <Route path={BaseUrl.AccountOrderDetail} element={<OrderDetailPage />} />
              </Route>
            </Route>
          </Route>

          {/* ── 2. Seller (Kênh người bán) — Strict Isolation ─────────────────── */}
          <Route element={<SellerLayout />}>
            <Route
              element={
                <RequireAuth
                  role="customer"
                  loginPath={BaseUrl.SellerLogin}
                  forbiddenPath={BaseUrl.AdminCategories}
                />
              }
            >
              <Route path={BaseUrl.SellerProducts} element={<MyProductsPage />} />
              <Route path={BaseUrl.SellerProductCreate} element={<ProductFormPage />} />
              <Route path={BaseUrl.SellerProductEdit} element={<ProductFormPage />} />
              <Route path={BaseUrl.SellerOrders} element={<SellerOrdersPage />} />
              <Route path={BaseUrl.SellerProfile} element={<SellerProfilePage />} />
              <Route path={BaseUrl.ShopSetup} element={<ShopSetupPage />} />
            </Route>
          </Route>

          {/* ── 3. Admin (Cổng quản trị) — Strict Isolation ───────────────────── */}
          <Route element={<AdminLayout />}>
            <Route element={<RequireAuth role="admin" loginPath={BaseUrl.AdminLogin} />}>
              <Route path={BaseUrl.AdminCategories} element={<AdminCategoryPage />} />
              <Route
                path={BaseUrl.AdminUsers}
                element={<AdminUserPage title="Quản lý người dùng" />}
              />
              <Route
                path={BaseUrl.AdminProducts}
                element={<AdminProductPage title="Kiểm duyệt sản phẩm" />}
              />
              <Route path={BaseUrl.AdminProfile} element={<AdminProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Page404 />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;

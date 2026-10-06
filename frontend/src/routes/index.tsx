import { Suspense } from "react";
import { Outlet, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";

import BaseUrl from "@/consts/baseUrl";
import Loading from "@/components/ui/loading";
import DefaultLayout from "@/layouts/DefaultLayout";
import PrivateRoute from "@/routes/PrivateRoute";

import Page404 from "@/pages/errors/Page404";
import Homepage from "@/pages/home/Homepage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ChangePassword from "@/pages/auth/ChangePassword";
import ProfilePage from "@/pages/profile/ProfilePage";
import ShopSetupPage from "@/pages/seller/ShopSetupPage";
import PublicShopPage from "@/pages/shop/PublicShopPage";
import AdminCategoryPage from "@/pages/admin/AdminCategoryPage";
import Todos from "@/pages/Todos";

const ErrorFallback = ({ error, resetErrorBoundary }: any) => {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
};

const SuspenseFallback = () => (
  <div className="p-2">
    <Loading />
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public — auth */}
      <Route path={BaseUrl.Login} element={<LoginPage />} />
      <Route path={BaseUrl.Register} element={<RegisterPage />} />
      <Route path={BaseUrl.ForgotPassword} element={<ForgotPassword />} />

      {/* Private — cần đăng nhập, dùng DefaultLayout */}
      <Route
        path={BaseUrl.Homepage}
        element={
          <Suspense fallback={<SuspenseFallback />}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <PrivateRoute>
                <DefaultLayout>
                  <Outlet />
                </DefaultLayout>
              </PrivateRoute>
            </ErrorBoundary>
          </Suspense>
        }
      >
        <Route index element={<Homepage />} />
        <Route path={BaseUrl.Todos} element={<Todos />} />
        <Route path={BaseUrl.ChangePassword} element={<ChangePassword />} />
        <Route path={BaseUrl.Profile} element={<ProfilePage />} />
        <Route path={BaseUrl.ShopSetup} element={<ShopSetupPage />} />
        <Route path={BaseUrl.AdminCategories} element={<AdminCategoryPage />} />
      </Route>

      {/* Public — gian hàng */}
      <Route
        path={BaseUrl.PublicShop}
        element={
          <Suspense fallback={<SuspenseFallback />}>
            <PublicShopPage />
          </Suspense>
        }
      />

      <Route path="*" element={<Page404 />} />
    </Routes>
  );
};

export default AppRoutes;

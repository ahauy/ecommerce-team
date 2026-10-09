import React from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { toast } from 'react-toastify';
import { Store, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FormikField from '@/components/customFieldsFormik/FormikField';
import InputField from '@/components/customFieldsFormik/InputField';
import BaseUrl from '@/consts/baseUrl';
import authService from '@/services/auth.service';
import userService from '@/services/user.service';
import { useAuthStore } from '@/stores/auth.store';
import { sellerLoginSchema } from './schemas/login.schema';

const SellerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);

  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ||
    BaseUrl.SellerProducts;

  // Nếu đã đăng nhập với role customer -> chuyển hướng vào Kênh người bán
  if (status === 'authed' && user?.role === 'customer') {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div
      className="min-h-screen w-full bg-canvas-cream flex flex-col items-center justify-center p-4 sm:p-6"
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      <div className="w-full max-w-md bg-white border border-hairline-light rounded-3xl p-8 sm:p-10 shadow-card space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-aloe text-black shadow-xs mb-1">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <span className="inline-block px-3 py-0.5 rounded-full bg-aloe text-black text-[11px] font-semibold uppercase tracking-wider mb-2">
              Kênh Người Bán
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black">
              Đăng Nhập Kênh Người Bán
            </h1>
            <p className="mt-1.5 text-xs text-zinc-500">
              Quản lý gian hàng, đơn hàng và sản phẩm của bạn trên TeamShop.
            </p>
          </div>
        </div>

        {/* Formik Form */}
        <Formik
          initialValues={{
            email: '',
            password: '',
          }}
          validationSchema={sellerLoginSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            setStatus(null);
            try {
              const res = await authService.login({
                email: values.email,
                password: values.password,
              });

              if (res.data) {
                if (res.data.user.role === 'admin') {
                  await authService.logout().catch(() => {});
                  const msg = 'Tài khoản quản trị viên vui lòng đăng nhập tại Cổng Quản Trị.';
                  setStatus(msg);
                  toast.error(msg);
                  return;
                }

                setSession(res.data.user, res.data.accessToken);

                try {
                  const profile = await userService.getProfile();
                  if (profile.shop) {
                    toast.success('Chào mừng quay trở lại Kênh Người Bán!');
                    navigate(redirectTo, { replace: true });
                  } else {
                    toast.info('Vui lòng hoàn tất thiết lập gian hàng để bán sản phẩm.');
                    navigate(BaseUrl.ShopSetup, { replace: true });
                  }
                } catch {
                  navigate(redirectTo, { replace: true });
                }
              }
            } catch (error: unknown) {
              const errResponse = (error as { response?: { data?: { message?: string } } })?.response?.data;
              const message = errResponse?.message || 'Email hoặc mật khẩu không chính xác';
              setStatus(message);
              toast.error(message);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, status: formStatus }) => (
            <Form className="flex flex-col gap-5">
              {formStatus && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium"
                >
                  {formStatus}
                </div>
              )}

              <FormikField
                component={InputField}
                name="email"
                type="email"
                label="Email người bán"
                placeholder="seller@example.com"
                required
              />

              <FormikField
                component={InputField}
                name="password"
                type="password"
                label="Mật khẩu"
                placeholder="Nhập mật khẩu"
                required
              />

              <Button
                type="submit"
                className="h-11 w-full rounded-full bg-black text-sm font-semibold text-white hover:bg-zinc-800 active:scale-[0.99] transition-all disabled:opacity-60 shadow-sm mt-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập Người Bán'}
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>

              <div className="pt-2 text-center text-xs text-zinc-500">
                Chưa có gian hàng?{' '}
                <Link
                  to={BaseUrl.SellerRegister}
                  className="font-semibold text-black underline underline-offset-4 hover:opacity-75 transition-opacity"
                >
                  Đăng ký bán hàng ngay
                </Link>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default SellerLoginPage;

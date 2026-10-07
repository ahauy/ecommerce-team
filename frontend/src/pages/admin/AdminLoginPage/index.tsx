import React from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { toast } from 'react-toastify';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FormikField from '@/components/customFieldsFormik/FormikField';
import InputField from '@/components/customFieldsFormik/InputField';
import BaseUrl from '@/consts/baseUrl';
import authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { adminLoginSchema } from './schemas/login.schema';

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);

  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ||
    BaseUrl.AdminCategories;

  // Nếu đã đăng nhập với quyền admin -> chuyển thẳng vào trang quản trị
  if (status === 'authed' && user?.role === 'admin') {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div
      className="min-h-screen w-full bg-[#fbfbf5] flex flex-col items-center justify-center p-4 sm:p-6"
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      <div className="w-full max-w-md bg-white border border-[#e4e4e7] rounded-3xl p-8 sm:p-10 shadow-[0_8px_8px_rgba(0,0,0,0.03),0_4px_4px_rgba(0,0,0,0.02),0_2px_2px_rgba(0,0,0,0.02),0_0_0_1px_#e4e4e7] space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black text-white shadow-sm mb-1">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="inline-block px-3 py-0.5 rounded-full bg-black text-white text-[11px] font-semibold uppercase tracking-wider mb-2">
              Quản trị viên
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black">
              Cổng Quản Trị Hệ Thống
            </h1>
            <p className="mt-1.5 text-xs text-zinc-500">
              Khu vực bảo mật dành riêng cho Quản trị viên sàn TeamShop.
            </p>
          </div>
        </div>

        {/* Formik Form */}
        <Formik
          initialValues={{
            email: '',
            password: '',
          }}
          validationSchema={adminLoginSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            setStatus(null);
            try {
              const res = await authService.login({
                email: values.email,
                password: values.password,
              });

              if (res.data) {
                // Kiểm tra phân quyền: Chỉ cho phép admin
                if (res.data.user.role !== 'admin') {
                  await authService.logout().catch(() => {});
                  const msg = 'Tài khoản của bạn không có quyền truy cập vào Cổng Quản Trị.';
                  setStatus(msg);
                  toast.error(msg);
                  return;
                }

                setSession(res.data.user, res.data.accessToken);
                toast.success('Đăng nhập quản trị viên thành công!');
                navigate(redirectTo, { replace: true });
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
                label="Email quản trị"
                placeholder="admin@teamshop.vn"
                required
              />

              <FormikField
                component={InputField}
                name="password"
                type="password"
                label="Mật khẩu"
                placeholder="Nhập mật khẩu quản trị"
                required
              />

              <Button
                type="submit"
                className="h-11 w-full rounded-full bg-black text-sm font-semibold text-white hover:bg-zinc-800 active:scale-[0.99] transition-all disabled:opacity-60 shadow-sm mt-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập Quản Trị'}
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>

              <div className="pt-2 text-center text-[11px] text-zinc-400">
                TeamShop Admin Portal • Phiên bản nội bộ
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AdminLoginPage;

import React from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { toast } from 'react-toastify';
import { Store, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FormikField from '@/components/customFieldsFormik/FormikField';
import InputField from '@/components/customFieldsFormik/InputField';
import BaseUrl from '@/consts/baseUrl';
import authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { sellerRegisterSchema } from './schemas/register.schema';

const SellerRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  // Nếu đã đăng nhập là customer -> vào thiết lập gian hàng
  if (status === 'authed' && user?.role === 'customer') {
    return <Navigate to={BaseUrl.ShopSetup} replace />;
  }

  return (
    <div
      className="min-h-screen w-full bg-[#fbfbf5] flex flex-col items-center justify-center p-4 sm:p-6"
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      <div className="w-full max-w-md bg-white border border-[#e4e4e7] rounded-3xl p-8 sm:p-10 shadow-[0_8px_8px_rgba(0,0,0,0.03),0_4px_4px_rgba(0,0,0,0.02),0_2px_2px_rgba(0,0,0,0.02),0_0_0_1px_#e4e4e7] space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#c1fbd4] text-black shadow-xs mb-1">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <span className="inline-block px-3 py-0.5 rounded-full bg-[#c1fbd4] text-black text-[11px] font-semibold uppercase tracking-wider mb-2">
              Kênh Người Bán
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black">
              Đăng Ký Bán Hàng
            </h1>
            <p className="mt-1.5 text-xs text-zinc-500">
              Tạo tài khoản để mở gian hàng và tiếp cận hàng ngàn khách hàng.
            </p>
          </div>
        </div>

        {/* Formik Form */}
        <Formik
          initialValues={{
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
          }}
          validationSchema={sellerRegisterSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            setStatus(null);
            try {
              await authService.register({
                fullName: values.fullName,
                email: values.email,
                password: values.password,
              });
              toast.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập để thiết lập gian hàng.');
              navigate(BaseUrl.SellerLogin, { replace: true });
            } catch (error: unknown) {
              const errResponse = (error as { response?: { data?: { message?: string } } })?.response?.data;
              const message = errResponse?.message || 'Đăng ký không thành công. Vui lòng thử lại.';
              setStatus(message);
              toast.error(message);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, status: formStatus }) => (
            <Form className="flex flex-col gap-4">
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
                name="fullName"
                type="text"
                label="Họ và tên chủ shop"
                placeholder="Nguyễn Văn A"
                required
              />

              <FormikField
                component={InputField}
                name="email"
                type="email"
                label="Email liên hệ"
                placeholder="seller@example.com"
                required
              />

              <FormikField
                component={InputField}
                name="password"
                type="password"
                label="Mật khẩu"
                placeholder="Tối thiểu 8 ký tự"
                required
              />

              <FormikField
                component={InputField}
                name="confirmPassword"
                type="password"
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu"
                required
              />

              <Button
                type="submit"
                className="h-11 w-full rounded-full bg-black text-sm font-semibold text-white hover:bg-zinc-800 active:scale-[0.99] transition-all disabled:opacity-60 shadow-sm mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang tạo tài khoản...' : 'Tiếp tục thiết lập gian hàng'}
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>

              <div className="pt-2 text-center text-xs text-zinc-500">
                Đã có tài khoản?{' '}
                <Link
                  to={BaseUrl.SellerLogin}
                  className="font-semibold text-black underline underline-offset-4 hover:opacity-75 transition-opacity"
                >
                  Đăng nhập Kênh người bán
                </Link>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default SellerRegisterPage;

import React from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { toast } from 'react-toastify';
import AuthShell from '@/components/AuthShell';
import CommonIcons from '@/components/commonIcons';
import { Button } from '@/components/ui/button';
import FormikField from '@/components/customFieldsFormik/FormikField';
import InputField from '@/components/customFieldsFormik/InputField';
import BaseUrl from '@/consts/baseUrl';
import authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { loginSchema } from './schemas/login.schema';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const status = useAuthStore((state) => state.status);
  const setSession = useAuthStore((state) => state.setSession);

  // Quay lại trang người dùng đang định vào trước khi bị chuyển tới /login.
  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ||
    BaseUrl.Homepage;

  if (status === 'authed') {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-[28px] font-medium leading-tight tracking-tight text-black font-display">
            Đăng nhập
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Đăng nhập để mua sắm và quản lý gian hàng của bạn.
          </p>
        </div>

        <Formik
          initialValues={{
            email: '',
            password: '',
          }}
          validationSchema={loginSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            setStatus(null);
            try {
              const res = await authService.login({
                email: values.email,
                password: values.password,
              });

              if (res.data) {
                setSession(res.data.user, res.data.accessToken);
                toast.success('Đăng nhập thành công!');
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
          {({ isSubmitting, status }) => (
            <Form className="flex flex-col gap-5">
              {status && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
                  {status}
                </div>
              )}

              <FormikField
                component={InputField}
                name="email"
                type="email"
                label="Email"
                placeholder="name@example.com"
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
                className="h-11 w-full rounded-full bg-black text-base font-medium text-white shadow-none hover:bg-zinc-800 active:bg-zinc-700 disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                {!isSubmitting && (
                  <CommonIcons.ArrowRight size={16} className="ml-2" />
                )}
              </Button>

              <div className="text-center text-[13px] text-zinc-500">
                Chưa có tài khoản?{' '}
                <Link
                  to={BaseUrl.Register}
                  className="font-medium text-black underline underline-offset-4 hover:opacity-70"
                >
                  Đăng ký
                </Link>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </AuthShell>
  );
};

export default LoginPage;

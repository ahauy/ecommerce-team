import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import AuthShell from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import FormikField from '@/components/customFieldsFormik/FormikField';
import InputField from '@/components/customFieldsFormik/InputField';
import BaseUrl from '@/consts/baseUrl';
import authService from '@/services/auth.service';

const validationSchema = Yup.object().shape({
  fullName: Yup.string()
    .trim()
    .required('Họ và tên không được để trống'),
  email: Yup.string()
    .trim()
    .email('Email không đúng định dạng')
    .required('Email không được để trống'),
  password: Yup.string()
    .min(8, 'Mật khẩu phải có tối thiểu 8 ký tự')
    .required('Mật khẩu không được để trống'),
  confirmPassword: Yup.string()
    .required('Vui lòng xác nhận mật khẩu')
    .oneOf([Yup.ref('password')], 'Mật khẩu xác nhận không khớp'),
});

const Register: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-[28px] font-medium leading-tight tracking-tight text-black font-display">
            Tạo tài khoản
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Điền các thông tin bên dưới để bắt đầu
          </p>
        </div>

        <Formik
          initialValues={{
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
          }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            setStatus(null);
            try {
              await authService.register({
                fullName: values.fullName,
                email: values.email,
                password: values.password,
              });
              toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
              navigate(BaseUrl.Login);
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
          {({ isSubmitting, status }) => (
            <Form className="flex flex-col gap-5">
              {status && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {status}
                </div>
              )}

              <FormikField
                component={InputField}
                name="fullName"
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                required
              />

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
                className="h-11 w-full rounded-full bg-black text-base font-medium text-white shadow-none hover:bg-zinc-800 active:bg-zinc-700 disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Tạo tài khoản'}
              </Button>

              <div className="text-center text-sm text-zinc-500">
                Đã có tài khoản?{' '}
                <Link
                  to={BaseUrl.Login}
                  className="font-medium text-black underline underline-offset-4 hover:opacity-70"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </AuthShell>
  );
};

export default Register;
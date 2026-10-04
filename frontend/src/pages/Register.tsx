import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
    .oneOf([Yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu'),
});

const Register: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Ecommerce Team
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tạo tài khoản người mua và người bán
          </p>
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <h2 className="text-xl font-semibold text-slate-800">
              Đăng ký tài khoản
            </h2>
            <p className="text-xs text-slate-500">
              Điền các thông tin bên dưới để bắt đầu
            </p>
          </CardHeader>
          <CardContent>
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
                <Form className="flex flex-col gap-4">
                  {status && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
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
                    className="mt-2 w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Tạo tài khoản'}
                  </Button>

                  <div className="mt-2 text-center text-sm text-slate-500">
                    Đã có tài khoản?{' '}
                    <Link
                      to={BaseUrl.Login}
                      className="font-medium text-slate-900 underline hover:text-slate-700"
                    >
                      Đăng nhập ngay
                    </Link>
                  </div>
                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;

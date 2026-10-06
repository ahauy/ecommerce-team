import * as Yup from 'yup';

export const registerSchema = Yup.object().shape({
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

export default registerSchema;

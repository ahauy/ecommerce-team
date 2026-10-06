import * as Yup from 'yup';

export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email('Email không đúng định dạng')
    .required('Email không được để trống'),
  password: Yup.string().required('Mật khẩu không được để trống'),
});

export default loginSchema;

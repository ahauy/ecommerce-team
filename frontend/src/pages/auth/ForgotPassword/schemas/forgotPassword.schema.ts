import * as Yup from 'yup';

export const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email('Email không đúng định dạng')
    .required('Email không được để trống'),
});

export default forgotPasswordSchema;

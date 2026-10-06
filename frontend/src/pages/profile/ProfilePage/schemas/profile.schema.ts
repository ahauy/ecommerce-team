import * as Yup from 'yup';

export const profileValidationSchema = Yup.object().shape({
  fullName: Yup.string()
    .trim()
    .min(2, 'Họ tên phải từ 2-100 ký tự')
    .max(100, 'Họ tên tối đa 100 ký tự')
    .required('Họ tên không được để trống'),
  phone: Yup.string()
    .transform((value) => (!value || !value.trim() ? null : value.trim()))
    .nullable()
    .notRequired()
    .matches(/^(\+84|0)[0-9]{9,10}$/, {
      message: 'Số điện thoại không hợp lệ',
      excludeEmptyString: true,
    }),
  address: Yup.string()
    .transform((value) => (!value || !value.trim() ? null : value.trim()))
    .nullable()
    .notRequired()
    .max(500, 'Địa chỉ tối đa 500 ký tự'),
});

export default profileValidationSchema;

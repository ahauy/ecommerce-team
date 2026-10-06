import * as Yup from 'yup';

export const shopSetupValidationSchema = Yup.object().shape({
  shopName: Yup.string()
    .trim()
    .min(3, 'Tên gian hàng phải từ 3-50 ký tự')
    .max(50, 'Tên gian hàng tối đa 50 ký tự')
    .required('Tên gian hàng không được để trống'),
  pickupAddress: Yup.string()
    .trim()
    .min(10, 'Địa chỉ lấy hàng tối thiểu 10 ký tự')
    .max(500, 'Địa chỉ tối đa 500 ký tự')
    .required('Địa chỉ lấy hàng không được để trống'),
  phone: Yup.string()
    .trim()
    .matches(/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ')
    .required('Số điện thoại không được để trống'),
});

export default shopSetupValidationSchema;

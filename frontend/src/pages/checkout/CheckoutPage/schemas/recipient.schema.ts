import * as Yup from 'yup';

/** Thông tin người nhận của 1 Checkout (BR-CHK-006, BR-CHK-008): họ tên, SĐT, địa chỉ đều bắt buộc. */
export const recipientValidationSchema = Yup.object().shape({
  fullName: Yup.string()
    .trim()
    .min(2, 'Họ tên phải từ 2-100 ký tự')
    .max(100, 'Họ tên tối đa 100 ký tự')
    .required('Vui lòng nhập họ tên người nhận'),
  phone: Yup.string()
    .trim()
    .matches(/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ')
    .required('Vui lòng nhập số điện thoại'),
  address: Yup.string()
    .trim()
    .min(5, 'Địa chỉ quá ngắn')
    .max(500, 'Địa chỉ tối đa 500 ký tự')
    .required('Vui lòng nhập địa chỉ giao hàng'),
});

export type RecipientFormValues = Yup.InferType<typeof recipientValidationSchema>;

/** Profile đã đủ họ tên + SĐT + địa chỉ hợp lệ để đặt hàng ngay chưa. */
export const isRecipientComplete = (values: Partial<RecipientFormValues>): boolean =>
  recipientValidationSchema.isValidSync({
    fullName: values.fullName ?? '',
    phone: values.phone ?? '',
    address: values.address ?? '',
  });

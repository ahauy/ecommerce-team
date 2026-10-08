  import React, { useEffect } from 'react';
import { Form, Formik, useFormikContext } from 'formik';
import { Phone, User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import FormikField from '@/components/customFieldsFormik/FormikField';
import InputField from '@/components/customFieldsFormik/InputField';
import { recipientValidationSchema, type RecipientFormValues } from '../schemas/recipient.schema';

interface CheckoutRecipientCardProps {
  /** Giá trị khởi tạo (lấy từ hồ sơ người mua). */
  initialValues: RecipientFormValues;
  /** Gọi mỗi khi người mua sửa — trang cha dùng giá trị mới nhất để đặt hàng. */
  onChange: (values: RecipientFormValues) => void;
}

/** Đẩy giá trị form lên trang cha sau mỗi lần sửa. */
const ValuesObserver: React.FC<{ onChange: (values: RecipientFormValues) => void }> = ({ onChange }) => {
  const { values } = useFormikContext<RecipientFormValues>();
  useEffect(() => {
    onChange(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);
  return null;
};

/** Thẻ ① "Thông tin nhận hàng": luôn sửa được, mặc định điền từ hồ sơ; chỉ áp dụng cho đơn này (BR-CHK-008). */
const CheckoutRecipientCard: React.FC<CheckoutRecipientCardProps> = ({ initialValues, onChange }) => (
  <Card
    data-testid="checkout-recipient"
    aria-label="Thông tin nhận hàng"
    className="p-5 sm:p-6 shadow-card"
  >
    <CardHeader className="p-0 mb-5 flex flex-wrap flex-row items-center justify-between gap-2 space-y-0">
      <h2 className="flex items-center gap-3 text-sm font-semibold text-black">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
          1
        </span>
        Thông tin nhận hàng
      </h2>
      <span className="text-[11px] text-zinc-500">Chỉ áp dụng cho đơn hàng này</span>
    </CardHeader>

    <CardContent className="p-0">
      <Formik<RecipientFormValues>
        initialValues={initialValues}
        enableReinitialize
        validateOnMount
        validationSchema={recipientValidationSchema}
        onSubmit={() => undefined}
      >
        {() => (
          <Form noValidate className="space-y-4">
            <ValuesObserver onChange={onChange} />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormikField
                name="fullName"
                component={InputField}
                label={
                  <>
                    Họ và tên <span className="text-red-500">*</span>
                  </>
                }
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                endIcon={<User className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />}
              />

              <FormikField
                name="phone"
                component={InputField}
                type="tel"
                inputMode="tel"
                label={
                  <>
                    Số điện thoại <span className="text-red-500">*</span>
                  </>
                }
                autoComplete="tel"
                placeholder="09xxxxxxxx hoặc +84xxxxxxxxx"
                endIcon={<Phone className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />}
              />
            </div>

            <FormikField
              name="address"
              component={InputField}
              as="textarea"
              rows={3}
              label={
                <>
                  Địa chỉ giao hàng <span className="text-red-500">*</span>
                </>
              }
              autoComplete="street-address"
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
            />
          </Form>
        )}
      </Formik>
    </CardContent>
  </Card>
);

export default CheckoutRecipientCard;

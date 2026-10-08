import React, { useEffect } from 'react';
import { Field, Form, Formik, useFormikContext } from 'formik';
import { Phone, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { recipientValidationSchema, type RecipientFormValues } from '../schemas/recipient.schema';

interface CheckoutRecipientCardProps {
  /** Giá trị khởi tạo (lấy từ hồ sơ người mua). */
  initialValues: RecipientFormValues;
  /** Gọi mỗi khi người mua sửa — trang cha dùng giá trị mới nhất để đặt hàng. */
  onChange: (values: RecipientFormValues) => void;
}

const fieldClass = 'h-10 rounded-lg border-[#e4e4e7] bg-white text-sm focus:ring-black/10';
const labelClass = 'text-[11px] font-medium text-zinc-700';

const ErrorText: React.FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p id={id} role="alert" className="text-[11px] font-medium text-red-700">
      {message}
    </p>
  ) : null;

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
  <section
    data-testid="checkout-recipient"
    aria-label="Thông tin nhận hàng"
    className="rounded-2xl border border-[#e4e4e7] bg-white p-5 shadow-sm sm:p-6"
  >
    <header className="mb-5 flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-3 text-sm font-semibold text-black">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
          1
        </span>
        Thông tin nhận hàng
      </h2>
      <span className="text-[11px] text-zinc-500">Chỉ áp dụng cho đơn hàng này</span>
    </header>

    <Formik<RecipientFormValues>
      initialValues={initialValues}
      enableReinitialize
      validateOnMount
      validationSchema={recipientValidationSchema}
      onSubmit={() => undefined}
    >
      {({ errors, touched }) => (
        <Form noValidate className="space-y-4">
          <ValuesObserver onChange={onChange} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className={labelClass}>
                Họ và tên <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Field
                  as={Input}
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  placeholder="Nguyễn Văn A"
                  className={cn(fieldClass, 'pr-9', touched.fullName && errors.fullName && 'border-red-500')}
                  aria-invalid={!!(touched.fullName && errors.fullName)}
                  aria-describedby={touched.fullName && errors.fullName ? 'fullName-error' : undefined}
                />
                <User className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              </div>
              <ErrorText id="fullName-error" message={touched.fullName ? errors.fullName : undefined} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className={labelClass}>
                Số điện thoại <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Field
                  as={Input}
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="09xxxxxxxx hoặc +84xxxxxxxxx"
                  className={cn(fieldClass, 'pr-9', touched.phone && errors.phone && 'border-red-500')}
                  aria-invalid={!!(touched.phone && errors.phone)}
                  aria-describedby={touched.phone && errors.phone ? 'phone-error' : undefined}
                />
                <Phone className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              </div>
              <ErrorText id="phone-error" message={touched.phone ? errors.phone : undefined} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className={labelClass}>
              Địa chỉ giao hàng <span className="text-red-500">*</span>
            </Label>
            <Field
              as={Textarea}
              id="address"
              name="address"
              rows={3}
              autoComplete="street-address"
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
              className={cn(
                'rounded-lg border-[#e4e4e7] bg-white text-sm',
                touched.address && errors.address && 'border-red-500'
              )}
              aria-invalid={!!(touched.address && errors.address)}
              aria-describedby={touched.address && errors.address ? 'address-error' : undefined}
            />
            <ErrorText id="address-error" message={touched.address ? errors.address : undefined} />
          </div>
        </Form>
      )}
    </Formik>
  </section>
);

export default CheckoutRecipientCard;

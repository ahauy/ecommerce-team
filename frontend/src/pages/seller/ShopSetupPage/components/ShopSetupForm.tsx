import React from 'react';
import { Formik, Form, Field } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { userService, SetupShopDto } from '@/services/user.service';
import BaseUrl from '@/consts/baseUrl';
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { shopSetupValidationSchema } from '../schemas/shopSetup.schema';

export interface ShopSetupFormProps {
  initialValues?: {
    shopName?: string;
    pickupAddress?: string;
    phone?: string;
  };
  onSuccess?: () => void;
}

export const ShopSetupForm: React.FC<ShopSetupFormProps> = ({ initialValues, onSuccess }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const setupShopMutation = userService.useSetupShop();

  const handleSubmit = async (values: SetupShopDto) => {
    try {
      await setupShopMutation.mutateAsync({
        shopName: values.shopName.trim(),
        pickupAddress: values.pickupAddress.trim(),
        phone: values.phone.trim(),
      });

      toast({
        title: 'Thiết lập gian hàng thành công',
        description: 'Gian hàng của bạn đã sẵn sàng bắt đầu bán sản phẩm.',
        variant: 'default',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate(BaseUrl.Profile);
      }
    } catch (err: unknown) {
      const errResponse = err as { response?: { data?: { message?: string | string[] } } };
      const rawMessage = errResponse?.response?.data?.message;
      const message =
        (Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage) ||
        'Có lỗi xảy ra khi thiết lập gian hàng. Vui lòng thử lại.';

      toast({
        title: 'Thiết lập gian hàng thất bại',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Formik<SetupShopDto>
      initialValues={{
        shopName: initialValues?.shopName || '',
        pickupAddress: initialValues?.pickupAddress || '',
        phone: initialValues?.phone || '',
      }}
      enableReinitialize
      validationSchema={shopSetupValidationSchema}
      onSubmit={handleSubmit}
    >
      {({ values, errors, touched, isSubmitting }) => {
        const isShopNameValid =
          values.shopName.trim().length >= 3 &&
          values.shopName.trim().length <= 50 &&
          !errors.shopName;

        return (
          <Form className="space-y-6" noValidate>
            {/* Live region for accessibility */}
            <div role="status" aria-live="polite" className="sr-only">
              {Object.keys(touched).length > 0 && Object.keys(errors).length > 0
                ? 'Biểu mẫu có lỗi cần sửa'
                : ''}
            </div>

            {/* Shop Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="shopName"
                  className="text-sm font-semibold text-zinc-900"
                >
                  Tên gian hàng <span className="text-red-500">*</span>
                </Label>
                <span
                  className={`text-xs ${
                    values.shopName.length > 0 ? 'text-zinc-600' : 'text-zinc-400'
                  }`}
                >
                  {values.shopName.length}/50
                </span>
              </div>
              <Field
                as={Input}
                id="shopName"
                name="shopName"
                type="text"
                maxLength={50}
                placeholder="Nhập tên gian hàng của bạn"
                className={`h-12 px-4 rounded-lg bg-white border text-sm text-zinc-900 transition-all ${
                  touched.shopName && errors.shopName
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : 'border-[#e4e4e7] focus-visible:ring-black focus-visible:border-black'
                }`}
                aria-invalid={touched.shopName && !!errors.shopName}
                aria-describedby={
                  touched.shopName && errors.shopName
                    ? 'shopName-error'
                    : 'shopName-hint'
                }
              />
              <div className="flex items-center justify-between text-xs">
                <p id="shopName-hint" className="text-zinc-500">
                  Từ 3 đến 50 ký tự
                </p>
                {isShopNameValid && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-aloe text-black">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Hợp lệ
                  </span>
                )}
              </div>
              {touched.shopName && errors.shopName && (
                <p id="shopName-error" className="text-xs text-red-500 font-medium" role="alert">
                  {errors.shopName}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-sm font-semibold text-zinc-900"
              >
                Số điện thoại liên hệ <span className="text-red-500">*</span>
              </Label>
              <Field
                as={Input}
                id="phone"
                name="phone"
                type="tel"
                placeholder="09xxxxxxxx hoặc +84xxxxxxxxx"
                className={`h-12 px-4 rounded-lg bg-white border text-sm text-zinc-900 transition-all ${
                  touched.phone && errors.phone
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : 'border-[#e4e4e7] focus-visible:ring-black focus-visible:border-black'
                }`}
                aria-invalid={touched.phone && !!errors.phone}
                aria-describedby={
                  touched.phone && errors.phone
                    ? 'phone-error'
                    : 'phone-hint'
                }
              />
              <p id="phone-hint" className="text-xs text-zinc-500">
                Định dạng: 09xxxxxxxx hoặc +84xxxxxxxxx
              </p>
              {touched.phone && errors.phone && (
                <p id="phone-error" className="text-xs text-red-500 font-medium" role="alert">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Pickup Address */}
            <div className="space-y-2">
              <Label
                htmlFor="pickupAddress"
                className="text-sm font-semibold text-zinc-900"
              >
                Địa chỉ lấy hàng <span className="text-red-500">*</span>
              </Label>
              <Field
                as={Textarea}
                id="pickupAddress"
                name="pickupAddress"
                rows={4}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                className={`p-4 rounded-lg bg-white border text-sm text-zinc-900 leading-relaxed resize-none transition-all ${
                  touched.pickupAddress && errors.pickupAddress
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : 'border-[#e4e4e7] focus-visible:ring-black focus-visible:border-black'
                }`}
                aria-invalid={touched.pickupAddress && !!errors.pickupAddress}
                aria-describedby={
                  touched.pickupAddress && errors.pickupAddress
                    ? 'pickupAddress-error'
                    : 'pickupAddress-hint'
                }
              />
              <p id="pickupAddress-hint" className="text-xs text-zinc-500">
                Tối thiểu 10 ký tự để đơn vị vận chuyển có thể đến lấy hàng
              </p>
              {touched.pickupAddress && errors.pickupAddress && (
                <p id="pickupAddress-error" className="text-xs text-red-500 font-medium" role="alert">
                  {errors.pickupAddress}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-between gap-4 border-t border-[#e4e4e7]">
              <Link
                to={BaseUrl.Homepage}
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors underline-offset-4 hover:underline"
              >
                Để sau
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting || setupShopMutation.isPending}
                className="h-12 px-7 rounded-full bg-black text-white hover:bg-zinc-800 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 group shadow-sm font-medium text-sm"
              >
                {isSubmitting || setupShopMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <span>Lưu & bắt đầu bán</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default ShopSetupForm;

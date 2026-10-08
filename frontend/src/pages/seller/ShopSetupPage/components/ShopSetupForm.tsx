import React from 'react';
import { Formik, Form } from 'formik';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FormikField from '@/components/customFieldsFormik/FormikField';
import InputField from '@/components/customFieldsFormik/InputField';
import { showSuccess, showError } from '@/helpers/toast';
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
  const navigate = useNavigate();
  const setupShopMutation = userService.useSetupShop();

  const handleSubmit = async (values: SetupShopDto) => {
    try {
      await setupShopMutation.mutateAsync({
        shopName: values.shopName.trim(),
        pickupAddress: values.pickupAddress.trim(),
        phone: values.phone.trim(),
      });

      showSuccess('Gian hàng của bạn đã sẵn sàng bắt đầu bán sản phẩm.');

      if (onSuccess) {
        onSuccess();
      } else {
        navigate(BaseUrl.SellerProducts);
      }
    } catch (err: unknown) {
      const errResponse = err as { response?: { data?: { message?: string | string[] } } };
      const rawMessage = errResponse?.response?.data?.message;
      const message =
        (Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage) ||
        'Có lỗi xảy ra khi thiết lập gian hàng. Vui lòng thử lại.';

      showError(message);
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-black">
                  Tên gian hàng <span className="text-red-500">*</span>
                </span>
                <span
                  className={`text-xs ${
                    values.shopName.length > 0 ? 'text-zinc-600' : 'text-zinc-400'
                  }`}
                >
                  {values.shopName.length}/50
                </span>
              </div>
              <FormikField
                name="shopName"
                component={InputField}
                type="text"
                maxLength={50}
                placeholder="Nhập tên gian hàng của bạn"
                helperText={
                  <span className="flex items-center justify-between text-xs w-full">
                    <span id="shopName-hint" className="text-zinc-500">
                      Từ 3 đến 50 ký tự
                    </span>
                    {isShopNameValid && (
                      <Badge variant="aloe" className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 bg-aloe text-black">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Hợp lệ
                      </Badge>
                    )}
                  </span>
                }
              />
            </div>

            {/* Phone Number */}
            <FormikField
              name="phone"
              component={InputField}
              type="tel"
              label={
                <>
                  Số điện thoại liên hệ <span className="text-red-500">*</span>
                </>
              }
              placeholder="09xxxxxxxx hoặc +84xxxxxxxxx"
              helperText="Định dạng: 09xxxxxxxx hoặc +84xxxxxxxxx"
            />

            {/* Pickup Address */}
            <FormikField
              name="pickupAddress"
              component={InputField}
              as="textarea"
              rows={4}
              label={
                <>
                  Địa chỉ lấy hàng <span className="text-red-500">*</span>
                </>
              }
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
              helperText="Tối thiểu 10 ký tự để đơn vị vận chuyển có thể đến lấy hàng"
            />

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-4 border-t border-[#e4e4e7]">
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

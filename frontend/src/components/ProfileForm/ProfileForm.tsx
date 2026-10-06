import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { userService, UpdateProfileDto } from '@/services/user.service';

interface ProfileFormProps {
  initialValues?: {
    fullName: string;
    phone: string | null;
    address: string | null;
  };
}

const validationSchema = Yup.object().shape({
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

const ProfileForm = ({ initialValues }: ProfileFormProps) => {
  const { toast } = useToast();
  const updateProfileMutation = userService.useUpdateProfile();

  const handleSubmit = async (values: UpdateProfileDto) => {
    try {
      await updateProfileMutation.mutateAsync({
        fullName: values.fullName?.trim(),
        phone: values.phone && values.phone.trim() ? values.phone.trim() : undefined,
        address: values.address && values.address.trim() ? values.address.trim() : undefined,
      });
      toast({
        title: 'Cập nhật thành công',
        description: 'Thông tin hồ sơ đã được cập nhật',
        variant: 'default',
      });
    } catch {
      toast({
        title: 'Cập nhật thất bại',
        description: 'Có lỗi xảy ra khi cập nhật thông tin',
        variant: 'destructive',
      });
    }
  };

  return (
    <Formik
      initialValues={{
        fullName: initialValues?.fullName || '',
        phone: initialValues?.phone || '',
        address: initialValues?.address || '',
      }}
      enableReinitialize
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched, isSubmitting }) => (
        <Form className="space-y-6" noValidate>
          {/* Live region for accessibility */}
          <div role="status" aria-live="polite" className="sr-only">
            {Object.keys(touched).length > 0 && Object.keys(errors).length > 0
              ? 'Biểu mẫu có lỗi cần sửa'
              : ''}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="block text-sm font-medium text-zinc-900">
              Họ tên
            </Label>
            <Field
              as={Input}
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Nhập họ tên"
              className={touched.fullName && errors.fullName ? 'border-red-500' : ''}
              aria-invalid={touched.fullName && errors.fullName ? 'true' : 'false'}
              aria-describedby={touched.fullName && errors.fullName ? 'fullName-error' : undefined}
            />
            {touched.fullName && errors.fullName && (
              <p id="fullName-error" className="text-sm text-red-700 font-medium" role="alert">
                {errors.fullName}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="block text-sm font-medium text-zinc-900">
              Số điện thoại
            </Label>
            <Field
              as={Input}
              id="phone"
              name="phone"
              type="tel"
              placeholder="09xxxxxxxx hoặc +84xxxxxxxxx"
              className={touched.phone && errors.phone ? 'border-red-500' : ''}
              aria-invalid={touched.phone && errors.phone ? 'true' : 'false'}
              aria-describedby={touched.phone && errors.phone ? 'phone-error' : undefined}
            />
            {touched.phone && errors.phone && (
              <p id="phone-error" className="text-sm text-red-700 font-medium" role="alert">
                {errors.phone}
              </p>
            )}
            <p className="text-xs text-zinc-500">Định dạng: 09xxxxxxxx hoặc +84xxxxxxxxx</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="block text-sm font-medium text-zinc-900">
              Địa chỉ
            </Label>
            <Field
              as={Input}
              id="address"
              name="address"
              type="text"
              placeholder="Nhập địa chỉ"
              className={touched.address && errors.address ? 'border-red-500' : ''}
              aria-invalid={touched.address && errors.address ? 'true' : 'false'}
              aria-describedby={touched.address && errors.address ? 'address-error' : undefined}
            />
            {touched.address && errors.address && (
              <p id="address-error" className="text-sm text-red-700 font-medium" role="alert">
                {errors.address}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-200">
            <Button
              type="submit"
              disabled={isSubmitting || !!updateProfileMutation?.isPending}
              className="h-11 rounded-full bg-black text-white hover:bg-zinc-800 active:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting || updateProfileMutation?.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default ProfileForm;
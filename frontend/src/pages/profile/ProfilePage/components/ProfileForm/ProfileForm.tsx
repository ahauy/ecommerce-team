import { Formik, Form } from 'formik';
import { Button } from '@/components/ui/button';
import FormikField from '@/components/customFieldsFormik/FormikField';
import InputField from '@/components/customFieldsFormik/InputField';
import { showSuccess, showError } from '@/helpers/toast';
import { userService, UpdateProfileDto } from '@/services/user.service';
import { profileValidationSchema } from '../../schemas/profile.schema';

export interface ProfileFormProps {
  initialValues?: {
    fullName: string;
    phone: string | null;
    address: string | null;
  };
}

const ProfileForm = ({ initialValues }: ProfileFormProps) => {
  const updateProfileMutation = userService.useUpdateProfile();

  const handleSubmit = async (values: UpdateProfileDto) => {
    try {
      await updateProfileMutation.mutateAsync({
        fullName: values.fullName?.trim(),
        phone: values.phone && values.phone.trim() ? values.phone.trim() : undefined,
        address: values.address && values.address.trim() ? values.address.trim() : undefined,
      });
      showSuccess('Thông tin hồ sơ đã được cập nhật');
    } catch {
      showError('Có lỗi xảy ra khi cập nhật thông tin');
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
      validationSchema={profileValidationSchema}
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

          <FormikField
            name="fullName"
            component={InputField}
            label="Họ tên"
            type="text"
            placeholder="Nhập họ tên"
          />

          <FormikField
            name="phone"
            component={InputField}
            label="Số điện thoại"
            type="tel"
            placeholder="09xxxxxxxx hoặc +84xxxxxxxxx"
            helperText="Định dạng: 09xxxxxxxx hoặc +84xxxxxxxxx"
          />

          <FormikField
            name="address"
            component={InputField}
            label="Địa chỉ"
            type="text"
            placeholder="Nhập địa chỉ"
          />

          <div className="flex justify-end pt-4 border-t border-hairline-light">
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

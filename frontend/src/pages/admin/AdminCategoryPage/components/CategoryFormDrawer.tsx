import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import { X, Lock, Check, Image as ImageIcon, Trash2 } from 'lucide-react';
import { AdminCategoryItem, CreateCategoryPayload, UpdateCategoryPayload } from '@/types/category.types';
import { adminCategoryService } from '../services/admin-category.service';
import { slugifyVietnamese } from '@/helpers/slugify';
import { showError, showSuccess } from '@/helpers/toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import FormikField from '@/components/customFieldsFormik/FormikField';
import InputField from '@/components/customFieldsFormik/InputField';
import SwitchBoxField from '@/components/customFieldsFormik/SwitchBoxField';
import { CategorySchema, CategoryFormValues } from '../schemas/category.schema';

export interface CategoryFormDrawerProps {
  isOpen: boolean;
  category: AdminCategoryItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CategoryFormDrawer: React.FC<CategoryFormDrawerProps> = ({
  isOpen,
  category,
  onClose,
  onSuccess,
}) => {
  const [conflictError, setConflictError] = useState<string | null>(null);
  const isEditMode = !!category;

  const createMutation = adminCategoryService.useCreateCategory();
  const updateMutation = adminCategoryService.useUpdateCategory();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  const initialValues: CategoryFormValues = {
    name: category?.name ?? '',
    description: category?.description ?? '',
    imageUrl: category?.imageUrl ?? '',
    isActive: category?.isActive ?? true,
  };

  const handleFormSubmit = async (values: CategoryFormValues) => {
    setConflictError(null);
    try {
      if (isEditMode && category) {
        const payload: UpdateCategoryPayload = {
          name: values.name.trim(),
          description: values.description.trim(),
          imageUrl: values.imageUrl.trim() || undefined,
          isActive: values.isActive,
        };
        await updateMutation.mutateAsync({ id: category._id, payload });
        showSuccess('Cập nhật danh mục thành công');
      } else {
        const payload: CreateCategoryPayload = {
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          imageUrl: values.imageUrl.trim() || undefined,
          isActive: values.isActive,
        };
        await createMutation.mutateAsync(payload);
        showSuccess('Tạo danh mục mới thành công');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number; data?: { message?: string } } };
      if (errorObj.response?.status === 409) {
        setConflictError('Tên danh mục đã tồn tại, vui lòng chọn tên khác');
      } else {
        showError(err);
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <SheetContent
        side="right"
        data-testid="category-form-drawer"
        aria-describedby={undefined}
        className="w-full max-w-lg p-0 flex flex-col justify-between overflow-hidden bg-white sm:max-w-lg border-l border-hairline-light [&>button]:hidden"
        style={{ fontFeatureSettings: '"ss03"' }}
      >
        {/* Header */}
        <SheetHeader className="p-6 bg-white border-b border-hairline-light flex flex-row items-start justify-between shrink-0 space-y-0 text-left">
          <div className="space-y-1 pr-4">
            <SheetTitle id="drawer-title" className="text-2xl font-light text-black tracking-tight leading-snug">
              {isEditMode ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </SheetTitle>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {isEditMode
                ? 'Cập nhật thông tin danh mục hiển thị trên sàn.'
                : 'Thêm danh mục mới vào cấu trúc ngành hàng và điều hướng.'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 hover:text-black transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </SheetHeader>

        {/* Form Body */}
        <Formik
          initialValues={initialValues}
          validationSchema={CategorySchema}
          onSubmit={handleFormSubmit}
          enableReinitialize
        >
          {({ values, setFieldValue }) => {
            const currentSlug = isEditMode
              ? category?.slug ?? ''
              : slugifyVietnamese(values.name);

            return (
              <Form className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {conflictError && (
                    <div
                      data-testid="category-form-conflict-error"
                      className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium"
                    >
                      {conflictError}
                    </div>
                  )}

                  {/* Tên danh mục */}
                  <FormikField
                    name="name"
                    component={InputField}
                    id="cat-name-input"
                    label="Tên danh mục *"
                    placeholder="Ví dụ: Thiết bị điện tử"
                    helperText="Tên hiển thị trên thanh điều hướng và bộ lọc."
                  />

                  {/* Slug Readonly */}
                  <div className="space-y-1.5">
                    <label htmlFor="cat-slug-input" className="block text-xs font-semibold text-black">
                      Đường dẫn (slug)
                    </label>
                    <div className="flex items-center h-11 bg-zinc-100 border border-hairline-light rounded-lg px-3.5 text-zinc-500 cursor-not-allowed">
                      <span className="text-xs text-zinc-400 select-none">/category/</span>
                      <input
                        id="cat-slug-input"
                        type="text"
                        value={currentSlug}
                        readOnly
                        disabled
                        className="w-full bg-transparent text-zinc-700 text-sm pl-1 outline-none cursor-not-allowed font-mono"
                      />
                      <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
                    </div>
                    <p className="text-[12px] text-zinc-500 leading-relaxed">
                      Đường dẫn được tạo tự động từ tên danh mục nhằm tối ưu SEO và không thể chỉnh sửa trực tiếp.
                    </p>
                  </div>

                  {/* Mô tả */}
                  <FormikField
                    name="description"
                    component={InputField}
                    as="textarea"
                    rows={4}
                    id="cat-description-input"
                    label="Mô tả danh mục"
                    placeholder="Mô tả ngành hàng, danh mục sản phẩm liên quan..."
                  />

                  {/* Ảnh danh mục */}
                  <div className="space-y-2">
                    <span className="block text-xs font-semibold text-black">
                      Ảnh danh mục (URL)
                    </span>
                    <div className="flex items-center gap-4 p-3 bg-zinc-50 border border-hairline-light rounded-lg">
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-zinc-200 border border-hairline-light flex items-center justify-center text-zinc-400">
                        {values.imageUrl ? (
                          <img
                            src={values.imageUrl}
                            alt="Category Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '';
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <FormikField
                          name="imageUrl"
                          component={InputField}
                          type="url"
                          id="cat-image-input"
                          placeholder="https://example.com/image.jpg"
                        />
                        {values.imageUrl && (
                          <button
                            type="button"
                            aria-label="Xóa ảnh"
                            onClick={() => setFieldValue('imageUrl', '')}
                            className="min-h-[32px] px-3 py-1 rounded-full border border-hairline-light bg-white text-[11px] text-red-600 hover:bg-red-50 hover:border-red-200 font-medium inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Xóa ảnh</span>
                          </button>
                        )}
                        <p className="text-[11px] text-zinc-500">Định dạng hỗ trợ: JPG, PNG, WEBP. Tối đa 2MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Kích hoạt Switch */}
                  <div className="pt-2 border-t border-hairline-light">
                    <FormikField
                      name="isActive"
                      component={SwitchBoxField}
                      id="category-active-toggle"
                      label="Kích hoạt danh mục"
                      classNameContainer="justify-between min-h-[44px]"
                    />
                    <p className="text-[12px] text-zinc-500 mt-1">
                      Cho phép danh mục xuất hiện trên trang chủ và menu tìm kiếm
                    </p>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 flex items-center justify-end gap-3 bg-white border-t border-hairline-light shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="min-h-[44px] px-6 py-2.5 rounded-full border border-hairline-light bg-white text-zinc-700 hover:bg-zinc-100 text-xs font-medium transition-colors duration-150 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-[44px] px-6 py-2.5 rounded-full bg-black text-white text-xs font-medium hover:bg-zinc-800 shadow-sm transition-all duration-150 inline-flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{isEditMode ? 'Lưu thay đổi' : 'Tạo danh mục'}</span>
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </SheetContent>
    </Sheet>
  );
};

export default CategoryFormDrawer;

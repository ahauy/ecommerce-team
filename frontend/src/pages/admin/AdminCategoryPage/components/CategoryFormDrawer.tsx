import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { X, Lock, Check, Image as ImageIcon, Trash2 } from 'lucide-react';
import { AdminCategoryItem, CreateCategoryPayload, UpdateCategoryPayload } from '@/types/category.types';
import { categoryService } from '@/services/category.service';
import { slugifyVietnamese } from '@/helpers/slugify';
import { showError, showSuccess } from '@/helpers/toast';

export interface CategoryFormDrawerProps {
  isOpen: boolean;
  category: AdminCategoryItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

import { CategorySchema, CategoryFormValues } from '../schemas/category.schema';

export const CategoryFormDrawer: React.FC<CategoryFormDrawerProps> = ({
  isOpen,
  category,
  onClose,
  onSuccess,
}) => {
  const [conflictError, setConflictError] = useState<string | null>(null);
  const isEditMode = !!category;

  const createMutation = categoryService.useCreateCategory();
  const updateMutation = categoryService.useUpdateCategory();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isSubmitting]);

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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      data-testid="category-form-drawer"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex justify-end animate-in fade-in duration-200"
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 bg-white border-b border-[#e4e4e7] flex items-start justify-between shrink-0">
          <div className="space-y-1 pr-4">
            <h2 id="drawer-title" className="text-2xl font-light text-black tracking-tight leading-snug">
              {isEditMode ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </h2>
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
        </div>

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
                  <div className="space-y-1.5">
                    <label htmlFor="cat-name-input" className="block text-xs font-semibold text-black">
                      Tên danh mục *
                    </label>
                    <Field
                      id="cat-name-input"
                      name="name"
                      type="text"
                      placeholder="Ví dụ: Thiết bị điện tử"
                      className="w-full h-11 px-3.5 bg-white border border-[#e4e4e7] rounded-lg text-black text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all"
                    />
                    <ErrorMessage name="name" component="p" className="text-xs text-red-600 font-medium" />
                    <p className="text-[12px] text-zinc-500">Tên hiển thị trên thanh điều hướng và bộ lọc.</p>
                  </div>

                  {/* Slug Readonly */}
                  <div className="space-y-1.5">
                    <label htmlFor="cat-slug-input" className="block text-xs font-semibold text-black">
                      Đường dẫn (slug)
                    </label>
                    <div className="flex items-center h-11 bg-zinc-100 border border-[#e4e4e7] rounded-lg px-3.5 text-zinc-500 cursor-not-allowed">
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
                  <div className="space-y-1.5">
                    <label htmlFor="cat-description-input" className="block text-xs font-semibold text-black">
                      Mô tả danh mục
                    </label>
                    <Field
                      id="cat-description-input"
                      as="textarea"
                      name="description"
                      rows={4}
                      placeholder="Mô tả ngành hàng, danh mục sản phẩm liên quan..."
                      className="w-full p-3 bg-white border border-[#e4e4e7] rounded-lg text-black text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-black transition-all resize-none leading-relaxed"
                    />
                    <ErrorMessage name="description" component="p" className="text-xs text-red-600 font-medium" />
                  </div>

                  {/* Ảnh danh mục */}
                  <div className="space-y-2">
                    <label htmlFor="cat-image-input" className="block text-xs font-semibold text-black">
                      Ảnh danh mục (URL)
                    </label>
                    <div className="flex items-center gap-4 p-3 bg-zinc-50 border border-[#e4e4e7] rounded-lg">
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-zinc-200 border border-[#e4e4e7] flex items-center justify-center text-zinc-400">
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
                        <Field
                          id="cat-image-input"
                          name="imageUrl"
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          className="w-full h-10 px-3 bg-white border border-[#e4e4e7] rounded-md text-xs text-black focus:outline-none focus:ring-1 focus:ring-black"
                        />
                        {values.imageUrl && (
                          <button
                            type="button"
                            aria-label="Xóa ảnh"
                            onClick={() => setFieldValue('imageUrl', '')}
                            className="min-h-[32px] px-3 py-1 rounded-full border border-[#e4e4e7] bg-white text-[11px] text-red-600 hover:bg-red-50 hover:border-red-200 font-medium inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Xóa ảnh</span>
                          </button>
                        )}
                        <p className="text-[11px] text-zinc-500">Định dạng hỗ trợ: JPG, PNG, WEBP. Tối đa 2MB.</p>
                      </div>
                    </div>
                    <ErrorMessage name="imageUrl" component="p" className="text-xs text-red-600 font-medium" />
                  </div>

                  {/* Kích hoạt Switch */}
                  <div className="pt-2 border-t border-[#e4e4e7]">
                    <label className="flex items-center justify-between cursor-pointer py-2 min-h-[44px]">
                      <div className="space-y-0.5 pr-4">
                        <span className="block text-xs font-semibold text-black">Kích hoạt danh mục</span>
                        <p className="text-[12px] text-zinc-500">
                          Cho phép danh mục xuất hiện trên trang chủ và menu tìm kiếm
                        </p>
                      </div>
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          id="category-active-toggle"
                          checked={values.isActive}
                          onChange={(e) => setFieldValue('isActive', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black" />
                      </div>
                    </label>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 flex items-center justify-end gap-3 bg-white border-t border-[#e4e4e7] shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="min-h-[44px] px-6 py-2.5 rounded-full border border-[#e4e4e7] bg-white text-zinc-700 hover:bg-zinc-100 text-xs font-medium transition-colors inline-flex items-center justify-center"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-[44px] px-6 py-2.5 rounded-full bg-black text-white text-xs font-medium hover:bg-zinc-800 shadow-sm transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
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
      </div>
    </div>
  );
};

export default CategoryFormDrawer;

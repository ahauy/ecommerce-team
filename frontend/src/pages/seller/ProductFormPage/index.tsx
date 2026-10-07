import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Lock, AlertCircle } from 'lucide-react';
import { categoryService } from '@/services/category.service';
import { useProductDetailQuery } from './hooks/useProductDetailQuery';
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from './hooks/useProductMutation';
import { ImageUploader } from './components/ImageUploader';
import { BlockedProductAlert } from './components/BlockedProductAlert';
import { BottomSaveBar } from './components/BottomSaveBar';
import {
  productValidationSchema,
  initialProductValues,
} from './schemas/product.schema';
import { ProductFormValues } from './types';
import BaseUrl from '@/consts/baseUrl';
import { cn } from '@/lib/utils';

const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Queries
  const { data: categories = [], isLoading: isCategoriesLoading } =
    categoryService.useCategories();
  const { data: productDetail, isLoading: isProductLoading } =
    useProductDetailQuery(id);

  // Mutations
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();

  const isBlocked = Boolean(productDetail?.isBlocked);

  // Initial values
  const formInitialValues: ProductFormValues = productDetail
    ? {
        name: productDetail.name || '',
        categoryId: productDetail.category?.id || '',
        description: productDetail.description || '',
        price: productDetail.price ?? '',
        stock: productDetail.stock ?? '',
        images: productDetail.images || [],
        isActive: productDetail.isActive ?? true,
      }
    : initialProductValues;

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitError(null);
    try {
      const payload = {
        name: values.name.trim(),
        categoryId: values.categoryId,
        description: values.description.trim(),
        price: Number(values.price),
        stock: Number(values.stock),
        images: values.images,
      };

      if (isEditMode && id) {
        await updateMutation.mutateAsync({
          id,
          payload: {
            ...payload,
            isActive: values.isActive,
          },
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      navigate(BaseUrl.SellerProducts);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi lưu sản phẩm. Vui lòng thử lại.';
      setSubmitError(msg);
    }
  };

  if ((isEditMode && isProductLoading) || isCategoriesLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      data-testid="product-form-page"
      className="flex flex-col w-full min-w-0 pb-28"
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
        <Link
          to={BaseUrl.SellerProducts}
          className="hover:text-black transition-colors"
        >
          Sản phẩm của tôi
        </Link>
        <span className="text-zinc-400">›</span>
        <span className="text-black font-medium">
          {isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </span>
      </nav>

      {/* Page Title */}
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-black">
          {isEditMode ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </h1>
      </div>

      {/* Admin Block Alert if blocked */}
      {isBlocked && (
        <BlockedProductAlert blockReason={productDetail?.blockReason} />
      )}

      {/* Global Error Banner if submit failed */}
      {submitError && (
        <div
          data-testid="form-submit-error"
          className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-4 flex items-center gap-2 mb-6"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <Formik
        enableReinitialize
        initialValues={formInitialValues}
        validationSchema={productValidationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, setFieldValue, isSubmitting }) => (
          <Form id="product-form">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Image Uploader (5 cols) */}
              <div className="lg:col-span-5">
                <ImageUploader
                  images={values.images}
                  onChange={(newImages) => setFieldValue('images', newImages)}
                  disabled={isSubmitting}
                />
                {touched.images && errors.images && (
                  <p className="text-red-600 text-xs mt-1.5">
                    {String(errors.images)}
                  </p>
                )}
              </div>

              {/* Right Column: Product Information Form (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-6 bg-white rounded-xl p-5 sm:p-6 border border-[#e4e4e7] shadow-card">
                {/* Header card with public visibility toggle */}
                <div className="flex items-center justify-between pb-4 border-b border-[#e4e4e7]">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-black">
                      Thông tin sản phẩm
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Quản lý chi tiết nội dung hiển thị trong gian hàng
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-black">
                      Hiển thị công khai
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={values.isActive}
                      aria-label="Hiển thị công khai"
                      disabled={isBlocked || isSubmitting}
                      onClick={() => setFieldValue('isActive', !values.isActive)}
                      className={cn(
                        'toggle-btn w-10 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer',
                        values.isActive ? 'bg-[#c1fbd4]' : 'bg-[#d4d4d8]',
                        isBlocked && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span
                        className={cn(
                          'block w-5 h-5 rounded-full shadow-xs transition-transform',
                          values.isActive
                            ? 'bg-black translate-x-4'
                            : 'bg-white translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="product-name"
                        className="text-xs font-semibold text-black"
                      >
                        Tên sản phẩm <span className="text-red-500">*</span>
                      </label>
                      <span
                        id="name-counter"
                        className="text-[11px] text-zinc-500 font-mono"
                      >
                        {values.name.length}/120
                      </span>
                    </div>
                    <Field
                      id="product-name"
                      name="name"
                      type="text"
                      maxLength={120}
                      placeholder="Nhập tên sản phẩm (tối đa 120 ký tự)..."
                      className={cn(
                        'h-10 px-3.5 rounded-lg border bg-white text-xs text-black placeholder:text-zinc-400 focus:outline-none transition-colors',
                        touched.name && errors.name
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-[#e4e4e7] focus:border-black'
                      )}
                    />
                    <ErrorMessage
                      name="name"
                      component="p"
                      className="text-red-600 text-[11px]"
                    />
                  </div>

                  {/* Category */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="product-category"
                      className="text-xs font-semibold text-black"
                    >
                      Danh mục <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="select"
                      id="product-category"
                      name="categoryId"
                      className={cn(
                        'h-10 px-3.5 rounded-lg border bg-white text-xs text-black focus:outline-none transition-colors cursor-pointer',
                        touched.categoryId && errors.categoryId
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-[#e4e4e7] focus:border-black'
                      )}
                    >
                      <option value="">-- Chọn danh mục sản phẩm --</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </Field>
                    <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                      <Lock className="w-3 h-3 text-zinc-400" />
                      <span>Danh mục dùng chung do quản trị viên quy định</span>
                    </div>
                    <ErrorMessage
                      name="categoryId"
                      component="p"
                      className="text-red-600 text-[11px]"
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="product-desc"
                      className="text-xs font-semibold text-black"
                    >
                      Mô tả sản phẩm <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="textarea"
                      id="product-desc"
                      name="description"
                      rows={6}
                      placeholder="Mô tả chi tiết sản phẩm, công dụng, bảo quản..."
                      className={cn(
                        'p-3.5 rounded-lg border bg-white text-xs text-black placeholder:text-zinc-400 focus:outline-none transition-colors resize-y leading-relaxed',
                        touched.description && errors.description
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-[#e4e4e7] focus:border-black'
                      )}
                    />
                    <ErrorMessage
                      name="description"
                      component="p"
                      className="text-red-600 text-[11px]"
                    />
                  </div>

                  {/* Price & Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Price */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="product-price"
                        className="text-xs font-semibold text-black"
                      >
                        Giá (₫) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Field
                          id="product-price"
                          name="price"
                          type="number"
                          min={1}
                          placeholder="350000"
                          className={cn(
                            'w-full h-10 pl-3.5 pr-8 rounded-lg border bg-white text-xs font-semibold text-black placeholder:text-zinc-400 focus:outline-none transition-colors',
                            touched.price && errors.price
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-[#e4e4e7] focus:border-black'
                          )}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-medium pointer-events-none">
                          ₫
                        </span>
                      </div>
                      <ErrorMessage
                        name="price"
                        component="p"
                        className="text-red-600 text-[11px]"
                      />
                    </div>

                    {/* Stock */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="product-stock"
                        className="text-xs font-semibold text-black"
                      >
                        Tồn kho <span className="text-red-500">*</span>
                      </label>
                      <Field
                        id="product-stock"
                        name="stock"
                        type="number"
                        min={0}
                        placeholder="24"
                        className={cn(
                          'w-full h-10 px-3.5 rounded-lg border bg-white text-xs font-semibold text-black placeholder:text-zinc-400 focus:outline-none transition-colors',
                          touched.stock && errors.stock
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#e4e4e7] focus:border-black'
                        )}
                      />
                      <ErrorMessage
                        name="stock"
                        component="p"
                        className="text-red-600 text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed bottom bar */}
            <BottomSaveBar
              onCancel={() => navigate(BaseUrl.SellerProducts)}
              isSubmitting={isSubmitting}
              isEditMode={isEditMode}
            />
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ProductFormPage;

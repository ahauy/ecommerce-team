import React from 'react';
import { Form, Formik } from 'formik';
import { Ban, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import FormikField from '@/components/customFieldsFormik/FormikField';
import InputField from '@/components/customFieldsFormik/InputField';
import {
  BLOCK_REASON_MAX,
  BLOCK_REASON_PRESETS,
  BlockReasonSchema,
  type BlockReasonFormValues,
} from '../schemas/block-reason.schema';
import type { AdminProduct } from '../types';

export interface BlockProductDialogProps {
  isOpen: boolean;
  product: AdminProduct | null;
  onClose: () => void;
  onConfirm: (product: AdminProduct, reason: string) => Promise<void>;
  isSubmitting?: boolean;
}

const initialValues: BlockReasonFormValues = { reason: '' };

export const BlockProductDialog: React.FC<BlockProductDialogProps> = ({
  isOpen,
  product,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  if (!isOpen || !product) return null;

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent
        data-testid="block-product-dialog"
        className="max-w-lg w-full bg-white rounded-2xl p-6 flex flex-col border border-hairline-light shadow-card"
        style={{ fontFeatureSettings: '"ss03"' }}
      >
        <AlertDialogHeader className="pb-3 text-left">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <AlertDialogTitle className="text-lg font-medium text-black tracking-tight">Chặn sản phẩm</AlertDialogTitle>
            </div>
            <button
              type="button"
              aria-label="Đóng hộp thoại"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors -mr-2 -mt-2 disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <AlertDialogDescription className="sr-only">Nhập lý do và xác nhận chặn sản phẩm vi phạm</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-zinc-50 border border-hairline-light rounded-xl p-4 flex flex-col">
          <span className="font-semibold text-sm text-black truncate">{product.name}</span>
          <span className="text-xs text-zinc-500 truncate">
            {product.seller?.shopName ?? product.seller?.fullName ?? 'Không rõ người bán'}
          </span>
        </div>

        <p
          data-testid="block-warning"
          className="bg-red-50/50 border border-red-200 rounded-xl p-4 text-xs text-zinc-700 leading-relaxed"
        >
          Sản phẩm sẽ <strong className="text-red-700">biến khỏi trang công khai</strong> và không thể đặt mua. Người
          bán vẫn thấy sản phẩm kèm lý do bên dưới và không tự mở lại được.
        </p>

        <Formik<BlockReasonFormValues>
          initialValues={initialValues}
          validationSchema={BlockReasonSchema}
          onSubmit={(values) => onConfirm(product, values.reason.trim())}
        >
          {({ values, setFieldValue, setFieldTouched }) => (
            <Form noValidate className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Lý do thường gặp">
                {BLOCK_REASON_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      void setFieldValue('reason', preset);
                      void setFieldTouched('reason', true, false);
                    }}
                    className="min-h-[36px] px-3 rounded-full text-[12px] font-medium bg-white text-zinc-700 border border-hairline-light hover:bg-zinc-50 hover:text-black transition-colors disabled:opacity-50"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <FormikField
                name="reason"
                component={InputField}
                as="textarea"
                rows={4}
                id="block-reason-input"
                label="Lý do chặn"
                required
                disabled={isSubmitting}
                placeholder="Ví dụ: Sản phẩm vi phạm bản quyền thương hiệu..."
              />
              <span className="self-end text-[12px] text-zinc-400 tabular-nums" data-testid="reason-counter">
                {values.reason.trim().length}/{BLOCK_REASON_MAX}
              </span>

              <div className="flex justify-end items-center gap-3 pt-4 border-t border-hairline-light">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="min-h-[44px] rounded-full border border-hairline-light px-6 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors inline-flex items-center justify-center disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] rounded-full bg-red-600 text-white px-6 py-2.5 text-xs font-medium hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{isSubmitting ? 'Đang xử lý...' : 'Chặn sản phẩm'}</span>
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BlockProductDialog;

import React from 'react';
import { RefreshCw, Loader2, Check } from 'lucide-react';

interface BottomSaveBarProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isEditMode: boolean;
  disabled?: boolean;
}

export const BottomSaveBar: React.FC<BottomSaveBarProps> = ({
  onCancel,
  isSubmitting,
  isEditMode,
  disabled = false,
}) => {
  return (
    <div
      data-testid="bottom-save-bar"
      className="fixed bottom-0 left-0 right-0 lg:left-[260px] z-40 bg-white shadow-card py-3 border-t border-hairline-light"
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-zinc-500 text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            Thay đổi sẽ có hiệu lực ngay sau khi lưu.
          </span>
          <span className="sm:hidden">Lưu để cập nhật ngay.</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-10 px-5 rounded-full border border-hairline-light bg-white text-zinc-700 hover:bg-zinc-100 text-xs font-medium transition-colors duration-150 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            Hủy
          </button>
          <button
            id="btn-save"
            type="submit"
            disabled={isSubmitting || disabled}
            className="h-10 px-6 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-semibold transition-all duration-150 shadow-sm flex items-center gap-1.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isEditMode ? 'Lưu thay đổi' : 'Đăng bán sản phẩm'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface BlockedProductAlertProps {
  blockReason?: string | null;
}

export const BlockedProductAlert: React.FC<BlockedProductAlertProps> = ({
  blockReason,
}) => {
  return (
    <div
      data-testid="blocked-product-alert"
      className="w-full bg-red-50 border border-red-200 rounded-xl p-4 sm:p-5 flex items-start gap-3.5 mb-6 shadow-xs"
    >
      <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-sm text-red-900">
          Sản phẩm đang bị Admin khóa
        </h3>
        <p className="text-xs text-red-700 mt-1 leading-relaxed">
          <strong className="font-medium">Lý do:</strong>{' '}
          {blockReason || 'Hình ảnh hoặc nội dung vi phạm tiêu chuẩn cộng đồng.'}
        </p>
        <p className="text-xs text-red-600/80 mt-1">
          Sản phẩm bị ẩn khỏi toàn bộ sàn và bạn không thể tự bật hiển thị lại.
        </p>
      </div>
    </div>
  );
};

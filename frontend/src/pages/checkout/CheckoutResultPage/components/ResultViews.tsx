import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import type { CheckoutResult } from '@/types/checkout-result.types';
import ResultHeader from './ResultHeader';
import { FailureActions, SuccessActions } from './ResultActions';
import { FailedOrderList, SuccessOrderList } from './ResultOrderList';

const PAYMENT_GATEWAY = 'PayOS';

const Row: React.FC<React.PropsWithChildren<{ label: string }>> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 text-xs">
    <dt className="text-zinc-500">{label}</dt>
    <dd className="font-medium text-black">{children}</dd>
  </div>
);

/** Thanh toán thành công (Đặt hàng thành công #1). */
export const SuccessView: React.FC<{ checkout: CheckoutResult }> = ({ checkout }) => (
  <div data-testid="result-success" className="space-y-8">
    <ResultHeader
      tone="success"
      title="Đặt hàng thành công"
      chip={`Mã thanh toán: ${checkout.checkoutCode}`}
      description="Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được ghi nhận và chuyển tới các nhà bán hàng."
    />
    <SuccessOrderList orders={checkout.orders} />
    <SuccessActions />
  </div>
);

/** Đang chờ xác nhận — trang tự poll, không cần người dùng thao tác (Đặt hàng thành công #3). */
export const PendingView: React.FC<{ checkout: CheckoutResult }> = ({ checkout }) => (
  <div data-testid="result-pending" role="status" aria-live="polite" className="space-y-8">
    <ResultHeader
      tone="pending"
      title="Đang xác nhận thanh toán..."
      description={`Hệ thống đang kết nối với cổng ${PAYMENT_GATEWAY} để kiểm tra trạng thái giao dịch. Quá trình này có thể mất vài giây, vui lòng không tắt trình duyệt.`}
    />
    <dl className="mx-auto max-w-sm space-y-3 rounded-2xl border border-hairline-light bg-white p-5 shadow-card">
      <Row label="Cổng thanh toán">{PAYMENT_GATEWAY}</Row>
      <Row label="Mã thanh toán">
        <span className="font-mono text-[11px]">{checkout.checkoutCode}</span>
      </Row>
      <Row label="Trạng thái">
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px]">Đang xử lý...</span>
      </Row>
    </dl>
  </div>
);

const FAILURE_COPY = {
  failed: {
    title: 'Thanh toán không thành công',
    description: 'Đơn hàng đã được hủy và sản phẩm đã được hoàn lại kho.',
    notice: `Giao dịch qua cổng ${PAYMENT_GATEWAY} chưa được hoàn tất hoặc đã hết thời hạn giữ đơn (30 phút). Bạn có thể quay lại giỏ hàng để tiến hành thanh toán lại.`,
  },
  expired: {
    title: 'Đơn hàng đã hết hạn thanh toán',
    description: 'Bạn chưa hoàn tất thanh toán trong 30 phút nên đơn đã được hủy và sản phẩm đã hoàn lại kho.',
    notice: null,
  },
} as const;

/** Thanh toán thất bại hoặc hết hạn (Đặt hàng thành công #2 và #4). Giỏ hàng được giữ nguyên (BR-CHK-007). */
export const FailedView: React.FC<{ checkout: CheckoutResult; kind: 'failed' | 'expired' }> = ({ checkout, kind }) => {
  const copy = FAILURE_COPY[kind];
  return (
    <div data-testid={`result-${kind}`} className="space-y-8">
      <ResultHeader tone="danger" title={copy.title} description={copy.description} />

      <div className="space-y-4 rounded-2xl border border-hairline-light bg-white p-5 shadow-card">
        {copy.notice && (
          <div className="flex items-start gap-3 text-xs leading-relaxed text-zinc-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
            <p>{copy.notice}</p>
          </div>
        )}
        <dl className="space-y-2.5 rounded-xl bg-zinc-50 px-4 py-3">
          <Row label="Phương thức">{PAYMENT_GATEWAY}</Row>
          <Row label="Tồn kho">
            <span className="inline-flex items-center gap-1 text-[#0f5132]">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Đã hoàn lại
            </span>
          </Row>
          <Row label="Giỏ hàng">Được giữ nguyên</Row>
        </dl>
      </div>

      <FailedOrderList orders={checkout.orders} />
      <FailureActions />
    </div>
  );
};

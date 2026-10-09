import React from 'react';
import { CheckCircle2, Circle, MapPin } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatVnd } from '@/helpers/format';
import {
  formatOrderDateTime,
  getOrderSteps,
  getPaymentMethodLabel,
  PAYMENT_STATUS_LABEL,
} from '@/helpers/orderHistory';
import OrderStepper from '@/pages/orders/OrderDetailPage/components/OrderStepper';
import { OrderItemThumb } from '@/pages/orders/OrderHistoryPage/components/OrderCard';
import { cn } from '@/lib/utils';
import { useSellerOrderDetail } from '../hooks/useSellerOrders';
import { getAvailableActions } from '../helpers';
import type { SellerOrder, SellerOrderAction } from '../types';
import StatusActionButtons from './StatusActionButtons';

interface SellerOrderDetailSheetProps {
  /** `null` = đóng. */
  orderId: string | null;
  /** Bản từ danh sách, hiện ngay trong lúc chờ bản chi tiết. */
  initialOrder: SellerOrder | null;
  onClose: () => void;
  onAction: (action: SellerOrderAction, order: SellerOrder) => void;
  busy?: boolean;
}

const SectionLabel: React.FC<React.PropsWithChildren<{ aside?: string }>> = ({ children, aside }) => (
  <div className="mb-2.5 flex items-center justify-between">
    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{children}</h3>
    {aside && <span className="text-[11px] text-zinc-500">{aside}</span>}
  </div>
);

const DetailBody: React.FC<{ order: SellerOrder }> = ({ order }) => {
  const recipient = order.recipient;
  const paid = order.paymentStatus === 'paid';
  const StatusIcon = paid ? CheckCircle2 : Circle;
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';
  // Bỏ ghi chú theo góc nhìn người mua ("Chờ người bán giao hàng") — chỉ giữ nhãn + mốc thời gian.
  const steps = getOrderSteps(order).map((step) => ({ ...step, note: '' }));

  return (
    <div className="space-y-6">
      <section aria-label="Tiến độ đơn hàng">
        <SectionLabel>Tiến độ đơn hàng</SectionLabel>
        <OrderStepper steps={steps} />
      </section>

      {isCancelled && (
        <div role="alert" data-testid="seller-order-cancel-alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <p className="font-semibold">{order.status === 'refunded' ? 'Đơn đã hủy và hoàn tiền' : 'Đơn đã bị hủy'}</p>
          <p className="mt-0.5">Lý do hủy: {order.cancelReason ?? 'Không có thông tin.'}</p>
        </div>
      )}

      <section aria-label="Thông tin người nhận">
        <SectionLabel>Thông tin người nhận</SectionLabel>
        {recipient ? (
          <div className="space-y-1.5 text-xs">
            <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-semibold text-black">
              {recipient.fullName}
              {recipient.phone && <span className="font-mono text-xs font-medium">{recipient.phone}</span>}
            </p>
            {recipient.email && <p className="text-zinc-500">{recipient.email}</p>}
            <p className="flex items-start gap-1.5 leading-relaxed text-zinc-600">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
              {recipient.address}
            </p>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Không có thông tin người nhận.</p>
        )}
      </section>

      <section aria-label="Sản phẩm trong đơn">
        <SectionLabel aside={`${order.items.length} mặt hàng`}>Sản phẩm trong đơn</SectionLabel>
        <ul className="space-y-3">
          {order.items.map((item, index) => (
            <li key={`${item.productId ?? 'item'}-${index}`} className="flex items-center gap-3">
              <OrderItemThumb src={item.imageUrl} alt={item.name} className="h-14 w-14" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs font-medium text-black">{item.name}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
                  SL: {item.quantity} • Đơn giá: {formatVnd(item.price)}
                </p>
              </div>
              <p className="shrink-0 text-xs font-semibold text-black tabular-nums">{formatVnd(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Thanh toán và chi tiết">
        <SectionLabel>Thanh toán &amp; chi tiết</SectionLabel>
        <dl className="space-y-2.5 rounded-xl border border-hairline-light bg-canvas-cream px-4 py-4 text-xs">
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-zinc-500">Phương thức thanh toán</dt>
            <dd className={cn('flex items-center gap-1 text-right font-medium', paid ? 'text-[#0f5132]' : 'text-zinc-600')}>
              <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {paid && order.paymentMethod
                ? `${PAYMENT_STATUS_LABEL.paid} qua ${getPaymentMethodLabel(order.paymentMethod)}`
                : PAYMENT_STATUS_LABEL[order.paymentStatus]}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-zinc-500">Thời gian đặt hàng</dt>
            <dd className="font-mono text-[11px] font-medium text-black">{formatOrderDateTime(order.createdAt) || '—'}</dd>
          </div>
          <div className="flex items-end justify-between gap-4 border-t border-hairline-light pt-3">
            <dt className="text-xs font-semibold text-black">Tổng thanh toán</dt>
            <dd data-testid="seller-order-detail-total" className="text-lg font-semibold text-black tabular-nums">
              {formatVnd(order.totalAmount)}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
};

/** Ngăn chi tiết đơn bán trượt từ phải (Đơn bán #5). */
const SellerOrderDetailSheet: React.FC<SellerOrderDetailSheetProps> = ({
  orderId,
  initialOrder,
  onClose,
  onAction,
  busy,
}) => {
  const { data, isError } = useSellerOrderDetail(orderId ?? '', initialOrder);
  const order = data ?? initialOrder;
  const hasActions = order ? getAvailableActions(order.status).length > 0 : false;

  return (
    <Sheet open={Boolean(orderId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        data-testid="seller-order-sheet"
        className="flex w-full flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-md"
        style={{ fontFeatureSettings: '"ss03"' }}
      >
        <SheetHeader className="space-y-1 border-b border-hairline-light px-6 py-5 pr-12 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Đơn bán</p>
          <SheetTitle className="text-base font-semibold tracking-tight text-black">
            Chi tiết đơn bán{' '}
            <span className="font-mono text-sm">{order ? `#${order.orderCode}` : ''}</span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Tiến độ, thông tin người nhận, sản phẩm và thanh toán của đơn bán.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {order ? (
            <DetailBody order={order} />
          ) : isError ? (
            <p className="text-xs text-zinc-500">Không tải được chi tiết đơn hàng. Vui lòng đóng và thử lại.</p>
          ) : (
            <div aria-busy="true" className="space-y-4">
              <div className="h-20 animate-pulse rounded-xl bg-zinc-100" />
              <div className="h-16 animate-pulse rounded-xl bg-zinc-100" />
              <div className="h-28 animate-pulse rounded-xl bg-zinc-100" />
            </div>
          )}
        </div>

        {order && hasActions && (
          <div className="flex items-center justify-end border-t border-hairline-light bg-white px-6 py-4">
            <StatusActionButtons order={order} onAction={onAction} disabled={busy} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default SellerOrderDetailSheet;

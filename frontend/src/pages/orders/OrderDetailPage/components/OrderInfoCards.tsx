import React from 'react';
import { CheckCircle2, Circle, CreditCard, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatOrderDateTime, getPaymentMethodLabel, PAYMENT_STATUS_LABEL } from '@/helpers/orderHistory';
import type { MyOrder } from '@/types/order-history.types';

const cardClass = 'rounded-2xl border border-[#e4e4e7] bg-white p-6 shadow-card';

const Row: React.FC<React.PropsWithChildren<{ label: string }>> = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 text-xs">
    <dt className="shrink-0 text-zinc-500">{label}</dt>
    <dd className="min-w-0 text-right font-medium text-black">{children}</dd>
  </div>
);

/** "Thông tin nhận hàng" — snapshot người nhận lúc đặt. */
export const RecipientCard: React.FC<{ order: MyOrder }> = ({ order }) => {
  const r = order.recipient;
  return (
    <section data-testid="order-recipient" className={cardClass}>
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold text-black">
        <MapPin className="h-4 w-4 text-zinc-500" aria-hidden="true" />
        Thông tin nhận hàng
      </h2>
      {r ? (
        <div className="space-y-1.5 text-xs">
          <p className="font-semibold text-black">
            {r.fullName}
            {r.phone && <span className="font-medium"> · {r.phone}</span>}
          </p>
          {r.email && <p className="text-zinc-500">{r.email}</p>}
          <p className="leading-relaxed text-zinc-600">{r.address}</p>
        </div>
      ) : (
        <p className="text-xs text-zinc-500">Không có thông tin người nhận.</p>
      )}
    </section>
  );
};

/** "Thông tin thanh toán" — phương thức, trạng thái, mã phiên thanh toán, thời gian. */
export const PaymentCard: React.FC<{ order: MyOrder }> = ({ order }) => {
  const paid = order.paymentStatus === 'paid';
  const StatusIcon = paid ? CheckCircle2 : Circle;
  return (
    <section data-testid="order-payment" className={cardClass}>
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold text-black">
        <CreditCard className="h-4 w-4 text-zinc-500" aria-hidden="true" />
        Thông tin thanh toán
      </h2>
      <dl className="space-y-2">
        <Row label="Phương thức:">{getPaymentMethodLabel(order.paymentMethod)}</Row>
        <Row label="Trạng thái:">
          <span className={cn('inline-flex items-center gap-1', paid ? 'text-[#0f5132]' : 'text-zinc-600')}>
            <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {order.paymentMethod && paid
              ? `${PAYMENT_STATUS_LABEL.paid} qua ${getPaymentMethodLabel(order.paymentMethod)}`
              : PAYMENT_STATUS_LABEL[order.paymentStatus]}
          </span>
        </Row>
        {order.checkoutCode && (
          <Row label="Phiên thanh toán:">
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px]">{order.checkoutCode}</span>
          </Row>
        )}
        <Row label="Thời gian:">{formatOrderDateTime(order.createdAt) || '—'}</Row>
      </dl>
    </section>
  );
};

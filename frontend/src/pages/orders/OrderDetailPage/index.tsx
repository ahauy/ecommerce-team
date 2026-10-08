import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BaseUrl, { shopPath } from '@/consts/baseUrl';
import { useMyOrderDetail } from '@/hooks/queries/useMyOrders';
import { getHttpStatus } from '@/helpers/format';
import { formatOrderDateTime, getOrderSteps } from '@/helpers/orderHistory';
import OrderStatusBadge from '../components/OrderStatusBadge';
import CancelReasonAlert from './components/CancelReasonAlert';
import { OrderDetailError, OrderDetailSkeleton, OrderNotFound } from './components/OrderDetailStates';
import { PaymentCard, RecipientCard } from './components/OrderInfoCards';
import OrderItemsCard from './components/OrderItemsCard';
import OrderStepper from './components/OrderStepper';

/** Trang "Chi tiết đơn hàng" của người mua (US-ORD-002). */
const OrderDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { data: order, isPending, isError, error, refetch } = useMyOrderDetail(id);

  useEffect(() => {
    document.title = order ? `Đơn ${order.orderCode} | TeamShop` : 'Chi tiết đơn hàng | TeamShop';
    return () => {
      document.title = 'TeamShop';
    };
  }, [order]);

  const renderBody = () => {
    if (isPending) return <OrderDetailSkeleton />;
    if (isError || !order) {
      const status = getHttpStatus(error);
      return status === 404 || status === 400 ? <OrderNotFound /> : <OrderDetailError onRetry={() => refetch()} />;
    }

    const shopName = order.seller.shopName ?? 'Gian hàng';
    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-medium tracking-tight text-zinc-900">
              Chi tiết đơn hàng #{order.orderCode}
            </h1>
            <p className="text-xs text-zinc-500">
              Gian hàng:{' '}
              {order.seller.id ? (
                <Link to={shopPath(order.seller.id)} className="font-semibold text-black hover:underline">
                  {shopName}
                </Link>
              ) : (
                <span className="font-semibold text-black">{shopName}</span>
              )}
              {formatOrderDateTime(order.createdAt) && ` • Ngày đặt: ${formatOrderDateTime(order.createdAt)}`}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </header>

        <OrderStepper steps={getOrderSteps(order)} />

        <div className="grid gap-4 md:grid-cols-2">
          <RecipientCard order={order} />
          <PaymentCard order={order} />
        </div>

        <OrderItemsCard order={order} />

        <CancelReasonAlert order={order} />
      </div>
    );
  };

  return (
    <div data-testid="order-detail-page" className="w-full space-y-6">
      <Link
        to={BaseUrl.AccountOrders}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-black"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Quay lại danh sách đơn mua
      </Link>
      {renderBody()}
    </div>
  );
};

export default OrderDetailPage;

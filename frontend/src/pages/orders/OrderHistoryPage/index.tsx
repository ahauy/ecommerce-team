import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '@/components/Pagination';
import { useMyOrders } from '@/hooks/queries/useMyOrders';
import {
  groupOrdersByCheckout,
  parsePageParam,
  parseTabParam,
  type OrderTabKey,
} from '@/helpers/orderHistory';
import OrderGroup from './components/OrderGroup';
import OrderStatusTabs from './components/OrderStatusTabs';
import { OrderHistoryEmpty, OrderHistoryError, OrderHistorySkeleton } from './components/OrderHistoryStates';

export const ORDERS_PAGE_SIZE = 10;

/** Trang "Đơn mua" — lịch sử đơn đã mua, lọc theo trạng thái (US-ORD-002). */
const OrderHistoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTabParam(searchParams.get('status'));
  const page = parsePageParam(searchParams.get('page'));

  const { data, isPending, isError, isPlaceholderData, refetch } = useMyOrders({
    page,
    limit: ORDERS_PAGE_SIZE,
    status: tab === 'all' ? undefined : tab,
  });

  useEffect(() => {
    document.title = 'Đơn mua | TeamShop';
    return () => {
      document.title = 'TeamShop';
    };
  }, []);

  // Lọc lại ở client phòng khi API chưa hỗ trợ `status` → không bao giờ hiện sai tab.
  const groups = useMemo(() => {
    const orders = (data?.items ?? []).filter((o) => tab === 'all' || o.status === tab);
    return groupOrdersByCheckout(orders);
  }, [data, tab]);

  const updateParams = (status: OrderTabKey, nextPage: number) => {
    const next = new URLSearchParams();
    if (status !== 'all') next.set('status', status);
    if (nextPage > 1) next.set('page', String(nextPage));
    setSearchParams(next);
  };

  const handlePageChange = (nextPage: number) => {
    updateParams(tab, nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderBody = () => {
    if (isPending) return <OrderHistorySkeleton />;
    if (isError || !data) return <OrderHistoryError onRetry={() => refetch()} />;
    if (groups.length === 0) {
      return <OrderHistoryEmpty filtered={tab !== 'all'} onShowAll={() => updateParams('all', 1)} />;
    }

    return (
      <div className={isPlaceholderData ? 'space-y-6 opacity-60 transition-opacity' : 'space-y-6'}>
        {groups.map((group, index) => (
          <OrderGroup key={`${group.checkoutCode || 'no-checkout'}-${index}`} group={group} />
        ))}
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={handlePageChange} className="pt-2" />
      </div>
    );
  };

  return (
    <div data-testid="order-history-page" className="w-full space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-medium tracking-tight text-zinc-900">Đơn mua</h1>
        <p className="text-sm text-zinc-500">Quản lý và theo dõi trạng thái các đơn hàng của bạn.</p>
      </header>

      <div className="space-y-6">
        <OrderStatusTabs value={tab} onChange={(next) => updateParams(next, 1)} />
        {renderBody()}
      </div>
    </div>
  );
};

export default OrderHistoryPage;

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';
import BaseUrl from '@/consts/baseUrl';
import Pagination from '@/components/Pagination';
import { getHttpStatus } from '@/helpers/format';
import { getApiMessage } from '@/helpers/apiError';
import { parsePageParam, parseTabParam, type OrderTabKey } from '@/helpers/orderHistory';
import { showError, showSuccess } from '@/helpers/toast';
import { ProductSearchInput } from '../MyProductsPage/components/ProductSearchInput';
import { useSellerOrdersQuery, useUpdateOrderStatus } from './hooks/useSellerOrders';
import {
  ACTION_SUCCESS_MESSAGE,
  buildStatusPayload,
  matchesOrderSearch,
  SELLER_ORDERS_PAGE_SIZE,
} from './helpers';
import SellerOrderCard from './components/SellerOrderCard';
import SellerOrderDetailSheet from './components/SellerOrderDetailSheet';
import SellerOrderStatusTabs from './components/SellerOrderStatusTabs';
import {
  SellerOrdersEmpty,
  SellerOrdersError,
  SellerOrdersFilteredEmpty,
  SellerOrdersSkeleton,
} from './components/SellerOrdersStates';
import CancelReasonDialog from './dialogs/CancelReasonDialog';
import ConfirmStatusDialog from './dialogs/ConfirmStatusDialog';
import type { SellerOrder, SellerOrderAction } from './types';

interface PendingAction {
  action: SellerOrderAction;
  order: SellerOrder;
}

/** Trang "Đơn bán" — Seller xem đơn chứa sản phẩm của mình và đẩy trạng thái giao hàng (US-SELL-002). */
const SellerOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTabParam(searchParams.get('status'));
  const page = parsePageParam(searchParams.get('page'));

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const { data, isPending, isError, isFetching, isPlaceholderData, refetch } = useSellerOrdersQuery({
    page,
    limit: SELLER_ORDERS_PAGE_SIZE,
    status: tab === 'all' ? undefined : tab,
  });
  const updateStatus = useUpdateOrderStatus();

  useEffect(() => {
    document.title = 'Đơn bán | TeamShop';
    return () => {
      document.title = 'TeamShop';
    };
  }, []);

  // Lọc lại ở client phòng khi API chưa hỗ trợ `status` → không bao giờ hiện sai tab; rồi áp dụng tìm kiếm.
  const orders = useMemo(
    () =>
      (data?.items ?? [])
        .filter((o) => tab === 'all' || o.status === tab)
        .filter((o) => matchesOrderSearch(o, search)),
    [data, tab, search]
  );

  const selectedOrder = useMemo(
    () => data?.items.find((o) => o.id === selectedId) ?? null,
    [data, selectedId]
  );

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

  const handleAction = (action: SellerOrderAction, order: SellerOrder) => setPending({ action, order });
  const closePending = () => setPending(null);

  const submitStatus = async (reason?: string) => {
    if (!pending) return;
    const { action, order } = pending;
    try {
      await updateStatus.mutateAsync({ id: order.id, ...buildStatusPayload(action, reason) });
      showSuccess(ACTION_SUCCESS_MESSAGE[action](order.orderCode));
      setPending(null);
    } catch (error) {
      showError(getApiMessage(error, 'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.'));
      // 400/403/404: đơn đã đổi trạng thái hoặc không còn thao tác được → đóng hộp thoại, danh sách tự đồng bộ lại.
      const status = getHttpStatus(error);
      if (status === 400 || status === 403 || status === 404) setPending(null);
    }
  };

  const busyOrderId = updateStatus.isPending ? (updateStatus.variables?.id ?? null) : null;
  const isSearching = search.trim() !== '';

  const renderBody = () => {
    if (isPending) return <SellerOrdersSkeleton />;
    if (isError || !data) return <SellerOrdersError onRetry={() => refetch()} />;

    if (orders.length === 0) {
      if (tab === 'all' && !isSearching && data.total === 0) {
        return <SellerOrdersEmpty onReload={() => refetch()} reloading={isFetching} />;
      }
      return (
        <SellerOrdersFilteredEmpty
          searching={isSearching}
          onReset={() => (isSearching ? setSearch('') : updateParams('all', 1))}
        />
      );
    }

    return (
      <div className={isPlaceholderData ? 'space-y-5 opacity-60 transition-opacity' : 'space-y-5'}>
        {orders.map((order) => (
          <SellerOrderCard
            key={order.id}
            order={order}
            busy={busyOrderId === order.id}
            onView={(o) => setSelectedId(o.id)}
            onAction={handleAction}
          />
        ))}
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={handlePageChange} className="pt-2" />
      </div>
    );
  };

  const cancelOrder = pending?.action === 'cancel' ? pending.order : null;
  const confirmAction = pending && pending.action !== 'cancel' ? pending.action : null;
  const confirmOrder = confirmAction ? pending.order : null;

  return (
    <div
      data-testid="seller-orders-page"
      className="flex w-full min-w-0 flex-col gap-6"
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-black sm:text-4xl">Đơn bán</h1>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm">Các đơn hàng chứa sản phẩm của gian hàng bạn.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={BaseUrl.SellerProducts}
            className="flex h-10 items-center gap-1.5 rounded-full border border-[#e4e4e7] bg-white px-4 text-xs font-semibold text-black transition-colors hover:border-black"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            <span>Xem kho hàng</span>
          </Link>
          <Link
            to={BaseUrl.SellerProductCreate}
            className="flex h-10 items-center gap-1.5 rounded-full bg-black px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Thêm sản phẩm mới</span>
          </Link>
        </div>
      </div>

      {/* Toolbar: chip trạng thái + tìm kiếm */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <SellerOrderStatusTabs value={tab} onChange={(next) => updateParams(next, 1)} activeCount={data?.total} />
        <ProductSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo mã đơn hoặc tên người mua..."
        />
      </div>

      {renderBody()}

      <SellerOrderDetailSheet
        orderId={selectedId}
        initialOrder={selectedOrder}
        onClose={() => setSelectedId(null)}
        onAction={handleAction}
        busy={updateStatus.isPending}
      />

      <ConfirmStatusDialog
        action={confirmAction}
        order={confirmOrder}
        isSubmitting={updateStatus.isPending}
        onClose={closePending}
        onConfirm={() => void submitStatus()}
      />
      <CancelReasonDialog
        order={cancelOrder}
        isSubmitting={updateStatus.isPending}
        onClose={closePending}
        onConfirm={(reason) => void submitStatus(reason)}
      />
    </div>
  );
};

export default SellerOrdersPage;

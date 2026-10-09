import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import BaseUrl from '@/consts/baseUrl';
import { useCart, useRemoveCartItem, useUpdateCartItem } from '@/hooks/queries/useCart';
import { getCartStats } from '@/helpers/cart';
import { getApiMessage } from '@/helpers/apiError';
import { showError } from '@/helpers/toast';
import type { CartItem } from '@/types/cart.types';
import CartGroupCard from './components/CartGroupCard';
import CartNoticeBanner from './components/CartNoticeBanner';
import CartSummary from './components/CartSummary';
import { CartAdminNotice, CartEmptyState, CartLoadError, CartSkeleton } from './components/CartStates';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode, cart, isPending, isError, refetch } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  /** Số SP không mua được mà người dùng đã đóng banner — đổi số này banner sẽ hiện lại. */
  const [dismissedCount, setDismissedCount] = useState(0);

  useEffect(() => {
    document.title = 'Giỏ hàng | TeamShop';
    return () => {
      document.title = 'TeamShop';
    };
  }, []);

  const busyProductId =
    (updateItem.isPending ? updateItem.variables?.productId : undefined) ??
    (removeItem.isPending ? removeItem.variables : undefined);

  const handleChangeQuantity = (item: CartItem, quantity: number) => {
    updateItem.mutate(
      { productId: item.product.id, quantity, stock: item.product.stock },
      { onError: (err) => showError(getApiMessage(err)) }
    );
  };

  const handleRemove = (item: CartItem) => {
    removeItem.mutate(item.product.id, { onError: (err) => showError(getApiMessage(err)) });
  };

  const handleCheckout = () => {
    // Không có Guest checkout (BR-AUTH-012): chuyển sang đăng nhập, xong quay lại giỏ.
    if (mode === 'guest') {
      navigate(BaseUrl.Login, { state: { from: { pathname: BaseUrl.Cart } } });
      return;
    }
    navigate(BaseUrl.Checkout);
  };

  const renderBody = () => {
    if (mode === 'admin') return <CartAdminNotice />;
    if (mode === 'booting' || isPending) return <CartSkeleton />;
    if (isError || !cart) return <CartLoadError onRetry={() => refetch()} />;
    if (cart.groups.length === 0) return <CartEmptyState />;

    const stats = getCartStats(cart);
    const showNotice = stats.unavailableCount > 0 && dismissedCount !== stats.unavailableCount;

    return (
      <div className="space-y-6">
        {showNotice && (
          <CartNoticeBanner
            message={`${stats.unavailableCount} sản phẩm hiện không thể đặt mua (hết hàng, ngừng bán hoặc vượt tồn kho). Vui lòng giảm số lượng hoặc xóa khỏi giỏ.`}
            onDismiss={() => setDismissedCount(stats.unavailableCount)}
          />
        )}

        <div className="space-y-6 border-b border-hairline-light pb-6">
          <PageTitle count={stats.productCount} />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            {cart.groups.map((group) => (
              <CartGroupCard
                key={group.seller.id}
                group={group}
                busyProductId={busyProductId}
                onChangeQuantity={handleChangeQuantity}
                onRemove={handleRemove}
              />
            ))}
          </div>

          <CartSummary
            cart={cart}
            orderCount={stats.orderCount}
            isGuest={mode === 'guest'}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    );
  };

  const isEmptyView = !!cart && cart.groups.length === 0 && mode !== 'admin';

  return (
    <div data-testid="cart-page" className="w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <nav aria-label="Đường dẫn" className="flex items-center gap-2 text-[11px] text-zinc-500">
        <Link to={BaseUrl.Homepage} className="hover:text-black">
          Trang chủ
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-400" aria-hidden="true" />
        <span aria-current="page" className="font-semibold text-black">
          Giỏ hàng
        </span>
      </nav>

      {/* Giỏ trống: tiêu đề đứng riêng, thẻ trống nằm giữa (Giỏ hàng #1). */}
      {isEmptyView && <PageTitle />}

      {renderBody()}
    </div>
  );
};

const PageTitle: React.FC<{ count?: number }> = ({ count }) => (
  <h1 className="flex flex-wrap items-baseline gap-3 text-4xl font-light tracking-tight text-black sm:text-5xl">
    Giỏ hàng
    {count !== undefined && (
      <span data-testid="cart-count" className="text-[11px] font-normal tracking-normal text-zinc-500">
        ({count} sản phẩm)
      </span>
    )}
  </h1>
);

export default CartPage;

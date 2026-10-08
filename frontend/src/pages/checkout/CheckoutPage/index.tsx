import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import BaseUrl from '@/consts/baseUrl';
import { useCart } from '@/hooks/queries/useCart';
import { useCreateCheckout } from '@/hooks/queries/useOrders';
import { extractStockShortages } from '@/services/order.service';
import { userService } from '@/services/user.service';
import { getCartStats } from '@/helpers/cart';
import {
  countCheckoutProducts,
  getCartIssues,
  mergeIssues,
  redirectToPayment,
  shortagesToIssues,
  toCheckoutLines,
  type CheckoutIssue,
} from '@/helpers/checkout';
import { getApiMessage } from '@/helpers/apiError';
import { showError } from '@/helpers/toast';
import CheckoutIssueAlert from './components/CheckoutIssueAlert';
import CheckoutOrderCard from './components/CheckoutOrderCard';
import CheckoutRecipientCard from './components/CheckoutRecipientCard';
import CheckoutSummary from './components/CheckoutSummary';
import {
  CheckoutAdminNotice,
  CheckoutEmptyState,
  CheckoutLoadError,
  CheckoutNothingPurchasable,
  CheckoutSkeleton,
} from './components/CheckoutStates';
import { isRecipientComplete, type RecipientFormValues } from './schemas/recipient.schema';

/**
 * Trang thanh toán (US-ORD-001) — chỉ Customer đã đăng nhập (route đã bọc RequireAuth).
 * Luồng: kiểm tra giỏ + người nhận → `POST /orders` (1 Checkout + N Order) → redirect `paymentUrl` (PayOS).
 */
const CheckoutPage: React.FC = () => {
  const { mode, cart, isPending, isError, refetch } = useCart();
  const profileQuery = userService.useGetProfile(mode === 'customer');
  const createCheckout = useCreateCheckout();

  /** Giá trị người nhận người mua đang nhập (null = chưa sửa, dùng hồ sơ). */
  const [draft, setDraft] = useState<RecipientFormValues | null>(null);
  /** Cảnh báo thiếu hàng do BE trả về khi đặt (BR-CHK-002). */
  const [serverIssues, setServerIssues] = useState<CheckoutIssue[]>([]);

  useEffect(() => {
    document.title = 'Thanh toán | TeamShop';
    return () => {
      document.title = 'TeamShop';
    };
  }, []);

  const profile = profileQuery.data;
  const profileRecipient: RecipientFormValues = useMemo(
    () => ({
      fullName: profile?.fullName ?? '',
      phone: profile?.phone ?? '',
      address: profile?.address ?? '',
    }),
    [profile]
  );
  const recipient = draft ?? profileRecipient;
  const recipientComplete = isRecipientComplete(recipient);

  const issues = useMemo(
    () => (cart ? mergeIssues(getCartIssues(cart), shortagesToIssues(cart, serverIssues)) : []),
    [cart, serverIssues]
  );
  const blocked = issues.length > 0;

  const handlePay = () => {
    if (!cart || blocked || !recipientComplete || createCheckout.isPending) return;

    createCheckout.mutate(
      {
        recipient: {
          fullName: recipient.fullName.trim(),
          phone: recipient.phone.trim(),
          address: recipient.address.trim(),
        },
        items: toCheckoutLines(cart),
      },
      {
        // Giữ trạng thái "đang chuyển" cho tới khi trình duyệt rời trang → không bấm đúp.
        onSuccess: (result) => {
          if (!result.paymentUrl) {
            showError('Không tạo được liên kết thanh toán. Vui lòng thử lại.');
            return;
          }
          redirectToPayment(result.paymentUrl);
        },
        onError: (err) => {
          const shortages = extractStockShortages(err);
          if (cart && shortages.length > 0) {
            setServerIssues(shortagesToIssues(cart, shortages));
            return;
          }
          showError(getApiMessage(err));
        },
      }
    );
  };

  const disabledReason = recipientComplete
    ? null
    : 'Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.';

  const renderBody = () => {
    if (mode === 'admin') return <CheckoutAdminNotice />;
    if (mode === 'booting' || isPending || profileQuery.isPending) return <CheckoutSkeleton />;
    if (isError || !cart || profileQuery.isError) {
      return (
        <CheckoutLoadError
          onRetry={() => {
            void refetch();
            void profileQuery.refetch();
          }}
        />
      );
    }
    if (cart.groups.length === 0) return <CheckoutEmptyState />;

    const stats = getCartStats(cart);
    if (stats.purchasableCount === 0 && !blocked) return <CheckoutNothingPurchasable />;

    return (
      <div className="space-y-6">
        {blocked && <CheckoutIssueAlert issues={issues} />}

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <CheckoutRecipientCard initialValues={profileRecipient} onChange={setDraft} />
            <CheckoutOrderCard
              cart={cart}
              productCount={countCheckoutProducts(cart)}
              issues={issues}
            />
          </div>

          <CheckoutSummary
            cart={cart}
            orderCount={cart.groups.length}
            blocked={blocked}
            disabledReason={disabledReason}
            submitting={createCheckout.isPending || createCheckout.isSuccess}
            onPay={handlePay}
          />
        </div>
      </div>
    );
  };

  return (
    <div data-testid="checkout-page" className="w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <nav aria-label="Đường dẫn" className="flex items-center gap-2 text-[11px] text-zinc-500">
        <Link to={BaseUrl.Homepage} className="hover:text-black">
          Trang chủ
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-400" aria-hidden="true" />
        <Link to={BaseUrl.Cart} className="hover:text-black">
          Giỏ hàng
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-400" aria-hidden="true" />
        <span aria-current="page" className="font-semibold text-black">
          Thanh toán
        </span>
      </nav>

      <h1 className="text-4xl font-light tracking-tight text-black sm:text-5xl">Thanh toán</h1>

      {renderBody()}
    </div>
  );
};

export default CheckoutPage;

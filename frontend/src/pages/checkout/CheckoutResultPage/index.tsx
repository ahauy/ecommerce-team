import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCheckoutResult } from './hooks/useCheckoutResult';
import { getHttpStatus } from '@/helpers/format';
import { FailedView, PendingView, SuccessView } from './components/ResultViews';
import { ResultLoadError, ResultNotFound, ResultSkeleton } from './components/ResultStates';

const Frame: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div
    data-testid="checkout-result-page"
    className="w-full bg-[#fbfbf5] px-4 py-12 sm:px-6 md:py-16"
    style={{ fontFeatureSettings: '"ss03"' }}
  >
    <div className="mx-auto w-full max-w-2xl">{children}</div>
  </div>
);

/**
 * Trang kết quả thanh toán `/checkout/result?checkoutCode=...` (US-PAY-001).
 * Chỉ đọc `checkoutCode`; MỌI query khác (vd. `status=success` từ cổng thanh toán) bị bỏ qua vì
 * không có chữ ký — trạng thái thật luôn lấy từ `GET /checkouts/:checkoutCode` (BR-PAY-006).
 * Còn `pending` thì tự poll cho tới khi ra paid / failed / expired.
 */
const CheckoutResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const checkoutCode = (searchParams.get('checkoutCode') ?? '').trim();
  const { data, isPending, isError, error, refetch } = useCheckoutResult(checkoutCode);

  useEffect(() => {
    document.title = 'Kết quả thanh toán | TeamShop';
    return () => {
      document.title = 'TeamShop';
    };
  }, []);

  const renderBody = () => {
    if (!checkoutCode) return <ResultNotFound reason="missing" />;
    if (isPending) return <ResultSkeleton />;
    // Đã có dữ liệu (vd. đang poll) mà 1 lần gọi lỗi mạng → giữ nguyên màn hình hiện tại.
    if (!data) {
      return getHttpStatus(error) === 404 ? (
        <ResultNotFound reason="notFound" />
      ) : (
        <ResultLoadError onRetry={() => refetch()} />
      );
    }

    switch (data.status) {
      case 'paid':
        return <SuccessView checkout={data} />;
      case 'failed':
        return <FailedView checkout={data} kind="failed" />;
      case 'expired':
        return <FailedView checkout={data} kind="expired" />;
      default:
        return <PendingView checkout={data} />;
    }
  };

  return <Frame>{renderBody()}</Frame>;
};

export default CheckoutResultPage;

import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useProductDetail, useSetProductActive } from './hooks/useProductDetail';
import { useAddToCart } from '@/hooks/queries/useCart';
import { getHttpStatus, formatVnd } from '@/helpers/format';
import { getApiMessage } from '@/helpers/apiError';
import { showError, showSuccess } from '@/helpers/toast';
import { cn } from '@/lib/utils';
import ProductBreadcrumb from './components/ProductBreadcrumb';
import ProductGallery from './components/ProductGallery';
import ProductShopCard from './components/ProductShopCard';
import ProductPurchasePanel, { type PanelMode } from './components/ProductPurchasePanel';
import ProductStatusBanner, { type BannerKind } from './components/ProductStatusBanner';
import RelatedProducts from './components/RelatedProducts';
import { ProductDetailSkeleton, ProductLoadError, ProductNotFound } from './components/ProductDetailStates';

/** Lấy `message` từ phản hồi lỗi chuẩn của API (`{ success:false, message }`). */
const apiMessage = (error: unknown): unknown => {
  if (error && typeof error === 'object' && 'response' in error) {
    const message = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message;
    if (typeof message === 'string' && message) return message;
  }
  return error;
};

const Chip: React.FC<React.PropsWithChildren<{ className: string }>> = ({ className, children }) => (
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold', className)}>
    {children}
  </span>
);

const ProductDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  // Chờ biết phiên đăng nhập trước khi gọi API để chủ shop/admin không bị 404 oan với SP ẩn/bị khóa.
  const { data: product, isPending, isError, error, refetch } = useProductDetail(
    id,
    user?.id ?? 'guest',
    status !== 'booting'
  );
  const setActive = useSetProductActive();
  const addToCart = useAddToCart();

  useEffect(() => {
    if (product?.name) document.title = `${product.name} | TeamShop`;
    return () => {
      document.title = 'TeamShop';
    };
  }, [product?.name]);

  if (isPending) return <ProductDetailSkeleton />;

  if (isError || !product) {
    // 404: không tồn tại / ẩn / bị khóa với người không có quyền (không lộ sự tồn tại).
    return getHttpStatus(error) === 404 ? <ProductNotFound /> : <ProductLoadError onRetry={() => refetch()} />;
  }

  const isOwner = !!user && user.id === product.seller.id;
  const isAdmin = !!user && user.role === 'admin' && !isOwner;
  const mode: PanelMode = isOwner ? 'owner' : isAdmin ? 'admin' : 'buyer';

  const soldOut = product.stock <= 0;
  const isHidden = !product.isActive;
  const canSeeState = isOwner || isAdmin;

  const bannerKind: BannerKind | null = !canSeeState
    ? null
    : product.isBlocked
      ? 'blocked'
      : isHidden
        ? 'hidden'
        : isOwner
          ? 'owner'
          : null;

  const stockText = canSeeState
    ? soldOut
      ? 'Kho hàng: Hết hàng'
      : `Kho hàng: Còn ${product.stock} sản phẩm`
    : soldOut
      ? 'Tạm thời hết hàng'
      : `Còn ${product.stock} sản phẩm trong kho`;

  const handleAddToCart = (quantity: number) => {
    // Guest: lưu localStorage; Customer: POST /cart/items (BR-CART-001/002).
    addToCart.mutate(
      { productId: product.id, quantity, stock: product.stock },
      {
        onSuccess: () => showSuccess('Đã thêm vào giỏ hàng'),
        onError: (err) => showError(getApiMessage(err)),
      }
    );
  };

  const handleToggleActive = () => {
    const nextActive = isHidden;
    setActive.mutate(
      { id: product.id, isActive: nextActive },
      {
        onSuccess: () => showSuccess(nextActive ? 'Đã hiện sản phẩm' : 'Đã ẩn sản phẩm'),
        onError: (err) => showError(apiMessage(err)),
      }
    );
  };

  return (
    <div data-testid="product-detail-page" className="w-full space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <ProductBreadcrumb category={product.category} productName={product.name} />

      {bannerKind && (
        <ProductStatusBanner kind={bannerKind} viewerIsOwner={isOwner} blockReason={product.blockReason} />
      )}

      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery key={product.id} images={product.images} name={product.name} soldOut={soldOut} />

        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {product.category && <Chip className="bg-aloe text-black">{product.category.name}</Chip>}
              {soldOut && <Chip className="bg-zinc-800 text-white">Hết hàng</Chip>}
              {canSeeState && product.isBlocked && (
                <Chip className="border border-red-300 bg-red-50 text-red-700">Bị khóa</Chip>
              )}
              {canSeeState && isHidden && !product.isBlocked && (
                <Chip className="bg-zinc-200 text-zinc-700">Đang ẩn</Chip>
              )}
            </div>

            <h1 className="text-2xl font-light leading-tight tracking-tight text-black sm:text-3xl">
              {product.name}
            </h1>
            <p data-testid="product-price" className="text-2xl font-bold text-black sm:text-3xl tabular-nums">
              {formatVnd(product.price)}
            </p>
            <p className="flex items-center gap-2 text-xs text-zinc-600 tabular-nums" data-testid="product-stock">
              <span
                aria-hidden="true"
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  soldOut || product.isBlocked ? 'bg-zinc-400' : 'bg-emerald-600'
                )}
              />
              {stockText}
            </p>
          </div>

          <div className="space-y-4 border-t border-hairline-light pt-5">
            <ProductShopCard sellerId={product.seller.id} shopName={product.seller.shopName} isOwner={isOwner} />
            <ProductPurchasePanel
              // Mỗi sản phẩm bắt đầu lại với số lượng 1.
              key={product.id}
              mode={mode}
              productId={product.id}
              stock={product.stock}
              isGuest={status === 'guest'}
              isHidden={isHidden}
              isBlocked={product.isBlocked}
              isToggling={setActive.isPending}
              onAddToCart={handleAddToCart}
              onToggleActive={handleToggleActive}
            />
          </div>
        </div>
      </div>

      <section aria-labelledby="description-title" className="space-y-3">
        <h2 id="description-title" className="text-base font-semibold text-black">
          Mô tả sản phẩm
        </h2>
        <div
          data-testid="product-description"
          className="rounded-2xl border border-hairline-light bg-white p-5 text-sm leading-7 text-zinc-700 sm:p-6"
        >
          {product.description.trim() ? (
            // Mô tả là văn bản thuần: giữ xuống dòng, tuyệt đối không render HTML.
            <p className="whitespace-pre-line break-words">{product.description}</p>
          ) : (
            <p className="text-zinc-400">Người bán chưa thêm mô tả cho sản phẩm này.</p>
          )}
        </div>
      </section>

      <RelatedProducts sellerId={product.seller.id} currentProductId={product.id} isOwner={isOwner} />
    </div>
  );
};

export default ProductDetailPage;

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { shopService } from '@/services/shop.service';
import { Button } from '@/components/ui/button';
import BaseUrl from '@/consts/baseUrl';
import { Store, Calendar, Package, ArrowLeft, AlertCircle } from 'lucide-react';

const formatJoinedDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    if (dateStr.includes('T')) {
      const [datePart] = dateStr.split('T');
      const [y, m, d] = datePart.split('-');
      if (y && m && d) {
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
    }
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

const PublicShopPage: React.FC = () => {
  const { sellerId = '' } = useParams<{ sellerId: string }>();
  const { data: shop, isPending, isError } = shopService.useGetPublicShop(sellerId);

  if (isPending) {
    return (
      <div
        className="w-full min-h-[60vh] flex items-center justify-center bg-[#fbfbf5] p-8"
        style={{ fontFeatureSettings: '"ss03"' }}
      >
        <div className="flex items-center gap-3 text-zinc-600">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
          <span className="text-sm font-medium">Đang tải thông tin gian hàng...</span>
        </div>
      </div>
    );
  }

  if (isError || !shop) {
    return (
      <div
        data-testid="public-shop-not-found"
        className="w-full min-h-[70vh] flex items-center justify-center bg-[#fbfbf5] px-4 py-16"
        style={{ fontFeatureSettings: '"ss03"' }}
      >
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-[#e4e4e7] shadow-card text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-light tracking-tight text-zinc-900">
              Không tìm thấy gian hàng
            </h1>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Gian hàng này không tồn tại hoặc đã tạm dừng hoạt động. Vui lòng kiểm tra lại đường dẫn.
            </p>
          </div>
          <Button
            asChild
            className="rounded-full bg-black text-white hover:bg-zinc-800 transition-colors h-11 px-8 text-sm"
          >
            <Link to={BaseUrl.Homepage} className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Về trang chủ</span>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const initialLetter = shop.shopName ? shop.shopName.charAt(0).toUpperCase() : 'S';

  return (
    <div
      data-testid="public-shop-page"
      className="w-full min-h-screen bg-[#fbfbf5] py-8 md:py-12 px-4 sm:px-6 lg:px-8"
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Back Link */}
        <div>
          <Link
            to={BaseUrl.Homepage}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang chủ</span>
          </Link>
        </div>

        {/* Hero Band Gian Hang */}
        <section className="w-full">
          <div className="w-full bg-pistachio rounded-2xl p-6 sm:p-10 md:p-12 border border-[#e4e4e7] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Store Avatar */}
              <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center text-white shrink-0 shadow-md">
                <span className="text-3xl font-light select-none">
                  {initialLetter}
                </span>
              </div>

              {/* Store Identity */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-zinc-900 leading-tight">
                    {shop.shopName}
                  </h1>
                  <span className="font-mono text-xs text-zinc-700 bg-white/80 border border-[#e4e4e7] px-2.5 py-0.5 rounded-full">
                    @{shop.shopSlug}
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-zinc-600 mt-2 flex items-center flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    Tham gia từ {formatJoinedDate(shop.joinedAt)}
                  </span>
                  <span className="inline-block w-1 h-1 rounded-full bg-zinc-400" />
                  <span className="inline-flex items-center gap-1 font-medium text-zinc-800">
                    <Package className="w-3.5 h-3.5 text-zinc-500" />
                    {shop.productCount} sản phẩm
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Catalog Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#e4e4e7] pb-4">
            <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-zinc-700" />
              <span>Sản phẩm của gian hàng</span>
            </h2>
            <span className="text-xs text-zinc-500">
              Tổng số: {shop.productCount} sản phẩm
            </span>
          </div>

          {shop.productCount === 0 ? (
            <div className="w-full bg-white rounded-2xl p-12 text-center border border-[#e4e4e7] shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-base font-medium text-zinc-900">
                Gian hàng chưa có sản phẩm nào
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Người bán hiện tại chưa đăng bán sản phẩm nào lên gian hàng. Vui lòng quay lại sau!
              </p>
            </div>
          ) : (
            <div className="w-full bg-white rounded-2xl p-12 text-center border border-[#e4e4e7] shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-aloe flex items-center justify-center mx-auto text-black">
                <Package className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-medium text-zinc-900">
                  Gian hàng có {shop.productCount} sản phẩm đang bày bán
                </h3>
                <p className="text-xs text-zinc-500">
                  Danh mục sản phẩm chi tiết sẽ hiển thị tại đây khi tính năng quản lý sản phẩm hoàn thiện.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PublicShopPage;

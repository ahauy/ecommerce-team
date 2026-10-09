import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus } from 'lucide-react';
import BaseUrl from '@/consts/baseUrl';

export const EmptyProductsState: React.FC = () => {
  return (
    <div
      data-testid="empty-products-state"
      className="w-full bg-white rounded-xl border border-hairline-light p-12 text-center flex flex-col items-center justify-center shadow-card"
    >
      <div className="w-16 h-16 rounded-full bg-canvas-cream border border-hairline-light flex items-center justify-center text-zinc-400 mb-4">
        <Package className="w-8 h-8 text-zinc-500" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 mb-1">
        Chưa có sản phẩm nào
      </h3>
      <p className="text-sm text-zinc-500 max-w-sm mb-6">
        Bắt đầu đăng bán sản phẩm đầu tiên để tiếp cận khách hàng trên Marketplace.
      </p>
      <Link
        to={BaseUrl.SellerProductCreate}
        className="h-10 px-6 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" />
        <span>Thêm sản phẩm</span>
      </Link>
    </div>
  );
};

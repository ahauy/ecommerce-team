import React from 'react';
import { Package } from 'lucide-react';

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
}

interface ProductGridProps {
  products: CatalogProduct[];
}

const formatVnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

/** Lưới sản phẩm responsive, lấp đầy phần còn lại bên phải cột lọc. */
const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  if (products.length === 0) {
    return (
      <div
        data-testid="product-grid-empty"
        className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-[#e4e4e7] bg-white p-12 text-center shadow-sm"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
          <Package className="h-6 w-6" />
        </div>
        <p className="max-w-sm text-sm text-zinc-500">
          Danh sách sản phẩm sẽ hiển thị tại đây (US-PRD-002).
        </p>
      </div>
    );
  }

  return (
    <ul
      data-testid="product-grid"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 xl:grid-cols-4 2xl:grid-cols-5"
    >
      {products.map((p) => (
        <li
          key={p.id}
          className="overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white shadow-sm"
        >
          <div className="aspect-square w-full bg-zinc-100">
            {p.imageUrl && (
              <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
            )}
          </div>
          <div className="space-y-1 p-3">
            <p className="line-clamp-2 text-sm font-medium text-black">{p.name}</p>
            <p className="text-sm font-semibold text-black">{formatVnd(p.price)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default ProductGrid;

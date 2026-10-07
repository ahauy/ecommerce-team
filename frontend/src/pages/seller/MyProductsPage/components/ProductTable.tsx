import React from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2 } from 'lucide-react';
import { OwnerProduct } from '../types';
import { cn } from '@/lib/utils';

interface ProductTableProps {
  products: OwnerProduct[];
  categoriesMap: Record<string, string>;
  onToggleActive: (id: string, currentActive: boolean, isBlocked: boolean) => void;
  onDeleteClick: (product: OwnerProduct) => void;
  isTogglingId?: string | null;
}

const formatVND = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price) + '₫';
};

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  categoriesMap,
  onToggleActive,
  onDeleteClick,
  isTogglingId,
}) => {
  return (
    <div className="bg-white border border-[#e4e4e7] rounded-xl overflow-hidden shadow-[0_8px_8px_rgba(0,0,0,0.03),0_4px_4px_rgba(0,0,0,0.02),0_2px_2px_rgba(0,0,0,0.02),0_0_0_1px_#e4e4e7]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-[#fbfbf5]/60 border-b border-[#e4e4e7] text-zinc-500 text-xs font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-5">Sản phẩm</th>
              <th className="py-3.5 px-4">Danh mục</th>
              <th className="py-3.5 px-4">Giá</th>
              <th className="py-3.5 px-4">Tồn kho</th>
              <th className="py-3.5 px-4">Trạng thái</th>
              <th className="py-3.5 px-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody
            id="productTableBody"
            className="divide-y divide-[#e4e4e7] text-xs text-zinc-900"
          >
            {products.map((product) => {
              const categoryName =
                product.categoryName ||
                categoriesMap[product.categoryId] ||
                'Chưa phân loại';
              const firstImage =
                product.images?.[0] ||
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1"%3E%3Crect width="18" height="18" x="3" y="3" rx="2"/%3E%3C/svg%3E';
              const isToggling = isTogglingId === product.id;

              return (
                <tr
                  key={product.id}
                  data-testid={`product-row-${product.id}`}
                  className="hover:bg-[#fbfbf5]/40 transition-colors"
                >
                  {/* Name and Image */}
                  <td className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <img
                        src={firstImage}
                        alt={product.name}
                        className="w-10 h-10 rounded-md object-cover bg-zinc-100 border border-[#e4e4e7] shrink-0 mt-0.5"
                      />
                      <div className="min-w-0">
                        <span
                          className="font-medium text-xs text-black block truncate max-w-xs"
                          title={product.name}
                        >
                          {product.name}
                        </span>
                        {product.isBlocked && (
                          <span
                            data-testid="block-reason-text"
                            className="text-red-600 text-[11px] font-medium block mt-0.5"
                          >
                            Lý do: {product.blockReason || 'Hình ảnh hoặc nội dung vi phạm tiêu chuẩn'}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-4 px-4 text-zinc-600 whitespace-nowrap">
                    {categoryName}
                  </td>

                  {/* Price */}
                  <td className="py-4 px-4 font-semibold text-black whitespace-nowrap">
                    {formatVND(product.price)}
                  </td>

                  {/* Stock */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {product.stock > 0 ? (
                      <span>{product.stock}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <span>0</span>
                        <span className="bg-[#fbfbf5] text-zinc-600 text-[11px] px-2 py-0.5 rounded-full font-medium border border-[#e4e4e7]">
                          Hết hàng
                        </span>
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {product.isBlocked ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold border border-red-500 text-red-600 bg-red-50">
                        Bị khóa
                      </span>
                    ) : product.isActive ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#c1fbd4] text-black">
                        Đang bán
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-[#e4e4e7] text-zinc-700">
                        Đã ẩn
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-5 whitespace-nowrap text-right">
                    <div className="inline-flex items-center justify-end gap-2.5">
                      {/* Edit Button */}
                      <Link
                        to={`/seller/products/${product.id}/edit`}
                        className="inline-flex items-center gap-1 text-zinc-600 hover:text-black font-medium text-xs px-2 py-1 rounded-full hover:bg-zinc-100 transition-colors"
                        title="Chỉnh sửa sản phẩm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </Link>

                      {/* Toggle Active Switch */}
                      {product.isBlocked ? (
                        <div className="relative group inline-flex items-center">
                          <button
                            type="button"
                            disabled
                            aria-disabled="true"
                            aria-label="Sản phẩm bị khóa"
                            className="w-9 h-5 rounded-full p-0.5 bg-[#e4e4e7] opacity-50 cursor-not-allowed flex items-center"
                          >
                            <span className="block w-4 h-4 rounded-full bg-zinc-400" />
                          </button>
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-30 pointer-events-none">
                            <div className="bg-black text-white text-[11px] py-1.5 px-3 rounded shadow-md whitespace-nowrap">
                              Sản phẩm bị Admin khóa, bạn không thể tự mở lại
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={product.isActive}
                          aria-label={`Trạng thái hiển thị ${product.name}`}
                          disabled={isToggling}
                          onClick={() =>
                            onToggleActive(product.id, product.isActive, product.isBlocked)
                          }
                          className={cn(
                            'toggle-btn w-9 h-5 rounded-full p-0.5 transition-colors relative cursor-pointer',
                            product.isActive ? 'bg-[#c1fbd4]' : 'bg-[#d4d4d8]',
                            isToggling && 'opacity-60 cursor-wait'
                          )}
                        >
                          <span
                            className={cn(
                              'block w-4 h-4 rounded-full shadow-xs transition-transform',
                              product.isActive
                                ? 'bg-black translate-x-4'
                                : 'bg-white translate-x-0'
                            )}
                          />
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => onDeleteClick(product)}
                        title="Ẩn sản phẩm"
                        className="text-zinc-400 hover:text-red-600 p-1 rounded-full hover:bg-zinc-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

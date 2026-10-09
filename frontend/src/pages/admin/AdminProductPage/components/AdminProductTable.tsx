import React from 'react';
import { ExternalLink, Package, PackageSearch } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { productPath } from '@/consts/baseUrl';
import { formatVnd } from '@/helpers/format';
import { getProductStatus, isUnblockLocked } from '../helpers';
import type { AdminProduct } from '../types';

export interface AdminProductTableProps {
  products: AdminProduct[];
  onBlock: (product: AdminProduct) => void;
  onUnblock: (product: AdminProduct) => void;
  isLoading?: boolean;
  hasFilters?: boolean;
}

const headCell = 'py-3.5 px-6 text-xs font-semibold text-zinc-500';
const actionButton =
  'min-h-[44px] px-4 rounded-full text-xs font-medium bg-transparent border border-hairline-light inline-flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed';

const ProductThumbnail: React.FC<{ imageUrl: string | null; name: string }> = ({ imageUrl, name }) => {
  const [hasError, setHasError] = React.useState(false);

  if (!imageUrl || hasError) {
    return (
      <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center border border-hairline-light shrink-0">
        <Package className="w-5 h-5 text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 border border-hairline-light shrink-0">
      <img src={imageUrl} alt={name} className="w-full h-full object-cover" onError={() => setHasError(true)} />
    </div>
  );
};

const StatusCell: React.FC<{ product: AdminProduct }> = ({ product }) => {
  const status = getProductStatus(product);

  if (status === 'selling') {
    return (
      <Badge variant="aloe" className="px-3 py-1 text-[12px] font-medium">
        Đang bán
      </Badge>
    );
  }
  if (status === 'hidden') {
    return (
      <Badge variant="muted" className="px-3 py-1 text-[12px] font-medium">
        Người bán ẩn
      </Badge>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1 max-w-[220px]">
      <Badge variant="destructive" className="px-3 py-1 text-[12px] font-medium">
        {status === 'seller_banned' ? 'Chặn do khóa người bán' : 'Bị chặn'}
      </Badge>
      {status === 'blocked' && product.blockReason && (
        <span className="text-[12px] text-zinc-500 line-clamp-2" title={product.blockReason}>
          {product.blockReason}
        </span>
      )}
    </div>
  );
};

export const AdminProductTable: React.FC<AdminProductTableProps> = ({
  products,
  onBlock,
  onUnblock,
  isLoading = false,
  hasFilters = false,
}) => {
  if (isLoading) {
    return (
      <Card data-testid="product-table-loading" className="w-full p-8 shadow-card">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 py-3 border-b border-hairline-light last:border-0"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="w-40 h-4" />
                  <Skeleton className="w-24 h-3" />
                </div>
              </div>
              <Skeleton className="w-28 h-4" />
              <Skeleton className="w-20 h-6 rounded-full" />
              <Skeleton className="w-24 h-8 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card data-testid="product-table-empty" className="w-full p-12 text-center shadow-card">
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400 mb-3">
          <PackageSearch className="w-6 h-6" />
        </div>
        <h3 className="text-base font-medium text-black">
          {hasFilters ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}
        </h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          {hasFilters
            ? 'Thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc.'
            : 'Sản phẩm người bán đăng sẽ xuất hiện tại đây.'}
        </p>
      </Card>
    );
  }

  return (
    <div
      data-testid="admin-product-table"
      className="w-full bg-white rounded-xl shadow-card border border-hairline-light overflow-hidden"
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-b border-hairline-light">
              <TableHead className={headCell}>Sản phẩm</TableHead>
              <TableHead className={headCell}>Người bán</TableHead>
              <TableHead className={headCell}>Giá</TableHead>
              <TableHead className={headCell}>Tồn kho</TableHead>
              <TableHead className={headCell}>Trạng thái</TableHead>
              <TableHead className={`${headCell} text-right`}>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-hairline-light bg-white">
            {products.map((product) => {
              const locked = isUnblockLocked(product);
              return (
                <TableRow
                  key={product.id}
                  data-testid={`product-row-${product.id}`}
                  className="hover:bg-canvas-cream/50 transition-colors"
                >
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3 min-w-0">
                      <ProductThumbnail imageUrl={product.imageUrl} name={product.name} />
                      <div className="flex flex-col min-w-0">
                        <a
                          href={productPath(product.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[15px] font-medium text-black hover:underline truncate"
                        >
                          <span className="truncate">{product.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
                        </a>
                        <span className="text-[13px] text-zinc-500 truncate">
                          {product.category?.name ?? 'Không có danh mục'}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    {product.seller ? (
                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] text-black truncate">
                          {product.seller.shopName ?? product.seller.fullName}
                        </span>
                        <span className="text-[12px] text-zinc-500 truncate">{product.seller.email}</span>
                        {!product.seller.isActive && (
                          <span className="text-[12px] font-medium text-red-600">Người bán đang bị khóa</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[13px] text-zinc-400">Không rõ người bán</span>
                    )}
                  </TableCell>

                  <TableCell className="py-4 px-6 text-[14px] text-zinc-800 tabular-nums whitespace-nowrap">
                    {formatVnd(product.price)}
                  </TableCell>

                  <TableCell className="py-4 px-6 text-[14px] text-zinc-800 tabular-nums">{product.stock}</TableCell>

                  <TableCell className="py-4 px-6">
                    <StatusCell product={product} />
                  </TableCell>

                  <TableCell className="py-4 px-6 text-right">
                    {product.isBlocked ? (
                      <button
                        type="button"
                        aria-label={`Mở chặn ${product.name}`}
                        title={locked ? 'Mở khóa tài khoản người bán để mở lại sản phẩm này' : undefined}
                        disabled={locked}
                        onClick={() => onUnblock(product)}
                        className={`${actionButton} text-black hover:bg-zinc-100 focus-visible:ring-black`}
                      >
                        Mở chặn
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Chặn ${product.name}`}
                        onClick={() => onBlock(product)}
                        className={`${actionButton} text-red-600 hover:border-red-600 hover:bg-red-50 focus-visible:ring-red-600`}
                      >
                        Chặn
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminProductTable;

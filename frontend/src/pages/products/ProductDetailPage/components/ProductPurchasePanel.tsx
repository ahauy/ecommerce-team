import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Info, Minus, Pencil, Plus, ShieldCheck, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sellerProductEditPath } from '@/consts/baseUrl';

export type PanelMode = 'buyer' | 'owner' | 'admin';

interface ProductPurchasePanelProps {
  mode: PanelMode;
  productId: string;
  stock: number;
  isGuest: boolean;
  isHidden: boolean;
  isBlocked: boolean;
  isToggling: boolean;
  onAddToCart: (quantity: number) => void;
  onToggleActive: () => void;
}

const card = 'space-y-4 rounded-2xl border border-[#e4e4e7] bg-white p-4 sm:p-5';
const primaryBtn =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black';
const outlineBtn =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#e4e4e7] bg-white text-sm font-semibold text-black transition-colors hover:border-black disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:border-[#e4e4e7]';

/** Khung mua hàng — thay đổi theo người xem (khách / người mua / chủ shop / admin) và tồn kho. */
const ProductPurchasePanel: React.FC<ProductPurchasePanelProps> = ({
  mode,
  productId,
  stock,
  isGuest,
  isHidden,
  isBlocked,
  isToggling,
  onAddToCart,
  onToggleActive,
}) => {
  const [quantity, setQuantity] = useState(1);

  /* ── Chủ shop: công cụ quản lý thay cho nút mua (BR: không tự mua hàng của mình) ── */
  if (mode === 'owner') {
    return (
      <div data-testid="panel-owner" className={card}>
        <div
          className={cn(
            'flex items-start gap-2 text-xs leading-relaxed',
            isBlocked ? 'text-red-600' : 'text-zinc-600'
          )}
        >
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <p>
            {isBlocked
              ? 'Sản phẩm này đang bị quản trị viên khóa do vi phạm tiêu chuẩn. Bạn cần cập nhật lại thông tin để hệ thống xem xét mở lại.'
              : 'Bạn là người đăng bán sản phẩm này. Các nút đặt mua hoặc giỏ hàng được thay thế bằng công cụ quản lý và biên tập nội dung.'}
          </p>
        </div>

        <div className={cn('grid gap-3', isBlocked ? 'grid-cols-1' : 'sm:grid-cols-2')}>
          <Link to={sellerProductEditPath(productId)} className={primaryBtn}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Chỉnh sửa sản phẩm
          </Link>
          {!isBlocked && (
            <button type="button" onClick={onToggleActive} disabled={isToggling} className={outlineBtn}>
              {isHidden ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />}
              {isHidden ? 'Hiện sản phẩm' : 'Ẩn sản phẩm'}
            </button>
          )}
        </div>

        {isBlocked && (
          <div className="flex items-center justify-between border-t border-[#f0f0f2] pt-3 text-[11px]">
            <span className="font-semibold text-red-600">Trạng thái: Bị khóa bởi Quản trị viên</span>
            <span className="text-zinc-400">Không thể ẩn / hiện</span>
          </div>
        )}
      </div>
    );
  }

  /* ── Admin: chỉ kiểm duyệt, không mua (BR-AUTH-011) ── */
  if (mode === 'admin') {
    return (
      <div data-testid="panel-admin" className={card}>
        <div className="flex items-start gap-2 text-xs leading-relaxed text-zinc-600">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <p>Bạn đang xem với quyền quản trị viên. Tài khoản quản trị chỉ kiểm duyệt, không đặt mua sản phẩm.</p>
        </div>
      </div>
    );
  }

  /* ── Người mua / khách ── */
  const soldOut = stock <= 0;
  const atMax = quantity >= stock;

  return (
    <div data-testid={soldOut ? 'panel-soldout' : 'panel-buyer'} className={card}>
      <div className="flex items-center justify-between">
        <span id="qty-label" className="text-xs font-medium text-black">
          Số lượng
        </span>
        <div
          role="group"
          aria-labelledby="qty-label"
          className={cn('inline-flex items-center rounded-full bg-zinc-100 p-1', soldOut && 'opacity-50')}
        >
          <button
            type="button"
            aria-label="Giảm số lượng"
            disabled={soldOut || quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <output aria-live="polite" data-testid="qty-value" className="w-9 text-center text-sm font-semibold text-black">
            {soldOut ? 0 : quantity}
          </output>
          <button
            type="button"
            aria-label="Tăng số lượng"
            disabled={soldOut || atMax}
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!soldOut && atMax && stock > 1 && (
        <p className="text-right text-[11px] text-zinc-500">Đã chọn tối đa số lượng còn trong kho ({stock}).</p>
      )}

      {soldOut ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" disabled className={outlineBtn}>
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Thêm vào giỏ
            </button>
            <button type="button" disabled className={outlineBtn}>
              Mua ngay
            </button>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Sản phẩm hiện đang tạm hết hàng. Vui lòng quay lại sau.
          </p>
        </>
      ) : (
        <>
          <button type="button" onClick={() => onAddToCart(quantity)} className={primaryBtn}>
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Thêm vào giỏ
          </button>
          {isGuest && (
            <p className="text-center text-[11px] text-zinc-500">Đăng nhập để thêm sản phẩm vào giỏ hàng</p>
          )}
        </>
      )}
    </div>
  );
};

export default ProductPurchasePanel;

import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import ProductFilterPanel from './ProductFilterPanel';
import { EMPTY_FILTER_VALUES, type FilterValues } from '../hooks/useCatalogFilters';

interface ProductFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Giá trị đang áp dụng (từ URL). */
  value: FilterValues;
  /** Áp dụng toàn bộ bộ lọc đã chọn trong Drawer. */
  onApply: (values: FilterValues) => void;
}

/**
 * Drawer bộ lọc cho mobile (< 1024px): chọn trong bản nháp,
 * chỉ áp dụng khi bấm "Xem kết quả".
 */
const ProductFilterDrawer: React.FC<ProductFilterDrawerProps> = ({ open, onOpenChange, value, onApply }) => {
  const [draft, setDraft] = useState<FilterValues>(value);

  // Mỗi lần mở lại, bắt đầu từ bộ lọc đang áp dụng.
  useEffect(() => {
    if (open) setDraft(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        data-testid="product-filter-drawer"
        className="flex w-[88vw] max-w-sm flex-col gap-0 bg-[#fbfbf5] p-0"
      >
        <div className="flex items-center justify-between border-b border-[#e4e4e7] bg-white px-5 py-4 pr-12">
          <SheetTitle className="text-base font-semibold text-black">Bộ lọc tìm kiếm</SheetTitle>
          <button
            type="button"
            onClick={() => setDraft(EMPTY_FILTER_VALUES)}
            className="text-xs text-zinc-500 hover:text-black"
          >
            Thiết lập lại
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white px-5 py-5">
          <ProductFilterPanel
            instantPrice
            value={draft}
            onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
          />
        </div>

        <div className="border-t border-[#e4e4e7] bg-white p-4">
          <button
            type="button"
            onClick={handleApply}
            className="h-11 w-full rounded-full bg-black text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Xem kết quả
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProductFilterDrawer;

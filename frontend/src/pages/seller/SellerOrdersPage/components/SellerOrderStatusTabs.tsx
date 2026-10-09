import React from 'react';
import { cn } from '@/lib/utils';
import { ORDER_TABS, type OrderTabKey } from '@/helpers/orderHistory';

interface SellerOrderStatusTabsProps {
  value: OrderTabKey;
  onChange: (tab: OrderTabKey) => void;
  /** Tổng số đơn của tab đang chọn — hiện cạnh nhãn của tab đó (vd. "Tất cả 12"). */
  activeCount?: number;
}

/** Hàng chip lọc trạng thái kiểu Seller (chip đang chọn nền xanh mint, giống "Sản phẩm của tôi"). */
const SellerOrderStatusTabs: React.FC<SellerOrderStatusTabsProps> = ({ value, onChange, activeCount }) => (
  <div
    role="group"
    aria-label="Lọc đơn bán theo trạng thái"
    data-testid="seller-order-tabs"
    className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 md:pb-0"
  >
    {ORDER_TABS.map((tab) => {
      const active = tab.key === value;
      return (
        <button
          key={tab.key}
          type="button"
          data-tab={tab.key}
          aria-pressed={active}
          onClick={() => !active && onChange(tab.key)}
          className={cn(
            'flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
            active
              ? 'bg-aloe font-semibold text-black shadow-xs'
              : 'border border-hairline-light bg-white font-medium text-zinc-700 hover:border-zinc-400'
          )}
        >
          <span>{tab.label}</span>
          {active && activeCount !== undefined && (
            <span className="rounded-full bg-black/10 px-1.5 text-[11px] text-black">{activeCount}</span>
          )}
        </button>
      );
    })}
  </div>
);

export default SellerOrderStatusTabs;

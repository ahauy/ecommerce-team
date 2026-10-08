import React from 'react';
import { cn } from '@/lib/utils';
import { ORDER_TABS, type OrderTabKey } from '@/helpers/orderHistory';

interface OrderStatusTabsProps {
  value: OrderTabKey;
  onChange: (tab: OrderTabKey) => void;
}

/** Hàng chip lọc theo trạng thái (Tất cả · Đã xác nhận · Đang giao · …). */
const OrderStatusTabs: React.FC<OrderStatusTabsProps> = ({ value, onChange }) => (
  <div
    role="group"
    aria-label="Lọc đơn hàng theo trạng thái"
    className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
  >
    {ORDER_TABS.map((tab) => {
      const active = tab.key === value;
      return (
        <button
          key={tab.key}
          type="button"
          aria-pressed={active}
          onClick={() => !active && onChange(tab.key)}
          className={cn(
            'inline-flex h-8 shrink-0 items-center rounded-full border px-4 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
            active
              ? 'border-black bg-black text-white'
              : 'border-[#e4e4e7] bg-white text-zinc-700 hover:border-black'
          )}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);

export default OrderStatusTabs;

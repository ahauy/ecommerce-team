import React from 'react';
import { cn } from '@/lib/utils';
import { ACTION_LABEL, getAvailableActions } from '../helpers';
import type { SellerOrder, SellerOrderAction } from '../types';

interface StatusActionButtonsProps {
  order: SellerOrder;
  onAction: (action: SellerOrderAction, order: SellerOrder) => void;
  /** Khoá nút khi đơn này đang được xử lý. */
  disabled?: boolean;
  className?: string;
}

const BUTTON_CLASS: Record<SellerOrderAction, string> = {
  cancel: 'border border-red-300 bg-white text-red-600 hover:bg-red-50',
  ship: 'border border-black bg-black text-white hover:bg-zinc-800',
  deliver: 'border border-black bg-black text-white hover:bg-zinc-800',
};

/** Nút Hủy đơn / Giao hàng / Đã giao — hiện đúng theo trạng thái đơn (state machine của BE). */
const StatusActionButtons: React.FC<StatusActionButtonsProps> = ({ order, onAction, disabled, className }) => {
  const actions = getAvailableActions(order.status);
  if (actions.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {actions.map((action) => (
        <button
          key={action}
          type="button"
          data-testid={`action-${action}`}
          aria-label={`${ACTION_LABEL[action]} ${order.orderCode}`}
          disabled={disabled}
          onClick={() => onAction(action, order)}
          className={cn(
            'inline-flex h-9 items-center justify-center rounded-full px-5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50',
            BUTTON_CLASS[action]
          )}
        >
          {ACTION_LABEL[action]}
        </button>
      ))}
    </div>
  );
};

export default StatusActionButtons;

import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderStep } from '@/helpers/orderHistory';

const circleClass: Record<OrderStep['state'], string> = {
  done: 'border-black bg-black text-white',
  failed: 'border-red-600 bg-red-600 text-white',
  current: 'border-black bg-white text-black',
  upcoming: 'border-hairline-light bg-white text-zinc-400',
};

/** Thanh tiến trình đơn hàng (Đã xác nhận → Đang giao → Đã giao, hoặc nhánh Đã hủy). */
const OrderStepper: React.FC<{ steps: OrderStep[] }> = ({ steps }) => (
  <section
    data-testid="order-stepper"
    aria-label="Tiến trình đơn hàng"
    className="rounded-2xl border border-hairline-light bg-white px-4 py-6 shadow-card sm:px-8"
  >
    <ol className="flex w-full items-start">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li
            key={step.key}
            data-testid={`order-step-${step.key}`}
            data-state={step.state}
            aria-current={step.state === 'current' ? 'step' : undefined}
            className="relative flex flex-1 flex-col items-center text-center"
          >
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-1/2 top-4 h-px w-full -translate-y-1/2',
                  step.state === 'done' ? 'bg-black' : 'bg-hairline-light'
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold',
                circleClass[step.state]
              )}
            >
              {step.state === 'done' && <Check className="h-4 w-4" aria-hidden="true" />}
              {step.state === 'failed' && <X className="h-4 w-4" aria-hidden="true" />}
              {(step.state === 'current' || step.state === 'upcoming') && index + 1}
            </span>
            <p className={cn('mt-2 text-xs font-semibold', step.state === 'upcoming' ? 'text-zinc-400' : 'text-black')}>
              {step.label}
            </p>
            {step.time && <p className="mt-0.5 text-[10px] text-zinc-500">{step.time}</p>}
            {step.note && <p className="mt-0.5 max-w-[160px] text-[10px] leading-snug text-zinc-500">{step.note}</p>}
          </li>
        );
      })}
    </ol>
  </section>
);

export default OrderStepper;

import React from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ResultTone = 'success' | 'danger' | 'pending';

interface ResultHeaderProps {
  tone: ResultTone;
  title: string;
  description: string;
  /** Chip nhỏ dưới tiêu đề, vd. "Mã thanh toán: CHK-…". */
  chip?: string;
}

const iconWrap: Record<ResultTone, string> = {
  success: 'bg-[#c1fbd4] text-black',
  danger: 'border border-red-200 bg-red-50 text-red-500',
  pending: 'bg-zinc-100 text-zinc-600',
};

/** Phần đầu trang kết quả: icon tròn + tiêu đề lớn + mô tả. */
const ResultHeader: React.FC<ResultHeaderProps> = ({ tone, title, description, chip }) => (
  <header className="space-y-4 text-center">
    <div
      data-testid={`result-icon-${tone}`}
      className={cn('mx-auto flex h-16 w-16 items-center justify-center rounded-full', iconWrap[tone])}
    >
      {tone === 'success' && <Check className="h-7 w-7" aria-hidden="true" />}
      {tone === 'danger' && <X className="h-7 w-7" aria-hidden="true" />}
      {tone === 'pending' && <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />}
    </div>

    <h1 className="text-3xl font-normal tracking-tight text-black sm:text-4xl">{title}</h1>

    {chip && (
      <p
        data-testid="result-chip"
        className="mx-auto inline-flex rounded-full bg-[#c1fbd4] px-3 py-1 text-[11px] font-semibold text-[#0f5132]"
      >
        {chip}
      </p>
    )}

    <p className="mx-auto max-w-md text-xs leading-relaxed text-zinc-500">{description}</p>
  </header>
);

export default ResultHeader;

import React, { useState } from 'react';
import { ImageIcon, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: string[];
  name: string;
  soldOut: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Ảnh lớn + dải ảnh nhỏ (tối đa 5 ảnh, ảnh đầu là ảnh bìa — BR-PRD-005) + xem phóng to. */
const ProductGallery: React.FC<ProductGalleryProps> = ({ images, name, soldOut }) => {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const current = images[index] ?? null;
  const hasMany = images.length > 1;

  return (
    <div data-testid="product-gallery" className="space-y-3">
      <div
        className={cn(
          'relative aspect-square w-full overflow-hidden rounded-2xl border border-[#e4e4e7]',
          soldOut ? 'bg-zinc-300' : 'bg-white'
        )}
      >
        {current ? (
          <img
            src={current}
            alt={name}
            className={cn('h-full w-full object-cover', soldOut && 'opacity-50 grayscale')}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            <ImageIcon className="h-10 w-10" aria-hidden="true" />
          </div>
        )}

        {soldOut && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-800/90 px-4 py-1.5 text-xs font-semibold text-white">
            Hết hàng
          </span>
        )}

        {hasMany && (
          <span className="absolute right-4 top-4 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
            {pad(index + 1)} / {pad(images.length)}
          </span>
        )}

        {current && (
          <button
            type="button"
            aria-label="Xem ảnh phóng to"
            onClick={() => setZoomOpen(true)}
            className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-800 shadow-md transition-colors hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        )}
      </div>

      {hasMany && (
        <ul className="grid grid-cols-5 gap-2 sm:gap-3" aria-label="Ảnh sản phẩm">
          {images.map((src, i) => (
            <li key={src + i}>
              <button
                type="button"
                aria-label={`Xem ảnh ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => setIndex(i)}
                className={cn(
                  'aspect-square w-full overflow-hidden rounded-xl border-2 bg-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
                  i === index ? 'border-black' : 'border-transparent hover:border-zinc-300',
                  soldOut && 'opacity-60'
                )}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {current && (
        <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
          <DialogContent className="max-w-3xl border-0 bg-transparent p-0 shadow-none sm:rounded-2xl">
            <DialogTitle className="sr-only">{name}</DialogTitle>
            <img src={current} alt={name} className="max-h-[85vh] w-full rounded-2xl bg-white object-contain" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProductGallery;

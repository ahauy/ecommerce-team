import React from 'react';
import { Search, X } from 'lucide-react';

interface ProductSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const ProductSearchInput: React.FC<ProductSearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Tìm theo tên sản phẩm',
}) => {
  return (
    <div className="relative w-full md:w-72">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 pointer-events-none" />
      <input
        id="searchInput"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-9 bg-white border border-hairline-light rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black p-0.5 rounded-full"
          aria-label="Xóa tìm kiếm"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

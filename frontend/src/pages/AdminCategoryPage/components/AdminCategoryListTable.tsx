import React from 'react';
import { AdminCategoryItem } from '@/interfaces/category';
import { Folder } from 'lucide-react';

export interface AdminCategoryListTableProps {
  categories: AdminCategoryItem[];
  onEdit: (category: AdminCategoryItem) => void;
  onDelete: (category: AdminCategoryItem) => void;
  isLoading?: boolean;
}

const CategoryThumbnail: React.FC<{ imageUrl?: string | null; name: string }> = ({ imageUrl, name }) => {
  const [hasError, setHasError] = React.useState(false);

  if (!imageUrl || hasError) {
    return (
      <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center border border-[#e4e4e7]">
        <Folder className="w-5 h-5 text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 flex items-center justify-center border border-[#e4e4e7]">
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export const AdminCategoryListTable: React.FC<AdminCategoryListTableProps> = ({
  categories,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-xl shadow-sm border border-[#e4e4e7] p-8">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 animate-pulse py-3 border-b border-[#e4e4e7] last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-zinc-200 shrink-0" />
                <div className="space-y-2">
                  <div className="w-32 h-4 bg-zinc-200 rounded-md" />
                  <div className="w-24 h-3 bg-zinc-200 rounded-md" />
                </div>
              </div>
              <div className="w-20 h-4 bg-zinc-200 rounded-md" />
              <div className="w-20 h-6 bg-zinc-200 rounded-full" />
              <div className="w-32 h-8 bg-zinc-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div
        data-testid="category-table-empty"
        className="w-full bg-white rounded-xl border border-[#e4e4e7] p-12 text-center shadow-sm"
      >
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400 mb-3">
          <Folder className="w-6 h-6" />
        </div>
        <h3 className="text-base font-medium text-black">Chưa có danh mục nào</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          Hiện tại chưa có danh mục nào được hiển thị theo tiêu chí tìm kiếm hoặc bộ lọc này.
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="admin-category-table"
      className="w-full bg-white rounded-xl shadow-[0_8px_8px_rgba(0,0,0,0.03),0_4px_4px_rgba(0,0,0,0.02),0_2px_2px_rgba(0,0,0,0.02),0_0_0_1px_#e4e4e7] overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-zinc-50/50 border-b border-[#e4e4e7]">
              <th className="w-[76px] py-3.5 px-6 text-xs font-semibold text-zinc-500">Ảnh</th>
              <th className="py-3.5 px-6 text-xs font-semibold text-zinc-500">Tên danh mục</th>
              <th className="py-3.5 px-6 text-xs font-semibold text-zinc-500">Đường dẫn (slug)</th>
              <th className="py-3.5 px-6 text-xs font-semibold text-zinc-500">Số sản phẩm</th>
              <th className="py-3.5 px-6 text-xs font-semibold text-zinc-500">Trạng thái</th>
              <th className="py-3.5 px-6 text-xs font-semibold text-zinc-500 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7] bg-white" data-testid="category-table-body">
            {categories.map((category) => (
              <tr
                key={category._id}
                data-testid={`category-row-${category._id}`}
                className="hover:bg-[#fbfbf5]/50 transition-colors"
              >
                {/* Ảnh */}
                <td className="py-4 px-6">
                  <CategoryThumbnail imageUrl={category.imageUrl} name={category.name} />
                </td>

                {/* Tên danh mục */}
                <td className="py-4 px-6 text-[15px] font-medium text-black">
                  {category.name}
                </td>

                {/* Slug */}
                <td className="py-4 px-6 font-mono text-[13px] text-zinc-500">
                  {category.slug}
                </td>

                {/* Số sản phẩm */}
                <td className="py-4 px-6 text-[14px] text-zinc-800">
                  {category.productCount ?? 0} sản phẩm
                </td>

                {/* Trạng thái */}
                <td className="py-4 px-6">
                  {category.isActive ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#c1fbd4] text-black">
                      Hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#d4d4d8] text-[#3f3f46]">
                      Đang ẩn
                    </span>
                  )}
                </td>

                {/* Thao tác */}
                <td className="py-4 px-6 text-right">
                  <div className="inline-flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      aria-label={`Chỉnh sửa ${category.name}`}
                      onClick={() => onEdit(category)}
                      className="min-h-[44px] px-4 rounded-full text-xs font-medium bg-transparent text-black border border-[#e4e4e7] hover:bg-zinc-100 inline-flex items-center justify-center transition-colors"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      aria-label={`Xóa ${category.name}`}
                      onClick={() => onDelete(category)}
                      className="min-h-[44px] px-4 rounded-full text-xs font-medium bg-transparent text-red-600 border border-[#e4e4e7] hover:border-red-600 hover:bg-red-50 inline-flex items-center justify-center transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCategoryListTable;

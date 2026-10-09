import React from 'react';
import { Store, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { formatJoinDate, getInitials } from '../helpers';
import type { AdminUser } from '../types';

export interface AdminUserTableProps {
  users: AdminUser[];
  currentUserId: string | null;
  onBan: (user: AdminUser) => void;
  onUnban: (user: AdminUser) => void;
  isLoading?: boolean;
  hasFilters?: boolean;
}

const headCell = 'py-3.5 px-6 text-xs font-semibold text-zinc-500';
const actionButton =
  'min-h-[44px] px-4 rounded-full text-xs font-medium bg-transparent border border-hairline-light inline-flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed';

export const AdminUserTable: React.FC<AdminUserTableProps> = ({
  users,
  currentUserId,
  onBan,
  onUnban,
  isLoading = false,
  hasFilters = false,
}) => {
  if (isLoading) {
    return (
      <Card data-testid="user-table-loading" className="w-full p-8 shadow-card">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 py-3 border-b border-hairline-light last:border-0"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="w-36 h-4" />
                  <Skeleton className="w-48 h-3" />
                </div>
              </div>
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-20 h-6 rounded-full" />
              <Skeleton className="w-24 h-8 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card data-testid="user-table-empty" className="w-full p-12 text-center shadow-card">
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400 mb-3">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-base font-medium text-black">
          {hasFilters ? 'Không tìm thấy người dùng phù hợp' : 'Chưa có người dùng nào'}
        </h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          {hasFilters
            ? 'Thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc.'
            : 'Người dùng đăng ký tài khoản sẽ xuất hiện tại đây.'}
        </p>
      </Card>
    );
  }

  return (
    <div
      data-testid="admin-user-table"
      className="w-full bg-white rounded-xl shadow-card border border-hairline-light overflow-hidden"
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-b border-hairline-light">
              <TableHead className={headCell}>Người dùng</TableHead>
              <TableHead className={headCell}>Vai trò</TableHead>
              <TableHead className={headCell}>Gian hàng</TableHead>
              <TableHead className={headCell}>Ngày tham gia</TableHead>
              <TableHead className={headCell}>Trạng thái</TableHead>
              <TableHead className={`${headCell} text-right`}>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-hairline-light bg-white">
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const displayName = user.fullName || user.email;
              return (
                <TableRow
                  key={user.id}
                  data-testid={`user-row-${user.id}`}
                  className="hover:bg-canvas-cream/50 transition-colors"
                >
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        aria-hidden="true"
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                          user.isActive ? 'bg-pistachio text-black' : 'bg-zinc-200 text-zinc-500'
                        }`}
                      >
                        {getInitials(user.fullName, user.email)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[15px] font-medium text-black truncate">
                          {displayName}
                          {isSelf && <span className="ml-2 text-xs font-normal text-zinc-500">(Bạn)</span>}
                        </span>
                        <span className="text-[13px] text-zinc-500 truncate">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    {user.role === 'admin' ? (
                      <Badge variant="default" className="px-3 py-1 text-[12px] font-medium">
                        Quản trị viên
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="px-3 py-1 text-[12px] font-medium">
                        Khách hàng
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    {user.shop ? (
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1.5 text-[14px] text-black">
                          <Store className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                          {user.shop.shopName}
                        </span>
                        <span className="text-[12px] text-zinc-500 tabular-nums">{user.productCount} sản phẩm</span>
                      </div>
                    ) : (
                      <span className="text-[13px] text-zinc-400">Chưa có gian hàng</span>
                    )}
                  </TableCell>

                  <TableCell className="py-4 px-6 text-[14px] text-zinc-800 tabular-nums">
                    {formatJoinDate(user.createdAt)}
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    {user.isActive ? (
                      <Badge variant="aloe" className="px-3 py-1 text-[12px] font-medium">
                        Hoạt động
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="px-3 py-1 text-[12px] font-medium">
                        Đã khóa
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="py-4 px-6 text-right">
                    {user.isActive ? (
                      <button
                        type="button"
                        aria-label={`Khóa tài khoản ${displayName}`}
                        title={isSelf ? 'Bạn không thể khóa chính tài khoản của mình' : undefined}
                        disabled={isSelf}
                        onClick={() => onBan(user)}
                        className={`${actionButton} text-red-600 hover:border-red-600 hover:bg-red-50 focus-visible:ring-red-600`}
                      >
                        Khóa
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Mở khóa tài khoản ${displayName}`}
                        onClick={() => onUnban(user)}
                        className={`${actionButton} text-black hover:bg-zinc-100 focus-visible:ring-black`}
                      >
                        Mở khóa
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUserTable;

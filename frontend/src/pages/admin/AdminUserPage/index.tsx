import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';
import Pagination from '@/components/Pagination';
import { showError, showSuccess } from '@/helpers/toast';
import { useAuthStore } from '@/stores/auth.store';
import AdminUserTable from './components/AdminUserTable';
import UserModerationDialog from './dialogs/UserModerationDialog';
import { adminUserService } from './services/admin-user.service';
import type { AdminUser, AdminUserRole, AdminUsersParams, UserModerationAction } from './types';

export const ADMIN_USERS_PAGE_SIZE = 20;
export const SEARCH_DEBOUNCE_MS = 400;

type RoleFilter = 'all' | AdminUserRole;
type StatusFilter = 'all' | 'active' | 'banned';

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả vai trò' },
  { value: 'customer', label: 'Khách hàng' },
  { value: 'admin', label: 'Quản trị viên' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'banned', label: 'Đã khóa' },
];

const chipClass = (selected: boolean) =>
  `min-h-[44px] px-4 rounded-full text-xs font-medium inline-flex items-center justify-center transition-colors ${
    selected
      ? 'bg-aloe text-black shadow-sm'
      : 'bg-white text-zinc-700 border border-hairline-light hover:bg-zinc-50 hover:text-black'
  }`;

interface ModerationTarget {
  user: AdminUser;
  action: UserModerationAction;
}

export interface AdminUserPageProps {
  title?: string;
}

export const AdminUserPage: React.FC<AdminUserPageProps> = ({ title = 'Người dùng' }) => {
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<ModerationTarget | null>(null);

  useEffect(() => {
    const next = searchInput.trim();
    if (next === search) return;
    const timer = setTimeout(() => {
      setSearch(next);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const params = useMemo<AdminUsersParams>(
    () => ({
      page,
      limit: ADMIN_USERS_PAGE_SIZE,
      ...(roleFilter !== 'all' && { role: roleFilter }),
      ...(statusFilter !== 'all' && { isActive: statusFilter === 'active' }),
      ...(search && { search }),
    }),
    [page, roleFilter, statusFilter, search]
  );

  const { data, isLoading, isError, error, refetch } = adminUserService.useAdminUsers(params);
  const banMutation = adminUserService.useBanUser();
  const unbanMutation = adminUserService.useUnbanUser();

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const hasFilters = roleFilter !== 'all' || statusFilter !== 'all' || search !== '';
  const firstIndex = total === 0 ? 0 : (page - 1) * ADMIN_USERS_PAGE_SIZE + 1;
  const lastIndex = Math.min(page * ADMIN_USERS_PAGE_SIZE, total);
  const isSubmitting = banMutation.isPending || unbanMutation.isPending;

  const changeRole = (value: RoleFilter) => {
    setRoleFilter(value);
    setPage(1);
  };

  const changeStatus = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleConfirm = async (user: AdminUser) => {
    if (!target) return;
    try {
      const message =
        target.action === 'ban'
          ? await banMutation.mutateAsync(user.id)
          : await unbanMutation.mutateAsync(user.id);
      showSuccess(message);
      setTarget(null);
    } catch (err: unknown) {
      showError(err);
    }
  };

  return (
    <div data-testid="admin-user-page" className="w-full bg-canvas-cream" style={{ fontFeatureSettings: '"ss03"' }}>
      <div className="w-full space-y-8">
        <div className="space-y-1">
          <h1 className="text-[44px] md:text-[48px] leading-[54px] font-[330] tracking-[-0.02em] text-black">
            {title}
          </h1>
          <p className="text-[15px] leading-[22px] text-zinc-500">
            Xem danh sách tài khoản, khóa người dùng vi phạm và mở khóa khi cần.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative w-full max-w-md">
            <label htmlFor="user-search-input" className="sr-only">
              Tìm kiếm người dùng
            </label>
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              id="user-search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo email, họ tên hoặc tên shop..."
              className="w-full h-11 pl-10 pr-4 bg-white text-black rounded-lg text-sm border border-hairline-light focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-wrap">
            <div role="group" aria-label="Lọc theo vai trò" className="flex items-center gap-2 flex-wrap">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={roleFilter === option.value}
                  onClick={() => changeRole(option.value)}
                  className={chipClass(roleFilter === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div role="group" aria-label="Lọc theo trạng thái" className="flex items-center gap-2 flex-wrap">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={statusFilter === option.value}
                  onClick={() => changeStatus(option.value)}
                  className={chipClass(statusFilter === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isError ? (
          <div
            data-testid="admin-user-error"
            className="p-6 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-4 text-red-800"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div className="text-sm">
                <span className="font-semibold">Không tải được danh sách người dùng: </span>
                <span>{(error as Error | null)?.message || 'Vui lòng thử lại sau.'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-full px-5 py-2.5 min-h-[44px] bg-red-100 hover:bg-red-200 text-red-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tải lại</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <AdminUserTable
              users={users}
              currentUserId={currentUserId}
              isLoading={isLoading}
              hasFilters={hasFilters}
              onBan={(user) => setTarget({ user, action: 'ban' })}
              onUnban={(user) => setTarget({ user, action: 'unban' })}
            />

            {!isLoading && total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 pt-2 px-2">
                <span data-testid="user-range">
                  Hiển thị {firstIndex}–{lastIndex} trong {total} người dùng
                </span>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </div>
        )}

        <UserModerationDialog
          isOpen={target !== null}
          user={target?.user ?? null}
          action={target?.action ?? 'ban'}
          onClose={() => setTarget(null)}
          onConfirm={handleConfirm}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default AdminUserPage;

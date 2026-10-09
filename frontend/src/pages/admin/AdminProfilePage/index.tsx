import React from 'react';
import { Mail, ShieldCheck, KeyRound, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const AdminProfilePage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const initial = user?.fullName?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div
      data-testid="admin-profile-page"
      className="w-full space-y-6"
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      <div className="border-b border-hairline-light pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-black">Hồ Sơ Quản Trị Viên</h1>
        <p className="mt-1 text-xs text-zinc-500">
          Thông tin tài khoản và bảo mật của quản trị viên hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* Thông tin tài khoản */}
        <section
          data-testid="admin-profile-card"
          className="space-y-5 rounded-2xl border border-hairline-light bg-white p-6 shadow-card lg:col-span-1"
        >
          <div className="flex items-center gap-4 border-b border-hairline-light pb-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black text-lg font-semibold text-white">
              {initial}
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
                <ShieldCheck className="h-3 w-3" />
                Quản trị viên
              </span>
              <h2 className="mt-1 truncate text-lg font-semibold text-black">{user?.fullName}</h2>
            </div>
          </div>

          <dl className="space-y-4 text-xs">
            <div className="flex items-start gap-2.5">
              <UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  Tên hiển thị
                </dt>
                <dd className="mt-0.5 font-medium text-black">{user?.fullName}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  Email hệ thống
                </dt>
                <dd className="mt-0.5 break-all font-medium text-black">{user?.email}</dd>
              </div>
            </div>
          </dl>
        </section>

        {/* Bảo mật tài khoản */}
        <section className="space-y-6 rounded-2xl border border-hairline-light bg-white p-6 shadow-card sm:p-8 lg:col-span-2">
          <div className="border-b border-hairline-light pb-4">
            <h2 className="text-lg font-semibold text-black">Bảo mật tài khoản</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Quản lý mật khẩu và các thiết lập an toàn cho tài khoản quản trị.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-dashed border-hairline-light bg-canvas-cream p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-black">Đổi mật khẩu</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Tính năng đổi mật khẩu đang được hoàn thiện và sẽ sớm ra mắt.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled
              className="h-10 shrink-0 cursor-not-allowed rounded-full border border-hairline-light bg-white px-5 text-xs font-semibold text-zinc-400"
            >
              Sắp ra mắt
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminProfilePage;

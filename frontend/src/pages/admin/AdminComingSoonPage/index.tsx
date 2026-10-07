import React from 'react';
import { Hourglass } from 'lucide-react';

interface AdminComingSoonPageProps {
  title: string;
}

const AdminComingSoonPage: React.FC<AdminComingSoonPageProps> = ({ title }) => (
  <div
    data-testid="admin-coming-soon"
    className="flex w-full flex-col gap-6"
    style={{ fontFeatureSettings: '"ss03"' }}
  >
    <h1 className="text-3xl font-light tracking-tight text-black">{title}</h1>
    <div className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-[#e4e4e7] bg-white p-12 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
        <Hourglass className="h-6 w-6" />
      </div>
      <h2 className="text-base font-medium text-zinc-900">Tính năng sắp ra mắt</h2>
      <p className="max-w-sm text-xs text-zinc-500">
        Khu vực này đang được hoàn thiện và sẽ sớm có mặt trong Cổng Quản Trị.
      </p>
    </div>
  </div>
);

export default AdminComingSoonPage;

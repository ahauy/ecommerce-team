import React from 'react';
import { Link } from 'react-router-dom';
import CommonIcons from '@/components/commonIcons';
import BaseUrl from '@/consts/baseUrl';

interface AuthShellProps {
  children: React.ReactNode;
}

const AuthShell: React.FC<AuthShellProps> = ({
  children,
}) => {
  return (
    <div className="flex min-h-screen flex-col bg-canvas-cream text-zinc-900">
      <header className="flex h-14 items-center justify-between border-b border-hairline-light px-5 sm:px-8 bg-white">
        <Link
          to={BaseUrl.Homepage}
          className="flex items-center gap-1.5 text-[15px] font-medium text-black"
        >
          <CommonIcons.ArrowLeft size={16} strokeWidth={1.5} />
          TeamShop
        </Link>
        <Link
          to={BaseUrl.Homepage}
          className="flex items-center gap-1 text-[13px] text-zinc-500 transition-colors hover:text-black"
        >
          <CommonIcons.ArrowLeft size={14} strokeWidth={1.5} />
          Về trang chủ
        </Link>
      </header>

      <main className="flex flex-1 flex-col lg:flex-row">
        <section className="flex flex-1 items-center justify-center px-6 py-14 sm:px-12">
          <div className="w-full max-w-[400px]">
            <div className="bg-white rounded-xl border border-hairline-light shadow-card p-8 sm:p-10">
              <div className="mt-8">{children}</div>
            </div>
          </div>
        </section>

        <aside className="hidden items-center justify-center bg-aloe px-12 py-16 lg:flex lg:w-[42%]">
          <div className="max-w-[320px]">
            <h2 className="text-[30px] font-semibold leading-[1.3] text-black">
              Mua và bán trên cùng một tài khoản
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              Mua sắm từ nhiều gian hàng, hoặc mở gian hàng của riêng bạn chỉ
              với vài bước.
            </p>
          </div>
        </aside>
      </main>

      <footer className="border-t border-hairline-light px-5 py-6 sm:px-8 bg-white">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[280px]">
            <p className="text-[15px] font-semibold text-black">TeamShop</p>
            <p className="mt-1 text-[13px] text-zinc-500">
              Sàn thương mại đa kênh cho người mua và người bán.
            </p>
            <p className="mt-4 text-xs text-zinc-400">
              © 2026 TeamShop. Tất cả quyền được bảo lưu.
            </p>
          </div>
          <div className="flex gap-14 sm:gap-16">
            <div>
              <p className="text-xs font-medium tracking-[0.72px] text-zinc-400">
                MUA SẮM
              </p>
              <ul className="mt-3 space-y-2 text-[13px] text-zinc-500">
                <li>Hướng dẫn mua hàng</li>
                <li>Thanh toán qua VNPay</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium tracking-[0.72px] text-zinc-400">
                BÁN HÀNG
              </p>
              <ul className="mt-3 space-y-2 text-[13px] text-zinc-500">
                <li>Dùng gian hàng</li>
                <li>Quy chuẩn đăng bán</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthShell;

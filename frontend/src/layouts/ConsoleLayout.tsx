import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LogOut, Menu, type LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/auth.store";
import useLogout from "@/hooks/useLogout";
import { cn } from "@/lib/utils";

export interface ConsoleNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Mục chưa hoàn thiện — hiện nhãn "Sắp có". */
  pending?: boolean;
  /** Tuỳ chỉnh điều kiện active (mặc định: trùng path hoặc là path con). */
  isActive?: (pathname: string) => boolean;
}

export interface ConsoleLayoutProps {
  variant: "seller" | "admin";
  /** Nhãn badge dưới logo, vd. "Kênh người bán" / "Quản trị viên". */
  badgeLabel: string;
  /** Dòng phụ trong sidebar (vd. tên gian hàng). */
  subtitle?: string;
  /** Nhãn vai trò hiển thị ở thẻ user cuối sidebar. */
  roleLabel: string;
  navItems: ConsoleNavItem[];
  /** Route trang chủ của console (logo trỏ về đây — KHÔNG trỏ về sàn). */
  homeHref: string;
  profileHref: string;
  breadcrumbRoot: string;
  /** Trả về các mảnh breadcrumb (không gồm root) theo pathname. */
  getBreadcrumbs: (pathname: string) => string[];
}

const VARIANT_STYLES = {
  seller: {
    badge: "bg-[#c1fbd4] text-black",
    active: "bg-[#c1fbd4] text-black font-semibold shadow-xs",
  },
  admin: {
    badge: "bg-black text-white",
    active: "bg-black text-white font-semibold shadow-xs",
  },
} as const;

interface SidebarBodyProps extends ConsoleLayoutProps {
  onNavigate?: () => void;
}

const SidebarBody: React.FC<SidebarBodyProps> = ({
  variant,
  badgeLabel,
  subtitle,
  roleLabel,
  navItems,
  homeHref,
  onNavigate,
}) => {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const styles = VARIANT_STYLES[variant];
  const initial = user?.fullName?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Top: Logo + badge (không có link về sàn) */}
      <div className="border-b border-[#e4e4e7] px-5 py-5">
        <Link
          to={homeHref}
          onClick={onNavigate}
          className="text-xl font-bold tracking-tight text-black transition-opacity hover:opacity-80"
        >
          TeamShop
        </Link>
        <div className="mt-2 flex flex-col items-start gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
              styles.badge
            )}
          >
            {badgeLabel}
          </span>
          {subtitle && (
            <p className="max-w-full truncate text-xs text-zinc-500" title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Body: Navigation */}
      <nav
        className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4"
        aria-label={`Menu ${badgeLabel.toLowerCase()}`}
      >
        {navItems.map(({ label, href, icon: Icon, pending, isActive }) => {
          const active = isActive
            ? isActive(pathname)
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              to={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center justify-between rounded-full px-3.5 py-2.5 text-xs transition-colors",
                active
                  ? styles.active
                  : "font-medium text-zinc-600 hover:bg-[#fbfbf5] hover:text-black"
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </span>
              {pending && (
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wider",
                    active ? "text-current opacity-70" : "text-zinc-400"
                  )}
                >
                  Sắp có
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer: thẻ user + Đăng xuất */}
      <div className="space-y-2 border-t border-[#e4e4e7] p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <Avatar className="h-9 w-9 ring-1 ring-[#e4e4e7]">
            <AvatarFallback className="bg-zinc-100 text-xs font-semibold text-black">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-black">{user?.fullName}</p>
            <p className="truncate text-[11px] text-zinc-400">{roleLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-full px-3.5 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 shrink-0 text-red-500" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Khung làm việc dùng chung cho Seller & Admin (Strict Isolation):
 * - Full viewport, Sidebar trái cố định 260px (mobile: Drawer trượt từ trái).
 * - Header tối giản: Breadcrumb + Avatar. Không có Header storefront, giỏ hàng,
 *   search mua hàng hay link "Quay lại sàn".
 */
const ConsoleLayout: React.FC<ConsoleLayoutProps> = (props) => {
  const { variant, breadcrumbRoot, getBreadcrumbs, profileHref } = props;
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Đóng drawer mobile mỗi khi điều hướng.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const crumbs = [breadcrumbRoot, ...getBreadcrumbs(pathname)];
  const initial = user?.fullName?.charAt(0)?.toUpperCase() || "U";

  return (
    <div
      className={cn(
        variant === "admin" ? "component:AdminLayout" : "component:SellerLayout",
        "flex h-screen w-full overflow-hidden bg-[#fbfbf5] text-black antialiased"
      )}
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      {/* Sidebar cố định 260px (desktop) */}
      <aside className="hidden h-full w-[260px] shrink-0 border-r border-[#e4e4e7] lg:block">
        <SidebarBody {...props} />
      </aside>

      {/* Drawer (mobile) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] max-w-[85vw] p-0 sm:max-w-[260px]">
          <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
          <SidebarBody {...props} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header tối giản: Breadcrumb + Avatar */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#e4e4e7] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-full p-2 text-zinc-700 hover:bg-zinc-100 hover:text-black lg:hidden"
              aria-label="Mở menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav aria-label="Breadcrumb" className="min-w-0">
              <ol className="flex items-center gap-1.5 truncate text-xs text-zinc-500">
                {crumbs.map((crumb, index) => {
                  const isLast = index === crumbs.length - 1;
                  return (
                    <li key={`${crumb}-${index}`} className="flex items-center gap-1.5">
                      {index > 0 && <span className="text-zinc-300">/</span>}
                      <span
                        className={cn(isLast && "font-semibold text-black")}
                        aria-current={isLast ? "page" : undefined}
                      >
                        {crumb}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          <Link
            to={profileHref}
            className="group flex items-center gap-2 rounded-full pl-1"
            aria-label="Hồ sơ của tôi"
          >
            <span className="hidden max-w-[140px] truncate text-xs font-medium text-zinc-700 group-hover:text-black sm:block">
              {user?.fullName}
            </span>
            <Avatar className="h-8 w-8 ring-1 ring-[#e4e4e7] transition-all group-hover:ring-black">
              <AvatarFallback className="bg-zinc-100 text-xs font-semibold text-black">
                {initial}
              </AvatarFallback>
            </Avatar>
          </Link>
        </header>

        {/* Main content: chiếm trọn phần còn lại, tự cuộn */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ConsoleLayout;

import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, Store, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarHandler } from "@/providers/SidebarProvider";
import { useAuthStore, type AuthStatus, type AuthRole } from "@/stores/auth.store";
import BaseUrl from "@/consts/baseUrl";

interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Điều kiện hiển thị theo trạng thái / role. */
  visible: (status: AuthStatus, role?: AuthRole) => boolean;
}

const MENU: MenuItem[] = [
  { label: "Trang chủ", href: BaseUrl.Homepage, icon: Home, visible: () => true },
  {
    label: "Hồ sơ cá nhân",
    href: BaseUrl.Profile,
    icon: User,
    visible: (status) => status === "authed",
  },
  {
    label: "Gian hàng",
    href: BaseUrl.ShopSetup,
    icon: Store,
    // Admin chỉ kiểm duyệt, không bán hàng.
    visible: (status, role) => status === "authed" && role === "customer",
  },
  {
    label: "Danh mục",
    href: BaseUrl.AdminCategories,
    icon: LayoutGrid,
    visible: (status, role) => status === "authed" && role === "admin",
  },
];

const Sidebar = ({ forMobile }: { forMobile?: boolean }) => {
  const location = useLocation();
  const { isOpen } = useSidebarHandler();
  const status = useAuthStore((s) => s.status);
  const role = useAuthStore((s) => s.user?.role);

  return (
    <div
      className={cn(
        "component:Sidebar",
        forMobile
          ? isOpen
            ? "block h-[100vh] w-[100vw] overflow-auto"
            : "hidden h-[100vh] w-[100vw] overflow-auto"
          : "sticky top-0 hidden h-[100vh] max-h-[100vh] w-[--sidebar-width] p-2 md:block"
      )}
    >
      <div className="flex h-full w-full flex-col rounded-md border bg-card p-1 shadow-md">
        <div className="side-bar__logo px-2 pt-2">
          <h3 className="text-xl">Marketplace</h3>
        </div>

        <nav className="side-bar__menu mt-8" aria-label="Menu chính">
          {MENU.filter((item) => item.visible(status, role)).map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className={cn(
                "side-bar__menu__item flex items-center gap-2 px-3 py-2 text-sm",
                location.pathname === href && "is-active"
              )}
            >
              <Icon size={16} aria-hidden="true" /> {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;

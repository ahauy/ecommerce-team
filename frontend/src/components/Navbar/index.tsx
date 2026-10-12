import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  X,
  ShoppingBag,
  ChevronDown,
  User as UserIcon,
  Store,
  ShieldCheck,
  LogOut,
  Receipt,
} from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import Sidebar from "../Sidebar";
import { useSidebarHandler } from "@/providers/SidebarProvider";
import { AUTH_USER_STORAGE_KEY, useAuthStore } from "@/stores/auth.store";
import { userService } from "@/services/user.service";
import useLogout from "@/hooks/useLogout";
import BaseUrl from "@/consts/baseUrl";
import { useCartCount } from "@/hooks/queries/useCart";

export default function Navbar() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { isOpen, toggle } = useSidebarHandler();
  const [openPopover, setPopover] = useState(false);
  const isShop = !!localStorage.getItem(AUTH_USER_STORAGE_KEY);

  const isCustomer = status === "authed" && user?.role === "customer";
  const isAdmin = status === "authed" && user?.role === "admin";
  const { data: profile } = userService.useGetProfile(isCustomer);

  const cartCount = useCartCount();

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || "U";

  return (
    <nav className="flex items-center gap-3">
      {/* Mobile Drawer Trigger */}
      <Popover open={isOpen} onOpenChange={toggle}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="rounded-full p-2 text-zinc-700 hover:bg-zinc-100 hover:text-black md:hidden"
            aria-label={isOpen ? "Đóng menu" : "Mở menu"}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </PopoverTrigger>
        <PopoverContent className="mt-[10px] w-auto border-0 p-0">
          <Sidebar forMobile />
        </PopoverContent>
      </Popover>

      {/* Guest Links */}
      {status === "guest" && (
        <div className="flex items-center gap-2">
          <Link
            to={BaseUrl.Login}
            className="hidden h-10 items-center justify-center rounded-full border border-hairline-light bg-white px-5 text-xs font-semibold text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 hover:text-black sm:inline-flex"
          >
            Đăng nhập
          </Link>
          <Link
            to={BaseUrl.Register}
            className="hidden h-10 items-center justify-center rounded-full bg-black px-5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-zinc-800 sm:inline-flex"
          >
            Đăng ký
          </Link>
        </div>
      )}

      {/* Seller Action Button */}
      {isCustomer && (
        <Link
          to={profile?.shop ? BaseUrl.SellerProducts : BaseUrl.ShopSetup}
          className="hidden h-10 items-center justify-center rounded-full border border-hairline-light bg-white px-5 text-xs font-semibold tracking-wider text-black shadow-xs transition-colors hover:bg-zinc-50 lg:inline-flex"
        >
          { isShop ? "Kênh người bán" : "Đăng bán" }
        </Link>
      )}

      {/* Cart Button with Mint Badge (Admin không mua hàng nên không có giỏ) */}
      {!isAdmin && (
        <Link
          to={BaseUrl.Cart}
          aria-label={
            cartCount > 0 ? `Giỏ hàng (${cartCount} sản phẩm)` : "Giỏ hàng"
          }
          className="relative rounded-full p-2.5 text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-black"
        >
          <ShoppingBag className="h-5 w-5" />
          {cartCount > 0 && (
            <span
              data-testid="cart-badge"
              className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-aloe px-1 text-[11px] font-bold tabular-nums leading-none text-black"
            >
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>
      )}

      {/* Vertical Hairline Separator */}
      <div className="hidden h-6 w-[1px] bg-hairline-light sm:block" />

      {/* Authed User Popover */}
      {status === "authed" && user && (
        <Popover open={openPopover} onOpenChange={setPopover}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="navbar__avatar group flex items-center gap-2 rounded-full pl-1 hover:cursor-pointer focus:outline-none"
              aria-label="Tài khoản cá nhân"
            >
              <Avatar className="h-9 w-9 ring-1 ring-hairline-light transition-all group-hover:ring-black">
                <AvatarFallback className="bg-zinc-100 text-xs font-semibold text-black">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col text-left sm:flex">
                <p className="max-w-[120px] truncate text-xs font-semibold leading-tight text-black">
                  {user.fullName}
                </p>
                <p className="max-w-[120px] truncate text-[10px] leading-tight text-zinc-400">
                  {user.role === "admin" ? "Quản trị viên" : user.email}
                </p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-zinc-400 transition-colors group-hover:text-black sm:block" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="mr-2 mt-2 w-56 rounded-xl border border-hairline-light bg-white p-2 shadow-card">
            <div className="mb-1 border-b border-hairline-light px-3 py-2">
              <p className="truncate text-xs font-semibold text-black">
                {user.fullName}
              </p>
              <p className="truncate text-[11px] text-zinc-400">{user.email}</p>
            </div>

            <Link
              to={isAdmin ? BaseUrl.AdminProfile : BaseUrl.AccountProfile}
              className="navbar__each__menu flex items-center gap-2.5 rounded-full px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-canvas-cream hover:text-black"
              onClick={() => setPopover(false)}
            >
              <UserIcon className="h-4 w-4 text-zinc-500" />
              <span>Hồ sơ cá nhân</span>
            </Link>

            {isCustomer && (
              <Link
                to={BaseUrl.AccountOrders}
                className="navbar__each__menu flex items-center gap-2.5 rounded-full px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-canvas-cream hover:text-black"
                onClick={() => setPopover(false)}
              >
                <Receipt className="h-4 w-4 text-zinc-500" />
                <span>Đơn mua</span>
              </Link>
            )}

            {isCustomer && (
              <Link
                to={profile?.shop ? BaseUrl.SellerProducts : BaseUrl.ShopSetup}
                className="navbar__each__menu flex items-center gap-2.5 rounded-full px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-canvas-cream hover:text-black"
                onClick={() => setPopover(false)}
              >
                <Store className="h-4 w-4 text-zinc-500" />
                <span>
                  {profile?.shop ? "Kênh người bán" : "Đăng bán sản phẩm"}
                </span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to={BaseUrl.AdminCategories}
                className="navbar__each__menu flex items-center gap-2.5 rounded-full px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-canvas-cream hover:text-black"
                onClick={() => setPopover(false)}
              >
                <ShieldCheck className="h-4 w-4 text-zinc-500" />
                <span>Trang quản trị</span>
              </Link>
            )}

            <div className="my-1 border-t border-hairline-light" />

            <button
              type="button"
              className="navbar__each__menu flex w-full items-center gap-2.5 rounded-full px-3 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              onClick={() => {
                setPopover(false);
                void logout();
              }}
            >
              <LogOut className="h-4 w-4 text-red-500" />
              <span>Đăng xuất</span>
            </button>
          </PopoverContent>
        </Popover>
      )}
    </nav>
  );
}

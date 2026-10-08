import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ShoppingBag, ChevronDown, User as UserIcon, Store, ShieldCheck, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import Sidebar from "../Sidebar";
import { useSidebarHandler } from "@/providers/SidebarProvider";
import { useAuthStore } from "@/stores/auth.store";
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
            className="p-2 text-zinc-700 hover:text-black rounded-full hover:bg-zinc-100 md:hidden"
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
            className="hidden sm:inline-flex items-center justify-center h-10 px-5 rounded-full text-xs font-semibold text-zinc-700 hover:text-black border border-[#e4e4e7] bg-white hover:bg-zinc-50 transition-colors shadow-xs"
          >
            Đăng nhập
          </Link>
          <Link
            to={BaseUrl.Register}
            className="hidden sm:inline-flex items-center justify-center h-10 px-5 rounded-full text-xs font-semibold text-white bg-black hover:bg-zinc-800 transition-colors shadow-xs"
          >
            Đăng ký
          </Link>
        </div>
      )}

      {/* Seller Action Button */}
      {isCustomer && (
        <Link
          to={profile?.shop ? BaseUrl.SellerProducts : BaseUrl.ShopSetup}
          className="hidden lg:inline-flex items-center justify-center h-10 px-5 rounded-full text-xs font-semibold tracking-wider bg-white text-black border border-[#e4e4e7] hover:bg-zinc-50 transition-colors shadow-xs"
        >
          {profile?.shop ? "Kênh người bán" : "Đăng bán"}
        </Link>
      )}

      {/* Cart Button with Mint Badge (Admin không mua hàng nên không có giỏ) */}
      {!isAdmin && (
        <Link
          to={BaseUrl.Cart}
          aria-label={cartCount > 0 ? `Giỏ hàng (${cartCount} sản phẩm)` : "Giỏ hàng"}
          className="relative p-2.5 text-zinc-700 hover:text-black rounded-full hover:bg-zinc-100 transition-colors"
        >
          <ShoppingBag className="h-5 w-5" />
          {cartCount > 0 && (
            <span
              data-testid="cart-badge"
              className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#c1fbd4] text-black text-[11px] font-bold rounded-full leading-none"
            >
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>
      )}

      {/* Vertical Hairline Separator */}
      <div className="h-6 w-[1px] bg-[#e4e4e7] hidden sm:block" />

      {/* Authed User Popover */}
      {status === "authed" && user && (
        <Popover open={openPopover} onOpenChange={setPopover}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="navbar__avatar flex items-center gap-2 pl-1 rounded-full group hover:cursor-pointer focus:outline-none"
              aria-label="Tài khoản cá nhân"
            >
              <Avatar className="h-9 w-9 ring-1 ring-[#e4e4e7] group-hover:ring-black transition-all">
                <AvatarFallback className="bg-zinc-100 text-black text-xs font-semibold">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col text-left">
                <p className="text-xs font-semibold text-black leading-tight truncate max-w-[120px]">
                  {user.fullName}
                </p>
                <p className="text-[10px] text-zinc-400 leading-tight truncate max-w-[120px]">
                  {user.role === "admin" ? "Quản trị viên" : user.email}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-zinc-400 group-hover:text-black hidden sm:block transition-colors" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="mr-2 mt-2 w-56 rounded-xl border border-[#e4e4e7] bg-white p-2 shadow-lg">
            <div className="px-3 py-2 border-b border-[#e4e4e7] mb-1">
              <p className="text-xs font-semibold text-black truncate">{user.fullName}</p>
              <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
            </div>

            <Link
              to={isAdmin ? BaseUrl.AdminProfile : BaseUrl.AccountProfile}
              className="navbar__each__menu flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-[#fbfbf5] hover:text-black transition-colors"
              onClick={() => setPopover(false)}
            >
              <UserIcon className="h-4 w-4 text-zinc-500" />
              <span>Hồ sơ cá nhân</span>
            </Link>

            {isCustomer && (
              <Link
                to={profile?.shop ? BaseUrl.SellerProducts : BaseUrl.ShopSetup}
                className="navbar__each__menu flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-[#fbfbf5] hover:text-black transition-colors"
                onClick={() => setPopover(false)}
              >
                <Store className="h-4 w-4 text-zinc-500" />
                <span>{profile?.shop ? "Kênh người bán" : "Đăng bán sản phẩm"}</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to={BaseUrl.AdminCategories}
                className="navbar__each__menu flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-[#fbfbf5] hover:text-black transition-colors"
                onClick={() => setPopover(false)}
              >
                <ShieldCheck className="h-4 w-4 text-zinc-500" />
                <span>Trang quản trị</span>
              </Link>
            )}

            <div className="my-1 border-t border-[#e4e4e7]" />

            <button
              type="button"
              className="navbar__each__menu flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
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


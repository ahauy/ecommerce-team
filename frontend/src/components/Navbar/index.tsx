import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import Sidebar from "../Sidebar";
import { useSidebarHandler } from "@/providers/SidebarProvider";
import { useAuthStore } from "@/stores/auth.store";
import { userService } from "@/services/user.service";
import useLogout from "@/hooks/useLogout";
import BaseUrl from "@/consts/baseUrl";

const pillLink =
  "hidden sm:inline-flex items-center justify-center rounded-full border border-black/20 px-3.5 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors";

export default function Navbar() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { isOpen, toggle } = useSidebarHandler();
  const [openPopover, setPopover] = useState(false);

  const isCustomer = status === "authed" && user?.role === "customer";
  // Chỉ cần profile để biết đã có gian hàng chưa (shopName không lưu trong auth store).
  const { data: profile } = userService.useGetProfile(isCustomer);

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || "U";

  return (
    <nav className="flex w-full items-center justify-between p-2 md:justify-end">
      <Popover open={isOpen} onOpenChange={toggle}>
        <PopoverTrigger asChild>
          {isOpen ? (
            <X className="hover:cursor-pointer md:hidden" aria-label="Đóng menu" />
          ) : (
            <Menu className="hover:cursor-pointer md:hidden" aria-label="Mở menu" />
          )}
        </PopoverTrigger>
        <PopoverContent className="mt-[10px] w-auto border-0 p-0">
          <Sidebar forMobile />
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-3">
        {status === "guest" && (
          <>
            <Link to={BaseUrl.Login} className={pillLink}>
              Đăng nhập
            </Link>
            <Link to={BaseUrl.Register} className={pillLink}>
              Đăng ký
            </Link>
          </>
        )}

        {isCustomer && profile && (
          <Link
            to={profile.shop ? `/shops/${user?.id}` : BaseUrl.ShopSetup}
            className={pillLink}
          >
            {profile.shop ? "Gian hàng của tôi" : "Đăng bán"}
          </Link>
        )}

        {status === "authed" && user && (
          <Popover open={openPopover} onOpenChange={setPopover}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="navbar__avatar flex items-center gap-2 rounded-md text-left hover:cursor-pointer"
              >
                <Avatar>
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="mb-1 text-sm font-medium leading-none">{user.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="mr-2 mt-2 flex max-w-[200px] flex-col p-2">
              <Link
                to={BaseUrl.Profile}
                className="navbar__each__menu is-hover p-1 px-2 text-sm"
                onClick={() => setPopover(false)}
              >
                Hồ sơ cá nhân
              </Link>
              <button
                type="button"
                className="navbar__each__menu is-hover p-1 px-2 text-left text-sm"
                onClick={() => {
                  setPopover(false);
                  void logout();
                }}
              >
                Đăng xuất
              </button>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </nav>
  );
}

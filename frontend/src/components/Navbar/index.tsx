import { Menu, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useSidebarHandler } from "@/providers/SidebarProvider";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useState } from "react";
import { useAuth } from "@/providers/AuthenticationProvider";
import { Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import Sidebar from "../Sidebar";
import ThemeToggle from "../ThemeToggle";

export default function Navbar() {
  const { logout, user } = useAuth();
  const { isOpen, toggle } = useSidebarHandler();

  const [openPopover, setPopover] = useState(false);

  return (
    <nav className="flex w-full items-center justify-between p-2 md:justify-end">
      <Popover open={isOpen} onOpenChange={toggle}>
        <PopoverTrigger asChild>
          {isOpen ? (
            <X className="hover:cursor-pointer md:hidden" />
          ) : (
            <Menu className="hover:cursor-pointer md:hidden" />
          )}
        </PopoverTrigger>
        <PopoverContent className="mt-[10px] w-auto border-0 p-0">
          <Sidebar forMobile />
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-3">
        <Link
          to={BaseUrl.ShopSetup}
          className="hidden sm:inline-flex items-center justify-center rounded-full border border-black/20 dark:border-white/20 px-3.5 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        >
          Đăng bán
        </Link>
        <ThemeToggle />

        <Popover open={openPopover} onOpenChange={setPopover}>
          <PopoverTrigger asChild>
            <div className="navbar__avatar flex items-center gap-2 rounded-md hover:cursor-pointer">
              <Avatar>
                <AvatarImage src="https://github.com/shadcnee.png" />
                <AvatarFallback>
                  {user?.firstname?.charAt(0) || user?.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="mb-1 text-sm font-medium leading-none">
                  {user?.firstname
                    ? `${user.firstname} ${user.lastname || ""}`.trim()
                    : user?.username || "donezombie"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || "donezombie@gmail.com"}
                </p>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="mr-2 mt-2 flex max-w-[200px] flex-col p-2">
            {[
              {
                label: "Profile",
                href: BaseUrl.Profile,
                function: () => {
                  setPopover(false);
                },
              },
              {
                label: "Change password",
                href: BaseUrl.ChangePassword,
                function: () => {
                  setPopover(false);
                },
              },
              {
                label: "Log out",
                function: () => {
                  setPopover(false);
                  logout();
                },
              },
            ].map((f) => {
              if (f.href) {
                return (
                  <Link
                    to={f.href}
                    className="navbar__each__menu is-hover p-1 px-2 text-sm"
                    key={f.label}
                    onClick={f.function}
                  >
                    {f.label}
                  </Link>
                );
              }

              return (
                <p
                  onClick={f.function}
                  className="navbar__each__menu is-hover p-1 px-2 text-sm"
                  key={f.label}
                >
                  {f.label}
                </p>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
}

import React from "react";
import { Package, PlusCircle, Settings, UserCog } from "lucide-react";
import ConsoleLayout, { type ConsoleNavItem } from "@/layouts/ConsoleLayout";
import BaseUrl from "@/consts/baseUrl";
import { useAuthStore } from "@/stores/auth.store";
import { userService } from "@/services/user.service";

const SELLER_MENU: ConsoleNavItem[] = [
  {
    label: "Sản phẩm của tôi",
    href: BaseUrl.SellerProducts,
    icon: Package,
    isActive: (pathname) =>
      pathname.startsWith(BaseUrl.SellerProducts) && pathname !== BaseUrl.SellerProductCreate,
  },
  {
    label: "Thêm sản phẩm",
    href: BaseUrl.SellerProductCreate,
    icon: PlusCircle,
    isActive: (pathname) => pathname === BaseUrl.SellerProductCreate,
  },
  { label: "Hồ sơ người bán", href: BaseUrl.SellerProfile, icon: UserCog },
  { label: "Thiết lập gian hàng", href: BaseUrl.ShopSetup, icon: Settings },
];

const getBreadcrumbs = (pathname: string): string[] => {
  const path = pathname.replace(/\/+$/, "");
  if (path === BaseUrl.SellerProducts) return ["Sản phẩm"];
  if (path === BaseUrl.SellerProductCreate) return ["Sản phẩm", "Thêm mới"];
  if (path.startsWith(`${BaseUrl.SellerProducts}/`) && path.endsWith("/edit")) {
    return ["Sản phẩm", "Chỉnh sửa"];
  }
  if (path === BaseUrl.SellerProfile) return ["Hồ sơ"];
  if (path === BaseUrl.ShopSetup) return ["Thiết lập gian hàng"];
  return [];
};

const SellerLayout: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isCustomer = user?.role === "customer";
  const { data: profile } = userService.useGetProfile(isCustomer);

  return (
    <ConsoleLayout
      variant="seller"
      badgeLabel="Kênh người bán"
      subtitle={profile?.shop?.shopName || undefined}
      roleLabel="Người bán"
      navItems={SELLER_MENU}
      homeHref={BaseUrl.SellerProducts}
      profileHref={BaseUrl.SellerProfile}
      breadcrumbRoot="Kênh người bán"
      getBreadcrumbs={getBreadcrumbs}
    />
  );
};

export default SellerLayout;

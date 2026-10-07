import React from "react";
import { LayoutGrid, Users, Package, UserCog } from "lucide-react";
import ConsoleLayout, { type ConsoleNavItem } from "@/layouts/ConsoleLayout";
import BaseUrl from "@/consts/baseUrl";

const ADMIN_MENU: ConsoleNavItem[] = [
  { label: "Danh mục", href: BaseUrl.AdminCategories, icon: LayoutGrid },
  { label: "Người dùng", href: BaseUrl.AdminUsers, icon: Users, pending: true },
  { label: "Sản phẩm", href: BaseUrl.AdminProducts, icon: Package, pending: true },
  { label: "Hồ sơ", href: BaseUrl.AdminProfile, icon: UserCog },
];

const CRUMBS: Record<string, string> = {
  [BaseUrl.AdminCategories]: "Danh mục",
  [BaseUrl.AdminUsers]: "Người dùng",
  [BaseUrl.AdminProducts]: "Kiểm duyệt sản phẩm",
  [BaseUrl.AdminProfile]: "Hồ sơ",
};

const getBreadcrumbs = (pathname: string): string[] => {
  const label = CRUMBS[pathname.replace(/\/+$/, "")];
  return label ? [label] : [];
};

const AdminLayout: React.FC = () => (
  <ConsoleLayout
    variant="admin"
    badgeLabel="Quản trị viên"
    roleLabel="Quản trị viên"
    navItems={ADMIN_MENU}
    homeHref={BaseUrl.AdminCategories}
    profileHref={BaseUrl.AdminProfile}
    breadcrumbRoot="Quản trị"
    getBreadcrumbs={getBreadcrumbs}
  />
);

export default AdminLayout;

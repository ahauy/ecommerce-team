const BaseUrl = {
  // ── Storefront (Guest & Customer) ──────────────────────────────────────────
  Homepage: "/",
  Login: "/login",
  Register: "/register",
  PublicShop: "/shops/:sellerId",
  AccountProfile: "/account/profile",

  // ── Seller (Kênh người bán) ────────────────────────────────────────────────
  SellerLogin: "/seller/login",
  SellerRegister: "/seller/register",
  SellerProfile: "/seller/profile",
  ShopSetup: "/seller/setup",
  SellerProducts: "/seller/products",
  SellerProductCreate: "/seller/products/new",
  SellerProductEdit: "/seller/products/:id/edit",

  // ── Admin (Cổng quản trị) ──────────────────────────────────────────────────
  AdminLogin: "/admin/login",
  AdminProfile: "/admin/profile",
  AdminCategories: "/admin/categories",
  AdminUsers: "/admin/users",
  AdminProducts: "/admin/products",

  // ── Legacy (giữ để link/bookmark cũ vẫn chạy, chỉ dùng cho redirect) ───────
  LegacyProfile: "/profile",
  LegacyShopSetup: "/shop/setup",
};

export default BaseUrl;

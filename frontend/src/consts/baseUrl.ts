const BaseUrl = {
  // ── Storefront (Guest & Customer) ──────────────────────────────────────────
  Homepage: "/",
  Login: "/login",
  Register: "/register",
  PublicShop: "/shops/:sellerId",
  ProductDetail: "/products/:id",
  Cart: "/cart",
  Checkout: "/checkout",
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

/** Đường dẫn trang chi tiết sản phẩm. */
export const productPath = (id: string): string => `/products/${id}`;

/** Đường dẫn trang gian hàng công khai. */
export const shopPath = (sellerId: string): string => `/shops/${sellerId}`;

/** Đường dẫn trang sửa sản phẩm của người bán. */
export const sellerProductEditPath = (id: string): string => `/seller/products/${id}/edit`;

export default BaseUrl;

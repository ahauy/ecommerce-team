import React from "react";
import { Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-hairline-light mt-12">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 pb-8 border-b border-hairline-light">
          <div>
            <Link
              to={BaseUrl.Homepage}
              className="text-xl font-bold tracking-tight text-black transition-opacity hover:opacity-80"
            >
              TeamShop
            </Link>
            <p className="text-xs text-zinc-500 mt-2 max-w-sm leading-relaxed">
              Nền tảng thương mại điện tử tuyển chọn và phong cách mộc mạc tối giản.
            </p>
          </div>
          <div className="flex gap-16">
            <div className="flex flex-col gap-2.5">
              <h4 className="text-sm font-semibold text-black tracking-tight mb-1">Mua sắm</h4>
              <Link
                to={BaseUrl.Homepage}
                className="text-xs text-zinc-600 hover:text-black transition-colors"
              >
                Khám phá sản phẩm
              </Link>
              <span className="text-xs text-zinc-400">
                Thanh toán an toàn qua PayOS
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              <h4 className="text-sm font-semibold text-black tracking-tight mb-1">Bán hàng</h4>
              <Link
                to={BaseUrl.SellerRegister}
                className="text-xs text-zinc-600 hover:text-black transition-colors"
              >
                Đăng ký gian hàng
              </Link>
              <Link
                to={BaseUrl.SellerLogin}
                className="text-xs text-zinc-600 hover:text-black transition-colors"
              >
                Kênh người bán
              </Link>
            </div>
          </div>
        </div>
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} TeamShop. Tất cả quyền được bảo lưu.</p>
          <p className="text-zinc-400">Thiết kế theo chuẩn Shopify Vietnam Marketplace</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


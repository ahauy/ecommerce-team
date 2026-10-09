import { Outlet, Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import BaseUrl from "@/consts/baseUrl";

const StorefrontLayout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentQuery = searchParams.get("q") || "";

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = ((formData.get("search") as string) || "").trim();
    if (query) {
      navigate(`${BaseUrl.Homepage}?q=${encodeURIComponent(query)}`);
    } else {
      navigate(BaseUrl.Homepage);
    }
  };

  return (
    <div
      className="component:StorefrontLayout flex min-h-[100vh] flex-col bg-canvas-cream text-black antialiased"
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      {/* 1. SHARED CUSTOMER HEADER (Stitch Screen 1: h-20 / 80px) */}
      <header className="sticky top-0 z-50 bg-white border-b border-hairline-light shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-8 shrink-0">
            <Link to={BaseUrl.Homepage} className="flex items-center gap-2 group">
              <span className="text-2xl font-bold tracking-tight text-black transition-opacity group-hover:opacity-85">
                TeamShop
              </span>
            </Link>
          </div>

          {/* Centered Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-2xl hidden md:block mx-4"
          >
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 h-5 w-5 pointer-events-none" />
              <input
                name="search"
                defaultValue={currentQuery}
                type="search"
                placeholder="Tìm kiếm sản phẩm, thương hiệu hoặc cửa hàng thủ công..."
                className="w-full h-11 pl-11 pr-4 bg-white hover:bg-zinc-50 focus:bg-white text-sm text-black placeholder:text-zinc-400 rounded-full border border-hairline-light focus:border-black focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black transition-all duration-150"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="shrink-0">
            <Navbar />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex w-full flex-1 flex-col">
        <Outlet />
      </main>

      {/* Shared Footer */}
      <Footer />
    </div>
  );
};

export default StorefrontLayout;


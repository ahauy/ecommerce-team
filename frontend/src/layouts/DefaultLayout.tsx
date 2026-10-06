import { Outlet } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

const DefaultLayout = () => {
  return (
    <div className="component:DefaultLayout flex min-h-[100vh]">
      <Sidebar />

      <div className="layout-wrapper w-full p-3 md:w-[calc(100%-var(--sidebar-width))] md:pl-10">
        <Navbar />
        <main className="flex w-full">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default DefaultLayout;

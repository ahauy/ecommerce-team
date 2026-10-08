import { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";

import AppRoutes from "@/routes";
import SidebarProvider from "./providers/SidebarProvider";
import { queryClient } from "@/lib/queryClient";
import { bootstrapSession } from "@/services/session";
import useCartMergeOnLogin from "@/hooks/useCartMergeOnLogin";

const App = () => {
  // Khôi phục phiên từ refresh-cookie khi mở app.
  useEffect(() => {
    void bootstrapSession();
  }, []);

  // Đăng nhập xong → gộp giỏ localStorage vào giỏ DB (BR-CART-002).
  useCartMergeOnLogin();

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <Router>
          <AppRoutes />
        </Router>
        <ToastContainer />
      </SidebarProvider>
    </QueryClientProvider>
  );
};

export default App;

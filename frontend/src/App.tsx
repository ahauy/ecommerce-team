import { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";

import AppRoutes from "@/routes";
import SidebarProvider from "./providers/SidebarProvider";
import { queryClient } from "@/lib/queryClient";
import { bootstrapSession } from "@/services/session";

const App = () => {
  // Khôi phục phiên từ refresh-cookie khi mở app.
  useEffect(() => {
    void bootstrapSession();
  }, []);

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

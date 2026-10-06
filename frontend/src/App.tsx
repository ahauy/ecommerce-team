import { BrowserRouter as Router } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { ToastContainer } from "react-toastify";
import { Toaster } from "@/components/ui/toaster";
import AppRoutes from "@/routes";
import AuthenticationProvider from "./providers/AuthenticationProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import i18n from "./i18n/config";
import SidebarProvider from "./providers/SidebarProvider";
import { showError } from "./helpers/toast";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined) {
        showError(error);
      }
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  //! State

  //! Function

  //! Render
  const renderContent = () => (
    <Router>
      <AppRoutes />
    </Router>
  );

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider defaultTheme="light" storageKey="theme">
        <QueryClientProvider client={queryClient}>
          <AuthenticationProvider>
            <SidebarProvider>
              {renderContent()}
              <ToastContainer />
              <Toaster />
            </SidebarProvider>
          </AuthenticationProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
};

export default App;

import React from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./providers/AuthProvider";
import { SearchProvider } from "./providers/SearchProvider";
import { AppRoutes } from "./routes";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SearchProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SearchProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

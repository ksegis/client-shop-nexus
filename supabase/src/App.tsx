import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SupabaseAuthProvider } from "@/contexts/auth/SupabaseAuthProvider";
import AppRoutes from "./routes/AppRoutes";

// Simple query client without complex error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 2,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
};

export default App;


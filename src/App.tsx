
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routes/AppRoutes";
import { useEffect } from "react";
import { setupAudioCleanupOnNavigation } from "@/utils/audioUtils";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

// Wrap TooltipProvider in a functional component to fix the useState hook error
const TooltipProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  return <TooltipProvider>{children}</TooltipProvider>;
};

const App = () => {
  // Set up audio cleanup when navigating between routes
  useEffect(() => {
    return setupAudioCleanupOnNavigation();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProviderWrapper>
        <Toaster position="top-right" />
        <AppRoutes />
      </TooltipProviderWrapper>
    </QueryClientProvider>
  );
};

export default App;

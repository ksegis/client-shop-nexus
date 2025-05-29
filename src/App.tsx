
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routes/AppRoutes";
import { useEffect } from "react";
import { setupAudioCleanupOnNavigation } from "@/utils/audioUtils";
import { HeaderProvider } from "./components/layout/HeaderContext";
import { DevModeIndicator } from "./components/shared/DevModeIndicator";
import { useSessionTracking } from "./utils/sessionService";
import { SupabaseAuthProvider } from "@/contexts/auth/SupabaseAuthProvider";

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
  
  // Track user sessions
  useSessionTracking();

  // Override any EGIS initialization
  useEffect(() => {
    console.log('[Supabase Auth] App component loading - blocking EGIS initialization');
    
    // Block EGIS logging
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      const argString = args.join(' ');
      if (argString.includes('EGIS Dynamics Auth') || argString.includes('[EGIS')) {
        console.warn('[Supabase Auth] Blocked EGIS log:', ...args);
        return;
      }
      originalConsoleLog(...args);
    };

    return () => {
      console.log = originalConsoleLog;
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProviderWrapper>
        <SupabaseAuthProvider>
          <HeaderProvider>
            <AppRoutes />
            <Toaster />
            <DevModeIndicator />
          </HeaderProvider>
        </SupabaseAuthProvider>
      </TooltipProviderWrapper>
    </QueryClientProvider>
  );
};

export default App;

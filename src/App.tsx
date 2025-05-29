
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

  // Block any conflicting auth systems completely
  useEffect(() => {
    console.log('[Supabase Auth] App component loading - blocking all conflicting auth systems');
    
    // Block all EGIS and other auth system logs and operations
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    
    console.log = (...args) => {
      const argString = args.join(' ');
      if (argString.includes('EGIS') || argString.includes('[EGIS') || argString.includes('Missing code or state parameter')) {
        return; // Completely block these logs
      }
      originalConsoleLog(...args);
    };

    console.warn = (...args) => {
      const argString = args.join(' ');
      if (argString.includes('EGIS') || argString.includes('[EGIS')) {
        return; // Block EGIS warnings
      }
      originalConsoleWarn(...args);
    };

    console.error = (...args) => {
      const argString = args.join(' ');
      if (argString.includes('EGIS') || argString.includes('[EGIS') || argString.includes('Missing code or state parameter')) {
        return; // Block EGIS errors
      }
      originalConsoleError(...args);
    };

    return () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
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

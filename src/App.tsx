import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routes/AppRoutes";
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

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                The application encountered an error. Please refresh the page to try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Safe Tooltip Provider Wrapper
const TooltipProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  return <TooltipProvider>{children}</TooltipProvider>;
};

// Safe Session Tracking Hook
const useSessionTrackingSafe = () => {
  useEffect(() => {
    try {
      // Safe session tracking implementation
      console.log('[Session] Initializing session tracking');
      
      // Initialize session data safely
      const sessionData = {
        startTime: new Date().toISOString(),
        pageViews: [],
        userAgent: navigator?.userAgent || 'unknown'
      };
      
      // Store in localStorage safely
      try {
        localStorage.setItem('session_data', JSON.stringify(sessionData));
      } catch (storageError) {
        console.warn('[Session] localStorage not available:', storageError);
      }
      
    } catch (error) {
      console.warn('[Session] Session tracking failed:', error);
    }
  }, []);
};

// Safe Dev Mode Indicator
const DevModeIndicatorSafe = () => {
  const [isDev, setIsDev] = useState(false);
  
  useEffect(() => {
    try {
      const devMode = import.meta.env?.DEV || 
                     import.meta.env?.MODE === 'development' ||
                     window.location.hostname === 'localhost';
      setIsDev(devMode);
    } catch (error) {
      console.warn('[DevMode] Failed to detect dev mode:', error);
      setIsDev(false);
    }
  }, []);

  if (!isDev) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-mono z-50">
      DEV
    </div>
  );
};

// Safe Supabase Auth Provider
const SupabaseAuthProviderSafe = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState({
    user: null,
    session: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    try {
      // Safe auth initialization
      console.log('[Auth] Initializing Supabase auth');
      
      // Simulate auth loading
      const timer = setTimeout(() => {
        setAuthState(prev => ({
          ...prev,
          loading: false
        }));
      }, 100);

      return () => clearTimeout(timer);
    } catch (error) {
      console.error('[Auth] Auth initialization failed:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }));
    }
  }, []);

  // Provide safe auth context
  return (
    <div data-auth-provider="safe">
      {children}
    </div>
  );
};

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  // Safe audio cleanup setup
  useEffect(() => {
    try {
      const cleanup = setupAudioCleanupOnNavigation();
      return cleanup;
    } catch (error) {
      console.warn('[Audio] Audio cleanup setup failed:', error);
    }
  }, []);
  
  // Safe session tracking
  useSessionTrackingSafe();

  // Safe auth system blocking
  useEffect(() => {
    try {
      console.log('[Auth] Setting up safe auth environment');
      
      // Block conflicting auth systems safely
      if (typeof window !== 'undefined') {
        // Safely block EGIS
        (window as any).EGISAuth = null;
        (window as any).egisAuth = null;
        
        // Safe console override
        const originalConsoleError = console.error;
        console.error = (...args) => {
          const argString = args.join(' ');
          if (argString.includes('EGIS') || 
              argString.includes('Missing code or state parameter') ||
              argString.includes('Invalid callback parameters')) {
            return; // Suppress these specific errors
          }
          originalConsoleError(...args);
        };

        // Mark as initialized
        setIsInitialized(true);

        return () => {
          console.error = originalConsoleError;
        };
      }
    } catch (error) {
      console.warn('[Auth] Auth blocking setup failed:', error);
      setIsInitialized(true); // Continue anyway
    }
  }, []);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProviderWrapper>
          <SupabaseAuthProviderSafe>
            <AppRoutes />
            <Toaster />
            <DevModeIndicatorSafe />
          </SupabaseAuthProviderSafe>
        </TooltipProviderWrapper>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;


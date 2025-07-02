import React, { useEffect, useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routes/AppRoutes";
import { setupAudioCleanupOnNavigation } from "@/utils/audioUtils";

// Enhanced Error Tracking
class ErrorTracker {
  private static errors: Map<string, { count: number; lastSeen: number; stack?: string }> = new Map();
  private static maxErrors = 10;
  private static timeWindow = 5000; // 5 seconds

  static trackError(error: Error, context?: string): boolean {
    const errorKey = `${error.message}-${context || 'unknown'}`;
    const now = Date.now();
    
    const existing = this.errors.get(errorKey);
    if (existing) {
      // If same error within time window, increment count
      if (now - existing.lastSeen < this.timeWindow) {
        existing.count++;
        existing.lastSeen = now;
        
        // If too many of same error, suppress it
        if (existing.count > this.maxErrors) {
          console.warn(`[ErrorTracker] Suppressing repeated error: ${errorKey} (${existing.count} times)`);
          return false; // Suppress this error
        }
      } else {
        // Reset count if outside time window
        existing.count = 1;
        existing.lastSeen = now;
      }
    } else {
      // New error
      this.errors.set(errorKey, {
        count: 1,
        lastSeen: now,
        stack: error.stack
      });
    }
    
    return true; // Allow this error to be logged
  }

  static getErrorSummary() {
    return Array.from(this.errors.entries()).map(([key, data]) => ({
      error: key,
      count: data.count,
      lastSeen: new Date(data.lastSeen).toISOString(),
      stack: data.stack
    }));
  }

  static clearErrors() {
    this.errors.clear();
  }
}

// Create a client with enhanced error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      onError: (error) => {
        if (ErrorTracker.trackError(error as Error, 'react-query')) {
          console.error('[React Query Error]:', error);
        }
      }
    },
  },
});

// Enhanced Error Boundary with debugging
class EnhancedErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error; errorInfo?: React.ErrorInfo; showDebug: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, showDebug: false };
  }

  static getDerivedStateFromError(error: Error) {
    ErrorTracker.trackError(error, 'react-error-boundary');
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Enhanced Error Boundary]:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Try to identify the problematic component
    const componentStack = errorInfo.componentStack;
    if (componentStack) {
      console.group('[Component Stack Analysis]');
      console.log('Component Stack:', componentStack);
      
      // Look for common problematic patterns
      if (componentStack.includes('AdminSettings')) {
        console.warn('🚨 Error likely in AdminSettings component');
      }
      if (componentStack.includes('Tab')) {
        console.warn('🚨 Error likely in a Tab component');
      }
      if (componentStack.includes('Provider')) {
        console.warn('🚨 Error likely in a Context Provider');
      }
      
      console.groupEnd();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-2xl w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Application Error Detected
              </h1>
              <p className="text-gray-600 mb-4">
                The application encountered an error. This has been logged for debugging.
              </p>
              
              <div className="flex gap-3 justify-center mb-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => this.setState({ showDebug: !this.state.showDebug })}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  {this.state.showDebug ? 'Hide' : 'Show'} Debug Info
                </button>
              </div>
            </div>

            {this.state.showDebug && (
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h3 className="font-bold mb-2">Debug Information:</h3>
                
                {this.state.error && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-red-600">Error Message:</h4>
                    <pre className="text-xs bg-red-50 p-2 rounded overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </div>
                )}

                {this.state.errorInfo && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-blue-600">Component Stack:</h4>
                    <pre className="text-xs bg-blue-50 p-2 rounded overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="font-semibold text-green-600">Error Summary:</h4>
                  <pre className="text-xs bg-green-50 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(ErrorTracker.getErrorSummary(), null, 2)}
                  </pre>
                </div>

                <button
                  onClick={() => {
                    ErrorTracker.clearErrors();
                    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                >
                  Clear Errors & Retry
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Safe Array Access Utility
const safeArrayAccess = <T,>(array: T[] | undefined | null, defaultValue: T[] = []): T[] => {
  if (Array.isArray(array)) return array;
  console.warn('[SafeArray] Accessed undefined/null array, returning default:', defaultValue);
  return defaultValue;
};

// Enhanced Global Error Handler
const setupGlobalErrorHandling = () => {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
    if (ErrorTracker.trackError(error, 'unhandled-promise')) {
      console.error('[Unhandled Promise]:', event.reason);
    }
    event.preventDefault(); // Prevent default browser error handling
  });

  // Catch global JavaScript errors
  window.addEventListener('error', (event) => {
    const error = new Error(`Global Error: ${event.message}`);
    if (ErrorTracker.trackError(error, 'global-error')) {
      console.error('[Global Error]:', event.error || event.message);
    }
  });

  // Override console.error to track errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Check for the specific undefined length error
    if (message.includes('Cannot read properties of undefined (reading \'length\')')) {
      const error = new Error('Undefined Length Access');
      if (ErrorTracker.trackError(error, 'undefined-length')) {
        originalConsoleError('[TRACKED]', ...args);
        
        // Try to get stack trace to identify source
        const stack = new Error().stack;
        if (stack) {
          console.group('[Undefined Length Debug]');
          console.log('Stack trace:', stack);
          console.log('This error suggests an array is undefined when .length is accessed');
          console.log('Common causes: API responses, state initialization, prop passing');
          console.groupEnd();
        }
      }
      return; // Don't spam console with repeated errors
    }
    
    // For other errors, use normal tracking
    if (args[0] instanceof Error) {
      if (ErrorTracker.trackError(args[0], 'console-error')) {
        originalConsoleError(...args);
      }
    } else {
      originalConsoleError(...args);
    }
  };
};

// Safe Tooltip Provider
const SafeTooltipProvider = ({ children }: { children: React.ReactNode }) => {
  try {
    return <TooltipProvider>{children}</TooltipProvider>;
  } catch (error) {
    console.warn('[SafeTooltipProvider] Failed to initialize:', error);
    return <>{children}</>;
  }
};

// Safe Session Tracking with Array Protection
const useSafeSessionTracking = () => {
  useEffect(() => {
    try {
      console.log('[Session] Initializing safe session tracking');
      
      const sessionData = {
        startTime: new Date().toISOString(),
        pageViews: safeArrayAccess([], []), // Safe array initialization
        userAgent: navigator?.userAgent || 'unknown',
        errors: safeArrayAccess([], [])
      };
      
      localStorage.setItem('session_data', JSON.stringify(sessionData));
      
    } catch (error) {
      console.warn('[Session] Session tracking failed:', error);
    }
  }, []);
};

// Safe Dev Mode Indicator
const SafeDevModeIndicator = () => {
  const [isDev, setIsDev] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  
  useEffect(() => {
    try {
      const devMode = import.meta.env?.DEV || 
                     import.meta.env?.MODE === 'development' ||
                     window.location.hostname === 'localhost';
      setIsDev(devMode);
      
      // Update error count periodically
      const interval = setInterval(() => {
        const errors = ErrorTracker.getErrorSummary();
        setErrorCount(errors.reduce((sum, e) => sum + e.count, 0));
      }, 1000);
      
      return () => clearInterval(interval);
    } catch (error) {
      console.warn('[DevMode] Failed to detect dev mode:', error);
    }
  }, []);

  if (!isDev) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-mono">
        DEV MODE
      </div>
      {errorCount > 0 && (
        <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-mono">
          {errorCount} ERRORS
        </div>
      )}
    </div>
  );
};

// Safe Auth Provider
const SafeAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState({
    user: null,
    session: null,
    loading: true,
    error: null,
    permissions: safeArrayAccess([], []) // Safe array for permissions
  });

  useEffect(() => {
    try {
      console.log('[Auth] Initializing safe auth provider');
      
      const timer = setTimeout(() => {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          permissions: safeArrayAccess(prev.permissions, [])
        }));
      }, 100);

      return () => clearTimeout(timer);
    } catch (error) {
      console.error('[Auth] Auth initialization failed:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
        permissions: safeArrayAccess([], [])
      }));
    }
  }, []);

  return <div data-auth-provider="safe">{children}</div>;
};

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  // Setup global error handling
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  // Safe audio cleanup
  useEffect(() => {
    try {
      const cleanup = setupAudioCleanupOnNavigation();
      return cleanup;
    } catch (error) {
      console.warn('[Audio] Audio cleanup setup failed:', error);
    }
  }, []);
  
  // Safe session tracking
  useSafeSessionTracking();

  // Safe initialization
  useEffect(() => {
    try {
      console.log('[App] Initializing application with enhanced error handling');
      
      if (typeof window !== 'undefined') {
        // Safe auth blocking
        (window as any).EGISAuth = null;
        (window as any).egisAuth = null;
        
        // Add global array safety
        (window as any).safeArrayAccess = safeArrayAccess;
        
        setIsInitialized(true);
      }
    } catch (error) {
      console.warn('[App] Initialization failed:', error);
      setIsInitialized(true);
    }
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing with enhanced error handling...</p>
        </div>
      </div>
    );
  }
  
  return (
    <EnhancedErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeTooltipProvider>
          <SafeAuthProvider>
            <AppRoutes />
            <Toaster />
            <SafeDevModeIndicator />
          </SafeAuthProvider>
        </SafeTooltipProvider>
      </QueryClientProvider>
    </EnhancedErrorBoundary>
  );
};

export default App;


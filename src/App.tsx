import React, { useEffect, useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routes/AppRoutes";
import { setupAudioCleanupOnNavigation } from "@/utils/audioUtils";

// Enhanced Error Tracking with Component Identification
class ErrorTracker {
  private static errors: Map<string, { count: number; lastSeen: number; stack?: string; component?: string }> = new Map();
  private static maxErrors = 5; // Reduced to catch issues faster
  private static timeWindow = 3000; // 3 seconds
  private static componentMap: Map<string, string> = new Map();

  static registerComponent(minifiedName: string, actualName: string) {
    this.componentMap.set(minifiedName, actualName);
    console.log(`[ComponentMap] Registered: ${minifiedName} → ${actualName}`);
  }

  static trackError(error: Error, context?: string, componentName?: string): boolean {
    const errorKey = `${error.message}-${context || 'unknown'}`;
    const now = Date.now();
    
    // Try to identify component from stack trace
    let identifiedComponent = componentName;
    if (!identifiedComponent && error.stack) {
      const stackLines = error.stack.split('\n');
      for (const line of stackLines) {
        if (line.includes('h3e')) {
          identifiedComponent = this.componentMap.get('h3e') || 'h3e (unknown)';
          break;
        }
        // Check for other common minified patterns
        const match = line.match(/at ([a-zA-Z0-9]{2,4}) \(/);
        if (match) {
          const minified = match[1];
          const actual = this.componentMap.get(minified);
          if (actual) {
            identifiedComponent = actual;
            break;
          }
        }
      }
    }
    
    const existing = this.errors.get(errorKey);
    if (existing) {
      if (now - existing.lastSeen < this.timeWindow) {
        existing.count++;
        existing.lastSeen = now;
        if (identifiedComponent) existing.component = identifiedComponent;
        
        if (existing.count > this.maxErrors) {
          console.warn(`[ErrorTracker] Suppressing repeated error: ${errorKey} (${existing.count} times) in ${existing.component || 'unknown component'}`);
          return false;
        }
      } else {
        existing.count = 1;
        existing.lastSeen = now;
        if (identifiedComponent) existing.component = identifiedComponent;
      }
    } else {
      this.errors.set(errorKey, {
        count: 1,
        lastSeen: now,
        stack: error.stack,
        component: identifiedComponent
      });
    }
    
    return true;
  }

  static getErrorSummary() {
    return Array.from(this.errors.entries()).map(([key, data]) => ({
      error: key,
      count: data.count,
      lastSeen: new Date(data.lastSeen).toISOString(),
      component: data.component || 'unknown',
      stack: data.stack
    }));
  }

  static clearErrors() {
    this.errors.clear();
  }

  static getComponentMap() {
    return Array.from(this.componentMap.entries());
  }
}

// Safe Array Access with Component Tracking
const safeArrayAccess = <T,>(
  array: T[] | undefined | null, 
  componentName: string = 'unknown',
  propertyName: string = 'array',
  defaultValue: T[] = []
): T[] => {
  if (Array.isArray(array)) {
    return array;
  }
  
  console.warn(`[SafeArray] ${componentName}.${propertyName} is ${array === null ? 'null' : 'undefined'}, using default:`, defaultValue);
  
  // Track this as a potential issue
  const error = new Error(`Undefined array access in ${componentName}.${propertyName}`);
  ErrorTracker.trackError(error, 'safe-array-access', componentName);
  
  return defaultValue;
};

// Component Registration Hook
const useComponentRegistration = (componentName: string, minifiedName?: string) => {
  useEffect(() => {
    if (minifiedName) {
      ErrorTracker.registerComponent(minifiedName, componentName);
    }
    console.log(`[Component] ${componentName} mounted`);
    
    return () => {
      console.log(`[Component] ${componentName} unmounted`);
    };
  }, [componentName, minifiedName]);
};

// Enhanced Query Client with Better Error Handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: (failureCount, error) => {
        // Don't retry on array access errors
        if (error?.message?.includes('length') || error?.message?.includes('undefined')) {
          return false;
        }
        return failureCount < 2;
      },
      onError: (error) => {
        if (ErrorTracker.trackError(error as Error, 'react-query')) {
          console.error('[React Query Error]:', error);
        }
      }
    },
  },
});

// Enhanced Error Boundary with Component Identification
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
    
    // Enhanced component analysis
    const componentStack = errorInfo.componentStack;
    if (componentStack) {
      console.group('[Component Stack Analysis]');
      console.log('Component Stack:', componentStack);
      console.log('Error Message:', error.message);
      
      // Look for specific patterns
      if (error.message.includes('Cannot read properties of undefined')) {
        console.warn('🚨 UNDEFINED LENGTH ERROR DETECTED');
        console.log('This is likely the h3e component issue we\'ve been tracking');
        
        // Try to identify the component
        if (componentStack.includes('AdminSettings')) {
          console.warn('🎯 Error likely in AdminSettings component');
          ErrorTracker.registerComponent('h3e', 'AdminSettings');
        } else if (componentStack.includes('Tab')) {
          console.warn('🎯 Error likely in a Tab component');
          ErrorTracker.registerComponent('h3e', 'TabComponent');
        } else if (componentStack.includes('Provider')) {
          console.warn('🎯 Error likely in a Context Provider');
          ErrorTracker.registerComponent('h3e', 'ContextProvider');
        } else if (componentStack.includes('Route')) {
          console.warn('🎯 Error likely in a Route component');
          ErrorTracker.registerComponent('h3e', 'RouteComponent');
        }
      }
      
      console.log('Registered Components:', ErrorTracker.getComponentMap());
      console.groupEnd();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Application Error Detected
              </h1>
              <p className="text-gray-600 mb-4">
                The application encountered an error. Enhanced debugging information is available below.
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
                <button
                  onClick={() => {
                    console.log('=== FULL ERROR ANALYSIS ===');
                    console.log('Error Summary:', ErrorTracker.getErrorSummary());
                    console.log('Component Map:', ErrorTracker.getComponentMap());
                    console.log('Error Details:', this.state.error);
                    console.log('Component Stack:', this.state.errorInfo?.componentStack);
                  }}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Log Full Analysis
                </button>
              </div>
            </div>

            {this.state.showDebug && (
              <div className="bg-gray-50 rounded-lg p-4 text-left space-y-4">
                <h3 className="font-bold mb-2">Enhanced Debug Information:</h3>
                
                {this.state.error && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-red-600">Error Message:</h4>
                    <pre className="text-xs bg-red-50 p-2 rounded overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="font-semibold text-purple-600">Component Mapping:</h4>
                  <div className="text-xs bg-purple-50 p-2 rounded">
                    {ErrorTracker.getComponentMap().length > 0 ? (
                      <ul>
                        {ErrorTracker.getComponentMap().map(([minified, actual]) => (
                          <li key={minified}><code>{minified}</code> → {actual}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No component mappings identified yet</p>
                    )}
                  </div>
                </div>

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

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      ErrorTracker.clearErrors();
                      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Clear Errors & Retry
                  </button>
                  <button
                    onClick={() => {
                      const errors = ErrorTracker.getErrorSummary();
                      const h3eErrors = errors.filter(e => e.component?.includes('h3e') || e.error.includes('length'));
                      if (h3eErrors.length > 0) {
                        alert(`Found ${h3eErrors.length} h3e/length errors. Check console for details.`);
                        console.log('h3e Component Errors:', h3eErrors);
                      } else {
                        alert('No h3e component errors found in current session.');
                      }
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Find h3e Component
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced Global Error Handler
const setupGlobalErrorHandling = () => {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
    if (ErrorTracker.trackError(error, 'unhandled-promise')) {
      console.error('[Unhandled Promise]:', event.reason);
    }
    event.preventDefault();
  });

  // Catch global JavaScript errors
  window.addEventListener('error', (event) => {
    const error = new Error(`Global Error: ${event.message}`);
    if (ErrorTracker.trackError(error, 'global-error')) {
      console.error('[Global Error]:', event.error || event.message);
    }
  });

  // Enhanced console.error override
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Specific handling for undefined length errors
    if (message.includes('Cannot read properties of undefined (reading \'length\')')) {
      const error = new Error('Undefined Length Access');
      if (ErrorTracker.trackError(error, 'undefined-length')) {
        originalConsoleError('[TRACKED - h3e Component Issue]', ...args);
        
        // Enhanced stack trace analysis
        const stack = new Error().stack;
        if (stack) {
          console.group('[h3e Component Debug]');
          console.log('🎯 This is the h3e component undefined length error!');
          console.log('Stack trace:', stack);
          console.log('Component mappings:', ErrorTracker.getComponentMap());
          console.log('Error summary:', ErrorTracker.getErrorSummary());
          console.groupEnd();
        }
      }
      return;
    }
    
    // Track other errors normally
    if (args[0] instanceof Error) {
      if (ErrorTracker.trackError(args[0], 'console-error')) {
        originalConsoleError(...args);
      }
    } else {
      originalConsoleError(...args);
    }
  };

  // Add global safe array access
  (window as any).safeArrayAccess = safeArrayAccess;
  (window as any).ErrorTracker = ErrorTracker;
};

// Safe Tooltip Provider with Registration
const SafeTooltipProvider = ({ children }: { children: React.ReactNode }) => {
  useComponentRegistration('TooltipProvider');
  
  try {
    return <TooltipProvider>{children}</TooltipProvider>;
  } catch (error) {
    console.warn('[SafeTooltipProvider] Failed to initialize:', error);
    return <>{children}</>;
  }
};

// Safe Session Tracking with Enhanced Array Protection
const useSafeSessionTracking = () => {
  useComponentRegistration('SessionTracking');
  
  useEffect(() => {
    try {
      console.log('[Session] Initializing safe session tracking');
      
      const sessionData = {
        startTime: new Date().toISOString(),
        pageViews: safeArrayAccess([], 'SessionTracking', 'pageViews', []),
        userAgent: navigator?.userAgent || 'unknown',
        errors: safeArrayAccess([], 'SessionTracking', 'errors', []),
        componentMap: safeArrayAccess([], 'SessionTracking', 'componentMap', [])
      };
      
      localStorage.setItem('session_data', JSON.stringify(sessionData));
      
    } catch (error) {
      console.warn('[Session] Session tracking failed:', error);
      ErrorTracker.trackError(error as Error, 'session-tracking', 'SessionTracking');
    }
  }, []);
};

// Safe Dev Mode Indicator with Error Count
const SafeDevModeIndicator = () => {
  useComponentRegistration('DevModeIndicator');
  
  const [isDev, setIsDev] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [h3eErrors, setH3eErrors] = useState(0);
  
  useEffect(() => {
    try {
      const devMode = import.meta.env?.DEV || 
                     import.meta.env?.MODE === 'development' ||
                     window.location.hostname === 'localhost';
      setIsDev(devMode);
      
      // Update error counts periodically
      const interval = setInterval(() => {
        const errors = ErrorTracker.getErrorSummary();
        const totalErrors = errors.reduce((sum, e) => sum + e.count, 0);
        const h3eCount = errors.filter(e => 
          e.component?.includes('h3e') || 
          e.error.includes('length') ||
          e.error.includes('undefined')
        ).reduce((sum, e) => sum + e.count, 0);
        
        setErrorCount(totalErrors);
        setH3eErrors(h3eCount);
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
      {h3eErrors > 0 && (
        <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-mono">
          h3e: {h3eErrors}
        </div>
      )}
      <button
        onClick={() => {
          console.log('=== DEV DEBUG INFO ===');
          console.log('Error Summary:', ErrorTracker.getErrorSummary());
          console.log('Component Map:', ErrorTracker.getComponentMap());
          const h3eErrors = ErrorTracker.getErrorSummary().filter(e => 
            e.component?.includes('h3e') || e.error.includes('length')
          );
          console.log('h3e Component Errors:', h3eErrors);
        }}
        className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-mono hover:bg-blue-600"
      >
        DEBUG
      </button>
    </div>
  );
};

// Safe Auth Provider with Enhanced Error Handling
const SafeAuthProvider = ({ children }: { children: React.ReactNode }) => {
  useComponentRegistration('AuthProvider', 'h3e'); // Register as potential h3e component
  
  const [authState, setAuthState] = useState({
    user: null,
    session: null,
    loading: true,
    error: null,
    permissions: safeArrayAccess([], 'AuthProvider', 'permissions', []),
    roles: safeArrayAccess([], 'AuthProvider', 'roles', [])
  });

  useEffect(() => {
    try {
      console.log('[Auth] Initializing safe auth provider');
      
      const timer = setTimeout(() => {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          permissions: safeArrayAccess(prev.permissions, 'AuthProvider', 'permissions', []),
          roles: safeArrayAccess(prev.roles, 'AuthProvider', 'roles', [])
        }));
      }, 100);

      return () => clearTimeout(timer);
    } catch (error) {
      console.error('[Auth] Auth initialization failed:', error);
      ErrorTracker.trackError(error as Error, 'auth-provider', 'AuthProvider');
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
        permissions: safeArrayAccess([], 'AuthProvider', 'permissions', []),
        roles: safeArrayAccess([], 'AuthProvider', 'roles', [])
      }));
    }
  }, []);

  return (
    <div data-component="auth-provider" data-auth-provider="safe">
      {children}
    </div>
  );
};

// Main App Component
const App = () => {
  useComponentRegistration('App');
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Setup global error handling
  useEffect(() => {
    try {
      setupGlobalErrorHandling();
      console.log('[App] Global error handling initialized');
    } catch (error) {
      console.error('[App] Failed to setup global error handling:', error);
      setInitError('Failed to initialize error handling');
    }
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

  // Safe initialization with enhanced error handling
  useEffect(() => {
    try {
      console.log('[App] Initializing application with enhanced error handling and h3e component tracking');
      
      if (typeof window !== 'undefined') {
        // Safe auth blocking
        (window as any).EGISAuth = null;
        (window as any).egisAuth = null;
        
        // Add debugging utilities to window
        (window as any).safeArrayAccess = safeArrayAccess;
        (window as any).ErrorTracker = ErrorTracker;
        (window as any).debugH3e = () => {
          console.log('=== h3e Component Debug ===');
          const errors = ErrorTracker.getErrorSummary();
          const h3eErrors = errors.filter(e => 
            e.component?.includes('h3e') || 
            e.error.includes('length') ||
            e.error.includes('undefined')
          );
          console.log('h3e Errors:', h3eErrors);
          console.log('Component Map:', ErrorTracker.getComponentMap());
          return h3eErrors;
        };
        
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('[App] Initialization failed:', error);
      setInitError(`Initialization failed: ${error.message}`);
      setIsInitialized(true); // Continue anyway
    }
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing with enhanced error handling and h3e component tracking...</p>
          {initError && (
            <p className="text-red-600 text-sm mt-2">{initError}</p>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <EnhancedErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeTooltipProvider>
          <SafeAuthProvider>
            <div data-component="app-routes">
              <AppRoutes />
            </div>
            <Toaster />
            <SafeDevModeIndicator />
          </SafeAuthProvider>
        </SafeTooltipProvider>
      </QueryClientProvider>
    </EnhancedErrorBoundary>
  );
};

export default App;


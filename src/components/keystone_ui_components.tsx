import React, { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, 
  Clock, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Timer,
  Zap,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Info,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Enhanced interfaces for better error and rate limit handling
interface RateLimitInfo {
  isRateLimited: boolean;
  retryAfterSeconds: number;
  endpoint: string;
  timestamp: number;
}

interface ErrorInfo {
  message: string;
  type: 'network' | 'rate_limit' | 'auth' | 'server' | 'unknown';
  statusCode?: number;
  retryable: boolean;
  retryAfterSeconds?: number;
}

interface ConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  lastError?: ErrorInfo;
  rateLimits: RateLimitInfo[];
  usingCachedData?: boolean;
}

// Compact Information Panel - Collapsible status section
export const InformationPanel: React.FC<{ 
  connectionState: ConnectionState;
  onRetry?: () => void;
  onUseCachedData?: () => void;
  onRefresh?: () => void;
}> = ({ connectionState, onRetry, onUseCachedData, onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { rateLimits, lastError, usingCachedData, isConnected } = connectionState;
  
  // Auto-open if there are important issues
  useEffect(() => {
    if (rateLimits.length > 0 || lastError || usingCachedData) {
      setIsOpen(true);
    }
  }, [rateLimits.length, lastError, usingCachedData]);

  const hasIssues = rateLimits.length > 0 || lastError || usingCachedData;
  const statusCount = (rateLimits.length > 0 ? 1 : 0) + (lastError ? 1 : 0) + (usingCachedData ? 1 : 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className={`w-full justify-between h-10 ${hasIssues ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="font-medium">Information</span>
            {statusCount > 0 && (
              <Badge variant="secondary" className="h-5 px-2 text-xs">
                {statusCount}
              </Badge>
            )}
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          
          {/* Connection Status Card */}
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {onRetry && !isConnected && (
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rate Limits Card */}
          {rateLimits.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">Rate Limits Active</span>
                  </div>
                  {rateLimits.slice(0, 2).map((limit, index) => {
                    const timeRemaining = Math.max(0, limit.retryAfterSeconds - Math.floor((Date.now() - limit.timestamp) / 1000));
                    const minutes = Math.floor(timeRemaining / 60);
                    const seconds = timeRemaining % 60;
                    
                    return (
                      <div key={index} className="text-xs text-orange-600">
                        {limit.endpoint.replace('/inventory/', '').replace('/parts/', '').toUpperCase()}: {minutes}:{seconds.toString().padStart(2, '0')}
                      </div>
                    );
                  })}
                  {rateLimits.length > 2 && (
                    <div className="text-xs text-orange-600">
                      +{rateLimits.length - 2} more...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Card */}
          {lastError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">
                      {lastError.type === 'rate_limit' ? 'Rate Limited' : 'Error'}
                    </span>
                  </div>
                  <p className="text-xs text-red-600 line-clamp-2">
                    {lastError.message}
                  </p>
                  {lastError.retryable && onRetry && (
                    <Button variant="outline" size="sm" onClick={onRetry} className="h-6 text-xs">
                      Retry
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cached Data Card */}
          {usingCachedData && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Using Cached Data</span>
                  </div>
                  <p className="text-xs text-blue-600">
                    Showing offline inventory data
                  </p>
                  {onRefresh && (
                    <Button variant="outline" size="sm" onClick={onRefresh} className="h-6 text-xs">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// Compact Status Bar - Always visible minimal status
export const StatusBar: React.FC<{ 
  connectionState: ConnectionState;
  lastRefresh?: Date;
}> = ({ connectionState, lastRefresh }) => {
  const { isConnected, rateLimits, usingCachedData } = connectionState;
  
  const getStatusIcon = () => {
    if (rateLimits.length > 0) return <Timer className="h-3 w-3 text-orange-500" />;
    if (usingCachedData) return <Database className="h-3 w-3 text-blue-500" />;
    if (isConnected) return <CheckCircle className="h-3 w-3 text-green-500" />;
    return <XCircle className="h-3 w-3 text-red-500" />;
  };

  const getStatusText = () => {
    if (rateLimits.length > 0) return 'Rate Limited';
    if (usingCachedData) return 'Cached Data';
    if (isConnected) return 'Live Data';
    return 'Offline';
  };

  return (
    <div className="flex items-center justify-between text-xs text-gray-500 py-1">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
      {lastRefresh && (
        <span>
          Last updated: {lastRefresh.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

// Fast Loading Component - Shows cached data immediately
export const FastLoadingWrapper: React.FC<{ 
  children: React.ReactNode;
  isLoading: boolean;
  hasData: boolean;
  cachedData?: any;
  onUseCachedData?: () => void;
  loadingMessage?: string;
}> = ({ 
  children, 
  isLoading, 
  hasData, 
  cachedData, 
  onUseCachedData,
  loadingMessage = "Loading fresh data..."
}) => {
  
  // If we have cached data and we're loading, show cached data immediately
  if (isLoading && cachedData && onUseCachedData) {
    // Auto-use cached data after 2 seconds of loading
    useEffect(() => {
      const timer = setTimeout(() => {
        onUseCachedData();
      }, 2000);
      
      return () => clearTimeout(timer);
    }, [onUseCachedData]);
  }

  // Always show content if we have any data
  if (hasData || cachedData) {
    return <>{children}</>;
  }

  // Only show loading state if we have no data at all
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-sm text-gray-600">{loadingMessage}</p>
      {cachedData && onUseCachedData && (
        <Button variant="outline" onClick={onUseCachedData}>
          <Database className="h-4 w-4 mr-2" />
          Use Cached Data
        </Button>
      )}
    </div>
  );
};

// Minimal Rate Limit Indicator
export const RateLimitIndicator: React.FC<{ 
  rateLimits: RateLimitInfo[];
  className?: string;
}> = ({ rateLimits, className = "" }) => {
  if (rateLimits.length === 0) return null;

  const nextExpiry = Math.min(...rateLimits.map(limit => {
    return limit.retryAfterSeconds - Math.floor((Date.now() - limit.timestamp) / 1000);
  }));

  if (nextExpiry <= 0) return null;

  const minutes = Math.floor(nextExpiry / 60);
  const seconds = nextExpiry % 60;

  return (
    <Badge variant="outline" className={`text-orange-600 border-orange-300 ${className}`}>
      <Timer className="h-3 w-3 mr-1" />
      {minutes}:{seconds.toString().padStart(2, '0')}
    </Badge>
  );
};

// Auto-refresh with rate limit awareness
export const useSmartRefresh = (
  refreshFunction: () => Promise<void>,
  intervalMs: number = 30000,
  rateLimits: RateLimitInfo[] = []
) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>();

  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    
    // Check if any endpoints are rate limited
    const hasActiveLimits = rateLimits.some(limit => {
      const timeRemaining = limit.retryAfterSeconds - Math.floor((Date.now() - limit.timestamp) / 1000);
      return timeRemaining > 0;
    });

    if (hasActiveLimits) {
      console.log('Skipping refresh due to active rate limits');
      return;
    }

    setIsRefreshing(true);
    try {
      await refreshFunction();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshFunction, isRefreshing, rateLimits]);

  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [refresh, intervalMs]);

  return { refresh, isRefreshing, lastRefresh };
};

// Enhanced Error Boundary with minimal UI
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Something went wrong</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom hook for managing Keystone status with cached data support
export const useKeystoneStatus = (keystoneService: any, enableCaching: boolean = true) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isLoading: false, // Start as false to show cached data immediately
    rateLimits: [],
    usingCachedData: false
  });
  const { toast } = useToast();

  const updateRateLimits = useCallback(() => {
    if (keystoneService?.getAllRateLimits) {
      const rateLimits = keystoneService.getAllRateLimits();
      setConnectionState(prev => ({ ...prev, rateLimits }));
    }
  }, [keystoneService]);

  const handleError = useCallback((error: ErrorInfo) => {
    setConnectionState(prev => ({ 
      ...prev, 
      lastError: error,
      isConnected: error.type !== 'network',
      isLoading: false
    }));

    // Only show toast for critical errors, not rate limits
    if (error.type === 'network') {
      toast({
        title: "Connection Error",
        description: "Using cached data while offline.",
        variant: "default",
      });
    }
  }, [toast]);

  const handleRateLimit = useCallback((rateLimitInfo: RateLimitInfo) => {
    updateRateLimits();
    // Don't show toast for rate limits - handle silently
  }, [updateRateLimits]);

  const useCachedData = useCallback(() => {
    setConnectionState(prev => ({
      ...prev,
      usingCachedData: true,
      isLoading: false
    }));
  }, []);

  useEffect(() => {
    if (keystoneService) {
      // Set up error and rate limit listeners
      keystoneService.onError?.(handleError);
      keystoneService.onRateLimit?.(handleRateLimit);

      // Update rate limits periodically
      const interval = setInterval(updateRateLimits, 5000); // Less frequent updates

      return () => {
        clearInterval(interval);
        keystoneService.removeErrorListener?.(handleError);
        keystoneService.removeRateLimitListener?.(handleRateLimit);
      };
    }
  }, [keystoneService, handleError, handleRateLimit, updateRateLimits]);

  const testConnection = useCallback(async () => {
    if (!keystoneService) return;

    setConnectionState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await keystoneService.testConnection();
      setConnectionState(prev => ({
        ...prev,
        isConnected: result.success,
        isLoading: false,
        usingCachedData: false,
        lastError: result.success ? undefined : {
          message: result.error || 'Connection test failed',
          type: 'unknown',
          retryable: true
        }
      }));
    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        lastError: {
          message: 'Connection test failed',
          type: 'network',
          retryable: true
        }
      }));
    }
  }, [keystoneService]);

  return {
    connectionState,
    testConnection,
    updateRateLimits,
    useCachedData,
    clearError: () => setConnectionState(prev => ({ ...prev, lastError: undefined }))
  };
};


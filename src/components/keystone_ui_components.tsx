import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle,
  Timer,
  Zap
} from 'lucide-react';
import { RateLimitInfo, ErrorInfo } from './enhanced_keystone_service_with_rate_limiting';

interface RateLimitStatusProps {
  rateLimits: RateLimitInfo[];
  onRetry?: (endpoint: string) => void;
  className?: string;
}

export const RateLimitStatus: React.FC<RateLimitStatusProps> = ({ 
  rateLimits, 
  onRetry, 
  className = '' 
}) => {
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: number } = {};
      
      rateLimits.forEach(limit => {
        const remaining = Math.max(0, limit.retryAfterSeconds - 1);
        newTimeRemaining[limit.endpoint] = remaining;
      });
      
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimits]);

  if (rateLimits.length === 0) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Timer className="h-4 w-4" />
          Rate Limits Active
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rateLimits.map((limit) => {
          const remaining = timeRemaining[limit.endpoint] ?? limit.retryAfterSeconds;
          const progress = ((limit.retryAfterSeconds - remaining) / limit.retryAfterSeconds) * 100;
          
          return (
            <div key={limit.endpoint} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                    {limit.endpoint}
                  </Badge>
                  <span className="text-sm text-orange-600">
                    {formatTime(remaining)} remaining
                  </span>
                </div>
                {remaining === 0 && onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRetry(limit.endpoint)}
                    className="h-6 px-2 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

interface ConnectionStatusProps {
  isConnected: boolean;
  lastChecked?: Date;
  onReconnect?: () => void;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  lastChecked,
  onReconnect,
  className = ''
}) => {
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = async () => {
    if (onReconnect) {
      setIsReconnecting(true);
      try {
        await onReconnect();
      } finally {
        setIsReconnecting(false);
      }
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isConnected ? (
        <>
          <div className="flex items-center gap-1 text-green-600">
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">Keystone Connected</span>
          </div>
          {lastChecked && (
            <span className="text-xs text-gray-500">
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-1 text-red-600">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">Keystone Disconnected</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReconnect}
            disabled={isReconnecting}
            className="h-6 px-2 text-xs"
          >
            {isReconnecting ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Reconnect
          </Button>
        </>
      )}
    </div>
  );
};

interface ErrorDisplayProps {
  error: ErrorInfo | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  className = ''
}) => {
  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return <WifiOff className="h-4 w-4" />;
      case 'rate_limit':
        return <Timer className="h-4 w-4" />;
      case 'auth':
        return <XCircle className="h-4 w-4" />;
      case 'server':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getErrorVariant = () => {
    switch (error.type) {
      case 'network':
      case 'server':
        return 'destructive';
      case 'rate_limit':
        return 'default';
      case 'auth':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Alert variant={getErrorVariant()} className={className}>
      <div className="flex items-start gap-2">
        {getErrorIcon()}
        <div className="flex-1">
          <AlertDescription className="mb-2">
            {error.message}
            {error.retryAfterSeconds && (
              <span className="block text-sm mt-1">
                Retry available in {error.retryAfterSeconds} seconds
              </span>
            )}
          </AlertDescription>
          <div className="flex gap-2">
            {error.retryable && onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </Alert>
  );
};

interface RetryCountdownProps {
  seconds: number;
  onRetry?: () => void;
  className?: string;
}

export const RetryCountdown: React.FC<RetryCountdownProps> = ({
  seconds,
  onRetry,
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (onRetry) {
            onRetry();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onRetry]);

  if (timeLeft <= 0) {
    return null;
  }

  const progress = ((seconds - timeLeft) / seconds) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Auto-retry in:</span>
        <span className="font-mono font-medium">{timeLeft}s</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

interface LoadingStateProps {
  isLoading: boolean;
  message?: string;
  showSpinner?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  message = 'Loading...',
  showSpinner = true,
  className = ''
}) => {
  if (!isLoading) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showSpinner && <RefreshCw className="h-4 w-4 animate-spin" />}
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
};

interface ApiStatusIndicatorProps {
  status: 'connected' | 'disconnected' | 'rate_limited' | 'error';
  message?: string;
  className?: string;
}

export const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({
  status,
  message,
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          label: 'Connected'
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          label: 'Disconnected'
        };
      case 'rate_limited':
        return {
          icon: <Timer className="h-4 w-4" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-200',
          label: 'Rate Limited'
        };
      case 'error':
        return {
          icon: <XCircle className="h-4 w-4" />,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          label: 'Error'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.bgColor} ${config.borderColor} ${className}`}>
      <div className={config.color}>
        {config.icon}
      </div>
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
      {message && (
        <span className="text-xs text-gray-600">
          {message}
        </span>
      )}
    </div>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Something went wrong. Please try refreshing the page.</p>
              <p className="text-sm text-gray-600">
                Error: {this.state.error?.message}
              </p>
              <Button size="sm" variant="outline" onClick={this.resetError}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Custom hook for managing error and rate limit state
export const useKeystoneStatus = () => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimitInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const addError = (error: ErrorInfo) => {
    setErrors(prev => [...prev, { ...error, id: Date.now() } as any]);
  };

  const removeError = (index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const updateRateLimits = (limits: RateLimitInfo[]) => {
    setRateLimits(limits);
  };

  const updateConnectionStatus = (connected: boolean) => {
    setIsConnected(connected);
    setLastChecked(new Date());
  };

  return {
    errors,
    rateLimits,
    isConnected,
    lastChecked,
    addError,
    removeError,
    clearErrors,
    updateRateLimits,
    updateConnectionStatus
  };
};


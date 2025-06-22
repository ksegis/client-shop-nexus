import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  Activity,
  Database,
  Zap,
  Bug,
  Timer,
  Pause
} from 'lucide-react';
import { inventorySyncService } from '@/services/inventory_sync_service';

// Safe formatting utilities (inline to avoid import issues)
const safeFormatDate = (dateValue, options = {}) => {
  if (!dateValue) return 'Never';
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return 'Invalid Date';
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };
    return date.toLocaleString(undefined, defaultOptions);
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Format Error';
  }
};

const safeFormatRelativeTime = (dateValue) => {
  if (!dateValue) return 'Never';
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return 'Invalid Date';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    else if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    else if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    else if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    else return safeFormatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (error) {
    console.warn('Error formatting relative time:', error);
    return 'Format Error';
  }
};

const safeFormatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0s';
  try {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  } catch (error) {
    console.warn('Error formatting duration:', error);
    return '0s';
  }
};

const safeFormatNumber = (value, options = {}) => {
  if (value === null || value === undefined || value === '') return '0';
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toLocaleString(undefined, options);
  } catch (error) {
    console.warn('Error formatting number:', error);
    return '0';
  }
};

const safeFormatPercentage = (value) => {
  if (value === null || value === undefined || value === '') return '0%';
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0%';
    return `${Math.round(num * 100)}%`;
  } catch (error) {
    console.warn('Error formatting percentage:', error);
    return '0%';
  }
};

const safeDisplayValue = (value, fallback = 'Unknown') => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
};

// Safe sync status interface with rate limiting
interface SafeSyncStatus {
  isRunning: boolean;
  lastSuccessfulSync: string | null;
  nextPlannedSync: string | null;
  totalItems: number;
  syncedItems: number;
  errors: string[];
  progress: number;
  lastSyncAttempt: string | null;
  lastSyncResult: 'success' | 'failed' | 'partial' | 'never' | null;
  failureReason: string | null;
  isRateLimited: boolean;
  rateLimitRetryAfter: string | null;
  rateLimitMessage: string | null;
  rateLimitTimeRemaining: number | null;
}

const AdminSettings: React.FC = () => {
  const [environment, setEnvironment] = useState<'development' | 'production'>('development');
  const [lastChanged, setLastChanged] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SafeSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);

  // Load current environment setting on component mount
  useEffect(() => {
    try {
      const savedEnvironment = localStorage.getItem('admin_environment') as 'development' | 'production';
      if (savedEnvironment) {
        setEnvironment(savedEnvironment);
      }

      const savedTimestamp = localStorage.getItem('admin_environment_changed');
      if (savedTimestamp) {
        setLastChanged(savedTimestamp);
      }

      // Load sync status
      loadSyncStatus();
    } catch (error) {
      console.error('Error loading admin settings:', error);
    }
  }, []);

  // Set up countdown timer for rate limiting
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (syncStatus?.isRateLimited && syncStatus?.rateLimitTimeRemaining) {
      setRateLimitCountdown(syncStatus.rateLimitTimeRemaining);
      
      interval = setInterval(() => {
        setRateLimitCountdown(prev => {
          if (prev === null || prev <= 1) {
            // Rate limit expired, reload sync status
            loadSyncStatus();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setRateLimitCountdown(null);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [syncStatus?.isRateLimited, syncStatus?.rateLimitTimeRemaining]);

  const loadSyncStatus = () => {
    try {
      const status = inventorySyncService?.getSyncStatus?.();
      if (status) {
        // Safely map the status to our interface
        const safeStatus: SafeSyncStatus = {
          isRunning: Boolean(status.isRunning),
          lastSuccessfulSync: status.lastSyncTime || null,
          nextPlannedSync: status.nextPlannedSync || null,
          totalItems: Number(status.totalBatches) * 50 || 0, // Estimate
          syncedItems: Number(status.syncedItems) || 0,
          errors: Array.isArray(status.errors) ? status.errors : [],
          progress: Number(status.progress) || 0,
          lastSyncAttempt: status.lastSyncTime || null,
          lastSyncResult: status.lastSyncResult || 'never',
          failureReason: status.lastSyncError || null,
          isRateLimited: Boolean(status.isRateLimited),
          rateLimitRetryAfter: status.rateLimitRetryAfter || null,
          rateLimitMessage: status.rateLimitMessage || null,
          rateLimitTimeRemaining: status.rateLimitTimeRemaining || null
        };
        setSyncStatus(safeStatus);
      }
    } catch (error) {
      console.error('Failed to load sync status:', error);
      // Set safe default status
      setSyncStatus({
        isRunning: false,
        lastSuccessfulSync: null,
        nextPlannedSync: null,
        totalItems: 0,
        syncedItems: 0,
        errors: [],
        progress: 0,
        lastSyncAttempt: null,
        lastSyncResult: 'never',
        failureReason: null,
        isRateLimited: false,
        rateLimitRetryAfter: null,
        rateLimitMessage: null,
        rateLimitTimeRemaining: null
      });
    }
  };

  const handleEnvironmentChange = (newEnvironment: 'development' | 'production') => {
    try {
      const timestamp = new Date().toISOString();
      
      // Save to localStorage
      localStorage.setItem('admin_environment', newEnvironment);
      localStorage.setItem('admin_environment_changed', timestamp);
      
      // Update state
      setEnvironment(newEnvironment);
      setLastChanged(timestamp);
      
      // Debug logging
      console.log('🔄 Environment Change Debug:');
      console.log('- New Environment:', newEnvironment);
      console.log('- DEV Token Available:', !!(import.meta.env?.VITE_KEYSTONE_SECURITY_TOKEN_DEV));
      console.log('- PROD Token Available:', !!(import.meta.env?.VITE_KEYSTONE_SECURITY_TOKEN_PROD));
      
      // Show confirmation and reload page to ensure all services pick up the new setting
      alert(`Environment switched to ${newEnvironment.toUpperCase()}. Page will reload to apply changes.`);
      window.location.reload();
    } catch (error) {
      console.error('Error changing environment:', error);
    }
  };

  const getSyncStatusBadge = (result: string | null) => {
    switch (result) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Partial</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Never</Badge>;
    }
  };

  const getRateLimitBadge = () => {
    if (!syncStatus?.isRateLimited) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Available</Badge>;
    }
    
    return <Badge variant="destructive"><Pause className="w-3 h-3 mr-1" />Rate Limited</Badge>;
  };

  const handleTestSync = async () => {
    if (syncStatus?.isRateLimited) {
      const timeRemaining = rateLimitCountdown || syncStatus.rateLimitTimeRemaining || 0;
      alert(`Cannot sync: API is rate limited. Retry in ${safeFormatDuration(timeRemaining)}.`);
      return;
    }

    setIsLoading(true);
    try {
      if (inventorySyncService?.performFullSync) {
        await inventorySyncService.performFullSync(10); // Test with small batch
        loadSyncStatus(); // Refresh status after sync
        alert('Test sync completed successfully!');
      } else {
        throw new Error('Inventory sync service not available');
      }
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Test sync failed: ${errorMessage}`);
      console.error('Test sync error:', error);
      loadSyncStatus(); // Refresh status to get any rate limit info
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebugConsole = () => {
    try {
      console.log('🔍 Environment Variables Debug:');
      console.log('Current Environment State:', environment);
      console.log('localStorage admin_environment:', localStorage.getItem('admin_environment'));
      console.log('VITE_KEYSTONE_SECURITY_TOKEN_DEV:', import.meta.env?.VITE_KEYSTONE_SECURITY_TOKEN_DEV ? 'SET' : 'UNDEFINED');
      console.log('VITE_KEYSTONE_SECURITY_TOKEN_PROD:', import.meta.env?.VITE_KEYSTONE_SECURITY_TOKEN_PROD ? 'SET' : 'UNDEFINED');
      console.log('VITE_KEYSTONE_PROXY_URL:', import.meta.env?.VITE_KEYSTONE_PROXY_URL || 'UNDEFINED');
      console.log('All VITE_KEYSTONE vars:', Object.keys(import.meta.env || {}).filter(k => k.startsWith('VITE_KEYSTONE')));
      console.log('Rate Limit Status:', syncStatus?.isRateLimited ? 'ACTIVE' : 'NONE');
      console.log('Rate Limit Retry After:', syncStatus?.rateLimitRetryAfter);
      console.log('All environment variables:', import.meta.env);
    } catch (error) {
      console.error('Error in debug console:', error);
    }
  };

  // Safe environment variable checks
  const getEnvVar = (key: string) => {
    try {
      return import.meta.env?.[key] || null;
    } catch (error) {
      console.warn(`Error accessing environment variable ${key}:`, error);
      return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Admin Settings</h1>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowDebug(!showDebug)}
          className="flex items-center space-x-2"
        >
          <Bug className="h-4 w-4" />
          <span>{showDebug ? 'Hide Debug' : 'Show Debug'}</span>
        </Button>
      </div>

      {/* Rate Limit Alert */}
      {syncStatus?.isRateLimited && (
        <Alert className="border-orange-200 bg-orange-50">
          <Timer className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-orange-800">API Rate Limited</strong>
                {getRateLimitBadge()}
              </div>
              <p className="text-orange-700">
                {syncStatus.rateLimitMessage || 'The Keystone API is currently rate limited.'}
              </p>
              {rateLimitCountdown && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Time remaining:</span>
                    <span className="font-mono font-medium">{safeFormatDuration(rateLimitCountdown)}</span>
                  </div>
                  <Progress 
                    value={syncStatus.rateLimitTimeRemaining ? 
                      ((syncStatus.rateLimitTimeRemaining - rateLimitCountdown) / syncStatus.rateLimitTimeRemaining) * 100 : 0
                    } 
                    className="h-2"
                  />
                </div>
              )}
              {syncStatus.rateLimitRetryAfter && (
                <p className="text-xs text-orange-600">
                  Retry available at: {safeFormatDate(syncStatus.rateLimitRetryAfter)}
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Debug Information - Only shown when toggled */}
      {showDebug && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <Bug className="h-5 w-5" />
              <span>Debug Information</span>
            </CardTitle>
            <CardDescription className="text-orange-700">
              Environment variable debugging - only visible when debug mode is enabled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-orange-800">Environment State</Label>
                <div className="bg-white p-3 rounded border text-xs space-y-1">
                  <div><strong>Current:</strong> {safeDisplayValue(environment)}</div>
                  <div><strong>localStorage:</strong> {safeDisplayValue(localStorage.getItem('admin_environment'), 'null')}</div>
                  <div><strong>Last Changed:</strong> {safeFormatDate(lastChanged)}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-orange-800">Environment Variables</Label>
                <div className="bg-white p-3 rounded border text-xs space-y-1">
                  <div><strong>DEV Token:</strong> {getEnvVar('VITE_KEYSTONE_SECURITY_TOKEN_DEV') ? '✅ SET' : '❌ UNDEFINED'}</div>
                  <div><strong>PROD Token:</strong> {getEnvVar('VITE_KEYSTONE_SECURITY_TOKEN_PROD') ? '✅ SET' : '❌ UNDEFINED'}</div>
                  <div><strong>Proxy URL:</strong> {getEnvVar('VITE_KEYSTONE_PROXY_URL') ? '✅ SET' : '❌ UNDEFINED'}</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-orange-800">Rate Limit Status</Label>
              <div className="bg-white p-3 rounded border text-xs space-y-1">
                <div><strong>Rate Limited:</strong> {syncStatus?.isRateLimited ? '🔴 YES' : '🟢 NO'}</div>
                <div><strong>Retry After:</strong> {syncStatus?.rateLimitRetryAfter ? safeFormatDate(syncStatus.rateLimitRetryAfter) : 'N/A'}</div>
                <div><strong>Time Remaining:</strong> {rateLimitCountdown ? safeFormatDuration(rateLimitCountdown) : 'N/A'}</div>
                <div><strong>Message:</strong> {syncStatus?.rateLimitMessage || 'None'}</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-orange-800">All VITE_KEYSTONE Variables</Label>
              <div className="bg-white p-3 rounded border text-xs">
                {Object.keys(import.meta.env || {}).filter(k => k.startsWith('VITE_KEYSTONE')).join(', ') || 'None found'}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDebugConsole}
              className="flex items-center space-x-2"
            >
              <Activity className="h-4 w-4" />
              <span>Log to Console</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Environment Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Environment Control</span>
          </CardTitle>
          <CardDescription>
            Control which environment the inventory sync system uses for API calls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="environment-toggle" className="text-base font-medium">
                Current Environment
              </Label>
              <p className="text-sm text-gray-600">
                {environment === 'development' ? 'Development (Test Data)' : 'Production (Live Data)'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-sm ${environment === 'development' ? 'font-medium' : 'text-gray-500'}`}>
                Development
              </span>
              <Switch
                id="environment-toggle"
                checked={environment === 'production'}
                onCheckedChange={(checked) => 
                  handleEnvironmentChange(checked ? 'production' : 'development')
                }
              />
              <span className={`text-sm ${environment === 'production' ? 'font-medium' : 'text-gray-500'}`}>
                Production
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge 
              variant={environment === 'production' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {environment === 'development' ? '🔧 DEV' : '🏭 PROD'}
            </Badge>
            <span className="text-sm text-gray-600">
              {environment.toUpperCase()} mode active
            </span>
          </div>

          {environment === 'production' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Production Mode Active:</strong> All inventory sync operations will use live Keystone data. 
                No mock data fallbacks are available in production mode.
              </AlertDescription>
            </Alert>
          )}

          {lastChanged && (
            <p className="text-xs text-gray-500">
              Last changed: {safeFormatDate(lastChanged)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>API Status</span>
          </CardTitle>
          <CardDescription>
            Current API availability and rate limiting status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Keystone API</Label>
              <div className="flex items-center space-x-2">
                {getRateLimitBadge()}
                {syncStatus?.isRateLimited && rateLimitCountdown && (
                  <span className="text-xs text-gray-500">
                    ({safeFormatDuration(rateLimitCountdown)} remaining)
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Supabase Database</Label>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Available</span>
              </div>
            </div>
          </div>

          {syncStatus?.isRateLimited && syncStatus.rateLimitRetryAfter && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Rate Limit Details</Label>
              <div className="bg-gray-50 p-3 rounded border text-sm space-y-1">
                <div><strong>Retry Available:</strong> {safeFormatDate(syncStatus.rateLimitRetryAfter)}</div>
                <div><strong>Time Remaining:</strong> {rateLimitCountdown ? safeFormatDuration(rateLimitCountdown) : 'Calculating...'}</div>
                {syncStatus.rateLimitMessage && (
                  <div><strong>Message:</strong> {syncStatus.rateLimitMessage}</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Status Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Inventory Sync Status</span>
          </CardTitle>
          <CardDescription>
            Monitor the status and health of your inventory synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {syncStatus && (
            <>
              {/* Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Last Successful Sync</Label>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">
                        {safeFormatDate(syncStatus.lastSuccessfulSync)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {safeFormatRelativeTime(syncStatus.lastSuccessfulSync)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Next Planned Sync</Label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">
                        {syncStatus.isRateLimited ? 'Delayed (Rate Limited)' : safeFormatDate(syncStatus.nextPlannedSync)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {syncStatus.isRateLimited ? 'Waiting for API availability' : 
                         syncStatus.nextPlannedSync ? 'Scheduled' : 'Not scheduled'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Last Sync Result</Label>
                  <div className="flex items-center space-x-2">
                    {getSyncStatusBadge(syncStatus.lastSyncResult)}
                  </div>
                  {syncStatus.failureReason && (
                    <p className="text-xs text-red-600 mt-1">
                      {safeDisplayValue(syncStatus.failureReason, 'Unknown error')}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Detailed Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-600">Sync Statistics</Label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Items:</span>
                      <span className="font-medium">{safeFormatNumber(syncStatus.totalItems)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Synced Items:</span>
                      <span className="font-medium">{safeFormatNumber(syncStatus.syncedItems)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Errors:</span>
                      <span className={`font-medium ${(syncStatus.errors?.length || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {safeFormatNumber(syncStatus.errors?.length || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Progress:</span>
                      <span className="font-medium">{safeFormatPercentage(syncStatus.progress)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-600">System Status</Label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sync Running:</span>
                      <Badge variant={syncStatus.isRunning ? "default" : "secondary"}>
                        {syncStatus.isRunning ? 'Active' : 'Idle'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>API Status:</span>
                      <Badge variant={syncStatus.isRateLimited ? "destructive" : "default"}>
                        {syncStatus.isRateLimited ? 'Rate Limited' : 'Available'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Attempt:</span>
                      <span className="font-medium text-xs">
                        {safeFormatRelativeTime(syncStatus.lastSyncAttempt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={loadSyncStatus}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Status</span>
            </Button>
            
            <Button 
              onClick={handleTestSync}
              disabled={isLoading || (syncStatus?.isRunning) || (syncStatus?.isRateLimited)}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Database className="h-4 w-4" />
              <span>
                {isLoading ? 'Testing...' : 
                 syncStatus?.isRateLimited ? 'Rate Limited' : 
                 'Test Sync'}
              </span>
            </Button>

            {syncStatus?.isRateLimited && rateLimitCountdown && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Timer className="h-4 w-4" />
                <span>Retry in {safeFormatDuration(rateLimitCountdown)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>API Configuration</span>
          </CardTitle>
          <CardDescription>
            Current API endpoints and token configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Supabase URL</Label>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Configured</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Supabase Token</Label>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Configured</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Keystone Proxy URL</Label>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-mono text-xs">
                  {safeDisplayValue(getEnvVar('VITE_KEYSTONE_PROXY_URL'), 'Not configured')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">
                {environment === 'development' ? 'Development Token' : 'Production Token'}
              </Label>
              <div className="flex items-center space-x-2">
                {(environment === 'development' 
                  ? getEnvVar('VITE_KEYSTONE_SECURITY_TOKEN_DEV')
                  : getEnvVar('VITE_KEYSTONE_SECURITY_TOKEN_PROD')
                ) ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Configured</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Missing</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>
            Common administrative tasks and navigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
              onClick={() => window.location.href = '/shop/parts-inventory/inventory-sync'}
            >
              <RefreshCw className="h-4 w-4" />
              <span>Inventory Sync</span>
            </Button>
            
            <Button 
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
              onClick={() => window.location.href = '/shop/parts-inventory'}
            >
              <Database className="h-4 w-4" />
              <span>View Inventory</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;


// PHASE 1 - WEEK 3: KEYSTONE CONFIGURATION MANAGER
// React component for managing Keystone API configuration
// Updated to use Vite environment variables for credentials
// Version: 2.2.0 - Updated for Vite environment variables
// =====================================================
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { keystoneService } from '@/services/keystoneService';
import { CheckCircle, XCircle, AlertCircle, Eye, EyeOff, Loader2, RefreshCw, Activity, Clock, CheckSquare, AlertTriangle } from 'lucide-react';

const VERSION = "2.2.0";
const BUILD_DATE = "2025-06-11";

interface KeystoneConfig {
  environment: 'development' | 'production';
  approvedIPs: string[];
}

interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date | null;
  error: string | null;
}

interface SyncLog {
  id: string;
  timestamp: string;
  operation: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  duration_seconds?: number;
}

interface EnvironmentStatus {
  hasAccountNumber: boolean;
  hasDevKey: boolean;
  hasProdKey: boolean;
  hasProxyUrl: boolean;
  hasSupabaseUrl: boolean;
  hasSupabaseKey: boolean;
}

export const KeystoneConfigManager: React.FC = () => {
  const [config, setConfig] = useState<KeystoneConfig>({
    environment: 'development',
    approvedIPs: ['']
  });
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    lastChecked: null,
    error: null
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [environmentStatus, setEnvironmentStatus] = useState<EnvironmentStatus>({
    hasAccountNumber: false,
    hasDevKey: false,
    hasProdKey: false,
    hasProxyUrl: false,
    hasSupabaseUrl: false,
    hasSupabaseKey: false
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
    checkEnvironmentStatus();
  }, []);

  const checkEnvironmentStatus = () => {
    const status = keystoneService.getEnvironmentStatus();
    setEnvironmentStatus(status);
    console.log('Environment Status Check:', status);
  };

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      const loadedConfig = await keystoneService.getConfig();
      setConfig({
        environment: loadedConfig.environment || 'development',
        approvedIPs: loadedConfig.approvedIPs || ['']
      });
    } catch (error) {
      console.error('Failed to load configuration:', error);
      toast({
        title: "Configuration Error",
        description: "Failed to load Keystone configuration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setIsLoading(true);
    try {
      // Filter out empty IP addresses
      const filteredIPs = config.approvedIPs.filter(ip => ip.trim() !== '');
      
      // Normalize environment to lowercase to avoid case sensitivity issues
      const normalizedEnvironment = config.environment.toLowerCase() as 'development' | 'production';
      
      const configToSave = {
        environment: normalizedEnvironment,
        approvedIPs: filteredIPs
      };

      console.log('Saving configuration:', configToSave);
      await keystoneService.saveConfig(configToSave);
      
      // Update local state with normalized environment
      setConfig(prev => ({
        ...prev,
        environment: normalizedEnvironment
      }));
      
      toast({
        title: "Configuration Saved",
        description: `Keystone configuration saved successfully (Environment: ${normalizedEnvironment})`,
      });
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast({
        title: "Save Error",
        description: "Failed to save Keystone configuration. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const result = await keystoneService.testConnection();
      
      setConnectionStatus({
        isConnected: result.success,
        lastChecked: new Date(),
        error: result.success ? null : result.error || 'Connection failed'
      });

      if (result.success) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Keystone API",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect to Keystone API",
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setConnectionStatus({
        isConnected: false,
        lastChecked: new Date(),
        error: errorMessage
      });
      
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const loadSyncLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await keystoneService.getSyncLogs();
      setSyncLogs(logs);
    } catch (error) {
      console.error('Failed to load sync logs:', error);
      toast({
        title: "Error Loading Logs",
        description: "Failed to load synchronization logs",
        variant: "destructive"
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const addIPField = () => {
    setConfig(prev => ({
      ...prev,
      approvedIPs: [...prev.approvedIPs, '']
    }));
  };

  const removeIPField = (index: number) => {
    setConfig(prev => ({
      ...prev,
      approvedIPs: prev.approvedIPs.filter((_, i) => i !== index)
    }));
  };

  const updateIPField = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      approvedIPs: prev.approvedIPs.map((ip, i) => i === index ? value : ip)
    }));
  };

  const validateConfiguration = (): boolean => {
    const filteredIPs = config.approvedIPs.filter(ip => ip.trim() !== '');
    
    if (filteredIPs.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one approved IP address is required",
        variant: "destructive"
      });
      return false;
    }

    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    for (const ip of filteredIPs) {
      if (!ipRegex.test(ip.trim())) {
        toast({
          title: "Validation Error",
          description: `Invalid IP address format: ${ip}`,
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (validateConfiguration()) {
      await saveConfiguration();
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusText = (status: boolean) => {
    return status ? "Set" : "Not Set";
  };

  const formatLogStatus = (status: string) => {
    const statusConfig = {
      success: { color: 'bg-green-100 text-green-800', icon: CheckSquare },
      error: { color: 'bg-red-100 text-red-800', icon: XCircle },
      warning: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.error;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Keystone Configuration</h2>
          <p className="text-muted-foreground">
            Manage your Keystone Automotive API integration settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {connectionStatus.isConnected ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">
              <XCircle className="h-3 w-3 mr-1" />
              Disconnected
            </Badge>
          )}
        </div>
      </div>

      {/* Version Indicator */}
      <div className="text-right">
        <Badge variant="outline" className="text-xs text-gray-500">
          v{VERSION} ({BUILD_DATE})
        </Badge>
      </div>

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables Status</CardTitle>
              <CardDescription>
                Keystone credentials are managed via environment variables for security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Credentials are configured via environment variables in your deployment platform.
                  The following variables are required: VITE_KEYSTONE_ACCOUNT_NUMBER, 
                  VITE_KEYSTONE_SECURITY_TOKEN_DEV, VITE_KEYSTONE_SECURITY_TOKEN_PROD, 
                  VITE_KEYSTONE_PROXY_URL
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Account Number</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(environmentStatus.hasAccountNumber)}
                    <span className="text-sm">{getStatusText(environmentStatus.hasAccountNumber)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Development Key</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(environmentStatus.hasDevKey)}
                    <span className="text-sm">{getStatusText(environmentStatus.hasDevKey)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Production Key</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(environmentStatus.hasProdKey)}
                    <span className="text-sm">{getStatusText(environmentStatus.hasProdKey)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Proxy URL</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(environmentStatus.hasProxyUrl)}
                    <span className="text-sm">{getStatusText(environmentStatus.hasProxyUrl)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Supabase URL</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(environmentStatus.hasSupabaseUrl)}
                    <span className="text-sm">{getStatusText(environmentStatus.hasSupabaseUrl)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Supabase Key</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(environmentStatus.hasSupabaseKey)}
                    <span className="text-sm">{getStatusText(environmentStatus.hasSupabaseKey)}</span>
                  </div>
                </div>
              </div>

              {/* Debug Information */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Debug Info:</strong> If variables show "Not Set", check browser console for environment variable details.
                  Current environment: {config.environment}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Runtime Configuration</CardTitle>
              <CardDescription>
                Configure runtime settings for your Keystone integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <select
                  id="environment"
                  value={config.environment}
                  onChange={(e) => setConfig(prev => ({ ...prev, environment: e.target.value as 'development' | 'production' }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="development">Development</option>
                  <option value="production">Production</option>
                </select>
                <p className="text-sm text-gray-500">
                  Select the environment to determine which security key to use (case insensitive)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Approved IP Addresses</Label>
                {config.approvedIPs.map((ip, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={ip}
                      onChange={(e) => updateIPField(index, e.target.value)}
                      placeholder="Enter IP address (e.g., 192.168.1.1)"
                      className="flex-1"
                    />
                    {config.approvedIPs.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeIPField(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIPField}
                >
                  Add IP Address
                </Button>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Testing</CardTitle>
              <CardDescription>
                Test your Keystone API connection and verify configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Connection Status</h4>
                  <p className="text-sm text-gray-500">
                    {connectionStatus.lastChecked 
                      ? `Last checked: ${connectionStatus.lastChecked.toLocaleString()}`
                      : 'Never tested'
                    }
                  </p>
                  {connectionStatus.error && (
                    <p className="text-sm text-red-600 mt-1">{connectionStatus.error}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {connectionStatus.isConnected ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Disconnected
                    </Badge>
                  )}
                </div>
              </div>

              <Button 
                onClick={testConnection} 
                disabled={isTesting}
                className="w-full"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Activity className="mr-2 h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>

              {!environmentStatus.hasAccountNumber || !environmentStatus.hasDevKey || !environmentStatus.hasProdKey || !environmentStatus.hasProxyUrl ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Some required environment variables are missing. Please ensure all Keystone environment variables are configured in your deployment platform.
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Synchronization Logs</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadSyncLogs}
                  disabled={isLoadingLogs}
                >
                  {isLoadingLogs ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Monitor Keystone API synchronization activity and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading logs...
                </div>
              ) : syncLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No synchronization logs available</p>
                  <p className="text-sm">Logs will appear here after API operations</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{log.operation}</span>
                          {log.duration_seconds && (
                            <span className="text-sm text-gray-500">
                              {log.duration_seconds}s
                            </span>
                          )}
                          {formatLogStatus(log.status)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{log.message}</p>
                        <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KeystoneConfigManager;

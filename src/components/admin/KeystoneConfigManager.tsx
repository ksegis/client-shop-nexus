// =====================================================
// PHASE 1 - WEEK 3: KEYSTONE CONFIGURATION MANAGER
// React component for managing Keystone API configuration
// Updated to use environment variables for credentials
// =====================================================
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, AlertTriangle, Settings, TestTube, Activity, Shield, Info } from 'lucide-react';
import KeystoneService from "@/services/keystone/KeystoneServiceClass.ts";
import { Badge } from '@/components/ui/badge';

const keystoneService = new KeystoneService();

interface KeystoneConfigData {
  environment: 'development' | 'production';
  approvedIPs: string[];
}

interface ConnectionStatus {
  isConnected: boolean;
  currentIP?: string;
  approvedIPs?: string[];
  approvedMethods?: string[];
  lastTested?: Date;
  error?: string;
}

interface ValidationErrors {
  approvedIPs?: string;
}

interface EnvironmentInfo {
  hasAccountNumber: boolean;
  hasDevKey: boolean;
  hasProdKey: boolean;
  hasProxyUrl: boolean;
  accountNumberPreview?: string;
  proxyUrl?: string;
}

// Security validation functions
const validateIPAddress = (ip: string): boolean => {
  const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipPattern.test(ip.trim());
};

const sanitizeErrorMessage = (error: string): string => {
  // Remove any potential security key information from error messages
  return error.replace(/[0-9a-fA-F]{20,}/g, '[REDACTED]');
};

export const KeystoneConfigManager: React.FC = () => {
  const [config, setConfig] = useState<KeystoneConfigData>({
    environment: 'development',
    approvedIPs: []
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [approvedIPsInput, setApprovedIPsInput] = useState('');
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo>({
    hasAccountNumber: false,
    hasDevKey: false,
    hasProdKey: false,
    hasProxyUrl: false
  });
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
    loadSyncLogs();
    checkEnvironmentVariables();
  }, []);

  useEffect(() => {
    // Update the input field when config.approvedIPs changes
    setApprovedIPsInput(config.approvedIPs.join(', '));
  }, [config.approvedIPs]);

  // Check environment variables status
  const checkEnvironmentVariables = () => {
    const info: EnvironmentInfo = {
      hasAccountNumber: !!process.env.KEYSTONE_ACCOUNT_NUMBER,
      hasDevKey: !!process.env.KEYSTONE_SECURITY_TOKEN_DEV,
      hasProdKey: !!process.env.KEYSTONE_SECURITY_TOKEN_PROD,
      hasProxyUrl: !!process.env.KEYSTONE_PROXY_URL,
      accountNumberPreview: process.env.KEYSTONE_ACCOUNT_NUMBER ? 
        `${process.env.KEYSTONE_ACCOUNT_NUMBER.substring(0, 3)}***` : undefined,
      proxyUrl: process.env.KEYSTONE_PROXY_URL
    };
    setEnvInfo(info);
  };

  // Validation function
  const validateConfiguration = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (config.approvedIPs.length > 0) {
      const invalidIPs = config.approvedIPs.filter(ip => ip.trim() && !validateIPAddress(ip));
      if (invalidIPs.length > 0) {
        errors.approvedIPs = `Invalid IP addresses: ${invalidIPs.join(', ')}`;
      }
    }

    return errors;
  };

  const loadConfiguration = async () => {
    try {
      await keystoneService.loadConfig();
      const currentConfig = keystoneService.getConfig();
      
      if (currentConfig) {
        setConfig({
          environment: currentConfig.environment,
          approvedIPs: currentConfig.approvedIPs
        });
      }
    } catch (error) {
      const sanitizedError = sanitizeErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      console.error('Failed to load configuration:', sanitizedError);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const logs = await keystoneService.getSyncLogs(20);
      setSyncLogs(logs);
    } catch (error) {
      const sanitizedError = sanitizeErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      console.error('Failed to load sync logs:', sanitizedError);
    }
  };

  const handleSaveConfiguration = async () => {
    // Validate configuration before saving
    const errors = validateConfiguration();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast({
        title: "Validation Failed",
        description: "Please fix the validation errors before saving.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await keystoneService.saveConfig(config);
      toast({
        title: "Configuration Saved",
        description: "Keystone configuration has been saved successfully.",
      });
      setValidationErrors({}); // Clear any previous errors
    } catch (error) {
      const sanitizedError = sanitizeErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: "Save Failed",
        description: sanitizedError,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await keystoneService.testConnection();
      
      if (result.success) {
        // Get additional connection info
        const [ipResult, approvedIPsResult, methodsResult] = await Promise.allSettled([
          keystoneService.utilityReportMyIP(),
          keystoneService.utilityReportApprovedIPs(),
          keystoneService.utilityReportApprovedMethods()
        ]);

        setConnectionStatus({
          isConnected: true,
          currentIP: ipResult.status === 'fulfilled' ? ipResult.value : undefined,
          approvedIPs: approvedIPsResult.status === 'fulfilled' ? 
            approvedIPsResult.value.data?.split(',') || [] : [],
          approvedMethods: methodsResult.status === 'fulfilled' ? methodsResult.value : [],
          lastTested: new Date()
        });

        toast({
          title: "Connection Successful",
          description: "Successfully connected to Keystone API.",
        });
      } else {
        const sanitizedError = sanitizeErrorMessage(result.error || result.statusMessage || 'Unknown error');
        setConnectionStatus({
          isConnected: false,
          error: sanitizedError,
          lastTested: new Date()
        });

        toast({
          title: "Connection Failed",
          description: sanitizedError,
          variant: "destructive",
        });
      }

      // Refresh sync logs
      await loadSyncLogs();
    } catch (error) {
      const sanitizedError = sanitizeErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setConnectionStatus({
        isConnected: false,
        error: sanitizedError,
        lastTested: new Date()
      });

      toast({
        title: "Test Failed",
        description: sanitizedError,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleApprovedIPsChange = (value: string) => {
    setApprovedIPsInput(value);
    
    // Parse the input and update the config
    const ips = value.split(',').map(ip => ip.trim()).filter(ip => ip);
    setConfig(prev => ({ ...prev, approvedIPs: ips }));
    
    // Clear validation errors when user is typing
    if (validationErrors.approvedIPs) {
      setValidationErrors(prev => ({ ...prev, approvedIPs: undefined }));
    }
  };

  const getStatusIcon = () => {
    if (connectionStatus.isConnected) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (connectionStatus.error) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    if (connectionStatus.isConnected) {
      return 'Connected';
    } else if (connectionStatus.error) {
      return 'Connection Failed';
    } else {
      return 'Not Tested';
    }
  };

  const formatLogStatus = (status: string) => {
    const statusColors = {
      running: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.cancelled}>
        {status}
      </Badge>
    );
  };

  const getEnvironmentStatus = () => {
    const allPresent = envInfo.hasAccountNumber && envInfo.hasDevKey && envInfo.hasProdKey && envInfo.hasProxyUrl;
    if (allPresent) {
      return <Badge className="bg-green-100 text-green-800">All Environment Variables Set</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Missing Environment Variables</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Keystone API Configuration</h2>
          <p className="text-gray-600">Manage your Keystone API connection and settings</p>
        </div>
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-blue-600 font-medium">Secure Configuration</span>
          {getStatusIcon()}
          <span className="font-medium">{getStatusText()}</span>
        </div>
      </div>

      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList>
          <TabsTrigger value="configuration" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configuration</span>
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center space-x-2">
            <TestTube className="w-4 h-4" />
            <span>Connection Test</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Monitoring</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>API Configuration</span>
                {getEnvironmentStatus()}
              </CardTitle>
              <CardDescription>
                Configure your Keystone API settings. Credentials are managed via environment variables for enhanced security.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Notice:</strong> This connection uses HTTPS encryption. API credentials are managed via environment variables and not stored in browser storage.
                </AlertDescription>
              </Alert>

              {/* Environment Variables Status */}
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Info className="w-5 h-5" />
                    <span>Environment Variables Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Account Number:</span>
                      <div className="flex items-center space-x-2">
                        {envInfo.hasAccountNumber ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-600">{envInfo.accountNumberPreview}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-600">Not Set</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Development Key:</span>
                      {envInfo.hasDevKey ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">Set</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600">Not Set</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Production Key:</span>
                      {envInfo.hasProdKey ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">Set</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600">Not Set</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Proxy URL:</span>
                      {envInfo.hasProxyUrl ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">{envInfo.proxyUrl}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600">Not Set</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Required Environment Variables:</strong>
                      <ul className="mt-2 space-y-1">
                        <li><code className="font-mono text-sm">KEYSTONE_ACCOUNT_NUMBER</code>: Your unique Keystone account identifier.</li>
                        <li><code className="font-mono text-sm">KEYSTONE_SECURITY_TOKEN_DEV</code>: Security token for development environment.</li>
                        <li><code className="font-mono text-sm">KEYSTONE_SECURITY_TOKEN_PROD</code>: Security token for production environment.</li>
                        <li><code className="font-mono text-sm">KEYSTONE_PROXY_URL</code>: The URL of your Keystone API proxy.</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Environment Selection */}
              <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <Select
                  value={config.environment}
                  onValueChange={(value: 'development' | 'production') => setConfig(prev => ({ ...prev, environment: value }))}
                >
                  <SelectTrigger id="environment">
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Approved IPs */}
              <div className="space-y-2">
                <Label htmlFor="approved-ips">Approved IP Addresses</Label>
                <Input
                  id="approved-ips"
                  placeholder="e.g., 192.168.1.1, 10.0.0.5"
                  value={approvedIPsInput}
                  onChange={(e) => handleApprovedIPsChange(e.target.value)}
                  className={validationErrors.approvedIPs ? 'border-red-500' : ''}
                />
                {validationErrors.approvedIPs && (
                  <p className="text-red-500 text-sm">{validationErrors.approvedIPs}</p>
                )}
                <p className="text-sm text-gray-500">Comma-separated list of IP addresses approved to access the API.</p>
              </div>

              <Button onClick={handleSaveConfiguration} disabled={loading}>
                {loading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TestTube className="w-5 h-5" />
                <span>Connection Test</span>
              </CardTitle>
              <CardDescription>
                Test your connection to the Keystone API and view current status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button onClick={handleTestConnection} disabled={testing}>
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>

              {connectionStatus.lastTested && (
                <Alert className={connectionStatus.isConnected ? 'border-green-500' : 'border-red-500'}>
                  {getStatusIcon()}
                  <AlertDescription>
                    <p className="font-medium">Status: {getStatusText()}</p>
                    {connectionStatus.currentIP && <p>Your Current IP: {connectionStatus.currentIP}</p>}
                    {connectionStatus.approvedIPs && connectionStatus.approvedIPs.length > 0 && (
                      <p>Approved IPs: {connectionStatus.approvedIPs.join(', ')}</p>
                    )}
                    {connectionStatus.approvedMethods && connectionStatus.approvedMethods.length > 0 && (
                      <p>Approved Methods: {connectionStatus.approvedMethods.join(', ')}</p>
                    )}
                    {connectionStatus.error && <p className="text-red-600">Error: {connectionStatus.error}</p>}
                    <p className="text-sm text-gray-500">Last Tested: {connectionStatus.lastTested.toLocaleString()}</p>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Recent Sync Logs</span>
              </CardTitle>
              <CardDescription>
                View recent synchronization activities with the Keystone API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncLogs.length === 0 ? (
                <p className="text-gray-500">No sync logs available.</p>
              ) : (
                <div className="space-y-4">
                  {syncLogs.map((log, index) => (
                    <div key={index} className="border p-4 rounded-md shadow-sm">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                        {formatLogStatus(log.status)}
                      </div>
                      <p className="font-medium mt-2">{log.message}</p>
                      {log.details && <p className="text-sm text-gray-500">Details: {log.details}</p>}
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


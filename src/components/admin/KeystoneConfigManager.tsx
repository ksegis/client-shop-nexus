// =====================================================
// PHASE 1 - WEEK 3: KEYSTONE CONFIGURATION MANAGER
// React component for managing Keystone API configuration
// =====================================================
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertTriangle, Settings, TestTube, Activity, Shield, Eye, EyeOff } from 'lucide-react';
import { keystoneService } from '@/services/keystone/KeystoneService';
import { useToast } from '@/hooks/use-toast';

interface KeystoneConfigData {
  accountNumber: string;
  securityKeyDev: string;
  securityKeyProd: string;
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
  accountNumber?: string;
  securityKeyDev?: string;
  securityKeyProd?: string;
  approvedIPs?: string;
}

// Security validation functions
const validateSecurityKey = (key: string): boolean => {
  // Accept any non-empty string as Keystone key formats may vary
  // Remove whitespace and check for minimum length
  const cleanKey = key.trim();
  return cleanKey.length >= 10; // Minimum reasonable length for a security key
};

const validateIPAddress = (ip: string): boolean => {
  const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipPattern.test(ip.trim());
};

const validateAccountNumber = (accountNumber: string): boolean => {
  // Account numbers can be alphanumeric and at least 3 characters
  const cleanAccount = accountNumber.trim();
  return cleanAccount.length >= 3 && /^[a-zA-Z0-9]+$/.test(cleanAccount);
};

const sanitizeErrorMessage = (error: string): string => {
  // Remove any potential security key information from error messages
  return error.replace(/[0-9a-fA-F]{20,}/g, '[REDACTED]');
};

export const KeystoneConfigManager: React.FC = () => {
  const [config, setConfig] = useState<KeystoneConfigData>({
    accountNumber: '',
    securityKeyDev: '',
    securityKeyProd: '',
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
  const [showDevKey, setShowDevKey] = useState(false);
  const [showProdKey, setShowProdKey] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [approvedIPsInput, setApprovedIPsInput] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
    loadSyncLogs();
  }, []);

  useEffect(() => {
    // Update the input field when config.approvedIPs changes
    setApprovedIPsInput(config.approvedIPs.join(', '));
  }, [config.approvedIPs]);

  // Validation function
  const validateConfiguration = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!config.accountNumber) {
      errors.accountNumber = 'Account number is required';
    } else if (!validateAccountNumber(config.accountNumber)) {
      errors.accountNumber = 'Account number must be alphanumeric and at least 3 characters';
    }

    if (config.securityKeyDev && !validateSecurityKey(config.securityKeyDev)) {
      errors.securityKeyDev = 'Development security key must be at least 10 characters';
    }

    if (config.securityKeyProd && !validateSecurityKey(config.securityKeyProd)) {
      errors.securityKeyProd = 'Production security key must be at least 10 characters';
    }

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
          accountNumber: currentConfig.accountNumber,
          securityKeyDev: currentConfig.securityKey, // Will be updated when we have separate keys
          securityKeyProd: currentConfig.securityKey,
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
              </CardTitle>
              <CardDescription>
                Configure your Keystone API credentials and settings. All sensitive data is encrypted and protected.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Notice:</strong> This connection uses HTTPS encryption. Your API keys are masked and not stored in browser storage.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <div className="relative">
                    <Input
                      id="accountNumber"
                      type={showAccountNumber ? "text" : "password"}
                      placeholder="Enter your Keystone account number"
                      value={config.accountNumber}
                      onChange={(e) => {
                        setConfig(prev => ({ ...prev, accountNumber: e.target.value }));
                        if (validationErrors.accountNumber) {
                          setValidationErrors(prev => ({ ...prev, accountNumber: undefined }));
                        }
                      }}
                      className={validationErrors.accountNumber ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowAccountNumber(!showAccountNumber)}
                    >
                      {showAccountNumber ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {validationErrors.accountNumber && (
                    <p className="text-sm text-red-500">{validationErrors.accountNumber}</p>
                  )}
                  <p className="text-xs text-gray-500">Alphanumeric account identifier from Keystone</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Select value={config.environment} onValueChange={(value: 'development' | 'production') => 
                    setConfig(prev => ({ ...prev, environment: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={config.environment === 'development' ? 'securityKeyDev' : 'securityKeyProd'}>
                  {config.environment === 'development' ? 'Development' : 'Production'} Security Key
                </Label>
                <div className="relative">
                  <Input
                    id={config.environment === 'development' ? 'securityKeyDev' : 'securityKeyProd'}
                    type={config.environment === 'development' ? (showDevKey ? "text" : "password") : (showProdKey ? "text" : "password")}
                    placeholder={`Security key for ${config.environment} environment`}
                    value={config.environment === 'development' ? config.securityKeyDev : config.securityKeyProd}
                    onChange={(e) => {
                      if (config.environment === 'development') {
                        setConfig(prev => ({ ...prev, securityKeyDev: e.target.value }));
                        if (validationErrors.securityKeyDev) {
                          setValidationErrors(prev => ({ ...prev, securityKeyDev: undefined }));
                        }
                      } else {
                        setConfig(prev => ({ ...prev, securityKeyProd: e.target.value }));
                        if (validationErrors.securityKeyProd) {
                          setValidationErrors(prev => ({ ...prev, securityKeyProd: undefined }));
                        }
                      }
                    }}
                    className={
                      (config.environment === 'development' ? validationErrors.securityKeyDev : validationErrors.securityKeyProd) 
                        ? 'border-red-500 pr-10' : 'pr-10'
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => {
                      if (config.environment === 'development') {
                        setShowDevKey(!showDevKey);
                      } else {
                        setShowProdKey(!showProdKey);
                      }
                    }}
                  >
                    {(config.environment === 'development' ? showDevKey : showProdKey) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {config.environment === 'development' && validationErrors.securityKeyDev && (
                  <p className="text-sm text-red-500">{validationErrors.securityKeyDev}</p>
                )}
                {config.environment === 'production' && validationErrors.securityKeyProd && (
                  <p className="text-sm text-red-500">{validationErrors.securityKeyProd}</p>
                )}
                <p className="text-xs text-gray-500">Security key provided by Keystone (minimum 10 characters)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approvedIPs">Approved IP Addresses</Label>
                <Input
                  id="approvedIPs"
                  placeholder="Comma-separated list of approved IPs (e.g., 192.168.1.1, 10.0.0.1)"
                  value={approvedIPsInput}
                  onChange={(e) => handleApprovedIPsChange(e.target.value)}
                  className={validationErrors.approvedIPs ? 'border-red-500' : ''}
                />
                {validationErrors.approvedIPs && (
                  <p className="text-sm text-red-500">{validationErrors.approvedIPs}</p>
                )}
                <p className="text-xs text-gray-500">
                  Enter the IP addresses that Keystone has approved for your account
                </p>
              </div>

              <Button 
                onClick={handleSaveConfiguration} 
                disabled={loading}
                className="w-full md:w-auto"
              >
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
                <span>Connection Testing</span>
              </CardTitle>
              <CardDescription>
                Test your Keystone API connection and view connection details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon()}
                  <div>
                    <p className="font-medium">{getStatusText()}</p>
                    {connectionStatus.lastTested && (
                      <p className="text-sm text-gray-500">
                        Last tested: {connectionStatus.lastTested.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={handleTestConnection} 
                  disabled={testing}
                  variant="outline"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>

              {connectionStatus.error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Connection Error:</strong> {connectionStatus.error}
                  </AlertDescription>
                </Alert>
              )}

              {connectionStatus.isConnected && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {connectionStatus.currentIP && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Current IP Address</h4>
                      <p className="text-sm text-gray-600">{connectionStatus.currentIP}</p>
                    </div>
                  )}

                  {connectionStatus.approvedIPs && connectionStatus.approvedIPs.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Approved IP Addresses</h4>
                      <div className="space-y-1">
                        {connectionStatus.approvedIPs.map((ip, index) => (
                          <p key={index} className="text-sm text-gray-600">{ip}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {connectionStatus.approvedMethods && connectionStatus.approvedMethods.length > 0 && (
                    <div className="p-4 border rounded-lg md:col-span-2">
                      <h4 className="font-medium mb-2">Approved Methods</h4>
                      <div className="flex flex-wrap gap-2">
                        {connectionStatus.approvedMethods.map((method, index) => (
                          <Badge key={index} variant="secondary">{method}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Sync Monitoring</span>
              </CardTitle>
              <CardDescription>
                Monitor recent synchronization activities and logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {syncLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No sync logs available</p>
                ) : (
                  <div className="space-y-3">
                    {syncLogs.map((log, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">{log.operation || 'Sync Operation'}</p>
                            <p className="text-sm text-gray-500">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown time'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {formatLogStatus(log.status || 'unknown')}
                          {log.recordCount && (
                            <span className="text-sm text-gray-500">
                              {log.recordCount} records
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};


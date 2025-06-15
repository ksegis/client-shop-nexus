// Updated KeystoneConfigManager to handle new proxy server JSON response format
// Version 2.3.3 - Fixed response parsing for new proxy server JSON format
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle, Loader2, Wifi, WifiOff, Server, Globe } from 'lucide-react';
import KeystoneService from '@/services/keystone/KeystoneService';

interface ValidationErrors {
  accountNumber?: string;
  securityKeyDev?: string;
  securityKeyProd?: string;
  approvedIPs?: string;
}

interface ConnectionStatus {
  isConnected: boolean;
  currentIP?: any;
  approvedIPs: string[];
  approvedMethods: any[];
  lastTested: Date;
}

const KeystoneConfigManager: React.FC = () => {
  const [config, setConfig] = useState({
    accountNumber: '',
    securityKeyDev: '',
    securityKeyProd: '',
    environment: 'development',
    approvedIPs: [] as string[]
  });

  const [approvedIPsInput, setApprovedIPsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const { toast } = useToast();

  const keystoneService = new KeystoneService();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const loadedConfig = keystoneService.getConfig();
      setConfig({
        accountNumber: loadedConfig.accountNumber || '',
        securityKeyDev: loadedConfig.securityKeyDev || '',
        securityKeyProd: loadedConfig.securityKeyProd || '',
        environment: loadedConfig.environment || 'development',
        approvedIPs: loadedConfig.approvedIPs || []
      });
      
      // Set the input field with comma-separated IPs
      setApprovedIPsInput((loadedConfig.approvedIPs || []).join(', '));
    } catch (error) {
      console.error('Failed to load configuration:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load configuration from database.",
        variant: "destructive",
      });
    }
  };

  const validateConfiguration = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!config.accountNumber?.trim()) {
      errors.accountNumber = 'Account number is required';
    }

    if (!config.securityKeyDev?.trim()) {
      errors.securityKeyDev = 'Development security key is required';
    }

    if (!config.securityKeyProd?.trim()) {
      errors.securityKeyProd = 'Production security key is required';
    }

    // Validate IP addresses
    if (config.approvedIPs.length > 0) {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      const invalidIPs = config.approvedIPs.filter(ip => !ipRegex.test(ip.trim()));
      if (invalidIPs.length > 0) {
        errors.approvedIPs = `Invalid IP addresses: ${invalidIPs.join(', ')}`;
      }
    }

    return errors;
  };

  const sanitizeErrorMessage = (message: string): string => {
    // Remove sensitive information from error messages
    return message
      .replace(/security[_\s]*key[_\s]*[a-zA-Z0-9\-]+/gi, '[SECURITY_KEY]')
      .replace(/token[_\s]*[a-zA-Z0-9\-]+/gi, '[TOKEN]')
      .replace(/password[_\s]*[a-zA-Z0-9\-]+/gi, '[PASSWORD]');
  };

  const handleSave = async () => {
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

        // Helper function to extract IP addresses from different response formats
        const extractIPAddresses = (result: any): string[] => {
          if (!result || result.status !== 'fulfilled') return [];
          
          const response = result.value;
          if (!response || !response.success) return [];
          
          // Handle new JSON format from proxy server
          if (response.data && typeof response.data === 'object') {
            // If data has ipAddress field
            if (response.data.ipAddress) {
              return [response.data.ipAddress];
            }
            // If data is an array of IPs
            if (Array.isArray(response.data)) {
              return response.data;
            }
          }
          
          // Handle legacy string format (comma-separated)
          if (response.data && typeof response.data === 'string') {
            return response.data.split(',').map((ip: string) => ip.trim()).filter((ip: string) => ip);
          }
          
          // Handle result field
          if (response.result) {
            if (typeof response.result === 'string') {
              return [response.result];
            }
            if (Array.isArray(response.result)) {
              return response.result;
            }
          }
          
          return [];
        };

        setConnectionStatus({
          isConnected: true,
          currentIP: ipResult.status === 'fulfilled' ? ipResult.value : undefined,
          approvedIPs: extractIPAddresses(approvedIPsResult),
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
          approvedIPs: [],
          approvedMethods: [],
          lastTested: new Date()
        });

        toast({
          title: "Connection Failed",
          description: sanitizedError,
          variant: "destructive",
        });
      }
    } catch (error) {
      const sanitizedError = sanitizeErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setConnectionStatus({
        isConnected: false,
        approvedIPs: [],
        approvedMethods: [],
        lastTested: new Date()
      });

      toast({
        title: "Connection Failed",
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
    if (connectionStatus?.isConnected) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (connectionStatus && !connectionStatus.isConnected) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (!connectionStatus) return 'Not tested';
    return connectionStatus.isConnected ? 'Connected' : 'Connection Failed';
  };

  const getStatusColor = () => {
    if (!connectionStatus) return 'secondary';
    return connectionStatus.isConnected ? 'default' : 'destructive';
  };

  const getCurrentIP = () => {
    if (!connectionStatus?.currentIP) return 'Unknown';
    
    const response = connectionStatus.currentIP;
    
    // Handle new JSON format from proxy server
    if (response.data && typeof response.data === 'object' && response.data.ipAddress) {
      return response.data.ipAddress;
    }
    
    // Handle result field
    if (response.result) {
      return response.result;
    }
    
    // Handle legacy format
    if (response.data && typeof response.data === 'string') {
      return response.data;
    }
    
    return 'Unknown';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Keystone API Configuration
          </CardTitle>
          <CardDescription>
            Configure your Keystone Automotive Operations API settings for both development and production environments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Account Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={config.accountNumber}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, accountNumber: e.target.value }));
                    if (validationErrors.accountNumber) {
                      setValidationErrors(prev => ({ ...prev, accountNumber: undefined }));
                    }
                  }}
                  placeholder="Enter your Keystone account number"
                />
                {validationErrors.accountNumber && (
                  <p className="text-sm text-red-500">{validationErrors.accountNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <Select
                  value={config.environment}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, environment: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Security Keys */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Security Keys</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="securityKeyDev">Development Security Key</Label>
                <Input
                  id="securityKeyDev"
                  type="password"
                  value={config.securityKeyDev}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, securityKeyDev: e.target.value }));
                    if (validationErrors.securityKeyDev) {
                      setValidationErrors(prev => ({ ...prev, securityKeyDev: undefined }));
                    }
                  }}
                  placeholder="Enter development security key"
                />
                {validationErrors.securityKeyDev && (
                  <p className="text-sm text-red-500">{validationErrors.securityKeyDev}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="securityKeyProd">Production Security Key</Label>
                <Input
                  id="securityKeyProd"
                  type="password"
                  value={config.securityKeyProd}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, securityKeyProd: e.target.value }));
                    if (validationErrors.securityKeyProd) {
                      setValidationErrors(prev => ({ ...prev, securityKeyProd: undefined }));
                    }
                  }}
                  placeholder="Enter production security key"
                />
                {validationErrors.securityKeyProd && (
                  <p className="text-sm text-red-500">{validationErrors.securityKeyProd}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* IP Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Approved IP Addresses</h3>
            <p className="text-sm text-muted-foreground">
              Enter the IP addresses that are approved for {config.environment} environment access (comma-separated).
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="approvedIPs">IP Addresses</Label>
              <Textarea
                id="approvedIPs"
                value={approvedIPsInput}
                onChange={(e) => handleApprovedIPsChange(e.target.value)}
                placeholder="192.168.1.100, 10.0.0.50, 203.0.113.1"
                rows={3}
              />
              {validationErrors.approvedIPs && (
                <p className="text-sm text-red-500">{validationErrors.approvedIPs}</p>
              )}
              {config.approvedIPs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {config.approvedIPs.map((ip, index) => (
                    <Badge key={index} variant="secondary">{ip}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
            
            <Button 
              onClick={handleTestConnection} 
              disabled={testing}
              variant="outline"
              className="flex-1"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Wifi className="mr-2 h-4 w-4" />
                  Test Connection
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      {connectionStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {connectionStatus.isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <Badge variant={getStatusColor() as any}>
                    {getStatusText()}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Current IP</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">{getCurrentIP()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Last Tested</Label>
                <p className="text-sm text-muted-foreground">
                  {connectionStatus.lastTested.toLocaleString()}
                </p>
              </div>
            </div>

            {connectionStatus.approvedIPs.length > 0 && (
              <div className="space-y-2">
                <Label>Approved IPs from API</Label>
                <div className="flex flex-wrap gap-2">
                  {connectionStatus.approvedIPs.map((ip, index) => (
                    <Badge key={index} variant="outline">{ip}</Badge>
                  ))}
                </div>
              </div>
            )}

            {!connectionStatus.isConnected && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Connection failed. Please check your configuration and ensure your IP address is approved for API access.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KeystoneConfigManager;


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
import { CheckCircle, XCircle, AlertTriangle, Settings, TestTube, Activity } from 'lucide-react';
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

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
    loadSyncLogs();
  }, []);

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
      console.error('Failed to load configuration:', error);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const logs = await keystoneService.getSyncLogs(20);
      setSyncLogs(logs);
    } catch (error) {
      console.error('Failed to load sync logs:', error);
    }
  };

  const handleSaveConfiguration = async () => {
    setLoading(true);
    try {
      await keystoneService.saveConfig(config);
      toast({
        title: "Configuration Saved",
        description: "Keystone configuration has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save configuration",
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
        setConnectionStatus({
          isConnected: false,
          error: result.error || result.statusMessage,
          lastTested: new Date()
        });

        toast({
          title: "Connection Failed",
          description: result.error || result.statusMessage || "Failed to connect to Keystone API",
          variant: "destructive",
        });
      }

      // Refresh sync logs
      await loadSyncLogs();
    } catch (error) {
      setConnectionStatus({
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastTested: new Date()
      });

      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Connection test failed",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
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
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Configure your Keystone API credentials and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Enter your Keystone account number"
                    value={config.accountNumber}
                    onChange={(e) => setConfig(prev => ({ ...prev, accountNumber: e.target.value }))}
                  />
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

                <div className="space-y-2">
                  <Label htmlFor="securityKeyDev">Development Security Key</Label>
                  <Input
                    id="securityKeyDev"
                    type="password"
                    placeholder="36-byte hex string for development"
                    value={config.securityKeyDev}
                    onChange={(e) => setConfig(prev => ({ ...prev, securityKeyDev: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="securityKeyProd">Production Security Key</Label>
                  <Input
                    id="securityKeyProd"
                    type="password"
                    placeholder="36-byte hex string for production"
                    value={config.securityKeyProd}
                    onChange={(e) => setConfig(prev => ({ ...prev, securityKeyProd: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approvedIPs">Approved IP Addresses</Label>
                <Input
                  id="approvedIPs"
                  placeholder="Comma-separated list of approved IPs"
                  value={config.approvedIPs.join(', ')}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    approvedIPs: e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip) 
                  }))}
                />
                <p className="text-sm text-gray-500">
                  Enter the IP addresses that Keystone has approved for your account
                </p>
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
              <CardTitle>Connection Testing</CardTitle>
              <CardDescription>
                Test your connection to the Keystone API and view connection details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon()}
                  <div>
                    <div className="font-medium">{getStatusText()}</div>
                    {connectionStatus.lastTested && (
                      <div className="text-sm text-gray-500">
                        Last tested: {connectionStatus.lastTested.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <Button onClick={handleTestConnection} disabled={testing}>
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>

              {connectionStatus.error && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {connectionStatus.error}
                  </AlertDescription>
                </Alert>
              )}

              {connectionStatus.isConnected && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Connection Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Current IP:</span> {connectionStatus.currentIP || 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Approved Methods:</span> {connectionStatus.approvedMethods?.length || 0}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Approved IP Addresses</h4>
                    <div className="space-y-1">
                      {connectionStatus.approvedIPs?.map((ip, index) => (
                        <Badge key={index} variant="outline">{ip}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>API Monitoring</CardTitle>
              <CardDescription>
                View recent API calls and synchronization logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {syncLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No sync logs available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {syncLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium">{log.sync_type}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(log.started_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {log.duration_seconds && (
                            <span className="text-sm text-gray-500">
                              {log.duration_seconds}s
                            </span>
                          )}
                          {formatLogStatus(log.status)}
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


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Settings, Database, Key, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminSettingsProps {
  className?: string;
}

export default function AdminSettings({ className }: AdminSettingsProps) {
  const [currentEnvironment, setCurrentEnvironment] = useState<'development' | 'production'>('development');
  const [isLoading, setIsLoading] = useState(false);
  const [lastChanged, setLastChanged] = useState<string | null>(null);

  // Load current environment setting on component mount
  useEffect(() => {
    const savedEnvironment = localStorage.getItem('admin_environment') as 'development' | 'production';
    if (savedEnvironment) {
      setCurrentEnvironment(savedEnvironment);
    }

    const lastChangedTime = localStorage.getItem('admin_environment_changed');
    if (lastChangedTime) {
      setLastChanged(new Date(lastChangedTime).toLocaleString());
    }
  }, []);

  const handleEnvironmentToggle = async (checked: boolean) => {
    setIsLoading(true);
    
    const newEnvironment = checked ? 'production' : 'development';
    
    try {
      // Save to localStorage
      localStorage.setItem('admin_environment', newEnvironment);
      localStorage.setItem('admin_environment_changed', new Date().toISOString());
      
      // Update state
      setCurrentEnvironment(newEnvironment);
      setLastChanged(new Date().toLocaleString());
      
      // Trigger a page reload to ensure all services pick up the new environment
      // This ensures the inventory sync service uses the new environment setting
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to update environment setting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEnvironmentBadge = () => {
    if (currentEnvironment === 'production') {
      return <Badge variant="destructive" className="ml-2">Production</Badge>;
    }
    return <Badge variant="secondary" className="ml-2">Development</Badge>;
  };

  const getEnvironmentInfo = () => {
    if (currentEnvironment === 'production') {
      return {
        title: 'Production Environment',
        description: 'Using production Keystone API tokens and live data',
        icon: <Globe className="h-4 w-4 text-red-500" />,
        tokenVar: 'VITE_KEYSTONE_SECURITY_TOKEN_PROD'
      };
    }
    return {
      title: 'Development Environment', 
      description: 'Using development Keystone API tokens and test data',
      icon: <Settings className="h-4 w-4 text-blue-500" />,
      tokenVar: 'VITE_KEYSTONE_SECURITY_TOKEN_DEV'
    };
  };

  const envInfo = getEnvironmentInfo();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Page Header */}
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Admin Settings</h1>
      </div>

      {/* Environment Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Environment Configuration
            {getEnvironmentBadge()}
          </CardTitle>
          <CardDescription>
            Control which Keystone API environment the system uses for inventory sync operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Environment Status */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            {envInfo.icon}
            <div className="flex-1">
              <h3 className="font-medium">{envInfo.title}</h3>
              <p className="text-sm text-gray-600">{envInfo.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                Token Variable: <code className="bg-gray-200 px-1 rounded">{envInfo.tokenVar}</code>
              </p>
            </div>
          </div>

          {/* Environment Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="environment-toggle" className="text-base font-medium">
                Production Mode
              </Label>
              <p className="text-sm text-gray-600">
                Switch to production environment for live operations
              </p>
            </div>
            <Switch
              id="environment-toggle"
              checked={currentEnvironment === 'production'}
              onCheckedChange={handleEnvironmentToggle}
              disabled={isLoading}
            />
          </div>

          {/* Warning for Production */}
          {currentEnvironment === 'production' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Production Mode Active:</strong> All inventory sync operations will use live production data. 
                Ensure you have proper backups and monitoring in place.
              </AlertDescription>
            </Alert>
          )}

          {/* Last Changed Info */}
          {lastChanged && (
            <div className="text-sm text-gray-500">
              Environment last changed: {lastChanged}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Configuration Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Current API endpoints and authentication status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Keystone Proxy URL</Label>
              <code className="block text-xs bg-gray-100 p-2 rounded">
                {import.meta.env.VITE_KEYSTONE_PROXY_URL || 'Not configured'}
              </code>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Supabase URL</Label>
              <code className="block text-xs bg-gray-100 p-2 rounded">
                {import.meta.env.VITE_SUPABASE_URL || 'Not configured'}
              </code>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Development Token</Label>
              <code className="block text-xs bg-gray-100 p-2 rounded">
                {import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_DEV ? '••••••••••••' : 'Not configured'}
              </code>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Production Token</Label>
              <code className="block text-xs bg-gray-100 p-2 rounded">
                {import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD ? '••••••••••••' : 'Not configured'}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>System Actions</CardTitle>
          <CardDescription>
            Administrative actions for system management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/shop/admin/inventory-sync'}
            >
              Go to Inventory Sync
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                localStorage.removeItem('admin_environment');
                localStorage.removeItem('admin_environment_changed');
                window.location.reload();
              }}
            >
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


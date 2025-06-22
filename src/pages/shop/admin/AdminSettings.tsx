import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
  Zap
} from 'lucide-react';
import { inventorySyncService } from '@/services/inventory_sync_service';

interface SyncStatus {
  isRunning: boolean;
  lastSuccessfulSync: string | null;
  nextPlannedSync: string | null;
  totalItems: number;
  syncedItems: number;
  errors: string[];
  progress: number;
  lastSyncAttempt: string | null;
  lastSyncResult: 'success' | 'failed' | 'partial' | null;
  failureReason: string | null;
}

const AdminSettings: React.FC = () => {
  const [environment, setEnvironment] = useState<'development' | 'production'>('development');
  const [lastChanged, setLastChanged] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load current environment setting on component mount
  useEffect(() => {
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
  }, []);

  const loadSyncStatus = () => {
    try {
      const status = inventorySyncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const handleEnvironmentChange = (newEnvironment: 'development' | 'production') => {
    const timestamp = new Date().toISOString();
    
    // Save to localStorage
    localStorage.setItem('admin_environment', newEnvironment);
    localStorage.setItem('admin_environment_changed', timestamp);
    
    // Update state
    setEnvironment(newEnvironment);
    setLastChanged(timestamp);
    
    // Show confirmation and reload page to ensure all services pick up the new setting
    alert(`Environment switched to ${newEnvironment.toUpperCase()}. Page will reload to apply changes.`);
    window.location.reload();
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getRelativeTime = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      }
    } catch {
      return 'Unknown';
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
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Unknown</Badge>;
    }
  };

  const handleTestSync = async () => {
    setIsLoading(true);
    try {
      await inventorySyncService.performFullSync(10); // Test with small batch
      loadSyncStatus(); // Refresh status after sync
      alert('Test sync completed successfully!');
    } catch (error) {
      alert(`Test sync failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Admin Settings</h1>
      </div>

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
              Last changed: {formatDateTime(lastChanged)}
            </p>
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
                        {formatDateTime(syncStatus.lastSuccessfulSync)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(syncStatus.lastSuccessfulSync)}
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
                        {formatDateTime(syncStatus.nextPlannedSync)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {syncStatus.nextPlannedSync ? 'Scheduled' : 'Not scheduled'}
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
                      {syncStatus.failureReason}
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
                      <span className="font-medium">{syncStatus.totalItems.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Synced Items:</span>
                      <span className="font-medium">{syncStatus.syncedItems.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Errors:</span>
                      <span className={`font-medium ${syncStatus.errors.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {syncStatus.errors.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Progress:</span>
                      <span className="font-medium">{syncStatus.progress.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-600">System Status</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Sync Running:</span>
                      <Badge variant={syncStatus.isRunning ? 'default' : 'outline'}>
                        {syncStatus.isRunning ? 'Active' : 'Idle'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Attempt:</span>
                      <span className="font-medium text-xs">
                        {getRelativeTime(syncStatus.lastSyncAttempt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Details */}
              {syncStatus.errors.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-red-600">Recent Errors</Label>
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-32 overflow-y-auto">
                      {syncStatus.errors.slice(-5).map((error, index) => (
                        <p key={index} className="text-xs text-red-700 mb-1">
                          • {error}
                        </p>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex items-center space-x-3">
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
              variant="outline" 
              size="sm"
              disabled={isLoading || (syncStatus?.isRunning ?? false)}
              className="flex items-center space-x-2"
            >
              <Database className="h-4 w-4" />
              <span>{isLoading ? 'Testing...' : 'Test Sync'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration Display */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs font-medium text-gray-600">Supabase URL</Label>
              <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                {import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing'}
              </p>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600">Supabase Token</Label>
              <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                {import.meta.env.VITE_SUPABASE_ANON_TOKEN ? '✅ Configured' : '❌ Missing'}
              </p>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600">Keystone Proxy URL</Label>
              <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                {import.meta.env.VITE_KEYSTONE_PROXY_URL || '❌ Missing'}
              </p>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600">
                {environment === 'production' ? 'Production' : 'Development'} Token
              </Label>
              <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                {environment === 'production' 
                  ? (import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD ? '✅ Configured' : '❌ Missing')
                  : (import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_DEV ? '✅ Configured' : '❌ Missing')
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks and navigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/shop/admin/inventory-sync'}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Inventory Sync</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/shop/parts'}
              className="flex items-center space-x-2"
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


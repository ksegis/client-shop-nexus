import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, RefreshCw, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

// Safe Array Access Utility
const safeArrayAccess = <T,>(
  array: T[] | undefined | null, 
  componentName: string = 'InventoryTab',
  propertyName: string = 'array',
  defaultValue: T[] = []
): T[] => {
  if (Array.isArray(array)) {
    return array;
  }
  
  console.warn(`[SafeArray] ${componentName}.${propertyName} is ${array === null ? 'null' : 'undefined'}, using default:`, defaultValue);
  return defaultValue;
};

interface InventoryTabProps {
  environment: string;
  setEnvironment: (env: string) => void;
  syncStatus: any;
  isLoading: boolean;
  deltaSyncSettings: any;
  setDeltaSyncSettings: (settings: any) => void;
  handleTestSync: () => void;
  handleTestDeltaSync: () => void;
  handleTestQuantityDelta: () => void;
  handleUpdateDeltaSyncSettings: () => void;
  debugMode: boolean;
  safeDisplayValue: (value: any) => string;
  safeFormatDate: (date: any) => string;
  safeFormatRelativeTime: (date: any) => string;
  getEnvVar: (key: string) => string;
}

const InventoryTab: React.FC<InventoryTabProps> = ({
  environment,
  setEnvironment,
  syncStatus,
  isLoading,
  deltaSyncSettings,
  setDeltaSyncSettings,
  handleTestSync,
  handleTestDeltaSync,
  handleTestQuantityDelta,
  handleUpdateDeltaSyncSettings,
  debugMode,
  safeDisplayValue,
  safeFormatDate,
  safeFormatRelativeTime,
  getEnvVar
}) => {
  // Component registration for debugging
  useEffect(() => {
    console.log('[InventoryTab] Component mounted - registering as potential p3e component');
    
    // Register this component for p3e tracking
    if (typeof window !== 'undefined' && window.ErrorTracker) {
      window.ErrorTracker.registerComponent('p3e', 'InventoryTab');
    }
    
    return () => {
      console.log('[InventoryTab] Component unmounted');
    };
  }, []);

  // Safe array handling for all array props
  const safeSyncStatusErrors = safeArrayAccess(syncStatus?.errors, 'InventoryTab', 'syncStatusErrors', []);

  return (
    <div data-component="InventoryTab" className="space-y-6">
      {/* Environment Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Environment Control
          </CardTitle>
          <CardDescription>
            Control which environment the system uses for API calls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="environment">Current Environment</Label>
            <Select value={environment} onValueChange={setEnvironment}>
              <SelectTrigger>
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development (Test Data)</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2 text-sm text-muted-foreground">
              <Badge variant={environment === 'development' ? 'secondary' : 'default'}>
                {environment === 'development' ? 'DEV' : 'PROD'}
              </Badge>
              <span className="ml-2">
                {environment === 'development' ? 'DEVELOPMENT mode active' : 'PRODUCTION mode active'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last changed: {safeFormatDate(new Date())}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delta Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Delta Sync Settings</CardTitle>
          <CardDescription>
            Configure automatic delta inventory synchronization for efficient updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="delta-sync-enabled"
              checked={deltaSyncSettings?.enabled || false}
              onCheckedChange={(checked) =>
                setDeltaSyncSettings({ ...deltaSyncSettings, enabled: checked })
              }
            />
            <Label htmlFor="delta-sync-enabled">Enable Delta Sync</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Automatically sync only changed inventory items at regular intervals
          </p>

          <div>
            <Label htmlFor="sync-interval">Sync Interval</Label>
            <Select
              value={(deltaSyncSettings?.intervalHours || 12).toString()}
              onValueChange={(value) =>
                setDeltaSyncSettings({ ...deltaSyncSettings, intervalHours: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Every 1 hour</SelectItem>
                <SelectItem value="2">Every 2 hours</SelectItem>
                <SelectItem value="4">Every 4 hours</SelectItem>
                <SelectItem value="6">Every 6 hours (4x daily)</SelectItem>
                <SelectItem value="12">Every 12 hours (2x daily)</SelectItem>
                <SelectItem value="24">Every 24 hours (daily)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Recommended: 12 hours for twice-daily updates
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {deltaSyncSettings?.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            <span className="text-sm">Every {deltaSyncSettings?.intervalHours || 12} hours</span>
          </div>

          <Button onClick={handleUpdateDeltaSyncSettings} className="w-full">
            Update Delta Sync Settings
          </Button>
        </CardContent>
      </Card>

      {/* Test Sync Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Test Sync Operations</CardTitle>
          <CardDescription>
            Test different sync operations with limited data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Test operations use limited data to avoid rate limiting. Use these to verify connectivity and functionality.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleTestSync}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Test Full Sync (10 items)
            </Button>

            <Button
              onClick={handleTestDeltaSync}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Test Delta Sync
            </Button>

            <Button
              onClick={handleTestQuantityDelta}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Test Quantity Delta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Sync Status</CardTitle>
          <CardDescription>
            Real-time status of inventory synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {syncStatus ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {syncStatus.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {syncStatus.success ? 'Last Sync Successful' : 'Last Sync Failed'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Last Full Sync</div>
                  <div className="text-muted-foreground">
                    {safeFormatRelativeTime(syncStatus.lastFullSync)}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Records Processed</div>
                  <div className="text-muted-foreground">{syncStatus.recordsProcessed || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Success Rate</div>
                  <div className="text-muted-foreground">{syncStatus.successRate || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-medium">Next Sync</div>
                  <div className="text-muted-foreground">
                    {safeFormatRelativeTime(syncStatus.nextSync)}
                  </div>
                </div>
              </div>

              {/* SAFE ERROR ARRAY HANDLING */}
              {safeSyncStatusErrors.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Sync Errors ({safeSyncStatusErrors.length}):</strong>
                    <ul className="mt-1 list-disc list-inside">
                      {safeSyncStatusErrors.slice(0, 3).map((error: string, index: number) => (
                        <li key={index} className="text-xs">{error || 'Unknown error'}</li>
                      ))}
                    </ul>
                    {safeSyncStatusErrors.length > 3 && (
                      <p className="text-xs mt-1">... and {safeSyncStatusErrors.length - 3} more errors</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {debugMode && syncStatus && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Debug Information</h4>
                  <div className="space-y-2">
                    <div className="text-xs">
                      <strong>Environment Variables:</strong>
                      <ul className="mt-1 space-y-1 text-gray-600">
                        <li>VITE_KEYSTONE_API_URL: {safeDisplayValue(getEnvVar('VITE_KEYSTONE_API_URL'))}</li>
                        <li>VITE_KEYSTONE_USERNAME: {safeDisplayValue(getEnvVar('VITE_KEYSTONE_USERNAME'))}</li>
                        <li>VITE_KEYSTONE_PASSWORD: {getEnvVar('VITE_KEYSTONE_PASSWORD') ? '***' : 'Not set'}</li>
                      </ul>
                    </div>
                    <div className="text-xs">
                      <strong>Sync Status Debug:</strong>
                      <div className="mt-1 text-gray-600">
                        <div>Errors Array Length: {safeSyncStatusErrors.length}</div>
                        <div>Success: {syncStatus.success ? 'true' : 'false'}</div>
                        <div>Records Processed: {syncStatus.recordsProcessed || 0}</div>
                      </div>
                    </div>
                    <pre className="text-xs text-gray-600 overflow-auto max-h-40">
                      {JSON.stringify(syncStatus, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No sync status available</p>
              <p className="text-sm">Run a test sync to see status information</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Information */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs">
        <div className="font-semibold mb-1">🐛 InventoryTab Debug Info</div>
        <div>Component: InventoryTab (potential p3e component)</div>
        <div>Sync Status Errors: {safeSyncStatusErrors.length} items</div>
        <div>Environment: {environment}</div>
        <div>Delta Sync Enabled: {deltaSyncSettings?.enabled ? 'Yes' : 'No'}</div>
        <div>Delta Sync Interval: {deltaSyncSettings?.intervalHours || 12} hours</div>
        <div>Is Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Debug Mode: {debugMode ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
};

export default InventoryTab;


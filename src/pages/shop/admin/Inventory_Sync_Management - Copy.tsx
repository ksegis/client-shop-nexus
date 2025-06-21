import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  RefreshCw, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database,
  Activity,
  Settings,
  Play,
  Square
} from 'lucide-react';
import { inventorySyncService, InventorySyncStatus, SyncLogEntry } from '@/services/inventory_sync_service';

const InventorySyncManagement: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<InventorySyncStatus>({
    isRunning: false,
    progress: 0,
    totalItems: 0,
    processedItems: 0,
    createdItems: 0,
    updatedItems: 0,
    errorItems: 0,
    errors: []
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize service on component mount
  useEffect(() => {
    initializeService();
  }, []);

  // Poll sync status while running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (syncStatus.isRunning) {
      interval = setInterval(() => {
        const currentStatus = inventorySyncService.getSyncStatus();
        setSyncStatus(currentStatus);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [syncStatus.isRunning]);

  // Initialize the sync service
  const initializeService = async () => {
    try {
      setIsInitializing(true);
      setInitializationError(null);
      
      console.log('🔧 Initializing inventory sync service...');
      await inventorySyncService.initialize();
      
      setIsInitialized(true);
      console.log('✅ Inventory sync service initialized');
      
      // Load recent sync logs
      await loadSyncLogs();
      
    } catch (error) {
      console.error('❌ Failed to initialize inventory sync service:', error);
      setInitializationError(error.message);
      setIsInitialized(false);
    } finally {
      setIsInitializing(false);
    }
  };

  // Load sync logs
  const loadSyncLogs = useCallback(async () => {
    try {
      const logs = await inventorySyncService.getSyncLogs(10);
      setSyncLogs(logs);
    } catch (error) {
      console.error('❌ Failed to load sync logs:', error);
    }
  }, []);

  // Start inventory sync
  const handleStartSync = async (options: {
    fullSync?: boolean;
    maxItems?: number;
  } = {}) => {
    try {
      console.log('🚀 Starting inventory sync...');
      
      // Start the sync
      await inventorySyncService.startInventorySync(options);
      
      // Reload sync logs after completion
      await loadSyncLogs();
      
    } catch (error) {
      console.error('❌ Inventory sync failed:', error);
      alert(`Sync failed: ${error.message}`);
    }
  };

  // Cancel running sync
  const handleCancelSync = async () => {
    try {
      await inventorySyncService.cancelSync();
      console.log('🛑 Sync cancelled');
    } catch (error) {
      console.error('❌ Failed to cancel sync:', error);
    }
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  // Format estimated time remaining
  const formatEstimatedTime = (milliseconds?: number): string => {
    if (!milliseconds) return 'Calculating...';
    const seconds = Math.floor(milliseconds / 1000);
    return formatDuration(seconds);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'completed': return 'default';
      case 'running': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Sync Management</h1>
          <p className="text-muted-foreground">
            Synchronize parts inventory from Keystone API
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={isInitialized ? 'default' : 'destructive'}>
            {isInitialized ? 'Service Ready' : 'Service Not Ready'}
          </Badge>
        </div>
      </div>

      {/* Initialization Status */}
      {!isInitialized && (
        <Alert variant={initializationError ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isInitializing ? (
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Initializing inventory sync service...</span>
              </div>
            ) : initializationError ? (
              <div className="space-y-2">
                <div>Service initialization failed: {initializationError}</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={initializeService}
                  disabled={isInitializing}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Initialization
                </Button>
              </div>
            ) : (
              'Service not initialized'
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Inventory Synchronization</span>
          </CardTitle>
          <CardDescription>
            Pull the latest parts inventory from Keystone API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sync Buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={() => handleStartSync({ fullSync: true })}
              disabled={!isInitialized || syncStatus.isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {syncStatus.isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Full Sync
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleStartSync({ fullSync: false })}
              disabled={!isInitialized || syncStatus.isRunning}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Incremental Sync
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleStartSync({ fullSync: true, maxItems: 50 })}
              disabled={!isInitialized || syncStatus.isRunning}
            >
              <Play className="h-4 w-4 mr-2" />
              Test Sync (50 items)
            </Button>
            
            {syncStatus.isRunning && (
              <Button
                variant="destructive"
                onClick={handleCancelSync}
              >
                <Square className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>

          {/* Sync Progress */}
          {syncStatus.isRunning && (
            <div className="space-y-4">
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Sync Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {syncStatus.processedItems} / {syncStatus.totalItems} items
                  </span>
                </div>
                
                <Progress value={syncStatus.progress} className="w-full" />
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-green-600">{syncStatus.createdItems}</div>
                    <div className="text-muted-foreground">Created</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-blue-600">{syncStatus.updatedItems}</div>
                    <div className="text-muted-foreground">Updated</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-red-600">{syncStatus.errorItems}</div>
                    <div className="text-muted-foreground">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{Math.round(syncStatus.progress)}%</div>
                    <div className="text-muted-foreground">Complete</div>
                  </div>
                </div>
                
                {syncStatus.currentItem && (
                  <div className="text-sm text-muted-foreground">
                    Currently processing: {syncStatus.currentItem}
                  </div>
                )}
                
                {syncStatus.estimatedTimeRemaining && (
                  <div className="text-sm text-muted-foreground">
                    Estimated time remaining: {formatEstimatedTime(syncStatus.estimatedTimeRemaining)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sync Errors */}
          {syncStatus.errors.length > 0 && (
            <div className="space-y-2">
              <Separator />
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">Sync Errors ({syncStatus.errors.length}):</div>
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {syncStatus.errors.map((error, index) => (
                          <div key={index} className="text-sm font-mono">
                            {error}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Sync History</span>
          </CardTitle>
          <CardDescription>
            Recent inventory synchronization logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {syncLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sync history available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(log.status)}>
                          {log.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {log.status === 'running' && <Clock className="h-3 w-3 mr-1" />}
                          {log.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(log.started_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {log.duration_seconds ? formatDuration(log.duration_seconds) : '-'}
                      </TableCell>
                      <TableCell>{log.records_processed}</TableCell>
                      <TableCell className="text-green-600">{log.records_created}</TableCell>
                      <TableCell className="text-blue-600">{log.records_updated}</TableCell>
                      <TableCell className="text-red-600">{log.records_failed}</TableCell>
                      <TableCell>
                        {log.error_message ? (
                          <div className="max-w-xs truncate" title={log.error_message}>
                            {log.error_message}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Service Configuration</span>
          </CardTitle>
          <CardDescription>
            Current sync service settings and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Service Status</div>
              <div className="flex items-center space-x-2">
                {isInitialized ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Initialized and Ready</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-600">Not Initialized</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Last Sync</div>
              <div className="text-sm text-muted-foreground">
                {syncStatus.lastSyncTime ? 
                  new Date(syncStatus.lastSyncTime).toLocaleString() : 
                  'Never'
                }
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Keystone API</div>
              <div className="text-sm text-muted-foreground">
                {import.meta.env.VITE_KEYSTONE_API_URL || 'Not configured'}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">API Key Status</div>
              <div className="text-sm text-muted-foreground">
                {import.meta.env.VITE_KEYSTONE_API_KEY ? 'Configured' : 'Not configured'}
              </div>
            </div>
          </div>
          
          {!isInitialized && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={initializeService}
                disabled={isInitializing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Initialize Service
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventorySyncManagement;



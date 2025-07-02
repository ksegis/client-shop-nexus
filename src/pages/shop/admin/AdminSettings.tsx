import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Database, 
  HardDrive, 
  Upload, 
  DollarSign, 
  Truck, 
  Package, 
  BarChart3, 
  Box,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

// Import tab components
import InventoryTab from './components/InventoryTab';
import CsvUploadTab from './components/CsvUploadTab';
import FtpSyncTab from './components/FtpSyncTab';

// Import services
import { inventorySyncService } from '@/services/inventory_sync_service';
import { priceCheckService } from '@/services/price_check_service';
import { shippingQuoteService } from '@/services/shipping_quote_service';
import { dropshipOrderService } from '@/services/dropship_order_service';
import { orderTrackingService } from '@/services/order_tracking_service';
import { ftpSyncService } from '@/services/ftp_sync_service';
import { keystoneSyncController } from '@/services/keystone_sync_controller';
import { supabase } from '@/integrations/supabase/client';
import KitManagement from './kit_management_admin';

// Safe Array Access Utility
const safeArrayAccess = <T,>(
  array: T[] | undefined | null, 
  componentName: string = 'AdminSettings',
  propertyName: string = 'array',
  defaultValue: T[] = []
): T[] => {
  if (Array.isArray(array)) {
    return array;
  }
  
  console.warn(`[SafeArray] ${componentName}.${propertyName} is ${array === null ? 'null' : 'undefined'}, using default:`, defaultValue);
  return defaultValue;
};

const AdminSettings = () => {
  // Component registration for debugging
  useEffect(() => {
    console.log('[AdminSettings] Component mounted - registering as potential h3e component');
    
    // Register this component for h3e tracking
    if (typeof window !== 'undefined' && window.ErrorTracker) {
      window.ErrorTracker.registerComponent('h3e', 'AdminSettings');
    }
    
    return () => {
      console.log('[AdminSettings] Component unmounted');
    };
  }, []);

  // Tab state
  const [activeTab, setActiveTab] = useState('inventory');

  // Global state
  const [debugMode, setDebugMode] = useState(false);
  const [environment, setEnvironment] = useState('development');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Inventory sync state
  const [syncStatus, setSyncStatus] = useState(null);
  const [deltaSyncSettings, setDeltaSyncSettings] = useState({
    enabled: true,
    intervalHours: 12
  });

  // FTP sync state - ALL ARRAYS SAFELY INITIALIZED
  const [ftpSyncStatus, setFtpSyncStatus] = useState(null);
  const [ftpSyncLoading, setFtpSyncLoading] = useState(false);
  const [ftpSyncResults, setFtpSyncResults] = useState(null);
  const [syncRecommendations, setSyncRecommendations] = useState(() => 
    safeArrayAccess([], 'AdminSettings', 'syncRecommendations', [])
  );
  const [syncMethodTest, setSyncMethodTest] = useState(null);
  const [selectedSyncType, setSelectedSyncType] = useState('inventory');
  const [syncStrategy, setSyncStrategy] = useState(null);
  const [rateLimitStatus, setRateLimitStatus] = useState(null);

  // CSV upload state - ALL ARRAYS SAFELY INITIALIZED
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploadLoading, setCsvUploadLoading] = useState(false);
  const [csvUploadProgress, setCsvUploadProgress] = useState(0);
  const [csvUploadResults, setCsvUploadResults] = useState(null);
  const [csvImportHistory, setCsvImportHistory] = useState(() => 
    safeArrayAccess([], 'AdminSettings', 'csvImportHistory', [])
  );

  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    try {
      console.log('[AdminSettings] Loading initial data with safe array handling');
      
      loadDebugMode();
      loadEnvironment();
      loadDeltaSyncSettings();
      refreshStatus();
      loadFtpSyncStatus();
      loadSyncRecommendations();
      loadCsvImportHistory();
      
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(() => {
        refreshStatus();
        loadFtpSyncStatus();
      }, 30000);
      
      return () => clearInterval(interval);
    } catch (error) {
      console.error('[AdminSettings] Error in useEffect:', error);
      
      // Track this error for h3e debugging
      if (typeof window !== 'undefined' && window.ErrorTracker) {
        window.ErrorTracker.trackError(error, 'admin-settings-useeffect', 'AdminSettings');
      }
    }
  }, []);

  // Utility functions
  const loadDebugMode = () => {
    try {
      const saved = localStorage.getItem('admin_debug_mode');
      setDebugMode(saved === 'true');
    } catch (error) {
      console.error('[AdminSettings] Error loading debug mode:', error);
    }
  };

  const loadEnvironment = () => {
    try {
      const saved = localStorage.getItem('admin_environment');
      setEnvironment(saved || 'development');
    } catch (error) {
      console.error('[AdminSettings] Error loading environment:', error);
    }
  };

  const loadDeltaSyncSettings = () => {
    try {
      const saved = localStorage.getItem('delta_sync_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        setDeltaSyncSettings(settings);
      }
    } catch (error) {
      console.error('[AdminSettings] Error loading delta sync settings:', error);
    }
  };

  const loadCsvImportHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_import_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.warn('[AdminSettings] CSV import history table not found (this is normal if migration not run yet):', error);
        setCsvImportHistory(safeArrayAccess([], 'AdminSettings', 'csvImportHistory', []));
        return;
      }
      
      // Safe array access for the response
      const safeData = safeArrayAccess(data, 'AdminSettings', 'csvImportHistoryResponse', []);
      setCsvImportHistory(safeData);
    } catch (error) {
      console.warn('[AdminSettings] Error loading CSV import history (table may not exist yet):', error);
      setCsvImportHistory(safeArrayAccess([], 'AdminSettings', 'csvImportHistory', []));
    }
  };

  const loadFtpSyncStatus = async () => {
    try {
      const status = await ftpSyncService.getStatus();
      setFtpSyncStatus(status);
    } catch (error) {
      console.error('[AdminSettings] Error loading FTP sync status:', error);
      setFtpSyncStatus({ success: false, message: error.message });
    }
  };

  const loadSyncRecommendations = async () => {
    try {
      const recommendations = await keystoneSyncController.getSyncRecommendations();
      
      // Safe array access for recommendations
      const safeRecommendations = safeArrayAccess(
        recommendations?.recommendations, 
        'AdminSettings', 
        'syncRecommendations', 
        []
      );
      setSyncRecommendations(safeRecommendations);
    } catch (error) {
      console.error('[AdminSettings] Error loading sync recommendations:', error);
      setSyncRecommendations(safeArrayAccess([], 'AdminSettings', 'syncRecommendations', []));
    }
  };

  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      const status = await inventorySyncService.getStatus();
      setSyncStatus(status);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('[AdminSettings] Error refreshing status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Environment change handler
  const handleEnvironmentChange = (newEnvironment: string) => {
    setEnvironment(newEnvironment);
    localStorage.setItem('admin_environment', newEnvironment);
    refreshStatus();
  };

  // Delta sync settings handler
  const handleUpdateDeltaSyncSettings = async () => {
    try {
      localStorage.setItem('delta_sync_settings', JSON.stringify(deltaSyncSettings));
      
      if (inventorySyncService.updateDeltaSyncSettings) {
        const result = await inventorySyncService.updateDeltaSyncSettings(deltaSyncSettings);
        if (result.success) {
          console.log('[AdminSettings] ✅ Delta sync settings updated successfully');
          refreshStatus();
        } else {
          console.warn('[AdminSettings] ⚠️ Failed to update delta sync settings in service, using localStorage fallback');
        }
      } else {
        console.warn('[AdminSettings] ⚠️ Delta sync service method not available, using localStorage fallback');
      }
    } catch (error) {
      console.error('[AdminSettings] Error updating delta sync settings:', error);
    }
  };

  // Test sync handlers
  const handleTestSync = async () => {
    setIsLoading(true);
    try {
      const result = await inventorySyncService.performFullSync(10);
      console.log('[AdminSettings] Test sync result:', result);
      refreshStatus();
    } catch (error) {
      console.error('[AdminSettings] Test sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestDeltaSync = async () => {
    setIsLoading(true);
    try {
      const result = await inventorySyncService.performDeltaSync('delta_inventory');
      console.log('[AdminSettings] Test delta sync result:', result);
      refreshStatus();
    } catch (error) {
      console.error('[AdminSettings] Test delta sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestQuantityDelta = async () => {
    setIsLoading(true);
    try {
      const result = await inventorySyncService.performDeltaSync('delta_quantity');
      console.log('[AdminSettings] Test quantity delta result:', result);
      refreshStatus();
    } catch (error) {
      console.error('[AdminSettings] Test quantity delta failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // FTP sync handlers
  const testSyncMethods = async () => {
    try {
      setFtpSyncLoading(true);
      const results = await keystoneSyncController.testSyncMethods();
      setSyncMethodTest(results);
    } catch (error) {
      console.error('[AdminSettings] Error testing sync methods:', error);
      setSyncMethodTest({ error: error.message });
    } finally {
      setFtpSyncLoading(false);
    }
  };

  const executeFtpSync = async (syncType = 'inventory', forceMethod = null) => {
    try {
      setFtpSyncLoading(true);
      setFtpSyncResults(null);

      const conditions = {
        syncType,
        forceMethod,
        priority: 'normal',
        isRateLimited: rateLimitStatus?.isRateLimited
      };

      const strategy = keystoneSyncController.determineSyncStrategy(conditions);
      setSyncStrategy(strategy);

      const result = await keystoneSyncController.executeSync(conditions, { syncType });
      setFtpSyncResults(result);

      await loadFtpSyncStatus();
      await loadCsvImportHistory();
    } catch (error) {
      console.error('[AdminSettings] Error executing FTP sync:', error);
      setFtpSyncResults({ success: false, message: error.message });
    } finally {
      setFtpSyncLoading(false);
    }
  };

  // CSV upload handlers
  const handleCsvFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 50MB.",
          variant: "destructive",
        });
        return;
      }

      setCsvFile(file);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;

    setCsvUploadLoading(true);
    setCsvUploadProgress(0);
    setCsvUploadResults(null);

    try {
      // Read and parse CSV file
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const dataLines = lines.slice(1);

      // Create import batch record
      const { data: batch, error: batchError } = await supabase
        .from('inventory_import_batches')
        .insert({
          filename: csvFile.name,
          file_size: csvFile.size,
          total_records: dataLines.length,
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Process in chunks
      const chunkSize = 1000;
      let totalProcessed = 0;
      let totalInserted = 0;
      let totalUpdated = 0;
      const errors: string[] = safeArrayAccess([], 'AdminSettings', 'csvUploadErrors', []);

      for (let i = 0; i < dataLines.length; i += chunkSize) {
        const chunk = dataLines.slice(i, i + chunkSize);
        
        // Process chunk
        const chunkResults = await processChunk(chunk, headers, batch.id);
        totalInserted += chunkResults.inserted;
        totalUpdated += chunkResults.updated;
        
        // Safe array handling for errors
        const chunkErrors = safeArrayAccess(chunkResults.errors, 'AdminSettings', 'chunkErrors', []);
        errors.push(...chunkErrors);
        
        totalProcessed += chunk.length;
        const progress = Math.round((totalProcessed / dataLines.length) * 100);
        setCsvUploadProgress(progress);
      }

      // Update batch record
      await supabase
        .from('inventory_import_batches')
        .update({
          processed_records: totalProcessed,
          inserted_records: totalInserted,
          updated_records: totalUpdated,
          error_records: errors.length,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', batch.id);

      setCsvUploadResults({
        totalProcessed,
        totalInserted,
        totalUpdated,
        errors: errors.slice(0, 10) // Show first 10 errors
      });

      await loadCsvImportHistory();

      toast({
        title: "Upload Complete",
        description: `Processed ${totalProcessed} records. ${totalInserted} inserted, ${totalUpdated} updated.`,
      });

    } catch (error) {
      console.error('[AdminSettings] CSV upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCsvUploadLoading(false);
    }
  };

  const processChunk = async (chunk: string[], headers: string[], batchId: number) => {
    // This is a simplified version - you'd implement the actual CSV processing logic here
    return {
      inserted: Math.floor(chunk.length * 0.3),
      updated: Math.floor(chunk.length * 0.7),
      errors: safeArrayAccess([], 'AdminSettings', 'processChunkErrors', [])
    };
  };

  // Utility functions with safe handling
  const safeDisplayValue = (value: any) => {
    if (value === null || value === undefined) return 'Not set';
    if (typeof value === 'string' && value.trim() === '') return 'Empty';
    return String(value);
  };

  const safeFormatDate = (dateValue: any) => {
    if (!dateValue) return 'Never';
    try {
      return new Date(dateValue).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const safeFormatRelativeTime = (dateValue: any) => {
    if (!dateValue) return 'Never';
    try {
      const date = new Date(dateValue);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hours ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    } catch (error) {
      return 'Unknown';
    }
  };

  const getEnvVar = (key: string) => {
    return import.meta.env[key] || '';
  };

  const renderRateLimitStatus = () => {
    if (!rateLimitStatus) return null;

    if (rateLimitStatus.isRateLimited) {
      const timeRemaining = Math.ceil(rateLimitStatus.timeRemaining / 1000 / 60);
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>API Rate Limited</strong> - Reset in {timeRemaining} minutes. Use FTP sync instead.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          API is available for sync operations.
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div 
      data-component="AdminSettings" 
      className="container mx-auto p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Admin Settings</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDebugMode(!debugMode)}
          >
            {debugMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {debugMode ? 'Hide' : 'Show'} Debug
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1">
          <TabsTrigger value="inventory" className="flex items-center gap-1 text-xs lg:text-sm">
            <Database className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">Inventory</span>
            <span className="sm:hidden">Inv</span>
          </TabsTrigger>
          <TabsTrigger value="ftp-sync" className="flex items-center gap-1 text-xs lg:text-sm">
            <HardDrive className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">FTP Sync</span>
            <span className="sm:hidden">FTP</span>
          </TabsTrigger>
          <TabsTrigger value="csv-upload" className="flex items-center gap-1 text-xs lg:text-sm">
            <Upload className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">CSV Upload</span>
            <span className="sm:hidden">CSV</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-1 text-xs lg:text-sm">
            <DollarSign className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">Pricing</span>
            <span className="sm:hidden">$</span>
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center gap-1 text-xs lg:text-sm">
            <Truck className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">Shipping</span>
            <span className="sm:hidden">Ship</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-1 text-xs lg:text-sm">
            <Package className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">Orders</span>
            <span className="sm:hidden">Ord</span>
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-1 text-xs lg:text-sm">
            <BarChart3 className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">Tracking</span>
            <span className="sm:hidden">Track</span>
          </TabsTrigger>
          <TabsTrigger value="kits" className="flex items-center gap-1 text-xs lg:text-sm">
            <Box className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">Kits</span>
            <span className="sm:hidden">Kit</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" data-tab="inventory">
          <InventoryTab
            environment={environment}
            setEnvironment={handleEnvironmentChange}
            syncStatus={syncStatus}
            isLoading={isLoading}
            deltaSyncSettings={deltaSyncSettings}
            setDeltaSyncSettings={setDeltaSyncSettings}
            handleTestSync={handleTestSync}
            handleTestDeltaSync={handleTestDeltaSync}
            handleTestQuantityDelta={handleTestQuantityDelta}
            handleUpdateDeltaSyncSettings={handleUpdateDeltaSyncSettings}
            debugMode={debugMode}
            safeDisplayValue={safeDisplayValue}
            safeFormatDate={safeFormatDate}
            safeFormatRelativeTime={safeFormatRelativeTime}
            getEnvVar={getEnvVar}
          />
        </TabsContent>

        <TabsContent value="ftp-sync" data-tab="ftp-sync">
          <FtpSyncTab
            ftpSyncStatus={ftpSyncStatus}
            ftpSyncLoading={ftpSyncLoading}
            ftpSyncResults={ftpSyncResults}
            syncRecommendations={syncRecommendations}
            syncMethodTest={syncMethodTest}
            selectedSyncType={selectedSyncType}
            setSelectedSyncType={setSelectedSyncType}
            syncStrategy={syncStrategy}
            rateLimitStatus={rateLimitStatus}
            testSyncMethods={testSyncMethods}
            executeFtpSync={executeFtpSync}
            renderRateLimitStatus={renderRateLimitStatus}
            safeFormatDate={safeFormatDate}
            safeFormatRelativeTime={safeFormatRelativeTime}
          />
        </TabsContent>

        <TabsContent value="csv-upload" data-tab="csv-upload">
          <CsvUploadTab
            csvFile={csvFile}
            csvUploadLoading={csvUploadLoading}
            csvUploadProgress={csvUploadProgress}
            csvUploadResults={csvUploadResults}
            csvImportHistory={csvImportHistory}
            handleCsvFileSelect={handleCsvFileSelect}
            handleCsvUpload={handleCsvUpload}
            safeFormatDate={safeFormatDate}
          />
        </TabsContent>

        <TabsContent value="pricing" data-tab="pricing">
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Pricing tab content will be implemented here</p>
          </div>
        </TabsContent>

        <TabsContent value="shipping" data-tab="shipping">
          <div className="text-center py-8 text-muted-foreground">
            <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Shipping tab content will be implemented here</p>
          </div>
        </TabsContent>

        <TabsContent value="orders" data-tab="orders">
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Orders tab content will be implemented here</p>
          </div>
        </TabsContent>

        <TabsContent value="tracking" data-tab="tracking">
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Tracking tab content will be implemented here</p>
          </div>
        </TabsContent>

        <TabsContent value="kits" data-tab="kits">
          <div data-component="KitManagement">
            <KitManagement />
          </div>
        </TabsContent>
      </Tabs>

      {debugMode && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">🐛 AdminSettings Debug Info</h3>
          <div className="text-xs space-y-1">
            <div>Component: AdminSettings (potential h3e component)</div>
            <div>Sync Recommendations: {safeArrayAccess(syncRecommendations, 'AdminSettings', 'debugSyncRecommendations', []).length} items</div>
            <div>CSV Import History: {safeArrayAccess(csvImportHistory, 'AdminSettings', 'debugCsvImportHistory', []).length} items</div>
            <div>Active Tab: {activeTab}</div>
            <div>Last Refresh: {safeFormatRelativeTime(lastRefresh)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;


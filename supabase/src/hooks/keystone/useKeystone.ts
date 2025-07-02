// =====================================================
// PHASE 1 - WEEK 4: KEYSTONE REACT HOOKS
// React hooks for Keystone API integration
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { keystoneAPI } from '@/services/keystone/KeystoneAPIService';
import { keystoneSyncScheduler } from '@/services/keystone/KeystoneSyncScheduler';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// CONFIGURATION HOOK
// =====================================================

export const useKeystoneConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await keystoneAPI.loadConfig();
      const currentConfig = keystoneAPI.getConfig();
      setConfig(currentConfig);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveConfig = useCallback(async (newConfig: any) => {
    setLoading(true);
    setError(null);
    try {
      await keystoneAPI.saveConfig(newConfig);
      await loadConfig(); // Reload to get updated config
      toast({
        title: "Configuration Saved",
        description: "Keystone configuration has been saved successfully.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration';
      setError(errorMessage);
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, loadConfig]);

  const testConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await keystoneAPI.testConnection();
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Keystone API.",
        });
        return result;
      } else {
        throw new Error(result.error || result.statusMessage || 'Connection failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      setError(errorMessage);
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    loading,
    error,
    loadConfig,
    saveConfig,
    testConnection,
    isConfigured: keystoneAPI.isConfigured()
  };
};

// =====================================================
// INVENTORY HOOK
// =====================================================

export const useKeystoneInventory = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const getFullInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await keystoneAPI.getFullInventory();
      setInventory(data);
      toast({
        title: "Inventory Synced",
        description: `Successfully synced ${data.length} inventory items.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get inventory';
      setError(errorMessage);
      toast({
        title: "Inventory Sync Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getInventoryUpdates = useCallback(async (lastSyncDate?: Date) => {
    setLoading(true);
    setError(null);
    try {
      const data = await keystoneAPI.getInventoryUpdates(lastSyncDate);
      setInventory(prev => {
        // Merge updates with existing inventory
        const updated = [...prev];
        data.forEach(newItem => {
          const existingIndex = updated.findIndex(item => 
            item.VCPN === newItem.VCPN && item.WarehouseCode === newItem.WarehouseCode
          );
          if (existingIndex >= 0) {
            updated[existingIndex] = newItem;
          } else {
            updated.push(newItem);
          }
        });
        return updated;
      });
      toast({
        title: "Inventory Updated",
        description: `Successfully updated ${data.length} inventory items.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get inventory updates';
      setError(errorMessage);
      toast({
        title: "Inventory Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const checkInventory = useCallback(async (partNumbers: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const data = await keystoneAPI.checkInventoryBulk(partNumbers);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check inventory';
      setError(errorMessage);
      toast({
        title: "Inventory Check Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    inventory,
    loading,
    error,
    getFullInventory,
    getInventoryUpdates,
    checkInventory
  };
};

// =====================================================
// PARTS CATALOG HOOK
// =====================================================

export const useKeystoneCatalog = () => {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const getFullCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await keystoneAPI.getFullCatalog();
      setCatalog(data);
      toast({
        title: "Catalog Synced",
        description: `Successfully synced ${data.length} catalog items.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get catalog';
      setError(errorMessage);
      toast({
        title: "Catalog Sync Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const searchParts = useCallback(async (criteria: {
    partNumber?: string;
    description?: string;
    manufacturer?: string;
    category?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await keystoneAPI.searchParts(criteria);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search parts';
      setError(errorMessage);
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    catalog,
    loading,
    error,
    getFullCatalog,
    searchParts
  };
};

// =====================================================
// ORDERS HOOK
// =====================================================

export const useKeystoneOrders = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const submitJobberOrder = useCallback(async (orderData: any) => {
    setLoading(true);
    setError(null);
    try {
      const orderNumber = await keystoneAPI.submitJobberOrder(orderData);
      toast({
        title: "Order Submitted",
        description: `Jobber order ${orderNumber} submitted successfully.`,
      });
      return orderNumber;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit order';
      setError(errorMessage);
      toast({
        title: "Order Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const submitDropshipOrder = useCallback(async (orderData: any) => {
    setLoading(true);
    setError(null);
    try {
      const orderNumber = await keystoneAPI.submitDropshipOrder(orderData);
      toast({
        title: "Dropship Order Submitted",
        description: `Dropship order ${orderNumber} submitted successfully.`,
      });
      return orderNumber;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit dropship order';
      setError(errorMessage);
      toast({
        title: "Dropship Order Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getOrderStatus = useCallback(async (orderNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const status = await keystoneAPI.getOrderStatus(orderNumber);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get order status';
      setError(errorMessage);
      toast({
        title: "Order Status Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    error,
    submitJobberOrder,
    submitDropshipOrder,
    getOrderStatus
  };
};

// =====================================================
// SYNC SCHEDULER HOOK
// =====================================================

export const useKeystoneSyncScheduler = () => {
  const [schedule, setSchedule] = useState(keystoneSyncScheduler.getSchedule());
  const [status, setStatus] = useState(keystoneSyncScheduler.getStatus());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const refreshStatus = useCallback(() => {
    setSchedule(keystoneSyncScheduler.getSchedule());
    setStatus(keystoneSyncScheduler.getStatus());
  }, []);

  const updateSchedule = useCallback(async (newSchedule: any) => {
    setLoading(true);
    try {
      keystoneSyncScheduler.updateSchedule(newSchedule);
      refreshStatus();
      toast({
        title: "Schedule Updated",
        description: "Sync schedule has been updated successfully.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update schedule';
      toast({
        title: "Schedule Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, refreshStatus]);

  const startScheduler = useCallback(() => {
    keystoneSyncScheduler.start();
    refreshStatus();
    toast({
      title: "Scheduler Started",
      description: "Keystone sync scheduler has been started.",
    });
  }, [toast, refreshStatus]);

  const stopScheduler = useCallback(() => {
    keystoneSyncScheduler.stop();
    refreshStatus();
    toast({
      title: "Scheduler Stopped",
      description: "Keystone sync scheduler has been stopped.",
    });
  }, [toast, refreshStatus]);

  const triggerSync = useCallback(async (syncType: 'inventory' | 'pricing' | 'catalog') => {
    setLoading(true);
    try {
      await keystoneSyncScheduler.triggerSync(syncType);
      refreshStatus();
      toast({
        title: "Sync Completed",
        description: `${syncType} sync completed successfully.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to sync ${syncType}`;
      toast({
        title: "Sync Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, refreshStatus]);

  useEffect(() => {
    const interval = setInterval(refreshStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [refreshStatus]);

  return {
    schedule,
    status,
    loading,
    updateSchedule,
    startScheduler,
    stopScheduler,
    triggerSync,
    refreshStatus
  };
};

// =====================================================
// MONITORING HOOK
// =====================================================

export const useKeystoneMonitoring = () => {
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [apiLogs, setApiLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSyncLogs = useCallback(async (limit: number = 50) => {
    setLoading(true);
    setError(null);
    try {
      const logs = await keystoneAPI.getSyncLogs(limit);
      setSyncLogs(logs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sync logs';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadApiLogs = useCallback(async (syncLogId?: string, limit: number = 100) => {
    setLoading(true);
    setError(null);
    try {
      const logs = await keystoneAPI.getAPILogs(syncLogId, limit);
      setApiLogs(logs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load API logs';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSyncLogs();
    loadApiLogs();
  }, [loadSyncLogs, loadApiLogs]);

  return {
    syncLogs,
    apiLogs,
    loading,
    error,
    loadSyncLogs,
    loadApiLogs
  };
};


// FTP Sync Service - eKeystone Integration with Correct HTTP Methods
// Implements both FTP file access and API calls through proxy

import { getSupabaseClient } from '@/lib/supabase';

export interface FTPSyncResult {
  success: boolean;
  message: string;
  itemsProcessed: number;
  itemsUpdated: number;
  itemsAdded: number;
  errors: string[];
  syncType: 'inventory' | 'pricing' | 'kits' | 'full';
  timestamp: string;
  source: 'ftp' | 'api';
}

export interface FTPSyncOptions {
  syncType: 'inventory' | 'pricing' | 'kits' | 'full';
  forceRefresh?: boolean;
  batchSize?: number;
  categories?: string[];
  dateFilter?: string;
  useAPI?: boolean; // Toggle between FTP files and API calls
}

export interface SyncResult {
  success: boolean;
  processed: number;
  updated: number;
  failed: number;
  errors: string[];
  duration: number;
  source: string;
}

class FTPSyncService {
  private supabase: any;
  private proxyBaseUrl: string;
  private apiBaseUrl: string;
  private ftpCredentials: any;
  private accountNumber: string;
  private securityToken: string;

  constructor() {
    this.supabase = getSupabaseClient();
    
    // Proxy service for HTTP API calls
    this.proxyBaseUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL || 'https://146-190-161-109.nip.io';
    
    // Direct eKeystone API (through proxy)
    this.apiBaseUrl = 'http://order.ekeystone.com/wselectronicorder/electronicorder.asmx';
    
    // FTP credentials from documentation
    this.ftpCredentials = {
      host: 'ftp.ekeystone.com',
      username: import.meta.env.VITE_KEYSTONE_FTP_USERNAME || 'S159980',
      password: import.meta.env.VITE_KEYSTONE_FTP_PASSWORD || 'ctc99mkn'
    };
    
    // API credentials
    this.accountNumber = import.meta.env.VITE_KEYSTONE_ACCOUNT_NUMBER || '';
    this.securityToken = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD || '';
  }

  // Main sync methods - choose between FTP files and API calls
  async syncKitsFTP(options: FTPSyncOptions = { syncType: 'kits' }): Promise<FTPSyncResult> {
    const startTime = Date.now();
    
    try {
      console.log('📁 Starting kit sync via proxy...');
      
      let result;
      if (options.useAPI) {
        // Use GetKitComponents API function through proxy
        result = await this.syncKitsViaAPI(options);
      } else {
        // Use proxy endpoints that handle FTP file downloads
        result = await this.syncKitsViaProxy(options);
      }
      
      const syncResult: FTPSyncResult = {
        success: result.success,
        message: result.message || 'Kit sync completed',
        itemsProcessed: result.processed || 0,
        itemsUpdated: result.updated || 0,
        itemsAdded: result.added || 0,
        errors: result.errors || [],
        syncType: 'kits',
        timestamp: new Date().toISOString(),
        source: options.useAPI ? 'api' : 'ftp'
      };

      await this.logSyncResult(syncResult);
      console.log('✅ Kit sync completed:', syncResult);
      
      return syncResult;

    } catch (error) {
      console.error('❌ Kit sync failed:', error);
      
      const errorResult: FTPSyncResult = {
        success: false,
        message: `Kit sync failed: ${error.message}`,
        itemsProcessed: 0,
        itemsUpdated: 0,
        itemsAdded: 0,
        errors: [error.message],
        syncType: 'kits',
        timestamp: new Date().toISOString(),
        source: options.useAPI ? 'api' : 'ftp'
      };

      await this.logSyncResult(errorResult);
      return errorResult;
    }
  }

  async syncInventoryFTP(options: FTPSyncOptions = { syncType: 'inventory' }): Promise<FTPSyncResult> {
    const startTime = Date.now();
    
    try {
      console.log('📁 Starting inventory sync...');
      
      let result;
      if (options.useAPI) {
        // Use CheckInventoryBulk or GetInventoryFull API functions
        result = await this.syncInventoryViaAPI(options);
      } else {
        // Use proxy endpoints for FTP file access
        result = await this.syncInventoryViaProxy(options);
      }
      
      const syncResult: FTPSyncResult = {
        success: result.success,
        message: result.message || 'Inventory sync completed',
        itemsProcessed: result.processed || 0,
        itemsUpdated: result.updated || 0,
        itemsAdded: result.added || 0,
        errors: result.errors || [],
        syncType: 'inventory',
        timestamp: new Date().toISOString(),
        source: options.useAPI ? 'api' : 'ftp'
      };

      await this.logSyncResult(syncResult);
      return syncResult;

    } catch (error) {
      console.error('❌ Inventory sync failed:', error);
      
      const errorResult: FTPSyncResult = {
        success: false,
        message: `Inventory sync failed: ${error.message}`,
        itemsProcessed: 0,
        itemsUpdated: 0,
        itemsAdded: 0,
        errors: [error.message],
        syncType: 'inventory',
        timestamp: new Date().toISOString(),
        source: options.useAPI ? 'api' : 'ftp'
      };

      await this.logSyncResult(errorResult);
      return errorResult;
    }
  }

  async syncPricingFTP(options: FTPSyncOptions = { syncType: 'pricing' }): Promise<FTPSyncResult> {
    const startTime = Date.now();
    
    try {
      console.log('📁 Starting pricing sync...');
      
      let result;
      if (options.useAPI) {
        // Use CheckPriceBulk API function
        result = await this.syncPricingViaAPI(options);
      } else {
        // Use proxy endpoints for FTP file access
        result = await this.syncPricingViaProxy(options);
      }
      
      const syncResult: FTPSyncResult = {
        success: result.success,
        message: result.message || 'Pricing sync completed',
        itemsProcessed: result.processed || 0,
        itemsUpdated: result.updated || 0,
        itemsAdded: result.added || 0,
        errors: result.errors || [],
        syncType: 'pricing',
        timestamp: new Date().toISOString(),
        source: options.useAPI ? 'api' : 'ftp'
      };

      await this.logSyncResult(syncResult);
      return syncResult;

    } catch (error) {
      console.error('❌ Pricing sync failed:', error);
      
      const errorResult: FTPSyncResult = {
        success: false,
        message: `Pricing sync failed: ${error.message}`,
        itemsProcessed: 0,
        itemsUpdated: 0,
        itemsAdded: 0,
        errors: [error.message],
        syncType: 'pricing',
        timestamp: new Date().toISOString(),
        source: options.useAPI ? 'api' : 'ftp'
      };

      await this.logSyncResult(errorResult);
      return errorResult;
    }
  }

  // API-based sync methods (real-time via eKeystone API)
  private async syncKitsViaAPI(options: FTPSyncOptions): Promise<any> {
    try {
      // Use the proxy's /kits/components endpoint which should call GetKitComponents
      const response = await this.makeProxyRequest('/kits/components', {
        Key: this.securityToken,
        FullAccountNo: this.accountNumber,
        method: 'GetKitComponents',
        // Note: GetKitComponents requires specific kit part numbers
        // For bulk sync, we might need to get all kits first
        fullKitPartNumber: options.categories?.join(',') || '' // Kit part numbers if specified
      }, 'POST');

      if (!response.success) {
        throw new Error(response.message || 'API kit sync failed');
      }

      // Process the kit components data
      const result = await this.processKitComponentsData(response.data || []);
      return {
        success: true,
        message: 'API kit sync completed',
        processed: result.processed,
        updated: result.updated,
        added: result.added,
        errors: result.errors
      };

    } catch (error) {
      console.error('❌ API kit sync failed:', error);
      throw error;
    }
  }

  private async syncInventoryViaAPI(options: FTPSyncOptions): Promise<any> {
    try {
      // Use CheckInventoryBulk or GetInventoryFull through proxy
      const endpoint = options.forceRefresh ? '/inventory/full' : '/inventory/bulk';
      
      const response = await this.makeProxyRequest(endpoint, {
        Key: this.securityToken,
        FullAccountNo: this.accountNumber,
        method: options.forceRefresh ? 'GetInventoryFull' : 'CheckInventoryBulk',
        batchSize: options.batchSize || 1000
      }, 'POST');

      if (!response.success) {
        throw new Error(response.message || 'API inventory sync failed');
      }

      const result = await this.processInventoryData(response.data || []);
      return {
        success: true,
        message: 'API inventory sync completed',
        processed: result.processed,
        updated: result.updated,
        added: result.added,
        errors: result.errors
      };

    } catch (error) {
      console.error('❌ API inventory sync failed:', error);
      throw error;
    }
  }

  private async syncPricingViaAPI(options: FTPSyncOptions): Promise<any> {
    try {
      // Use CheckPriceBulk through proxy
      const response = await this.makeProxyRequest('/pricing/bulk', {
        Key: this.securityToken,
        FullAccountNo: this.accountNumber,
        method: 'CheckPriceBulk',
        batchSize: options.batchSize || 1000
      }, 'POST');

      if (!response.success) {
        throw new Error(response.message || 'API pricing sync failed');
      }

      const result = await this.processPricingData(response.data || []);
      return {
        success: true,
        message: 'API pricing sync completed',
        processed: result.processed,
        updated: result.updated,
        added: result.added,
        errors: result.errors
      };

    } catch (error) {
      console.error('❌ API pricing sync failed:', error);
      throw error;
    }
  }

  // FTP-based sync methods (bulk file downloads via proxy)
  private async syncKitsViaProxy(options: FTPSyncOptions): Promise<any> {
    try {
      // Use proxy to download FTP files containing kit data
      const response = await this.makeProxyRequest('/kits/components', {
        Key: this.securityToken,
        FullAccountNo: this.accountNumber,
        method: 'ftp_download',
        fileType: 'kits',
        batchSize: options.batchSize || 500
      }, 'POST');

      if (!response.success) {
        throw new Error(response.message || 'FTP kit sync failed');
      }

      const result = await this.processKitComponentsData(response.data || []);
      return {
        success: true,
        message: 'FTP kit sync completed',
        processed: result.processed,
        updated: result.updated,
        added: result.added,
        errors: result.errors
      };

    } catch (error) {
      console.error('❌ FTP kit sync failed:', error);
      throw error;
    }
  }

  private async syncInventoryViaProxy(options: FTPSyncOptions): Promise<any> {
    try {
      const endpoint = options.forceRefresh ? '/inventory/full' : '/inventory/bulk';
      
      const response = await this.makeProxyRequest(endpoint, {
        Key: this.securityToken,
        FullAccountNo: this.accountNumber,
        method: 'ftp_download',
        fileType: 'inventory',
        forceRefresh: options.forceRefresh,
        batchSize: options.batchSize || 1000
      }, 'POST');

      if (!response.success) {
        throw new Error(response.message || 'FTP inventory sync failed');
      }

      const result = await this.processInventoryData(response.data || []);
      return {
        success: true,
        message: 'FTP inventory sync completed',
        processed: result.processed,
        updated: result.updated,
        added: result.added,
        errors: result.errors
      };

    } catch (error) {
      console.error('❌ FTP inventory sync failed:', error);
      throw error;
    }
  }

  private async syncPricingViaProxy(options: FTPSyncOptions): Promise<any> {
    try {
      const response = await this.makeProxyRequest('/pricing/bulk', {
        Key: this.securityToken,
        FullAccountNo: this.accountNumber,
        method: 'ftp_download',
        fileType: 'pricing',
        batchSize: options.batchSize || 1000
      }, 'POST');

      if (!response.success) {
        throw new Error(response.message || 'FTP pricing sync failed');
      }

      const result = await this.processPricingData(response.data || []);
      return {
        success: true,
        message: 'FTP pricing sync completed',
        processed: result.processed,
        updated: result.updated,
        added: result.added,
        errors: result.errors
      };

    } catch (error) {
      console.error('❌ FTP pricing sync failed:', error);
      throw error;
    }
  }

  // Legacy method names for compatibility
  async syncInventoryFromFTP(): Promise<SyncResult> {
    const result = await this.syncInventoryFTP({ syncType: 'inventory', useAPI: false });
    return {
      success: result.success,
      processed: result.itemsProcessed,
      updated: result.itemsUpdated,
      failed: result.errors.length,
      errors: result.errors,
      duration: 0,
      source: 'ftp'
    };
  }

  async syncKitsFromFTP(): Promise<SyncResult> {
    const result = await this.syncKitsFTP({ syncType: 'kits', useAPI: false });
    return {
      success: result.success,
      processed: result.itemsProcessed,
      updated: result.itemsUpdated,
      failed: result.errors.length,
      errors: result.errors,
      duration: 0,
      source: 'ftp'
    };
  }

  async syncPricingFromFTP(): Promise<SyncResult> {
    const result = await this.syncPricingFTP({ syncType: 'pricing', useAPI: false });
    return {
      success: result.success,
      processed: result.itemsProcessed,
      updated: result.itemsUpdated,
      failed: result.errors.length,
      errors: result.errors,
      duration: 0,
      source: 'ftp'
    };
  }

  // HTTP request helper for proxy - FIXED WITH PROPER HTTP METHODS AND AUTHENTICATION
  private async makeProxyRequest(endpoint: string, data: any, method: 'GET' | 'POST' = 'POST'): Promise<any> {
    const url = `${this.proxyBaseUrl}${endpoint}`;
    
    try {
      console.log(`🌐 Making ${method} request to: ${url}`);
      console.log(`📤 Request data:`, { ...data, Key: data.Key ? '[HIDDEN]' : undefined });
      
      const requestOptions: RequestInit = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add authentication headers that the proxy might expect
          'X-Account-Number': this.accountNumber,
          'X-Security-Token': this.securityToken
        }
      };

      // Only add body for POST requests
      if (method === 'POST' && data) {
        requestOptions.body = JSON.stringify(data);
      }

      // For GET requests, add query parameters if data exists
      let finalUrl = url;
      if (method === 'GET' && data && Object.keys(data).length > 0) {
        const params = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
        finalUrl = `${url}?${params.toString()}`;
      }

      const response = await fetch(finalUrl, requestOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ ${method} request successful:`, result);
      
      return result;

    } catch (error) {
      console.error(`❌ ${method} request failed:`, error);
      throw error;
    }
  }

  // Data processing methods
  private async processKitComponentsData(data: any[]): Promise<any> {
    try {
      let processed = 0;
      let updated = 0;
      let added = 0;
      const errors: string[] = [];

      if (!Array.isArray(data)) {
        console.warn('⚠️ Kit data is not an array:', data);
        return { processed: 0, updated: 0, added: 0, errors: ['Invalid data format'] };
      }

      for (const kit of data) {
        try {
          // Map based on GetKitComponents API response format
          const kitComponent = {
            kit_vcpn: kit.KitPartNumber || kit.kitVcpn || kit.kitPartNumber,
            component_vcpn: kit.ComponentPartNumber || kit.componentVcpn || kit.componentPartNumber,
            component_name: kit.ComponentName || kit.componentName || kit.description,
            quantity: parseInt(kit.ComponentQuantity || kit.quantity || kit.qty || 1),
            unit_price: parseFloat(kit.ComponentPrice || kit.unitPrice || kit.price || 0),
            is_required: kit.ComponentRequired !== false, // Default to true unless explicitly false
            category: kit.ComponentCategory || kit.category,
            description: kit.ComponentDescription || kit.description,
            sync_source: 'ftp',
            sync_timestamp: new Date().toISOString()
          };

          // Upsert kit component
          const { error } = await this.supabase
            .from('keystone_kit_components')
            .upsert(kitComponent, {
              onConflict: 'kit_vcpn,component_vcpn'
            });

          if (error) {
            errors.push(`Failed to upsert kit ${kitComponent.kit_vcpn}/${kitComponent.component_vcpn}: ${error.message}`);
          } else {
            processed++;
            updated++;
          }

        } catch (itemError) {
          errors.push(`Error processing kit: ${itemError.message}`);
        }
      }

      return { processed, updated, added, errors };

    } catch (error) {
      console.error('❌ Failed to process kit data:', error);
      throw error;
    }
  }

  private async processInventoryData(data: any[]): Promise<any> {
    try {
      let processed = 0;
      let updated = 0;
      let added = 0;
      const errors: string[] = [];

      if (!Array.isArray(data)) {
        console.warn('⚠️ Inventory data is not an array:', data);
        return { processed: 0, updated: 0, added: 0, errors: ['Invalid data format'] };
      }

      for (const item of data) {
        try {
          // Map based on eKeystone API response format
          const inventoryItem = {
            vcpn: item.FullPartNumber || item.vcpn || item.partNumber || item.id,
            name: item.PartDescription || item.name || item.description || 'Unknown',
            description: item.LongDescription || item.description || item.longDescription,
            category: item.CategoryName || item.category || item.categoryName,
            price: parseFloat(item.Price || item.unitPrice || item.price || 0),
            cost: parseFloat(item.Cost || item.unitCost || item.cost || 0),
            quantity: parseInt(item.QuantityAvailable || item.quantity || item.qtyAvailable || 0),
            weight: parseFloat(item.Weight || item.weight || 0),
            brand: item.Brand || item.brand || item.manufacturer,
            warehouse: item.Warehouse || item.warehouse || item.location,
            location: item.Location || item.location || item.binLocation,
            availability: item.Availability || item.availability || item.status || 'unknown',
            last_updated: item.LastUpdated || item.lastUpdated || new Date().toISOString(),
            sync_source: 'ftp',
            sync_timestamp: new Date().toISOString()
          };

          // Upsert inventory item
          const { error } = await this.supabase
            .from('inventory')
            .upsert(inventoryItem, {
              onConflict: 'vcpn'
            });

          if (error) {
            errors.push(`Failed to upsert ${inventoryItem.vcpn}: ${error.message}`);
          } else {
            processed++;
            updated++;
          }

        } catch (itemError) {
          errors.push(`Error processing item: ${itemError.message}`);
        }
      }

      return { processed, updated, added, errors };

    } catch (error) {
      console.error('❌ Failed to process inventory data:', error);
      throw error;
    }
  }

  private async processPricingData(data: any[]): Promise<any> {
    try {
      let processed = 0;
      let updated = 0;
      let added = 0;
      const errors: string[] = [];

      if (!Array.isArray(data)) {
        console.warn('⚠️ Pricing data is not an array:', data);
        return { processed: 0, updated: 0, added: 0, errors: ['Invalid data format'] };
      }

      for (const item of data) {
        try {
          // Map based on eKeystone API response format
          const pricingItem = {
            vcpn: item.FullPartNumber || item.vcpn || item.partNumber || item.id,
            price: parseFloat(item.Price || item.unitPrice || item.price || 0),
            cost: parseFloat(item.Cost || item.unitCost || item.cost || 0),
            effective_date: item.EffectiveDate || item.effectiveDate || new Date().toISOString(),
            sync_source: 'ftp',
            sync_timestamp: new Date().toISOString()
          };

          // Upsert pricing data
          const { error } = await this.supabase
            .from('keystone_pricing')
            .upsert(pricingItem, {
              onConflict: 'vcpn'
            });

          if (error) {
            errors.push(`Failed to upsert pricing ${pricingItem.vcpn}: ${error.message}`);
          } else {
            processed++;
            updated++;
          }

        } catch (itemError) {
          errors.push(`Error processing pricing: ${itemError.message}`);
        }
      }

      return { processed, updated, added, errors };

    } catch (error) {
      console.error('❌ Failed to process pricing data:', error);
      throw error;
    }
  }

  // Status and utility methods - FIXED WITH GET REQUESTS
  async getFTPSyncStatus(): Promise<any> {
    try {
      // Use GET request for health check
      const response = await this.makeProxyRequest('/health', {}, 'GET');

      return {
        success: true,
        message: 'Proxy service is available',
        status: response.status || 'healthy',
        ftpStatus: response.ftpStatus || 'unknown',
        apiStatus: response.apiStatus || 'unknown',
        availableEndpoints: response.available_endpoints
      };

    } catch (error) {
      return {
        success: false,
        message: `Proxy service unavailable: ${error.message}`,
        status: 'error'
      };
    }
  }

  async getLastSyncInfo(syncType: string): Promise<any> {
    try {
      const { data } = await this.supabase
        .from('keystone_sync_logs')
        .select('*')
        .eq('sync_type', syncType)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      return {
        lastSync: data?.completed_at,
        status: data?.status,
        itemsProcessed: data?.items_processed,
        message: data?.error_message,
        source: data?.sync_details?.source
      };

    } catch (error) {
      return {
        lastSync: null,
        status: 'never',
        itemsProcessed: 0,
        message: 'No sync history found'
      };
    }
  }

  // Log sync results to database
  private async logSyncResult(result: FTPSyncResult): Promise<void> {
    try {
      await this.supabase
        .from('keystone_sync_logs')
        .insert({
          sync_type: result.syncType,
          status: result.success ? 'completed' : 'failed',
          items_processed: result.itemsProcessed,
          items_updated: result.itemsUpdated,
          items_failed: result.errors.length,
          error_message: result.errors.join('; ') || null,
          sync_details: {
            source: result.source,
            timestamp: result.timestamp,
            message: result.message
          }
        });
    } catch (error) {
      console.error('❌ Failed to log sync result:', error);
    }
  }

  // Test connectivity using GET request
  async testFTPConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Use GET request for health check
      const response = await this.makeProxyRequest('/health', {}, 'GET');
      
      return {
        success: true,
        message: `Connection test successful. FTP: ${response.ftpStatus || 'unknown'}, API: ${response.apiStatus || 'unknown'}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`
      };
    }
  }
}

// Export singleton instance - THIS IS THE KEY EXPORT
export const ftpSyncService = new FTPSyncService();

// Also export the class and default
export default FTPSyncService;
export { FTPSyncService };


// FTP Sync Service - Keystone FTP Integration via Proxy
// Routes through https://146-190-161-109.nip.io/ftp-sync/* endpoints

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
  source: 'ftp';
}

export interface FTPSyncOptions {
  syncType: 'inventory' | 'pricing' | 'kits' | 'full';
  forceRefresh?: boolean;
  batchSize?: number;
  categories?: string[];
  dateFilter?: string; // YYYY-MM-DD format
}

export interface FTPInventoryItem {
  vcpn: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  cost?: number;
  quantity: number;
  weight?: number;
  brand?: string;
  warehouse?: string;
  location?: string;
  availability?: string;
  lastUpdated: string;
}

export interface FTPKitComponent {
  kitVcpn: string;
  componentVcpn: string;
  componentName: string;
  quantity: number;
  unitPrice: number;
  category?: string;
  description?: string;
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
  private baseUrl: string;
  private accountNumber: string;
  private securityToken: string;

  constructor() {
    this.supabase = getSupabaseClient();
    this.baseUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL || 'https://146-190-161-109.nip.io';
    this.accountNumber = import.meta.env.VITE_KEYSTONE_ACCOUNT_NUMBER || '';
    this.securityToken = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD || '';
  }

  // Main FTP sync methods
  async syncInventoryFTP(options: FTPSyncOptions = { syncType: 'inventory' }): Promise<FTPSyncResult> {
    const startTime = Date.now();
    
    try {
      console.log('📁 Starting FTP inventory sync...');
      
      const response = await this.makeRequest('/inventory', {
        accountNumber: this.accountNumber,
        securityToken: this.securityToken,
        forceRefresh: options.forceRefresh || false,
        batchSize: options.batchSize || 1000,
        categories: options.categories || [],
        dateFilter: options.dateFilter
      });

      if (!response.success) {
        throw new Error(response.message || 'FTP inventory sync failed');
      }

      // Process and store inventory data
      const result = await this.processInventoryData(response.data);
      
      const syncResult: FTPSyncResult = {
        success: true,
        message: `FTP inventory sync completed successfully`,
        itemsProcessed: result.processed,
        itemsUpdated: result.updated,
        itemsAdded: result.added,
        errors: result.errors,
        syncType: 'inventory',
        timestamp: new Date().toISOString(),
        source: 'ftp'
      };

      await this.logSyncResult(syncResult);
      console.log('✅ FTP inventory sync completed:', syncResult);
      
      return syncResult;

    } catch (error) {
      console.error('❌ FTP inventory sync failed:', error);
      
      const errorResult: FTPSyncResult = {
        success: false,
        message: `FTP inventory sync failed: ${error.message}`,
        itemsProcessed: 0,
        itemsUpdated: 0,
        itemsAdded: 0,
        errors: [error.message],
        syncType: 'inventory',
        timestamp: new Date().toISOString(),
        source: 'ftp'
      };

      await this.logSyncResult(errorResult);
      return errorResult;
    }
  }

  async syncKitsFTP(options: FTPSyncOptions = { syncType: 'kits' }): Promise<FTPSyncResult> {
    const startTime = Date.now();
    
    try {
      console.log('📁 Starting FTP kits sync...');
      
      const response = await this.makeRequest('/kits', {
        accountNumber: this.accountNumber,
        securityToken: this.securityToken,
        forceRefresh: options.forceRefresh || false,
        batchSize: options.batchSize || 500
      });

      if (!response.success) {
        throw new Error(response.message || 'FTP kits sync failed');
      }

      // Process and store kit data
      const result = await this.processKitData(response.data);
      
      const syncResult: FTPSyncResult = {
        success: true,
        message: `FTP kits sync completed successfully`,
        itemsProcessed: result.processed,
        itemsUpdated: result.updated,
        itemsAdded: result.added,
        errors: result.errors,
        syncType: 'kits',
        timestamp: new Date().toISOString(),
        source: 'ftp'
      };

      await this.logSyncResult(syncResult);
      console.log('✅ FTP kits sync completed:', syncResult);
      
      return syncResult;

    } catch (error) {
      console.error('❌ FTP kits sync failed:', error);
      
      const errorResult: FTPSyncResult = {
        success: false,
        message: `FTP kits sync failed: ${error.message}`,
        itemsProcessed: 0,
        itemsUpdated: 0,
        itemsAdded: 0,
        errors: [error.message],
        syncType: 'kits',
        timestamp: new Date().toISOString(),
        source: 'ftp'
      };

      await this.logSyncResult(errorResult);
      return errorResult;
    }
  }

  async syncPricingFTP(options: FTPSyncOptions = { syncType: 'pricing' }): Promise<FTPSyncResult> {
    const startTime = Date.now();
    
    try {
      console.log('📁 Starting FTP pricing sync...');
      
      const response = await this.makeRequest('/pricing', {
        accountNumber: this.accountNumber,
        securityToken: this.securityToken,
        forceRefresh: options.forceRefresh || false,
        batchSize: options.batchSize || 1000,
        dateFilter: options.dateFilter
      });

      if (!response.success) {
        throw new Error(response.message || 'FTP pricing sync failed');
      }

      // Process and store pricing data
      const result = await this.processPricingData(response.data);
      
      const syncResult: FTPSyncResult = {
        success: true,
        message: `FTP pricing sync completed successfully`,
        itemsProcessed: result.processed,
        itemsUpdated: result.updated,
        itemsAdded: result.added,
        errors: result.errors,
        syncType: 'pricing',
        timestamp: new Date().toISOString(),
        source: 'ftp'
      };

      await this.logSyncResult(syncResult);
      console.log('✅ FTP pricing sync completed:', syncResult);
      
      return syncResult;

    } catch (error) {
      console.error('❌ FTP pricing sync failed:', error);
      
      const errorResult: FTPSyncResult = {
        success: false,
        message: `FTP pricing sync failed: ${error.message}`,
        itemsProcessed: 0,
        itemsUpdated: 0,
        itemsAdded: 0,
        errors: [error.message],
        syncType: 'pricing',
        timestamp: new Date().toISOString(),
        source: 'ftp'
      };

      await this.logSyncResult(errorResult);
      return errorResult;
    }
  }

  // Legacy method names for compatibility
  async syncInventoryFromFTP(): Promise<SyncResult> {
    const result = await this.syncInventoryFTP();
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
    const result = await this.syncKitsFTP();
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
    const result = await this.syncPricingFTP();
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

  // HTTP request helper
  private async makeRequest(endpoint: string, data: any): Promise<any> {
    const url = `${this.baseUrl}/ftp-sync${endpoint}`;
    
    try {
      console.log(`🌐 Making FTP request to: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ FTP request successful:`, result);
      
      return result;

    } catch (error) {
      console.error(`❌ FTP request failed:`, error);
      throw error;
    }
  }

  // Data processing methods
  private async processInventoryData(data: FTPInventoryItem[]): Promise<any> {
    try {
      let processed = 0;
      let updated = 0;
      let added = 0;
      const errors: string[] = [];

      for (const item of data) {
        try {
          // Upsert inventory item
          const { error } = await this.supabase
            .from('inventory')
            .upsert({
              vcpn: item.vcpn,
              name: item.name,
              description: item.description,
              category: item.category,
              price: item.price,
              cost: item.cost,
              quantity: item.quantity,
              weight: item.weight,
              brand: item.brand,
              warehouse: item.warehouse,
              location: item.location,
              availability: item.availability,
              last_updated: item.lastUpdated,
              sync_source: 'ftp',
              sync_timestamp: new Date().toISOString()
            }, {
              onConflict: 'vcpn'
            });

          if (error) {
            errors.push(`Failed to upsert ${item.vcpn}: ${error.message}`);
          } else {
            processed++;
            // For simplicity, count all as updated
            updated++;
          }

        } catch (itemError) {
          errors.push(`Error processing ${item.vcpn}: ${itemError.message}`);
        }
      }

      return { processed, updated, added, errors };

    } catch (error) {
      console.error('❌ Failed to process inventory data:', error);
      throw error;
    }
  }

  private async processKitData(data: FTPKitComponent[]): Promise<any> {
    try {
      let processed = 0;
      let updated = 0;
      let added = 0;
      const errors: string[] = [];

      for (const kit of data) {
        try {
          // Upsert kit component
          const { error } = await this.supabase
            .from('keystone_kit_components')
            .upsert({
              kit_vcpn: kit.kitVcpn,
              component_vcpn: kit.componentVcpn,
              component_name: kit.componentName,
              quantity: kit.quantity,
              unit_price: kit.unitPrice,
              category: kit.category,
              description: kit.description,
              sync_source: 'ftp',
              sync_timestamp: new Date().toISOString()
            }, {
              onConflict: 'kit_vcpn,component_vcpn'
            });

          if (error) {
            errors.push(`Failed to upsert kit ${kit.kitVcpn}/${kit.componentVcpn}: ${error.message}`);
          } else {
            processed++;
            updated++;
          }

        } catch (itemError) {
          errors.push(`Error processing kit ${kit.kitVcpn}: ${itemError.message}`);
        }
      }

      return { processed, updated, added, errors };

    } catch (error) {
      console.error('❌ Failed to process kit data:', error);
      throw error;
    }
  }

  private async processPricingData(data: any[]): Promise<any> {
    try {
      let processed = 0;
      let updated = 0;
      let added = 0;
      const errors: string[] = [];

      for (const item of data) {
        try {
          // Upsert pricing data
          const { error } = await this.supabase
            .from('keystone_pricing')
            .upsert({
              vcpn: item.vcpn,
              price: item.price,
              cost: item.cost,
              effective_date: item.effectiveDate,
              sync_source: 'ftp',
              sync_timestamp: new Date().toISOString()
            }, {
              onConflict: 'vcpn'
            });

          if (error) {
            errors.push(`Failed to upsert pricing ${item.vcpn}: ${error.message}`);
          } else {
            processed++;
            updated++;
          }

        } catch (itemError) {
          errors.push(`Error processing pricing ${item.vcpn}: ${itemError.message}`);
        }
      }

      return { processed, updated, added, errors };

    } catch (error) {
      console.error('❌ Failed to process pricing data:', error);
      throw error;
    }
  }

  // Status and utility methods
  async getFTPSyncStatus(): Promise<any> {
    try {
      const response = await this.makeRequest('/status', {
        accountNumber: this.accountNumber
      });

      return {
        success: true,
        message: 'FTP service is available',
        status: response.status,
        lastSync: response.lastSync,
        availableFiles: response.availableFiles
      };

    } catch (error) {
      return {
        success: false,
        message: `FTP service unavailable: ${error.message}`,
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
        message: data?.error_message
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

  // Test FTP connectivity
  async testFTPConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest('/test', {
        accountNumber: this.accountNumber
      });
      return {
        success: true,
        message: 'FTP connection test successful'
      };
    } catch (error) {
      return {
        success: false,
        message: `FTP connection test failed: ${error.message}`
      };
    }
  }
}

// Export singleton instance - THIS IS THE KEY EXPORT
export const ftpSyncService = new FTPSyncService();

// Also export the class and default
export default FTPSyncService;
export { FTPSyncService };


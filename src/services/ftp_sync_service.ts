import { getSupabaseClient } from '@/lib/supabase';

// Types for FTP sync responses
interface FTPInventoryItem {
  vcpn: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  quantity: number;
  category?: string;
  brand?: string;
  weight?: number;
  warehouse?: string;
  location?: string;
  core_charge?: number;
  availability?: string;
  in_stock: boolean;
  images?: string[];
  specifications?: Record<string, any>;
  compatibility?: Record<string, any>;
  features?: Record<string, any>;
}

interface FTPPricingItem {
  vcpn: string;
  list_price: number;
  dealer_price: number;
  jobber_price: number;
  retail_price: number;
  core_charge?: number;
  effective_date?: string;
  currency: string;
}

interface FTPKitComponent {
  kit_vcpn: string;
  component_vcpn: string;
  quantity: number;
  description?: string;
  component_name?: string;
  required: boolean;
}

interface FTPSyncResponse {
  success: boolean;
  data: any[];
  total_records: number;
  sync_timestamp: string;
  source: 'ftp';
  errors?: string[];
}

interface SyncResult {
  success: boolean;
  processed: number;
  updated: number;
  failed: number;
  errors: string[];
  duration: number;
  source: 'ftp';
}

class FTPSyncService {
  private supabase = getSupabaseClient();
  private proxyBaseUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL || 'https://146-190-161-109.nip.io';
  private securityToken = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD || import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_DEV;
  private accountNumber = import.meta.env.VITE_KEYSTONE_ACCOUNT_NUMBER;

  /**
   * Sync inventory data via FTP proxy
   */
  async syncInventoryFromFTP(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      processed: 0,
      updated: 0,
      failed: 0,
      errors: [],
      duration: 0,
      source: 'ftp'
    };

    try {
      console.log('🔄 Starting FTP inventory sync...');
      
      // Log sync start
      await this.logSyncStart('inventory', 'ftp');

      // Call FTP proxy endpoint
      const response = await this.callFTPProxy('/ftp-sync/inventory');
      
      if (!response.success) {
        throw new Error(`FTP sync failed: ${response.errors?.join(', ')}`);
      }

      const inventoryData: FTPInventoryItem[] = response.data;
      result.processed = inventoryData.length;

      // Process in batches to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < inventoryData.length; i += batchSize) {
        const batch = inventoryData.slice(i, i + batchSize);
        
        try {
          const batchResult = await this.upsertInventoryBatch(batch);
          result.updated += batchResult.updated;
          result.failed += batchResult.failed;
          result.errors.push(...batchResult.errors);
        } catch (error) {
          console.error(`❌ Batch ${i}-${i + batchSize} failed:`, error);
          result.failed += batch.length;
          result.errors.push(`Batch ${i}-${i + batchSize}: ${error.message}`);
        }
      }

      result.success = result.failed < result.processed * 0.5; // Success if <50% failed
      result.duration = Date.now() - startTime;

      // Log sync completion
      await this.logSyncCompletion('inventory', 'ftp', result);

      console.log(`✅ FTP inventory sync completed: ${result.updated} updated, ${result.failed} failed`);
      return result;

    } catch (error) {
      console.error('❌ FTP inventory sync failed:', error);
      result.duration = Date.now() - startTime;
      result.errors.push(error.message);
      
      await this.logSyncError('inventory', 'ftp', error.message);
      return result;
    }
  }

  /**
   * Sync pricing data via FTP proxy
   */
  async syncPricingFromFTP(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      processed: 0,
      updated: 0,
      failed: 0,
      errors: [],
      duration: 0,
      source: 'ftp'
    };

    try {
      console.log('🔄 Starting FTP pricing sync...');
      
      await this.logSyncStart('pricing', 'ftp');

      const response = await this.callFTPProxy('/ftp-sync/pricing');
      
      if (!response.success) {
        throw new Error(`FTP pricing sync failed: ${response.errors?.join(', ')}`);
      }

      const pricingData: FTPPricingItem[] = response.data;
      result.processed = pricingData.length;

      const batchSize = 100;
      for (let i = 0; i < pricingData.length; i += batchSize) {
        const batch = pricingData.slice(i, i + batchSize);
        
        try {
          const batchResult = await this.upsertPricingBatch(batch);
          result.updated += batchResult.updated;
          result.failed += batchResult.failed;
          result.errors.push(...batchResult.errors);
        } catch (error) {
          console.error(`❌ Pricing batch ${i}-${i + batchSize} failed:`, error);
          result.failed += batch.length;
          result.errors.push(`Pricing batch ${i}-${i + batchSize}: ${error.message}`);
        }
      }

      result.success = result.failed < result.processed * 0.5;
      result.duration = Date.now() - startTime;

      await this.logSyncCompletion('pricing', 'ftp', result);

      console.log(`✅ FTP pricing sync completed: ${result.updated} updated, ${result.failed} failed`);
      return result;

    } catch (error) {
      console.error('❌ FTP pricing sync failed:', error);
      result.duration = Date.now() - startTime;
      result.errors.push(error.message);
      
      await this.logSyncError('pricing', 'ftp', error.message);
      return result;
    }
  }

  /**
   * Sync kit data via FTP proxy
   */
  async syncKitsFromFTP(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      processed: 0,
      updated: 0,
      failed: 0,
      errors: [],
      duration: 0,
      source: 'ftp'
    };

    try {
      console.log('🔄 Starting FTP kit sync...');
      
      await this.logSyncStart('kits', 'ftp');

      const response = await this.callFTPProxy('/ftp-sync/kits');
      
      if (!response.success) {
        throw new Error(`FTP kit sync failed: ${response.errors?.join(', ')}`);
      }

      const kitData: FTPKitComponent[] = response.data;
      result.processed = kitData.length;

      const batchSize = 50; // Smaller batches for kit components
      for (let i = 0; i < kitData.length; i += batchSize) {
        const batch = kitData.slice(i, i + batchSize);
        
        try {
          const batchResult = await this.upsertKitBatch(batch);
          result.updated += batchResult.updated;
          result.failed += batchResult.failed;
          result.errors.push(...batchResult.errors);
        } catch (error) {
          console.error(`❌ Kit batch ${i}-${i + batchSize} failed:`, error);
          result.failed += batch.length;
          result.errors.push(`Kit batch ${i}-${i + batchSize}: ${error.message}`);
        }
      }

      result.success = result.failed < result.processed * 0.5;
      result.duration = Date.now() - startTime;

      await this.logSyncCompletion('kits', 'ftp', result);

      console.log(`✅ FTP kit sync completed: ${result.updated} updated, ${result.failed} failed`);
      return result;

    } catch (error) {
      console.error('❌ FTP kit sync failed:', error);
      result.duration = Date.now() - startTime;
      result.errors.push(error.message);
      
      await this.logSyncError('kits', 'ftp', error.message);
      return result;
    }
  }

  /**
   * Call FTP proxy endpoint
   */
  private async callFTPProxy(endpoint: string): Promise<FTPSyncResponse> {
    const url = `${this.proxyBaseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication headers
    if (this.securityToken) {
      headers['Authorization'] = `Bearer ${this.securityToken}`;
    }
    if (this.accountNumber) {
      headers['X-Account-Number'] = this.accountNumber;
    }

    console.log(`🌐 Calling FTP proxy: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Upsert inventory batch to database
   */
  private async upsertInventoryBatch(items: FTPInventoryItem[]): Promise<{updated: number, failed: number, errors: string[]}> {
    const result = { updated: 0, failed: 0, errors: [] };

    try {
      // Transform FTP data to match database schema
      const dbItems = items.map(item => ({
        name: item.name,
        description: item.description,
        sku: item.vcpn, // Map VCPN to SKU
        quantity: item.quantity,
        price: item.price,
        cost: item.cost,
        category: item.category,
        supplier: item.brand, // Map brand to supplier
        core_charge: item.core_charge,
        keystone_vcpn: item.vcpn,
        keystone_synced: true,
        keystone_last_sync: new Date().toISOString(),
        keystone_sync_status: 'success',
        warehouse: item.warehouse,
        location: item.location,
        brand: item.brand,
        weight: item.weight,
        availability: item.availability,
        in_stock: item.in_stock,
        images: item.images ? { urls: item.images } : null,
        compatibility: item.compatibility,
        features: item.features,
        updated_at: new Date().toISOString()
      }));

      // Use upsert with keystone_vcpn as the conflict resolution key
      const { data, error } = await this.supabase
        .from('inventory')
        .upsert(dbItems, { 
          onConflict: 'keystone_vcpn',
          ignoreDuplicates: false 
        })
        .select('keystone_vcpn');

      if (error) {
        console.error('❌ Database upsert error:', error);
        result.failed = items.length;
        result.errors.push(`Database error: ${error.message}`);
      } else {
        result.updated = data?.length || items.length;
        console.log(`✅ Upserted ${result.updated} inventory items`);
      }

    } catch (error) {
      console.error('❌ Inventory batch upsert failed:', error);
      result.failed = items.length;
      result.errors.push(`Batch upsert error: ${error.message}`);
    }

    return result;
  }

  /**
   * Upsert pricing batch to database
   */
  private async upsertPricingBatch(items: FTPPricingItem[]): Promise<{updated: number, failed: number, errors: string[]}> {
    const result = { updated: 0, failed: 0, errors: [] };

    try {
      // Transform FTP pricing data to match database schema
      const dbItems = items.map(item => ({
        vcpn: item.vcpn,
        list_price: item.list_price,
        dealer_price: item.dealer_price,
        jobber_price: item.jobber_price,
        retail_price: item.retail_price,
        core_charge: item.core_charge,
        effective_date: item.effective_date,
        currency: item.currency,
        last_updated: new Date().toISOString(),
        sync_source: 'ftp'
      }));

      const { data, error } = await this.supabase
        .from('keystone_pricing')
        .upsert(dbItems, { 
          onConflict: 'vcpn',
          ignoreDuplicates: false 
        })
        .select('vcpn');

      if (error) {
        console.error('❌ Pricing database upsert error:', error);
        result.failed = items.length;
        result.errors.push(`Pricing database error: ${error.message}`);
      } else {
        result.updated = data?.length || items.length;
        console.log(`✅ Upserted ${result.updated} pricing items`);
      }

    } catch (error) {
      console.error('❌ Pricing batch upsert failed:', error);
      result.failed = items.length;
      result.errors.push(`Pricing batch upsert error: ${error.message}`);
    }

    return result;
  }

  /**
   * Upsert kit batch to database
   */
  private async upsertKitBatch(items: FTPKitComponent[]): Promise<{updated: number, failed: number, errors: string[]}> {
    const result = { updated: 0, failed: 0, errors: [] };

    try {
      // Transform FTP kit data to match database schema
      const dbItems = items.map(item => ({
        kit_vcpn: item.kit_vcpn,
        component_vcpn: item.component_vcpn,
        quantity: item.quantity,
        description: item.description || item.component_name,
        required: item.required,
        sync_source: 'ftp',
        last_synced: new Date().toISOString()
      }));

      const { data, error } = await this.supabase
        .from('keystone_kit_components')
        .upsert(dbItems, { 
          onConflict: 'kit_vcpn,component_vcpn',
          ignoreDuplicates: false 
        })
        .select('kit_vcpn, component_vcpn');

      if (error) {
        console.error('❌ Kit database upsert error:', error);
        result.failed = items.length;
        result.errors.push(`Kit database error: ${error.message}`);
      } else {
        result.updated = data?.length || items.length;
        console.log(`✅ Upserted ${result.updated} kit components`);
      }

    } catch (error) {
      console.error('❌ Kit batch upsert failed:', error);
      result.failed = items.length;
      result.errors.push(`Kit batch upsert error: ${error.message}`);
    }

    return result;
  }

  /**
   * Log sync start
   */
  private async logSyncStart(syncType: string, source: string): Promise<void> {
    try {
      await this.supabase
        .from('keystone_sync_logs')
        .insert({
          sync_type: syncType,
          status: 'running',
          source: source,
          started_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('⚠️ Failed to log sync start:', error);
    }
  }

  /**
   * Log sync completion
   */
  private async logSyncCompletion(syncType: string, source: string, result: SyncResult): Promise<void> {
    try {
      await this.supabase
        .from('keystone_sync_logs')
        .insert({
          sync_type: syncType,
          status: result.success ? 'completed' : 'failed',
          source: source,
          started_at: new Date(Date.now() - result.duration).toISOString(),
          completed_at: new Date().toISOString(),
          items_processed: result.processed,
          items_updated: result.updated,
          items_failed: result.failed,
          error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
          sync_details: {
            duration_ms: result.duration,
            errors: result.errors,
            source: source
          }
        });
    } catch (error) {
      console.warn('⚠️ Failed to log sync completion:', error);
    }
  }

  /**
   * Log sync error
   */
  private async logSyncError(syncType: string, source: string, errorMessage: string): Promise<void> {
    try {
      await this.supabase
        .from('keystone_sync_logs')
        .insert({
          sync_type: syncType,
          status: 'failed',
          source: source,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          items_processed: 0,
          items_updated: 0,
          items_failed: 0,
          error_message: errorMessage,
          sync_details: {
            source: source,
            error: errorMessage
          }
        });
    } catch (error) {
      console.warn('⚠️ Failed to log sync error:', error);
    }
  }

  /**
   * Get sync status and history
   */
  async getSyncHistory(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('keystone_sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Failed to get sync history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get sync history:', error);
      return [];
    }
  }

  /**
   * Get last sync info for a specific type and source
   */
  async getLastSyncInfo(syncType: string, source?: string): Promise<any | null> {
    try {
      let query = this.supabase
        .from('keystone_sync_logs')
        .select('*')
        .eq('sync_type', syncType)
        .order('started_at', { ascending: false })
        .limit(1);

      if (source) {
        query = query.eq('source', source);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Failed to get last sync info:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('❌ Failed to get last sync info:', error);
      return null;
    }
  }
}

export default FTPSyncService;
export { FTPSyncService };
export type { SyncResult, FTPInventoryItem, FTPPricingItem, FTPKitComponent };


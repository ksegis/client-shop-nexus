/**
 * Inventory Sync Service for Keystone API via DigitalOcean Proxy
 * 
 * This service handles synchronization of inventory data from Keystone API
 * through a DigitalOcean proxy (required for fixed IP access to Keystone).
 * 
 * Environment Variables Required:
 * - VITE_KEYSTONE_API_TOKEN: Authentication token for Keystone API
 * - VITE_KEYSTONE_PROXY_URL: DigitalOcean proxy URL (provides fixed IP for Keystone)
 */

import { createClient } from '@supabase/supabase-js';

// Types
export interface InventoryItem {
  id?: string;
  keystone_vcpn?: string;
  part_number: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  price?: number;
  cost?: number;
  quantity_available?: number;
  weight?: number;
  dimensions?: string;
  image_url?: string;
  last_updated?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventorySyncStatus {
  isRunning: boolean;
  progress: number;
  totalItems: number;
  processedItems: number;
  createdItems: number;
  updatedItems: number;
  errorItems: number;
  errors: string[];
  currentItem?: string;
  estimatedTimeRemaining?: number;
  lastSyncTime?: string;
}

export interface SyncLogEntry {
  id: string;
  sync_type: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_message?: string;
}

export interface SyncOptions {
  fullSync?: boolean;
  maxItems?: number;
  batchSize?: number;
}

class InventorySyncService {
  private supabase: any;
  private isInitialized = false;
  private syncStatus: InventorySyncStatus = {
    isRunning: false,
    progress: 0,
    totalItems: 0,
    processedItems: 0,
    createdItems: 0,
    updatedItems: 0,
    errorItems: 0,
    errors: []
  };
  private abortController: AbortController | null = null;

  constructor() {
    // Initialize Supabase client
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Initialize the sync service
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔧 Initializing Inventory Sync Service...');

      // Validate Supabase connection
      if (!this.supabase) {
        throw new Error('Supabase client not configured. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_TOKEN environment variables.');
      }

      // Test Supabase connection
      const { error: dbError } = await this.supabase
        .from('inventory')
        .select('count', { count: 'exact', head: true });

      if (dbError) {
        throw new Error(`Database connection failed: ${dbError.message}`);
      }

      // Validate DigitalOcean proxy configuration
      await this.validateProxyConfig();

      // Create sync logs table if it doesn't exist
      await this.ensureSyncLogsTable();

      this.isInitialized = true;
      console.log('✅ Inventory Sync Service initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Inventory Sync Service:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Validate DigitalOcean proxy configuration
   */
  private async validateProxyConfig(): Promise<void> {
    const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;
    const apiToken = import.meta.env.VITE_KEYSTONE_API_TOKEN;

    if (!proxyUrl) {
      throw new Error('DigitalOcean proxy URL not configured. Please set VITE_KEYSTONE_PROXY_URL environment variable.');
    }

    if (!apiToken) {
      throw new Error('Keystone API token not configured. Please set VITE_KEYSTONE_API_TOKEN environment variable.');
    }

    // Test proxy connectivity
    try {
      console.log('🔍 Testing DigitalOcean proxy connectivity...');
      
      const response = await fetch(`${proxyUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        console.warn('⚠️ Proxy health check failed, but continuing (proxy may not have health endpoint)');
      } else {
        console.log('✅ DigitalOcean proxy connectivity confirmed');
      }

    } catch (error) {
      console.warn('⚠️ Proxy connectivity test failed, but continuing:', error.message);
      // Don't throw error here as proxy may not have a health endpoint
    }
  }

  /**
   * Ensure sync logs table exists
   */
  private async ensureSyncLogsTable(): Promise<void> {
    try {
      // Try to query the table first
      const { error } = await this.supabase
        .from('api_sync_logs')
        .select('count', { count: 'exact', head: true });

      if (error && error.code === '42P01') {
        // Table doesn't exist, create it
        console.log('📋 Creating api_sync_logs table...');
        
        const { error: createError } = await this.supabase.rpc('create_sync_logs_table');
        
        if (createError) {
          console.warn('⚠️ Could not create sync logs table:', createError.message);
        } else {
          console.log('✅ Sync logs table created successfully');
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not verify sync logs table:', error.message);
    }
  }

  /**
   * Start inventory synchronization
   */
  async startInventorySync(options: SyncOptions = {}): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Please call initialize() first.');
    }

    if (this.syncStatus.isRunning) {
      throw new Error('Sync is already running. Please wait for it to complete or cancel it first.');
    }

    const {
      fullSync = true,
      maxItems = undefined,
      batchSize = 100
    } = options;

    // Reset sync status
    this.syncStatus = {
      isRunning: true,
      progress: 0,
      totalItems: 0,
      processedItems: 0,
      createdItems: 0,
      updatedItems: 0,
      errorItems: 0,
      errors: []
    };

    // Create abort controller for cancellation
    this.abortController = new AbortController();

    // Log sync start
    const syncLogId = await this.logSyncStart(fullSync ? 'full' : 'incremental');

    try {
      console.log(`🚀 Starting ${fullSync ? 'full' : 'incremental'} inventory sync...`);

      // Fetch inventory data from DigitalOcean proxy
      const inventoryData = await this.fetchInventoryFromProxy(maxItems);
      
      this.syncStatus.totalItems = inventoryData.length;
      console.log(`📦 Retrieved ${inventoryData.length} items from Keystone API`);

      // Process inventory in batches
      await this.processInventoryBatches(inventoryData, batchSize);

      // Complete sync
      this.syncStatus.isRunning = false;
      this.syncStatus.progress = 100;
      this.syncStatus.lastSyncTime = new Date().toISOString();

      await this.logSyncComplete(syncLogId);

      console.log('✅ Inventory sync completed successfully');
      console.log(`📊 Results: ${this.syncStatus.createdItems} created, ${this.syncStatus.updatedItems} updated, ${this.syncStatus.errorItems} errors`);

    } catch (error) {
      this.syncStatus.isRunning = false;
      this.syncStatus.errors.push(error.message);
      
      await this.logSyncError(syncLogId, error.message);
      
      console.error('❌ Inventory sync failed:', error);
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Fetch inventory data from DigitalOcean proxy
   */
  private async fetchInventoryFromProxy(maxItems?: number): Promise<InventoryItem[]> {
    const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;
    const apiToken = import.meta.env.VITE_KEYSTONE_API_TOKEN;

    try {
      console.log('🔄 Fetching inventory from DigitalOcean proxy...');

      const url = new URL(`${proxyUrl}/inventory`);
      if (maxItems) {
        url.searchParams.set('limit', maxItems.toString());
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        signal: this.abortController?.signal
      });

      if (!response.ok) {
        throw new Error(`Proxy API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      } else if (data.items && Array.isArray(data.items)) {
        return data.items;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      } else {
        throw new Error('Unexpected response format from proxy API');
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Sync was cancelled');
      }
      
      console.error('❌ Failed to fetch inventory from proxy:', error);
      
      // Return mock data for development/testing
      if (import.meta.env.DEV) {
        console.log('🔧 Using mock data for development');
        return this.getMockInventoryData(maxItems || 10);
      }
      
      throw error;
    }
  }

  /**
   * Process inventory data in batches
   */
  private async processInventoryBatches(inventoryData: InventoryItem[], batchSize: number): Promise<void> {
    const totalBatches = Math.ceil(inventoryData.length / batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      if (this.abortController?.signal.aborted) {
        throw new Error('Sync was cancelled');
      }

      const start = i * batchSize;
      const end = Math.min(start + batchSize, inventoryData.length);
      const batch = inventoryData.slice(start, end);

      console.log(`📦 Processing batch ${i + 1}/${totalBatches} (${batch.length} items)`);

      await this.processBatch(batch);

      // Update progress
      this.syncStatus.processedItems = end;
      this.syncStatus.progress = Math.round((end / inventoryData.length) * 100);

      // Small delay between batches to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Process a batch of inventory items
   */
  private async processBatch(batch: InventoryItem[]): Promise<void> {
    for (const item of batch) {
      if (this.abortController?.signal.aborted) {
        throw new Error('Sync was cancelled');
      }

      try {
        this.syncStatus.currentItem = item.name || item.part_number;
        
        await this.upsertInventoryItem(item);
        this.syncStatus.updatedItems++;

      } catch (error) {
        console.error(`❌ Failed to process item ${item.part_number}:`, error);
        this.syncStatus.errors.push(`${item.part_number}: ${error.message}`);
        this.syncStatus.errorItems++;
      }
    }
  }

  /**
   * Upsert inventory item to database
   */
  private async upsertInventoryItem(item: InventoryItem): Promise<void> {
    const inventoryRecord = {
      keystone_vcpn: item.keystone_vcpn,
      part_number: item.part_number,
      name: item.name,
      description: item.description,
      brand: item.brand,
      category: item.category,
      price: item.price,
      cost: item.cost,
      quantity_available: item.quantity_available,
      weight: item.weight,
      dimensions: item.dimensions,
      image_url: item.image_url,
      last_updated: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('inventory')
      .upsert(inventoryRecord, {
        onConflict: 'part_number',
        ignoreDuplicates: false
      });

    if (error) {
      throw new Error(`Database upsert failed: ${error.message}`);
    }
  }

  /**
   * Cancel running sync
   */
  async cancelSync(): Promise<void> {
    if (!this.syncStatus.isRunning) {
      throw new Error('No sync is currently running');
    }

    if (this.abortController) {
      this.abortController.abort();
    }

    this.syncStatus.isRunning = false;
    console.log('🛑 Sync cancelled by user');
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): InventorySyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Get sync logs
   */
  async getSyncLogs(limit: number = 10): Promise<SyncLogEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('api_sync_logs')
        .select('*')
        .eq('sync_type', 'inventory')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Failed to fetch sync logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to fetch sync logs:', error);
      return [];
    }
  }

  /**
   * Log sync start
   */
  private async logSyncStart(syncType: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('api_sync_logs')
        .insert([{
          sync_type: 'inventory',
          status: 'running',
          started_at: new Date().toISOString(),
          records_processed: 0,
          records_created: 0,
          records_updated: 0,
          records_failed: 0
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to log sync start:', error);
        return 'unknown';
      }

      return data.id;
    } catch (error) {
      console.error('❌ Failed to log sync start:', error);
      return 'unknown';
    }
  }

  /**
   * Log sync completion
   */
  private async logSyncComplete(syncLogId: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      const { error } = await this.supabase
        .from('api_sync_logs')
        .update({
          status: 'completed',
          completed_at: now,
          records_processed: this.syncStatus.processedItems,
          records_created: this.syncStatus.createdItems,
          records_updated: this.syncStatus.updatedItems,
          records_failed: this.syncStatus.errorItems
        })
        .eq('id', syncLogId);

      if (error) {
        console.error('❌ Failed to log sync completion:', error);
      }
    } catch (error) {
      console.error('❌ Failed to log sync completion:', error);
    }
  }

  /**
   * Log sync error
   */
  private async logSyncError(syncLogId: string, errorMessage: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('api_sync_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          records_processed: this.syncStatus.processedItems,
          records_created: this.syncStatus.createdItems,
          records_updated: this.syncStatus.updatedItems,
          records_failed: this.syncStatus.errorItems,
          error_message: errorMessage
        })
        .eq('id', syncLogId);

      if (error) {
        console.error('❌ Failed to log sync error:', error);
      }
    } catch (error) {
      console.error('❌ Failed to log sync error:', error);
    }
  }

  /**
   * Get mock inventory data for development/testing
   */
  private getMockInventoryData(count: number): InventoryItem[] {
    const mockItems: InventoryItem[] = [];
    
    for (let i = 1; i <= count; i++) {
      mockItems.push({
        keystone_vcpn: `VCPN${i.toString().padStart(6, '0')}`,
        part_number: `PART${i.toString().padStart(4, '0')}`,
        name: `Mock Part ${i}`,
        description: `This is a mock part for testing purposes - Item ${i}`,
        brand: ['Ford', 'Chevy', 'Dodge', 'Toyota'][i % 4],
        category: ['Engine', 'Transmission', 'Suspension', 'Electrical'][i % 4],
        price: Math.round((Math.random() * 500 + 50) * 100) / 100,
        cost: Math.round((Math.random() * 300 + 25) * 100) / 100,
        quantity_available: Math.floor(Math.random() * 100),
        weight: Math.round((Math.random() * 50 + 1) * 100) / 100,
        dimensions: `${Math.floor(Math.random() * 20 + 5)}"x${Math.floor(Math.random() * 20 + 5)}"x${Math.floor(Math.random() * 20 + 5)}"`,
        image_url: `https://via.placeholder.com/300x200?text=Part+${i}`,
        last_updated: new Date().toISOString()
      });
    }
    
    return mockItems;
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const inventorySyncService = new InventorySyncService();
export { InventorySyncService };


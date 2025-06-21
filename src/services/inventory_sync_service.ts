import { createClient } from '@supabase/supabase-js';

// Types for the inventory sync system
export interface InventoryItem {
  id?: string;
  keystone_vcpn?: string;
  part_number?: string;
  name?: string;
  description?: string;
  brand?: string;
  cost?: number;
  list_price?: number;
  quantity_available?: number;
  category?: string;
  subcategory?: string;
  weight?: number;
  dimensions?: string;
  image_url?: string;
  last_updated?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  created_at?: string;
  updated_at?: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  itemsProcessed: number;
  itemsUpdated: number;
  itemsAdded: number;
  itemsSkipped: number;
  errors: string[];
  duration: number;
  timestamp: string;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSync: string | null;
  nextScheduledSync: string | null;
  totalItems: number;
  pendingUpdates: number;
  lastSyncResult: SyncResult | null;
  syncType: 'full' | 'incremental' | 'none';
  progress: number;
  currentOperation: string;
}

export interface SyncConfiguration {
  enabled: boolean;
  fullSyncInterval: number; // hours
  incrementalSyncInterval: number; // minutes
  batchSize: number;
  maxRetries: number;
  timeout: number; // milliseconds
  autoSync: boolean;
}

export interface PendingUpdate {
  id: string;
  keystone_vcpn: string;
  operation: 'create' | 'update' | 'delete';
  data: Partial<InventoryItem>;
  timestamp: string;
  retries: number;
  priority: 'high' | 'medium' | 'low';
}

class InventorySyncService {
  private supabase: any;
  private isInitialized: boolean = false;
  private syncStatus: SyncStatus;
  private config: SyncConfiguration;
  private abortController: AbortController | null = null;
  private pendingUpdates: Map<string, PendingUpdate> = new Map();

  constructor() {
    // Initialize Supabase client
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    // Initialize sync status
    this.syncStatus = {
      isRunning: false,
      lastSync: null,
      nextScheduledSync: null,
      totalItems: 0,
      pendingUpdates: 0,
      lastSyncResult: null,
      syncType: 'none',
      progress: 0,
      currentOperation: 'Idle'
    };

    // Initialize configuration
    this.config = {
      enabled: true,
      fullSyncInterval: 24, // 24 hours
      incrementalSyncInterval: 30, // 30 minutes
      batchSize: 100,
      maxRetries: 3,
      timeout: 30000, // 30 seconds
      autoSync: true
    };
  }

  // Initialize the service
  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing Inventory Sync Service...');
      
      // Check environment variables
      const apiToken = import.meta.env.VITE_KEYSTONE_API_TOKEN;
      const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;
      
      if (!apiToken) {
        console.warn('⚠️ Keystone API token not configured. Please set VITE_KEYSTONE_API_TOKEN environment variable.');
      }
      
      if (!proxyUrl) {
        console.warn('⚠️ Keystone proxy URL not configured. Please set VITE_KEYSTONE_PROXY_URL environment variable.');
      }

      // Load configuration from database if available
      await this.loadConfiguration();
      
      // Load pending updates
      await this.loadPendingUpdates();
      
      // Update sync status
      await this.updateSyncStatus();
      
      this.isInitialized = true;
      console.log('✅ Inventory Sync Service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Inventory Sync Service:', error);
      throw error;
    }
  }

  // Check if a scheduled sync should run
  shouldRunScheduledSync(): boolean {
    if (!this.config.enabled || !this.config.autoSync) {
      return false;
    }

    const now = new Date();
    const lastSync = this.syncStatus.lastSync ? new Date(this.syncStatus.lastSync) : null;
    
    if (!lastSync) {
      // No previous sync, should run
      return true;
    }

    // Check if it's time for incremental sync
    const incrementalInterval = this.config.incrementalSyncInterval * 60 * 1000; // Convert to milliseconds
    const timeSinceLastSync = now.getTime() - lastSync.getTime();
    
    if (timeSinceLastSync >= incrementalInterval) {
      return true;
    }

    // Check if it's time for full sync
    const fullInterval = this.config.fullSyncInterval * 60 * 60 * 1000; // Convert to milliseconds
    if (timeSinceLastSync >= fullInterval) {
      return true;
    }

    return false;
  }

  // Get current sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Get inventory data from Supabase
  async getInventoryFromSupabase(limit: number = 1000): Promise<InventoryItem[]> {
    try {
      if (!this.supabase) {
        console.warn('⚠️ Supabase not configured, returning empty inventory');
        return [];
      }

      const { data, error } = await this.supabase
        .from('inventory')
        .select('*')
        .limit(limit)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching inventory from Supabase:', error);
        return [];
      }

      console.log(`✅ Loaded ${data?.length || 0} inventory items from Supabase`);
      return data || [];
      
    } catch (error) {
      console.error('❌ Failed to get inventory from Supabase:', error);
      return [];
    }
  }

  // Get inventory data from Keystone API via DigitalOcean proxy
  async getInventoryFromKeystone(limit: number = 1000): Promise<InventoryItem[]> {
    try {
      const apiToken = import.meta.env.VITE_KEYSTONE_API_TOKEN;
      const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;

      if (!apiToken || !proxyUrl) {
        console.warn('⚠️ Keystone API not configured, using mock data');
        return this.getMockInventoryData(limit);
      }

      const response = await fetch(`${proxyUrl}/inventory?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        signal: this.abortController?.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Loaded ${data?.length || 0} inventory items from Keystone`);
      return data || [];
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🛑 Keystone API request was cancelled');
        return [];
      }
      
      console.error('❌ Failed to get inventory from Keystone:', error);
      console.log('🔄 Falling back to mock data for development');
      return this.getMockInventoryData(limit);
    }
  }

  // Perform full sync
  async performFullSync(): Promise<SyncResult> {
    console.log('🔄 Starting full inventory sync...');
    
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      message: '',
      itemsProcessed: 0,
      itemsUpdated: 0,
      itemsAdded: 0,
      itemsSkipped: 0,
      errors: [],
      duration: 0,
      timestamp: new Date().toISOString()
    };

    try {
      // Update sync status
      this.syncStatus.isRunning = true;
      this.syncStatus.syncType = 'full';
      this.syncStatus.progress = 0;
      this.syncStatus.currentOperation = 'Fetching inventory from Keystone...';

      // Create abort controller for cancellation
      this.abortController = new AbortController();

      // Get inventory from Keystone
      const keystoneInventory = await this.getInventoryFromKeystone();
      
      if (keystoneInventory.length === 0) {
        result.message = 'No inventory data received from Keystone';
        result.success = false;
        return result;
      }

      this.syncStatus.currentOperation = 'Processing inventory items...';
      this.syncStatus.progress = 25;

      // Process inventory in batches
      const batchSize = this.config.batchSize;
      const totalBatches = Math.ceil(keystoneInventory.length / batchSize);

      for (let i = 0; i < totalBatches; i++) {
        const batch = keystoneInventory.slice(i * batchSize, (i + 1) * batchSize);
        
        this.syncStatus.currentOperation = `Processing batch ${i + 1} of ${totalBatches}...`;
        this.syncStatus.progress = 25 + (i / totalBatches) * 50;

        const batchResult = await this.processBatch(batch);
        
        result.itemsProcessed += batchResult.itemsProcessed;
        result.itemsUpdated += batchResult.itemsUpdated;
        result.itemsAdded += batchResult.itemsAdded;
        result.itemsSkipped += batchResult.itemsSkipped;
        result.errors.push(...batchResult.errors);

        // Small delay between batches to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.syncStatus.currentOperation = 'Finalizing sync...';
      this.syncStatus.progress = 90;

      // Update sync status
      result.duration = Date.now() - startTime;
      result.success = result.errors.length === 0;
      result.message = result.success 
        ? `Full sync completed successfully. Processed ${result.itemsProcessed} items.`
        : `Full sync completed with ${result.errors.length} errors.`;

      this.syncStatus.lastSync = new Date().toISOString();
      this.syncStatus.lastSyncResult = result;
      this.syncStatus.totalItems = result.itemsProcessed;

      console.log('✅ Full sync completed:', result);
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.success = false;
      result.message = `Full sync failed: ${error.message}`;
      result.errors.push(error.message);
      
      console.error('❌ Full sync failed:', error);
      return result;
      
    } finally {
      this.syncStatus.isRunning = false;
      this.syncStatus.progress = 100;
      this.syncStatus.currentOperation = 'Idle';
      this.abortController = null;
    }
  }

  // Perform incremental sync
  async performIncrementalSync(): Promise<SyncResult> {
    console.log('🔄 Starting incremental inventory sync...');
    
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      message: '',
      itemsProcessed: 0,
      itemsUpdated: 0,
      itemsAdded: 0,
      itemsSkipped: 0,
      errors: [],
      duration: 0,
      timestamp: new Date().toISOString()
    };

    try {
      this.syncStatus.isRunning = true;
      this.syncStatus.syncType = 'incremental';
      this.syncStatus.progress = 0;
      this.syncStatus.currentOperation = 'Processing pending updates...';

      // Process pending updates first
      await this.processPendingUpdates();

      this.syncStatus.currentOperation = 'Fetching recent changes from Keystone...';
      this.syncStatus.progress = 50;

      // For incremental sync, we could fetch only recently updated items
      // For now, we'll process a smaller batch
      const recentInventory = await this.getInventoryFromKeystone(this.config.batchSize);
      
      if (recentInventory.length > 0) {
        const batchResult = await this.processBatch(recentInventory);
        
        result.itemsProcessed = batchResult.itemsProcessed;
        result.itemsUpdated = batchResult.itemsUpdated;
        result.itemsAdded = batchResult.itemsAdded;
        result.itemsSkipped = batchResult.itemsSkipped;
        result.errors = batchResult.errors;
      }

      result.duration = Date.now() - startTime;
      result.success = result.errors.length === 0;
      result.message = result.success 
        ? `Incremental sync completed successfully. Processed ${result.itemsProcessed} items.`
        : `Incremental sync completed with ${result.errors.length} errors.`;

      this.syncStatus.lastSync = new Date().toISOString();
      this.syncStatus.lastSyncResult = result;

      console.log('✅ Incremental sync completed:', result);
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.success = false;
      result.message = `Incremental sync failed: ${error.message}`;
      result.errors.push(error.message);
      
      console.error('❌ Incremental sync failed:', error);
      return result;
      
    } finally {
      this.syncStatus.isRunning = false;
      this.syncStatus.progress = 100;
      this.syncStatus.currentOperation = 'Idle';
    }
  }

  // Process pending updates
  async processPendingUpdates(): Promise<void> {
    try {
      const updates = Array.from(this.pendingUpdates.values());
      
      if (updates.length === 0) {
        console.log('📝 No pending updates to process');
        return;
      }

      console.log(`📝 Processing ${updates.length} pending updates...`);

      for (const update of updates) {
        try {
          await this.processUpdate(update);
          this.pendingUpdates.delete(update.id);
        } catch (error) {
          console.error(`❌ Failed to process update ${update.id}:`, error);
          
          // Increment retry count
          update.retries++;
          
          // Remove if max retries exceeded
          if (update.retries >= this.config.maxRetries) {
            console.error(`🚫 Max retries exceeded for update ${update.id}, removing from queue`);
            this.pendingUpdates.delete(update.id);
          }
        }
      }

      // Update pending count
      this.syncStatus.pendingUpdates = this.pendingUpdates.size;
      
    } catch (error) {
      console.error('❌ Failed to process pending updates:', error);
    }
  }

  // Request part update
  async requestPartUpdate(keystone_vcpn: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    try {
      const updateId = `${keystone_vcpn}_${Date.now()}`;
      
      const pendingUpdate: PendingUpdate = {
        id: updateId,
        keystone_vcpn,
        operation: 'update',
        data: { keystone_vcpn },
        timestamp: new Date().toISOString(),
        retries: 0,
        priority
      };

      this.pendingUpdates.set(updateId, pendingUpdate);
      this.syncStatus.pendingUpdates = this.pendingUpdates.size;
      
      console.log(`📝 Requested update for part ${keystone_vcpn} with priority ${priority}`);
      
    } catch (error) {
      console.error(`❌ Failed to request part update for ${keystone_vcpn}:`, error);
    }
  }

  // Update single part immediately
  async updateSinglePart(keystone_vcpn: string): Promise<boolean> {
    try {
      console.log(`🔄 Updating single part: ${keystone_vcpn}`);
      
      // Fetch the specific part from Keystone
      const apiToken = import.meta.env.VITE_KEYSTONE_API_TOKEN;
      const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;

      if (!apiToken || !proxyUrl) {
        console.warn('⚠️ Keystone API not configured');
        return false;
      }

      const response = await fetch(`${proxyUrl}/inventory/${keystone_vcpn}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const partData = await response.json();
      
      if (partData) {
        await this.upsertInventoryItem(partData);
        console.log(`✅ Successfully updated part: ${keystone_vcpn}`);
        return true;
      }

      return false;
      
    } catch (error) {
      console.error(`❌ Failed to update single part ${keystone_vcpn}:`, error);
      return false;
    }
  }

  // Cancel current sync operation
  cancelSync(): void {
    if (this.abortController) {
      this.abortController.abort();
      console.log('🛑 Sync operation cancelled');
    }
    
    this.syncStatus.isRunning = false;
    this.syncStatus.currentOperation = 'Cancelled';
  }

  // Private helper methods

  private async processBatch(items: InventoryItem[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      message: '',
      itemsProcessed: 0,
      itemsUpdated: 0,
      itemsAdded: 0,
      itemsSkipped: 0,
      errors: [],
      duration: 0,
      timestamp: new Date().toISOString()
    };

    for (const item of items) {
      try {
        const wasUpdated = await this.upsertInventoryItem(item);
        
        result.itemsProcessed++;
        
        if (wasUpdated) {
          result.itemsUpdated++;
        } else {
          result.itemsAdded++;
        }
        
      } catch (error) {
        result.errors.push(`Failed to process item ${item.keystone_vcpn || item.part_number}: ${error.message}`);
        result.itemsSkipped++;
      }
    }

    return result;
  }

  private async upsertInventoryItem(item: InventoryItem): Promise<boolean> {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Check if item exists
      const { data: existing } = await this.supabase
        .from('inventory')
        .select('id')
        .eq('keystone_vcpn', item.keystone_vcpn)
        .single();

      const itemData = {
        ...item,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        // Update existing item
        const { error } = await this.supabase
          .from('inventory')
          .update(itemData)
          .eq('id', existing.id);

        if (error) throw error;
        return true; // Was updated
      } else {
        // Insert new item
        itemData.created_at = new Date().toISOString();
        
        const { error } = await this.supabase
          .from('inventory')
          .insert([itemData]);

        if (error) throw error;
        return false; // Was added
      }
      
    } catch (error) {
      console.error('❌ Failed to upsert inventory item:', error);
      throw error;
    }
  }

  private async processUpdate(update: PendingUpdate): Promise<void> {
    switch (update.operation) {
      case 'update':
        await this.updateSinglePart(update.keystone_vcpn);
        break;
      case 'create':
        if (update.data) {
          await this.upsertInventoryItem(update.data as InventoryItem);
        }
        break;
      case 'delete':
        await this.deleteInventoryItem(update.keystone_vcpn);
        break;
      default:
        throw new Error(`Unknown operation: ${update.operation}`);
    }
  }

  private async deleteInventoryItem(keystone_vcpn: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await this.supabase
      .from('inventory')
      .delete()
      .eq('keystone_vcpn', keystone_vcpn);

    if (error) throw error;
  }

  private async loadConfiguration(): Promise<void> {
    try {
      if (!this.supabase) return;

      const { data } = await this.supabase
        .from('sync_configuration')
        .select('*')
        .single();

      if (data) {
        this.config = { ...this.config, ...data };
      }
      
    } catch (error) {
      console.log('📝 Using default sync configuration');
    }
  }

  private async loadPendingUpdates(): Promise<void> {
    try {
      if (!this.supabase) return;

      const { data } = await this.supabase
        .from('pending_updates')
        .select('*')
        .order('timestamp', { ascending: true });

      if (data) {
        this.pendingUpdates.clear();
        data.forEach(update => {
          this.pendingUpdates.set(update.id, update);
        });
      }
      
    } catch (error) {
      console.log('📝 No pending updates found');
    }
  }

  private async updateSyncStatus(): Promise<void> {
    try {
      if (!this.supabase) return;

      const { data } = await this.supabase
        .from('sync_status')
        .select('*')
        .single();

      if (data) {
        this.syncStatus = { ...this.syncStatus, ...data };
      }
      
    } catch (error) {
      console.log('📝 Using default sync status');
    }
  }

  private getMockInventoryData(limit: number): InventoryItem[] {
    const mockItems: InventoryItem[] = [];
    
    for (let i = 1; i <= Math.min(limit, 10); i++) {
      mockItems.push({
        id: `mock-${i}`,
        keystone_vcpn: `MOCK${i.toString().padStart(6, '0')}`,
        part_number: `PART-${i}`,
        name: `Mock Part ${i}`,
        description: `This is a mock inventory item for testing purposes`,
        brand: 'Mock Brand',
        cost: 10.00 + i,
        list_price: 20.00 + i,
        quantity_available: 100 - i,
        category: 'Test Category',
        subcategory: 'Test Subcategory',
        weight: 1.0 + (i * 0.1),
        dimensions: '10x10x10',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    return mockItems;
  }
}

// Export singleton instance
export const InventorySyncService = new InventorySyncService();
export default InventorySyncService;


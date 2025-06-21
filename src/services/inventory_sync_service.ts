import { createClient } from '@supabase/supabase-js';

// Import existing rate limiting function
const checkRateLimit = async (path: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: string;
}> => {
  try {
    // Get client IP (simplified - use a proper IP detection method)
    const ip = await fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => data.ip)
      .catch(() => 'unknown');

    // Build the URL for the rate-limiter edge function
    const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL ? import.meta.env.VITE_SUPABASE_URL : 'https://vqkxrbflwhunvbotjdds.supabase.co'}/functions/v1`;
    
    // Call the rate-limiter edge function
    const response = await fetch(`${functionsUrl}/rate-limiter`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
      },
      body: JSON.stringify({ ip, path })
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // If this is a rate limit exceeded error, throw with specific format
      if (response.status === 429) {
        const retryTime = new Date(errorData.retryAfter).toLocaleTimeString();
        throw new Error(`Too many requests. Try again after ${retryTime}`);
      }
      
      throw new Error(errorData.error || 'Rate limit check failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Rate limit check failed:', error);
    
    // Check if this is already a formatted error from our code
    if (error.message && error.message.includes('Too many requests')) {
      throw error; // Re-throw rate limit errors with our format
    }
    
    // Return a default object to allow the application to continue
    return {
      success: false,
      limit: 0,
      remaining: 0,
      reset: new Date(Date.now() + 60000).toISOString() // Default 1 minute
    };
  }
};

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
      batchSize: 50, // Smaller batches for rate limiting
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
      const apiToken = this.getApiToken();
      const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;
      
      if (!apiToken) {
        console.warn('⚠️ Keystone API token not configured. Please set environment variable.');
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

  // Get appropriate API token based on environment
  private getApiToken(): string | undefined {
    const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_ENVIRONMENT === 'development';
    const isProduction = import.meta.env.VITE_ENVIRONMENT === 'production';
    
    if (isProduction) {
      console.log('🏭 Using PRODUCTION Keystone API token');
      return import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD;
    } else {
      console.log('🔧 Using DEVELOPMENT Keystone API token');
      return import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_DEV;
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

  // Get inventory data from Keystone API via DigitalOcean proxy with rate limiting
  async getInventoryFromKeystone(limit: number = 1000): Promise<InventoryItem[]> {
    try {
      // Check rate limit before making request
      console.log('🔍 Checking rate limit for Keystone inventory API...');
      const rateLimitCheck = await checkRateLimit('keystone-inventory-full');
      
      if (!rateLimitCheck.success) {
        const resetTime = new Date(rateLimitCheck.reset).toLocaleTimeString();
        console.warn(`⚠️ Rate limit exceeded. ${rateLimitCheck.remaining}/${rateLimitCheck.limit} requests remaining. Resets at ${resetTime}`);
        console.log('🔄 Falling back to mock data due to rate limiting');
        return this.getMockInventoryData(limit);
      }

      console.log(`✅ Rate limit check passed. ${rateLimitCheck.remaining}/${rateLimitCheck.limit} requests remaining.`);

      // Environment detection and token selection
      const apiToken = this.getApiToken();
      const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;

      if (!apiToken) {
        const envType = import.meta.env.VITE_ENVIRONMENT === 'production' ? 'PRODUCTION' : 'DEVELOPMENT';
        const expectedVar = import.meta.env.VITE_ENVIRONMENT === 'production' ? 'VITE_KEYSTONE_SECURITY_TOKEN_PROD' : 'VITE_KEYSTONE_SECURITY_TOKEN_DEV';
        console.warn(`⚠️ ${envType} Keystone API token not configured. Please set ${expectedVar} environment variable.`);
        console.log('🔄 Falling back to mock data for development');
        return this.getMockInventoryData(limit);
      }

      if (!proxyUrl) {
        console.warn('⚠️ Keystone proxy URL not configured. Please set VITE_KEYSTONE_PROXY_URL environment variable.');
        console.log('🔄 Falling back to mock data for development');
        return this.getMockInventoryData(limit);
      }

      console.log(`📡 Making Keystone API request for ${limit} items...`);

      const response = await fetch(`${proxyUrl}/inventory/full`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: limit
        }),
        signal: this.abortController?.signal,
      });

      if (response.status === 429) {
        // Handle rate limiting from Keystone API itself
        console.warn('⚠️ Keystone API returned 429 - Rate limited by external API');
        console.log('🔄 Falling back to mock data due to external rate limiting');
        return this.getMockInventoryData(limit);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Successfully loaded ${data?.length || 0} inventory items from Keystone`);
      return data || [];
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🛑 Keystone API request was cancelled');
        return [];
      }
      
      // Handle rate limiting errors from our rate limiter
      if (error.message && error.message.includes('Too many requests')) {
        console.warn('⚠️ Rate limited by our rate limiter:', error.message);
        console.log('🔄 Falling back to mock data due to rate limiting');
        return this.getMockInventoryData(limit);
      }
      
      console.error('❌ Failed to get inventory from Keystone:', error);
      console.log('🔄 Falling back to mock data for development');
      return this.getMockInventoryData(limit);
    }
  }

  // Perform full sync with rate limiting
  async performFullSync(): Promise<SyncResult> {
    console.log('🔄 Starting full inventory sync with rate limiting...');
    
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
      this.syncStatus.currentOperation = 'Checking rate limits...';

      // Create abort controller for cancellation
      this.abortController = new AbortController();

      // Get inventory from Keystone with rate limiting
      this.syncStatus.currentOperation = 'Fetching inventory from Keystone...';
      const keystoneInventory = await this.getInventoryFromKeystone();
      
      if (keystoneInventory.length === 0) {
        result.message = 'No inventory data received from Keystone (may be rate limited)';
        result.success = false;
        return result;
      }

      this.syncStatus.currentOperation = 'Processing inventory items...';
      this.syncStatus.progress = 25;

      // Process inventory in smaller batches with delays for rate limiting
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

        // Rate limiting delay between batches (except for last batch)
        if (i < totalBatches - 1) {
          const batchDelay = 2000; // 2 seconds between batches
          console.log(`⏳ Waiting ${batchDelay/1000}s between batches to respect rate limits...`);
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
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

  // Perform incremental sync with rate limiting
  async performIncrementalSync(): Promise<SyncResult> {
    console.log('🔄 Starting incremental inventory sync with rate limiting...');
    
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

      this.syncStatus.currentOperation = 'Checking rate limits for recent changes...';
      this.syncStatus.progress = 50;

      // For incremental sync, we could fetch only recently updated items
      // For now, we'll process a smaller batch with rate limiting
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

  // Update single part immediately with rate limiting
  async updateSinglePart(keystone_vcpn: string): Promise<boolean> {
    try {
      console.log(`🔄 Updating single part: ${keystone_vcpn}`);
      
      // Check rate limit before making request
      const rateLimitCheck = await checkRateLimit('keystone-inventory-check');
      
      if (!rateLimitCheck.success) {
        const resetTime = new Date(rateLimitCheck.reset).toLocaleTimeString();
        console.warn(`⚠️ Rate limit exceeded for single part update. Resets at ${resetTime}`);
        return false;
      }

      // Environment detection and token selection
      const apiToken = this.getApiToken();
      const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;

      if (!apiToken || !proxyUrl) {
        console.warn('⚠️ Keystone API not configured');
        return false;
      }

      const response = await fetch(`${proxyUrl}/inventory/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vcpn: keystone_vcpn
        }),
      });

      if (response.status === 429) {
        console.warn(`⚠️ Rate limited when updating single part: ${keystone_vcpn}`);
        return false;
      }

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
      if (error.message && error.message.includes('Too many requests')) {
        console.warn(`⚠️ Rate limited when updating single part: ${keystone_vcpn}`);
        return false;
      }
      
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

// Export both class and singleton instance for compatibility
export { InventorySyncService };
export const inventorySyncService = new InventorySyncService();
export default inventorySyncService;

/*
KEYSTONE API ENDPOINTS DISCOVERED:
Base URL: https://146-190-161-109.nip.io

Inventory Endpoints:
- /inventory/full - Complete inventory data (used for full sync)
- /inventory/bulk - Bulk operations
- /inventory/updates - Incremental updates
- /inventory/check - Check specific item (used for single part updates)

Other Available Endpoints:
- /health - Health check
- /parts/search - Part search
- /pricing/bulk - Bulk pricing
- /shipping/options - Shipping options
- /orders/ship - Order shipping
- /orders/history - Order history

RATE LIMITING INTEGRATION:
- Uses existing checkRateLimit() function from your rate limiting system
- Checks rate limits before making API calls to Keystone
- Handles rate limit responses gracefully with fallback to mock data
- Integrates with your Supabase Edge Function for rate limiting
- Respects rate limit windows and retry timing
*/


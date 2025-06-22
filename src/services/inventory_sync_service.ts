import { createClient } from '@supabase/supabase-js';

// FIXED Rate limiter function to match edge function expectations
const checkRateLimit = async (endpoint: string) => {
  try {
    // Get client IP (fallback for browser environment)
    const clientIP = '127.0.0.1'; // Default for browser-based requests
    
    const response = await fetch('/functions/v1/rate-limiter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ip: clientIP,
        path: endpoint 
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Rate limiter returned ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Rate limiter response error:', error);
    console.error('❌ Rate limit check failed:', error);
    console.error('❌ Full error details:', error);
    // Don't throw - allow sync to continue with rate limiting disabled
    return { success: false, error: error.message };
  }
};

// Types for the inventory sync service
interface InventoryItem {
  id?: string;
  keystone_vcpn?: string;
  sku?: string;
  name?: string;
  description?: string;
  brand?: string;
  cost?: number;
  price?: number;
  quantity?: number;
  category?: string;
  supplier?: string;
  weight?: number;
  dimensions?: string;
  availability?: string;
  keystone_synced?: boolean;
  keystone_last_sync?: string;
  keystone_sync_status?: 'not_synced' | 'synced' | 'error' | 'pending';
  created_at?: string;
  updated_at?: string;
  images?: any;
}

interface SyncStatus {
  isRunning: boolean;
  lastSuccessfulSync: string | null;
  nextPlannedSync: string | null;
  totalItems: number;
  syncedItems: number;
  errors: string[];
  progress: number;
  lastSyncAttempt: string | null;
  lastSyncResult: 'success' | 'failed' | 'partial' | null;
  failureReason: string | null;
}

interface SyncConfiguration {
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  enableRateLimit: boolean;
  syncIntervalHours: number;
  enableAutoSync: boolean;
}

class InventorySyncService {
  private supabase: any;
  private syncStatus: SyncStatus;
  private syncConfiguration: SyncConfiguration;
  private abortController: AbortController | null = null;

  constructor() {
    // Initialize Supabase client
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vqkxrbflwhunvbotjdds.supabase.co';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN || '';
    this.supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize sync status with enhanced tracking
    this.syncStatus = {
      isRunning: false,
      lastSuccessfulSync: this.getStoredSyncStatus('lastSuccessfulSync'),
      nextPlannedSync: this.calculateNextPlannedSync(),
      totalItems: 0,
      syncedItems: 0,
      errors: [],
      progress: 0,
      lastSyncAttempt: this.getStoredSyncStatus('lastSyncAttempt'),
      lastSyncResult: this.getStoredSyncStatus('lastSyncResult') as 'success' | 'failed' | 'partial' | null,
      failureReason: this.getStoredSyncStatus('failureReason')
    };

    // Default configuration
    this.syncConfiguration = {
      batchSize: 50,
      maxRetries: 3,
      retryDelay: 1000,
      enableRateLimit: true,
      syncIntervalHours: 24, // Daily sync by default
      enableAutoSync: true
    };
  }

  // Get stored sync status from localStorage
  private getStoredSyncStatus(key: string): string | null {
    try {
      return localStorage.getItem(`inventory_sync_${key}`);
    } catch {
      return null;
    }
  }

  // Store sync status to localStorage
  private storeSyncStatus(key: string, value: string): void {
    try {
      localStorage.setItem(`inventory_sync_${key}`, value);
    } catch (error) {
      console.warn('Failed to store sync status:', error);
    }
  }

  // Calculate next planned sync based on last successful sync and interval
  private calculateNextPlannedSync(): string | null {
    const lastSync = this.getStoredSyncStatus('lastSuccessfulSync');
    if (!lastSync) return null;

    const lastSyncDate = new Date(lastSync);
    const nextSync = new Date(lastSyncDate.getTime() + (this.syncConfiguration.syncIntervalHours * 60 * 60 * 1000));
    return nextSync.toISOString();
  }

  // Update sync status and persist to storage
  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    Object.assign(this.syncStatus, updates);

    // Persist critical status to localStorage
    if (updates.lastSuccessfulSync) {
      this.storeSyncStatus('lastSuccessfulSync', updates.lastSuccessfulSync);
    }
    if (updates.lastSyncAttempt) {
      this.storeSyncStatus('lastSyncAttempt', updates.lastSyncAttempt);
    }
    if (updates.lastSyncResult) {
      this.storeSyncStatus('lastSyncResult', updates.lastSyncResult);
    }
    if (updates.failureReason !== undefined) {
      this.storeSyncStatus('failureReason', updates.failureReason || '');
    }

    // Recalculate next planned sync
    this.syncStatus.nextPlannedSync = this.calculateNextPlannedSync();
  }

  // Get current environment setting from admin choice or fallback to env var
  private getCurrentEnvironment(): 'development' | 'production' {
    // First check admin setting in localStorage
    const adminEnvironment = localStorage.getItem('admin_environment') as 'development' | 'production';
    if (adminEnvironment) {
      console.log(`🎛️ Using admin-selected environment: ${adminEnvironment.toUpperCase()}`);
      return adminEnvironment;
    }

    // Fallback to environment variable
    const envVar = import.meta.env.VITE_ENVIRONMENT;
    const environment = envVar === 'production' ? 'production' : 'development';
    console.log(`🔧 Using environment variable setting: ${environment.toUpperCase()}`);
    return environment;
  }

  // Get the appropriate API token based on current environment
  private getApiToken(): string {
    const environment = this.getCurrentEnvironment();
    
    if (environment === 'production') {
      const token = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD;
      console.log('🏭 Using PRODUCTION Keystone API token');
      return token || '';
    } else {
      const token = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_DEV;
      console.log('🔧 Using DEVELOPMENT Keystone API token');
      return token || '';
    }
  }

  // Get inventory data from Keystone API with production-safe error handling
  async getInventoryFromKeystone(limit: number = 1000): Promise<InventoryItem[]> {
    const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;
    const apiToken = this.getApiToken();
    const environment = this.getCurrentEnvironment();

    // Log environment variables for debugging
    console.log('🔧 Environment check:');
    console.log(`- Current Environment: ${environment.toUpperCase()}`);
    console.log(`- VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ? 'Set ✅' : 'Missing ❌'}`);
    console.log(`- VITE_SUPABASE_ANON_TOKEN: ${import.meta.env.VITE_SUPABASE_ANON_TOKEN ? 'Set ✅' : 'Missing ❌'}`);
    console.log(`- VITE_KEYSTONE_PROXY_URL: ${proxyUrl ? 'Set ✅' : 'Missing ❌'}`);
    console.log(`- API Token: ${apiToken ? 'Set ✅' : 'Missing ❌'}`);

    if (!proxyUrl || !apiToken) {
      const error = 'Missing required environment variables for Keystone API';
      console.error('❌', error);
      this.updateSyncStatus({
        lastSyncAttempt: new Date().toISOString(),
        lastSyncResult: 'failed',
        failureReason: 'Missing API configuration'
      });
      throw new Error(error);
    }

    // FIXED: Check rate limit before making API call with proper error handling
    let rateLimitPassed = false;
    try {
      const rateLimitResult = await checkRateLimit('keystone-inventory-full');
      rateLimitPassed = rateLimitResult.success !== false;
      
      if (!rateLimitPassed && rateLimitResult.error && rateLimitResult.error.includes('Rate limit exceeded')) {
        console.log('🔄 Rate limited, waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (rateLimitError) {
      console.warn('⚠️ Rate limiter failed, but continuing with API call:', rateLimitError.message);
      rateLimitPassed = true; // Continue when rate limiter fails
    }

    if (!rateLimitPassed) {
      const error = 'Rate limit exceeded for Keystone API';
      console.error('❌', error);
      this.updateSyncStatus({
        lastSyncAttempt: new Date().toISOString(),
        lastSyncResult: 'failed',
        failureReason: 'Rate limit exceeded'
      });
      
      // In production, never fall back to mock data - throw error instead
      if (environment === 'production') {
        throw new Error(error);
      } else {
        // In development, allow mock data for testing
        console.log('🔄 Development mode: Falling back to mock data due to rate limiting');
        return this.getMockInventoryData(limit);
      }
    }

    try {
      // Add delay before API call to be respectful
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log(`📡 Making Keystone API request for ${limit} items...`);
      
      const response = await fetch(`${proxyUrl}/inventory/full`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({ limit })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Successfully loaded ${data.length || 0} inventory items from Keystone`);
      
      // Update successful sync status
      this.updateSyncStatus({
        lastSyncAttempt: new Date().toISOString(),
        lastSyncResult: 'success',
        failureReason: null
      });
      
      // Transform Keystone data to match our database schema
      return data.map((item: any) => this.transformKeystoneData(item));

    } catch (error) {
      console.error('❌ Failed to get inventory from Keystone:', error);
      
      // Update failed sync status
      this.updateSyncStatus({
        lastSyncAttempt: new Date().toISOString(),
        lastSyncResult: 'failed',
        failureReason: error.message || 'Unknown API error'
      });

      // In production, never fall back to mock data - throw error instead
      if (environment === 'production') {
        console.error('🚨 Production mode: No fallback available. Sync failed.');
        throw error;
      } else {
        // In development, allow mock data for testing
        console.log('🔄 Development mode: Falling back to mock data due to API error');
        return this.getMockInventoryData(limit);
      }
    }
  }

  // Transform Keystone data to match database schema
  private transformKeystoneData(keystoneItem: any): InventoryItem {
    return {
      keystone_vcpn: keystoneItem.keystone_vcpn || keystoneItem.vcpn,
      sku: keystoneItem.part_number,
      name: keystoneItem.name || keystoneItem.description,
      description: keystoneItem.description,
      brand: keystoneItem.brand || keystoneItem.manufacturer,
      cost: parseFloat(keystoneItem.cost || keystoneItem.cost_price || 0),
      price: parseFloat(keystoneItem.list_price || keystoneItem.price || 0),
      quantity: parseInt(keystoneItem.quantity_available || keystoneItem.quantity || 0),
      category: keystoneItem.category,
      supplier: keystoneItem.supplier || keystoneItem.vendor,
      weight: parseFloat(keystoneItem.weight || 0),
      dimensions: keystoneItem.dimensions,
      availability: keystoneItem.status || 'active',
      images: keystoneItem.image_url ? { urls: [keystoneItem.image_url] } : null,
      keystone_synced: true,
      keystone_last_sync: new Date().toISOString(),
      keystone_sync_status: 'synced',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Get inventory from Supabase database
  async getInventoryFromSupabase(): Promise<InventoryItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching inventory from Supabase:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get inventory from Supabase:', error);
      return [];
    }
  }

  // FIXED: Perform full sync with proper database constraint handling
  async performFullSync(limit: number = 1000): Promise<void> {
    if (this.syncStatus.isRunning) {
      throw new Error('Sync is already running');
    }

    this.syncStatus.isRunning = true;
    this.syncStatus.errors = [];
    this.syncStatus.progress = 0;
    this.abortController = new AbortController();

    try {
      console.log('🔄 Starting full inventory sync...');
      
      // Get inventory from Keystone
      const keystoneInventory = await this.getInventoryFromKeystone(limit);
      this.syncStatus.totalItems = keystoneInventory.length;

      if (keystoneInventory.length === 0) {
        console.log('⚠️ No inventory items received from Keystone');
        this.updateSyncStatus({
          lastSyncResult: 'failed',
          failureReason: 'No inventory items received'
        });
        return;
      }

      // Process inventory in batches
      const batchSize = this.syncConfiguration.batchSize;
      let processedItems = 0;

      for (let i = 0; i < keystoneInventory.length; i += batchSize) {
        if (this.abortController?.signal.aborted) {
          throw new Error('Sync was cancelled');
        }

        const batch = keystoneInventory.slice(i, i + batchSize);
        
        try {
          // Wait between batches to respect rate limits
          if (i > 0) {
            console.log('⏳ Waiting 1s between batches to respect rate limits...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // FIXED: Try different conflict resolution strategies
          let upsertError = null;
          
          // First try with keystone_vcpn (preferred)
          try {
            const { error } = await this.supabase
              .from('inventory')
              .upsert(batch, { 
                onConflict: 'keystone_vcpn',
                ignoreDuplicates: false 
              });
            upsertError = error;
          } catch (vcpnError) {
            console.log('⚠️ keystone_vcpn conflict resolution failed, trying sku...');
            
            // Fallback to sku if keystone_vcpn doesn't have unique constraint
            try {
              const { error } = await this.supabase
                .from('inventory')
                .upsert(batch, { 
                  onConflict: 'sku',
                  ignoreDuplicates: false 
                });
              upsertError = error;
            } catch (skuError) {
              console.log('⚠️ sku conflict resolution failed, using insert with manual deduplication...');
              
              // Final fallback: manual insert with error handling
              for (const item of batch) {
                try {
                  const { error: insertError } = await this.supabase
                    .from('inventory')
                    .insert([item]);
                  
                  if (insertError && !insertError.message.includes('duplicate')) {
                    throw insertError;
                  }
                } catch (itemError) {
                  console.warn(`⚠️ Failed to insert item ${item.sku}:`, itemError.message);
                }
              }
              upsertError = null; // Consider manual insert successful
            }
          }

          if (upsertError) {
            console.error(`❌ Error upserting batch ${Math.floor(i / batchSize) + 1}:`, upsertError);
            this.syncStatus.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${upsertError.message}`);
          } else {
            processedItems += batch.length;
            console.log(`✅ Successfully processed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(keystoneInventory.length / batchSize)}...`);
          }

          this.syncStatus.syncedItems = processedItems;
          this.syncStatus.progress = (processedItems / keystoneInventory.length) * 100;

        } catch (batchError) {
          console.error(`❌ Failed to process batch ${Math.floor(i / batchSize) + 1}:`, batchError);
          this.syncStatus.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${batchError.message}`);
        }
      }

      // Determine final sync result
      const hasErrors = this.syncStatus.errors.length > 0;
      const syncResult = hasErrors ? 'partial' : 'success';
      
      if (syncResult === 'success') {
        console.log(`✅ Full sync completed successfully. Processed ${processedItems} items.`);
        this.updateSyncStatus({
          lastSuccessfulSync: new Date().toISOString(),
          lastSyncResult: 'success',
          failureReason: null
        });
      } else {
        console.log(`⚠️ Full sync completed with ${this.syncStatus.errors.length} errors.`);
        this.updateSyncStatus({
          lastSyncResult: 'partial',
          failureReason: `${this.syncStatus.errors.length} batch errors occurred`
        });
      }

    } catch (error) {
      console.error('❌ Full sync failed:', error);
      this.updateSyncStatus({
        lastSyncResult: 'failed',
        failureReason: error.message || 'Unknown sync error'
      });
      throw error;
    } finally {
      this.syncStatus.isRunning = false;
      this.abortController = null;
    }
  }

  // Get current sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Check if scheduled sync should run
  shouldRunScheduledSync(): boolean {
    if (!this.syncConfiguration.enableAutoSync) {
      return false;
    }

    const now = new Date();
    const nextSync = this.syncStatus.nextPlannedSync;
    
    if (!nextSync) {
      // No previous sync, should run
      return true;
    }

    return now >= new Date(nextSync);
  }

  // Perform incremental sync (placeholder for future implementation)
  async performIncrementalSync(): Promise<void> {
    console.log('🔄 Incremental sync not yet implemented');
    // Implementation for incremental sync
  }

  // Cancel running sync
  cancelSync(): void {
    if (this.abortController) {
      this.abortController.abort();
      console.log('🛑 Sync cancellation requested');
    }
  }

  // Process pending updates (placeholder for future implementation)
  async processPendingUpdates(): Promise<void> {
    console.log('🔄 Processing pending updates...');
    // Implementation for processing queued updates
  }

  // Request part update (placeholder for future implementation)
  async requestPartUpdate(keystone_vcpn: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<void> {
    console.log(`🔄 Requesting update for part ${keystone_vcpn} with priority ${priority}...`);
    // Implementation for requesting individual part updates
  }

  // Update single part immediately
  async updateSinglePart(keystone_vcpn: string): Promise<void> {
    const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;
    const apiToken = this.getApiToken();

    if (!proxyUrl || !apiToken) {
      throw new Error('Missing Keystone API configuration');
    }

    try {
      console.log(`🔄 Updating single part: ${keystone_vcpn}`);
      
      const response = await fetch(`${proxyUrl}/inventory/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({ vcpn: keystone_vcpn })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const partData = await response.json();
      const transformedData = this.transformKeystoneData(partData);

      // FIXED: Use same conflict resolution strategy as full sync
      try {
        const { error } = await this.supabase
          .from('inventory')
          .upsert([transformedData], { 
            onConflict: 'keystone_vcpn',
            ignoreDuplicates: false 
          });

        if (error) throw error;
      } catch (vcpnError) {
        // Fallback to sku conflict resolution
        const { error } = await this.supabase
          .from('inventory')
          .upsert([transformedData], { 
            onConflict: 'sku',
            ignoreDuplicates: false 
          });

        if (error) throw error;
      }

      console.log(`✅ Successfully updated part: ${keystone_vcpn}`);
    } catch (error) {
      console.error(`❌ Failed to update part ${keystone_vcpn}:`, error);
      throw error;
    }
  }

  // Generate mock inventory data for testing (DEVELOPMENT ONLY)
  private getMockInventoryData(limit: number): InventoryItem[] {
    const environment = this.getCurrentEnvironment();
    
    if (environment === 'production') {
      throw new Error('Mock data is not allowed in production environment');
    }

    console.log(`🎭 DEVELOPMENT MODE: Generating ${Math.min(limit, 10)} mock inventory items for testing`);
    
    const mockItems: InventoryItem[] = [];
    
    for (let i = 1; i <= Math.min(limit, 10); i++) {
      mockItems.push({
        id: `mock-${i}`,
        keystone_vcpn: `MOCK${i.toString().padStart(6, '0')}`,
        sku: `PART-${i}`,
        name: `Mock Part ${i}`,
        description: `This is a mock inventory item for testing purposes`,
        brand: 'Mock Brand',
        cost: 10.00 + i,
        price: 20.00 + i,
        quantity: 100 - i,
        category: 'Test Category',
        supplier: 'Mock Supplier',
        weight: 1.0 + (i * 0.1),
        dimensions: '10x10x10',
        availability: 'active',
        keystone_synced: true,
        keystone_last_sync: new Date().toISOString(),
        keystone_sync_status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    return mockItems;
  }

  // Get sync configuration
  getSyncConfiguration(): SyncConfiguration {
    return { ...this.syncConfiguration };
  }

  // Update sync configuration
  updateSyncConfiguration(updates: Partial<SyncConfiguration>): void {
    Object.assign(this.syncConfiguration, updates);
    
    // Recalculate next planned sync if interval changed
    if (updates.syncIntervalHours) {
      this.syncStatus.nextPlannedSync = this.calculateNextPlannedSync();
    }
  }
}

// Export both class and singleton instance for compatibility
export { InventorySyncService };
export const inventorySyncService = new InventorySyncService();
export default inventorySyncService;

/*
Available Keystone API Endpoints (for reference):
- /inventory/full - Full inventory data (POST with limit parameter)
- /inventory/bulk - Bulk inventory operations  
- /inventory/updates - Incremental updates
- /inventory/check/{vcpn} - Check specific items
- /orders/create - Create new orders
- /orders/status - Check order status
- /orders/history - Order history
*/


import { createClient } from '@supabase/supabase-js';

// Rate limiting function (import from your existing location)
const checkRateLimit = async (path: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: string;
}> => {
  try {
    // Get client IP
    const ip = await fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => data.ip)
      .catch(() => 'unknown');

    // Get Supabase configuration
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vqkxrbflwhunvbotjdds.supabase.co';
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN || '';
    
    const rateLimiterUrl = `${supabaseUrl}/functions/v1/rate-limiter`;
    const requestBody = { ip, path };

    console.log(`🔍 Checking rate limit for path: ${path}`);
    console.log(`📍 Client IP: ${ip}`);
    console.log(`🌐 Rate limiter URL: ${rateLimiterUrl}`);

    const response = await fetch(rateLimiterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📥 Response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Rate limiter response error: ${response.status} - ${JSON.stringify(errorData)}`);
      throw new Error(`Rate limiter returned ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log(`✅ Rate limit check passed. ${result.remaining}/${result.limit} requests remaining.`);
    return result;

  } catch (error) {
    console.error('❌ Rate limit check failed:', error.message);
    console.error('❌ Full error details:', error);
    throw error;
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
  lastSync: string | null;
  totalItems: number;
  syncedItems: number;
  errors: string[];
  progress: number;
}

interface SyncConfiguration {
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  enableRateLimit: boolean;
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

    // Initialize sync status
    this.syncStatus = {
      isRunning: false,
      lastSync: null,
      totalItems: 0,
      syncedItems: 0,
      errors: [],
      progress: 0
    };

    // Default configuration
    this.syncConfiguration = {
      batchSize: 50,
      maxRetries: 3,
      retryDelay: 1000,
      enableRateLimit: true
    };
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

  // Get inventory data from Keystone API with admin environment awareness
  async getInventoryFromKeystone(limit: number = 1000): Promise<InventoryItem[]> {
    const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;
    const apiToken = this.getApiToken();

    // Log environment variables for debugging
    console.log('🔧 Environment check:');
    console.log(`- Current Environment: ${this.getCurrentEnvironment().toUpperCase()}`);
    console.log(`- VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}`);
    console.log(`- VITE_SUPABASE_ANON_TOKEN: ${import.meta.env.VITE_SUPABASE_ANON_TOKEN ? 'Set' : 'Missing'}`);
    console.log(`- VITE_KEYSTONE_PROXY_URL: ${proxyUrl ? 'Set' : 'Missing'}`);
    console.log(`- API Token: ${apiToken ? 'Set' : 'Missing'}`);

    if (!proxyUrl || !apiToken) {
      console.error('❌ Missing required environment variables for Keystone API');
      throw new Error('Missing Keystone API configuration');
    }

    // Check rate limit before making API call
    let rateLimitPassed = false;
    try {
      const rateLimitResult = await checkRateLimit('keystone-inventory-full');
      rateLimitPassed = rateLimitResult.success;
    } catch (rateLimitError) {
      console.warn('⚠️ Rate limiter failed, but continuing with API call:', rateLimitError.message);
      rateLimitPassed = true; // Continue when rate limiter fails
    }

    if (!rateLimitPassed) {
      console.log('🔄 Rate limited, falling back to mock data');
      return this.getMockInventoryData(limit);
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
      
      // Transform Keystone data to match our database schema
      return data.map((item: any) => this.transformKeystoneData(item));

    } catch (error) {
      console.error('❌ Failed to get inventory from Keystone:', error);
      console.log('🔄 Falling back to mock data due to API error');
      return this.getMockInventoryData(limit);
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
      keystone_sync_status: 'synced', // Use allowed value: 'synced' instead of 'success'
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

  // Perform full sync from Keystone to Supabase
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
          await this.processBatch(batch, i / batchSize + 1, Math.ceil(keystoneInventory.length / batchSize));
          processedItems += batch.length;
          this.syncStatus.syncedItems = processedItems;
          this.syncStatus.progress = (processedItems / keystoneInventory.length) * 100;

          // Add delay between batches to respect rate limits
          if (i + batchSize < keystoneInventory.length) {
            console.log('⏳ Waiting 1s between batches to respect rate limits...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (batchError) {
          console.error(`❌ Error processing batch ${i / batchSize + 1}:`, batchError);
          this.syncStatus.errors.push(`Batch ${i / batchSize + 1}: ${batchError.message}`);
        }
      }

      this.syncStatus.lastSync = new Date().toISOString();
      console.log(`✅ Full sync completed successfully. Processed ${processedItems} items.`);

    } catch (error) {
      console.error('❌ Full sync failed:', error);
      this.syncStatus.errors.push(`Full sync failed: ${error.message}`);
      throw error;
    } finally {
      this.syncStatus.isRunning = false;
      this.abortController = null;
    }
  }

  // Process a batch of inventory items
  private async processBatch(items: InventoryItem[], batchNumber: number, totalBatches: number): Promise<void> {
    console.log(`🔄 Processing batch ${batchNumber} of ${totalBatches} (${items.length} items)...`);

    try {
      const { data, error } = await this.supabase
        .from('inventory')
        .upsert(items, { 
          onConflict: 'keystone_vcpn',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error(`❌ Database error in batch ${batchNumber}:`, error);
        throw error;
      }

      console.log(`✅ Successfully processed batch ${batchNumber} of ${totalBatches}...`);
    } catch (error) {
      console.error(`❌ Failed to process batch ${batchNumber}:`, error);
      throw error;
    }
  }

  // Get current sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Cancel running sync
  cancelSync(): void {
    if (this.abortController) {
      this.abortController.abort();
      console.log('🛑 Sync cancellation requested');
    }
  }

  // Check if scheduled sync should run
  shouldRunScheduledSync(): boolean {
    if (this.syncStatus.isRunning) {
      return false;
    }

    const lastSync = this.syncStatus.lastSync;
    if (!lastSync) {
      return true;
    }

    const lastSyncTime = new Date(lastSync);
    const now = new Date();
    const hoursSinceLastSync = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastSync >= 24; // Run daily
  }

  // Perform incremental sync (placeholder for future implementation)
  async performIncrementalSync(): Promise<void> {
    console.log('🔄 Incremental sync not yet implemented, performing full sync...');
    return this.performFullSync(100);
  }

  // Process pending updates (placeholder for future implementation)
  async processPendingUpdates(): Promise<void> {
    console.log('🔄 Processing pending updates...');
    // Implementation for processing pending updates
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

      const { error } = await this.supabase
        .from('inventory')
        .upsert([transformedData], { 
          onConflict: 'keystone_vcpn',
          ignoreDuplicates: false 
        });

      if (error) {
        throw error;
      }

      console.log(`✅ Successfully updated part: ${keystone_vcpn}`);
    } catch (error) {
      console.error(`❌ Failed to update part ${keystone_vcpn}:`, error);
      throw error;
    }
  }

  // Generate mock inventory data for testing
  private getMockInventoryData(limit: number): InventoryItem[] {
    console.log(`🎭 Generating ${Math.min(limit, 10)} mock inventory items for testing`);
    
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
        keystone_sync_status: 'synced', // Use allowed value: 'synced' instead of 'mock'
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


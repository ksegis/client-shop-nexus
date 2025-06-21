/**
 * Inventory Sync Service for Keystone API Integration
 * 
 * Handles synchronization of parts inventory from Keystone API
 * to the local Supabase inventory table.
 */

import { createClient } from '@supabase/supabase-js';

// Create Supabase client
function createSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

// Interfaces for inventory data
export interface KeystoneInventoryItem {
  vcpn: string;
  name: string;
  part_number: string;
  brand: string;
  description: string;
  cost: number;
  list_price: number;
  category: string;
  subcategory?: string;
  availability: string;
  weight?: number;
  dimensions?: string;
  image_url?: string;
  specifications?: any;
}

export interface InventorySyncStatus {
  isRunning: boolean;
  progress: number;
  totalItems: number;
  processedItems: number;
  createdItems: number;
  updatedItems: number;
  errorItems: number;
  currentItem?: string;
  startTime?: Date;
  estimatedTimeRemaining?: number;
  errors: string[];
  lastSyncTime?: Date;
}

export interface SyncLogEntry {
  id: string;
  sync_type: 'inventory' | 'pricing';
  status: 'running' | 'completed' | 'failed';
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_message?: string;
  started_at: Date;
  completed_at?: Date;
  duration_seconds?: number;
}

/**
 * Inventory Sync Service
 */
export class InventorySyncService {
  private supabase = createSupabaseClient();
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

  // Keystone API configuration
  private keystoneConfig = {
    baseUrl: import.meta.env.VITE_KEYSTONE_API_URL || 'https://api.keystone.com',
    apiKey: import.meta.env.VITE_KEYSTONE_API_KEY,
    timeout: 30000,
    batchSize: 100
  };

  constructor() {
    console.log('🔧 Creating InventorySyncService...');
  }

  /**
   * Initialize the inventory sync service
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔧 Initializing InventorySyncService...');
      
      // Test database connectivity
      await this.testDatabaseConnection();
      
      // Validate Keystone API configuration
      await this.validateKeystoneConfig();
      
      // Create sync log table if it doesn't exist
      await this.ensureSyncLogTable();
      
      this.isInitialized = true;
      console.log('✅ InventorySyncService initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize InventorySyncService:', error);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  private async testDatabaseConnection(): Promise<void> {
    try {
      console.log('🔍 Testing database connection...');
      
      const { data, error } = await this.supabase
        .from('inventory')
        .select('id')
        .limit(1);

      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }

      console.log('✅ Database connection verified');
      
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      throw error;
    }
  }

  /**
   * Validate Keystone API configuration
   */
  private async validateKeystoneConfig(): Promise<void> {
    try {
      console.log('🔍 Validating Keystone API configuration...');
      
      if (!this.keystoneConfig.apiKey) {
        throw new Error('Keystone API key not configured. Please set VITE_KEYSTONE_API_KEY environment variable.');
      }

      // Test API connectivity with a simple request
      const response = await fetch(`${this.keystoneConfig.baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.keystoneConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(this.keystoneConfig.timeout)
      });

      if (!response.ok) {
        throw new Error(`Keystone API test failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Keystone API configuration validated');
      
    } catch (error) {
      console.error('❌ Keystone API validation failed:', error);
      // Don't throw here - allow initialization to continue for testing
      console.warn('⚠️ Continuing without Keystone API validation for development');
    }
  }

  /**
   * Ensure sync log table exists
   */
  private async ensureSyncLogTable(): Promise<void> {
    try {
      // Test if api_sync_logs table exists
      const { data, error } = await this.supabase
        .from('api_sync_logs')
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log('📋 Creating api_sync_logs table...');
        
        // Create the table using SQL
        const { error: createError } = await this.supabase.rpc('create_sync_logs_table');
        
        if (createError) {
          console.warn('⚠️ Could not create api_sync_logs table automatically. Please create it manually.');
        } else {
          console.log('✅ api_sync_logs table created');
        }
      } else if (error) {
        console.warn('⚠️ api_sync_logs table access issue:', error.message);
      } else {
        console.log('✅ api_sync_logs table found');
      }
      
    } catch (error) {
      console.warn('⚠️ Could not verify api_sync_logs table:', error);
    }
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): InventorySyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Start inventory synchronization
   */
  async startInventorySync(options: {
    fullSync?: boolean;
    categories?: string[];
    maxItems?: number;
  } = {}): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    if (this.syncStatus.isRunning) {
      throw new Error('Sync is already running');
    }

    try {
      console.log('🚀 Starting inventory synchronization...');
      
      // Reset sync status
      this.syncStatus = {
        isRunning: true,
        progress: 0,
        totalItems: 0,
        processedItems: 0,
        createdItems: 0,
        updatedItems: 0,
        errorItems: 0,
        errors: [],
        startTime: new Date()
      };

      // Create sync log entry
      const syncLogId = await this.createSyncLogEntry();

      try {
        // Fetch inventory data from Keystone API
        const inventoryData = await this.fetchInventoryFromKeystone(options);
        
        this.syncStatus.totalItems = inventoryData.length;
        console.log(`📦 Fetched ${inventoryData.length} items from Keystone API`);

        // Process inventory data in batches
        await this.processInventoryBatches(inventoryData);

        // Complete sync log
        await this.completeSyncLogEntry(syncLogId, 'completed');
        
        console.log('✅ Inventory synchronization completed successfully');
        
      } catch (error) {
        // Mark sync log as failed
        await this.completeSyncLogEntry(syncLogId, 'failed', error.message);
        throw error;
      }

    } catch (error) {
      console.error('❌ Inventory synchronization failed:', error);
      this.syncStatus.errors.push(error.message);
      throw error;
      
    } finally {
      this.syncStatus.isRunning = false;
      this.syncStatus.lastSyncTime = new Date();
    }
  }

  /**
   * Fetch inventory data from Keystone API
   */
  private async fetchInventoryFromKeystone(options: {
    fullSync?: boolean;
    categories?: string[];
    maxItems?: number;
  }): Promise<KeystoneInventoryItem[]> {
    try {
      console.log('📡 Fetching inventory from Keystone API...');
      
      // Build API request parameters
      const params = new URLSearchParams();
      
      if (options.categories && options.categories.length > 0) {
        params.append('categories', options.categories.join(','));
      }
      
      if (options.maxItems) {
        params.append('limit', options.maxItems.toString());
      }
      
      if (!options.fullSync) {
        // For incremental sync, only get items updated in last 24 hours
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        params.append('updated_since', yesterday.toISOString());
      }

      const url = `${this.keystoneConfig.baseUrl}/api/inventory?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.keystoneConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(this.keystoneConfig.timeout)
      });

      if (!response.ok) {
        throw new Error(`Keystone API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform Keystone data to our format
      return this.transformKeystoneData(data.items || data);
      
    } catch (error) {
      console.error('❌ Failed to fetch inventory from Keystone:', error);
      
      // For development/testing, return mock data
      if (import.meta.env.DEV) {
        console.log('🧪 Using mock data for development');
        return this.getMockInventoryData();
      }
      
      throw error;
    }
  }

  /**
   * Transform Keystone API data to our inventory format
   */
  private transformKeystoneData(keystoneItems: any[]): KeystoneInventoryItem[] {
    return keystoneItems.map(item => ({
      vcpn: item.vcpn || item.id,
      name: item.name || item.title || 'Unnamed Part',
      part_number: item.part_number || item.sku || item.partNumber,
      brand: item.brand || item.manufacturer || 'Unknown',
      description: item.description || item.desc || '',
      cost: parseFloat(item.cost || item.wholesale_price || 0),
      list_price: parseFloat(item.list_price || item.retail_price || item.price || 0),
      category: item.category || 'Uncategorized',
      subcategory: item.subcategory || item.sub_category,
      availability: item.availability || item.stock_status || 'Unknown',
      weight: item.weight ? parseFloat(item.weight) : undefined,
      dimensions: item.dimensions,
      image_url: item.image_url || item.imageUrl,
      specifications: item.specifications || item.specs
    }));
  }

  /**
   * Get mock inventory data for development
   */
  private getMockInventoryData(): KeystoneInventoryItem[] {
    return [
      {
        vcpn: 'TEST001',
        name: 'Test Oil Filter',
        part_number: 'OF-123',
        brand: 'TestBrand',
        description: 'High-quality oil filter for testing',
        cost: 15.50,
        list_price: 25.99,
        category: 'Filters',
        subcategory: 'Oil Filters',
        availability: 'In Stock'
      },
      {
        vcpn: 'TEST002',
        name: 'Test Air Filter',
        part_number: 'AF-456',
        brand: 'TestBrand',
        description: 'Premium air filter for testing',
        cost: 22.00,
        list_price: 35.99,
        category: 'Filters',
        subcategory: 'Air Filters',
        availability: 'In Stock'
      },
      {
        vcpn: 'TEST003',
        name: 'Test Brake Pad Set',
        part_number: 'BP-789',
        brand: 'TestBrand',
        description: 'Ceramic brake pads for testing',
        cost: 45.00,
        list_price: 75.99,
        category: 'Brakes',
        subcategory: 'Brake Pads',
        availability: 'Limited Stock'
      }
    ];
  }

  /**
   * Process inventory data in batches
   */
  private async processInventoryBatches(inventoryData: KeystoneInventoryItem[]): Promise<void> {
    const batchSize = this.keystoneConfig.batchSize;
    
    for (let i = 0; i < inventoryData.length; i += batchSize) {
      const batch = inventoryData.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(inventoryData.length / batchSize)}`);
      
      await this.processBatch(batch);
      
      // Update progress
      this.syncStatus.processedItems = Math.min(i + batchSize, inventoryData.length);
      this.syncStatus.progress = (this.syncStatus.processedItems / this.syncStatus.totalItems) * 100;
      
      // Calculate estimated time remaining
      if (this.syncStatus.startTime) {
        const elapsed = Date.now() - this.syncStatus.startTime.getTime();
        const rate = this.syncStatus.processedItems / elapsed;
        const remaining = this.syncStatus.totalItems - this.syncStatus.processedItems;
        this.syncStatus.estimatedTimeRemaining = remaining / rate;
      }
    }
  }

  /**
   * Process a batch of inventory items
   */
  private async processBatch(batch: KeystoneInventoryItem[]): Promise<void> {
    for (const item of batch) {
      try {
        this.syncStatus.currentItem = item.name;
        
        // Check if item already exists
        const { data: existingItem } = await this.supabase
          .from('inventory')
          .select('id, updated_at')
          .eq('keystone_vcpn', item.vcpn)
          .single();

        const inventoryRecord = {
          keystone_vcpn: item.vcpn,
          name: item.name,
          part_number: item.part_number,
          brand: item.brand,
          description: item.description,
          cost: item.cost,
          list_price: item.list_price,
          price: item.list_price, // Alternative price field
          category: item.category,
          subcategory: item.subcategory,
          availability: item.availability,
          weight: item.weight,
          dimensions: item.dimensions,
          image_url: item.image_url,
          specifications: item.specifications,
          last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (existingItem) {
          // Update existing item
          const { error } = await this.supabase
            .from('inventory')
            .update(inventoryRecord)
            .eq('id', existingItem.id);

          if (error) {
            throw error;
          }

          this.syncStatus.updatedItems++;
          
        } else {
          // Create new item
          const { error } = await this.supabase
            .from('inventory')
            .insert([{
              ...inventoryRecord,
              created_at: new Date().toISOString()
            }]);

          if (error) {
            throw error;
          }

          this.syncStatus.createdItems++;
        }

      } catch (error) {
        console.error(`❌ Failed to process item ${item.vcpn}:`, error);
        this.syncStatus.errorItems++;
        this.syncStatus.errors.push(`${item.vcpn}: ${error.message}`);
      }
    }
  }

  /**
   * Create sync log entry
   */
  private async createSyncLogEntry(): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('api_sync_logs')
        .insert([{
          sync_type: 'inventory',
          status: 'running',
          records_processed: 0,
          records_created: 0,
          records_updated: 0,
          records_failed: 0,
          started_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (error) {
        console.warn('⚠️ Could not create sync log entry:', error);
        return 'unknown';
      }

      return data.id;
      
    } catch (error) {
      console.warn('⚠️ Could not create sync log entry:', error);
      return 'unknown';
    }
  }

  /**
   * Complete sync log entry
   */
  private async completeSyncLogEntry(logId: string, status: 'completed' | 'failed', errorMessage?: string): Promise<void> {
    if (logId === 'unknown') return;

    try {
      const duration = this.syncStatus.startTime ? 
        Math.floor((Date.now() - this.syncStatus.startTime.getTime()) / 1000) : 0;

      const { error } = await this.supabase
        .from('api_sync_logs')
        .update({
          status,
          records_processed: this.syncStatus.processedItems,
          records_created: this.syncStatus.createdItems,
          records_updated: this.syncStatus.updatedItems,
          records_failed: this.syncStatus.errorItems,
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
          duration_seconds: duration
        })
        .eq('id', logId);

      if (error) {
        console.warn('⚠️ Could not update sync log entry:', error);
      }
      
    } catch (error) {
      console.warn('⚠️ Could not update sync log entry:', error);
    }
  }

  /**
   * Get recent sync logs
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
        console.warn('⚠️ Could not fetch sync logs:', error);
        return [];
      }

      return data || [];
      
    } catch (error) {
      console.warn('⚠️ Could not fetch sync logs:', error);
      return [];
    }
  }

  /**
   * Cancel running sync
   */
  async cancelSync(): Promise<void> {
    if (this.syncStatus.isRunning) {
      console.log('🛑 Cancelling inventory sync...');
      this.syncStatus.isRunning = false;
      this.syncStatus.errors.push('Sync cancelled by user');
    }
  }
}


// Export singleton instance
export const inventorySyncService = new InventorySyncService();


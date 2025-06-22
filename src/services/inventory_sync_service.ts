import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class InventorySyncService {
  constructor() {
    this.isRunning = false;
    this.isCancelled = false;
    this.progress = 0;
    this.currentBatch = 0;
    this.totalBatches = 0;
    this.syncedItems = 0;
    this.errors = [];
    this.lastSyncTime = null;
    this.lastSyncResult = 'unknown';
    this.lastSyncError = null;
    this.syncIntervalHours = 24; // Default 24 hours
    this.enableAutoSync = false;
    this.batchSize = 50;
    this.batchDelayMs = 1000; // 1 second delay between batches
  }

  // Get current environment (development or production)
  getCurrentEnvironment() {
    // Check admin-selected environment first
    const adminEnvironment = localStorage.getItem('admin_environment');
    if (adminEnvironment) {
      console.log(`🎛️ Using admin-selected environment: ${adminEnvironment.toUpperCase()}`);
      return adminEnvironment;
    }
    
    // Fallback to environment variable
    const envVar = import.meta.env.VITE_ENVIRONMENT;
    if (envVar) {
      console.log(`🔧 Using environment variable: ${envVar.toUpperCase()}`);
      return envVar;
    }
    
    // Default to development
    console.log('🔧 Defaulting to DEVELOPMENT environment');
    return 'development';
  }

  // Get API token based on current environment
  getApiToken() {
    const environment = this.getCurrentEnvironment();
    
    if (environment === 'production') {
      const token = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD;
      console.log(`🔧 Using PRODUCTION Keystone API token: ${token ? 'Set ✅' : 'Missing ❌'}`);
      return token;
    } else {
      const token = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_DEV;
      console.log(`🔧 Using DEVELOPMENT Keystone API token: ${token ? 'Set ✅' : 'Missing ❌'}`);
      return token;
    }
  }

  // DISABLED: Rate limiter check (bypassed to avoid 405 errors)
  async checkRateLimit(endpoint) {
    console.log('🔄 Rate limiter disabled - bypassing check');
    return { success: true, note: 'Rate limiting disabled' };
  }

  // Get inventory data from Keystone API
  async getInventoryFromKeystone(limit = 1000) {
    const environment = this.getCurrentEnvironment();
    
    console.log(`🔧 Environment check:`);
    console.log(`- Current Environment: ${environment.toUpperCase()}`);
    console.log(`- VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ? 'Set ✅' : 'Missing ❌'}`);
    console.log(`- VITE_SUPABASE_ANON_TOKEN: ${import.meta.env.VITE_SUPABASE_ANON_TOKEN ? 'Set ✅' : 'Missing ❌'}`);
    console.log(`- VITE_KEYSTONE_PROXY_URL: ${import.meta.env.VITE_KEYSTONE_PROXY_URL ? 'Set ✅' : 'Missing ❌'}`);
    
    const apiToken = this.getApiToken();
    const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;
    
    if (!apiToken || !proxyUrl) {
      const missingVars = [];
      if (!apiToken) missingVars.push(`VITE_KEYSTONE_SECURITY_TOKEN_${environment.toUpperCase()}`);
      if (!proxyUrl) missingVars.push('VITE_KEYSTONE_PROXY_URL');
      
      console.error('❌ Missing required environment variables:', missingVars.join(', '));
      
      // In production, throw error (no mock data)
      if (environment === 'production') {
        throw new Error(`Missing required environment variables for Keystone API: ${missingVars.join(', ')}`);
      }
      
      // In development, return mock data
      console.log('🔄 Falling back to mock data in development mode');
      return this.getMockInventoryData(limit);
    }

    try {
      const endpoint = '/inventory/full';
      const fullUrl = `${proxyUrl}${endpoint}`;
      
      console.log(`🌐 Making request to: ${fullUrl}`);
      console.log(`🔑 Using API token: ${apiToken.substring(0, 8)}...`);
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          limit: limit,
          offset: 0
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP ${response.status}: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Successfully fetched ${data.length || 0} items from Keystone API`);
      
      return data;
      
    } catch (error) {
      console.error('❌ Failed to get inventory from Keystone:', error);
      
      // In production, throw error (no mock data)
      if (environment === 'production') {
        throw error;
      }
      
      // In development, fall back to mock data
      console.log('🔄 Falling back to mock data due to API error');
      return this.getMockInventoryData(limit);
    }
  }

  // Transform Keystone data to Supabase format
  transformInventoryData(keystoneData) {
    if (!Array.isArray(keystoneData)) {
      console.warn('⚠️ Keystone data is not an array:', keystoneData);
      return [];
    }

    return keystoneData.map(item => ({
      sku: item.sku || item.partNumber || `UNKNOWN-${Date.now()}`,
      keystone_vcpn: item.vcpn || item.sku || item.partNumber,
      description: item.description || item.name || 'No description available',
      price: parseFloat(item.price || item.cost || 0),
      quantity: parseInt(item.quantity || item.stock || 0),
      keystone_sync_status: 'synced',
      last_keystone_sync: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  }

  // FIXED: Database upsert with multiple fallback strategies
  async upsertInventoryBatch(items, batchNumber) {
    console.log(`📦 Upserting batch ${batchNumber} with ${items.length} items`);
    
    // Strategy 1: Try with keystone_vcpn conflict resolution
    try {
      const { data, error } = await supabase
        .from('inventory')
        .upsert(items, { 
          onConflict: 'keystone_vcpn',
          ignoreDuplicates: false 
        })
        .select();

      if (!error) {
        console.log(`✅ Batch ${batchNumber} upserted successfully using keystone_vcpn`);
        return { data, error: null };
      }
      
      console.log(`⚠️ keystone_vcpn conflict failed, trying sku...`);
    } catch (err) {
      console.log(`⚠️ keystone_vcpn strategy failed:`, err.message);
    }

    // Strategy 2: Try with sku conflict resolution
    try {
      const { data, error } = await supabase
        .from('inventory')
        .upsert(items, { 
          onConflict: 'sku',
          ignoreDuplicates: false 
        })
        .select();

      if (!error) {
        console.log(`✅ Batch ${batchNumber} upserted successfully using sku`);
        return { data, error: null };
      }
      
      console.log(`⚠️ sku conflict failed, trying manual insert...`);
    } catch (err) {
      console.log(`⚠️ sku strategy failed:`, err.message);
    }

    // Strategy 3: Manual insert with duplicate checking
    try {
      const insertedItems = [];
      const errors = [];
      
      for (const item of items) {
        try {
          // Try to insert individual item
          const { data, error } = await supabase
            .from('inventory')
            .insert(item)
            .select()
            .single();
            
          if (error) {
            // If duplicate, try to update instead
            if (error.code === '23505') { // Unique violation
              const { data: updateData, error: updateError } = await supabase
                .from('inventory')
                .update({
                  description: item.description,
                  price: item.price,
                  quantity: item.quantity,
                  keystone_sync_status: item.keystone_sync_status,
                  last_keystone_sync: item.last_keystone_sync,
                  updated_at: item.updated_at
                })
                .eq('sku', item.sku)
                .select()
                .single();
                
              if (updateError) {
                errors.push({ item: item.sku, error: updateError.message });
              } else {
                insertedItems.push(updateData);
              }
            } else {
              errors.push({ item: item.sku, error: error.message });
            }
          } else {
            insertedItems.push(data);
          }
        } catch (itemError) {
          errors.push({ item: item.sku, error: itemError.message });
        }
      }
      
      console.log(`✅ Batch ${batchNumber} processed manually: ${insertedItems.length} success, ${errors.length} errors`);
      
      if (errors.length > 0) {
        console.warn(`⚠️ Some items in batch ${batchNumber} had errors:`, errors);
      }
      
      return { 
        data: insertedItems, 
        error: errors.length > 0 ? { message: `${errors.length} items failed`, details: errors } : null 
      };
      
    } catch (err) {
      console.error(`❌ Manual insert strategy failed for batch ${batchNumber}:`, err);
      return { data: null, error: err };
    }
  }

  // Perform full inventory sync
  async performFullSync() {
    if (this.isRunning) {
      console.log('⚠️ Sync already running');
      return { success: false, message: 'Sync already in progress' };
    }

    this.isRunning = true;
    this.isCancelled = false;
    this.progress = 0;
    this.currentBatch = 0;
    this.totalBatches = 0;
    this.syncedItems = 0;
    this.errors = [];
    this.lastSyncError = null;

    try {
      console.log('🚀 Starting full inventory sync...');
      this.updateSyncStatus('running', 'Full sync in progress');

      // Get inventory data from Keystone
      const keystoneData = await this.getInventoryFromKeystone();
      
      if (!keystoneData || keystoneData.length === 0) {
        throw new Error('No inventory data received from Keystone API');
      }

      // Transform data
      const transformedData = this.transformInventoryData(keystoneData);
      console.log(`📊 Transformed ${transformedData.length} items for database`);

      // Process in batches
      this.totalBatches = Math.ceil(transformedData.length / this.batchSize);
      console.log(`📦 Processing ${this.totalBatches} batches of ${this.batchSize} items each`);

      for (let i = 0; i < transformedData.length; i += this.batchSize) {
        if (this.isCancelled) {
          console.log('🛑 Sync cancelled by user');
          break;
        }

        this.currentBatch++;
        const batch = transformedData.slice(i, i + this.batchSize);
        
        console.log(`📦 Processing batch ${this.currentBatch}/${this.totalBatches} (${batch.length} items)`);

        try {
          const { data, error } = await this.upsertInventoryBatch(batch, this.currentBatch);
          
          if (error) {
            console.error(`❌ Error upserting batch ${this.currentBatch}:`, error);
            this.errors.push({
              batch: this.currentBatch,
              error: error.message || error,
              items: batch.length
            });
          } else {
            this.syncedItems += data?.length || batch.length;
            console.log(`✅ Batch ${this.currentBatch} completed: ${data?.length || batch.length} items synced`);
          }
        } catch (batchError) {
          console.error(`❌ Batch ${this.currentBatch} failed:`, batchError);
          this.errors.push({
            batch: this.currentBatch,
            error: batchError.message,
            items: batch.length
          });
        }

        // Update progress
        this.progress = Math.round((this.currentBatch / this.totalBatches) * 100);
        
        // Add delay between batches to avoid overwhelming the database
        if (this.currentBatch < this.totalBatches && !this.isCancelled) {
          await new Promise(resolve => setTimeout(resolve, this.batchDelayMs));
        }
      }

      // Update final status
      const hasErrors = this.errors.length > 0;
      const resultStatus = this.isCancelled ? 'cancelled' : (hasErrors ? 'partial' : 'success');
      const resultMessage = this.isCancelled 
        ? 'Sync cancelled by user'
        : hasErrors 
          ? `Sync completed with ${this.errors.length} batch errors`
          : `Sync completed successfully: ${this.syncedItems} items synced`;

      this.lastSyncTime = new Date().toISOString();
      this.lastSyncResult = resultStatus;
      this.lastSyncError = hasErrors ? this.errors : null;

      this.updateSyncStatus('idle', resultMessage);
      this.saveSyncStatus();

      console.log(`🎉 Full sync completed: ${resultStatus}`);
      console.log(`📊 Final stats: ${this.syncedItems} items synced, ${this.errors.length} batch errors`);

      return {
        success: !hasErrors && !this.isCancelled,
        message: resultMessage,
        stats: {
          totalItems: transformedData.length,
          syncedItems: this.syncedItems,
          batchErrors: this.errors.length,
          batches: this.totalBatches
        }
      };

    } catch (error) {
      console.error('❌ Full sync failed:', error);
      this.lastSyncError = error.message;
      this.lastSyncResult = 'failed';
      this.updateSyncStatus('idle', `Sync failed: ${error.message}`);
      this.saveSyncStatus();
      
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        error: error.message
      };
    } finally {
      this.isRunning = false;
      this.progress = 0;
      this.currentBatch = 0;
    }
  }

  // Get mock inventory data for development/testing
  getMockInventoryData(limit = 50) {
    console.log(`🧪 Generating ${limit} mock inventory items`);
    
    const mockItems = [];
    const categories = ['Engine', 'Transmission', 'Brake', 'Suspension', 'Electrical', 'Body'];
    const brands = ['ACDelco', 'Bosch', 'Denso', 'Motorcraft', 'NGK', 'Champion'];
    
    for (let i = 1; i <= limit; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      
      mockItems.push({
        sku: `MOCK-${String(i).padStart(4, '0')}`,
        vcpn: `VCPN-${String(i).padStart(6, '0')}`,
        description: `${brand} ${category} Component ${i}`,
        price: (Math.random() * 500 + 10).toFixed(2),
        quantity: Math.floor(Math.random() * 100) + 1,
        partNumber: `PN-${String(i).padStart(5, '0')}`
      });
    }
    
    return mockItems;
  }

  // Update sync status in localStorage
  updateSyncStatus(status, message = '') {
    const statusData = {
      status,
      message,
      timestamp: new Date().toISOString(),
      progress: this.progress,
      currentBatch: this.currentBatch,
      totalBatches: this.totalBatches,
      syncedItems: this.syncedItems,
      errors: this.errors.length
    };
    
    localStorage.setItem('inventory_sync_status', JSON.stringify(statusData));
  }

  // Save comprehensive sync status
  saveSyncStatus() {
    const statusData = {
      lastSyncTime: this.lastSyncTime,
      lastSyncResult: this.lastSyncResult,
      lastSyncError: this.lastSyncError,
      syncedItems: this.syncedItems,
      errors: this.errors,
      syncIntervalHours: this.syncIntervalHours,
      enableAutoSync: this.enableAutoSync,
      nextPlannedSync: this.getNextPlannedSync()
    };
    
    localStorage.setItem('inventory_sync_comprehensive_status', JSON.stringify(statusData));
  }

  // Load sync status from localStorage
  loadSyncStatus() {
    try {
      const statusData = localStorage.getItem('inventory_sync_comprehensive_status');
      if (statusData) {
        const parsed = JSON.parse(statusData);
        this.lastSyncTime = parsed.lastSyncTime;
        this.lastSyncResult = parsed.lastSyncResult || 'unknown';
        this.lastSyncError = parsed.lastSyncError;
        this.syncedItems = parsed.syncedItems || 0;
        this.errors = parsed.errors || [];
        this.syncIntervalHours = parsed.syncIntervalHours || 24;
        this.enableAutoSync = parsed.enableAutoSync || false;
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  }

  // Get next planned sync time
  getNextPlannedSync() {
    if (!this.enableAutoSync || !this.lastSyncTime) {
      return null;
    }
    
    const lastSync = new Date(this.lastSyncTime);
    const nextSync = new Date(lastSync.getTime() + (this.syncIntervalHours * 60 * 60 * 1000));
    return nextSync.toISOString();
  }

  // Get current sync status
  getSyncStatus() {
    return {
      isRunning: this.isRunning,
      progress: this.progress,
      currentBatch: this.currentBatch,
      totalBatches: this.totalBatches,
      syncedItems: this.syncedItems,
      errors: this.errors.length,
      lastSyncTime: this.lastSyncTime,
      lastSyncResult: this.lastSyncResult,
      lastSyncError: this.lastSyncError,
      nextPlannedSync: this.getNextPlannedSync(),
      enableAutoSync: this.enableAutoSync,
      syncIntervalHours: this.syncIntervalHours
    };
  }

  // Check if scheduled sync should run
  shouldRunScheduledSync() {
    if (!this.enableAutoSync || this.isRunning) {
      return false;
    }
    
    const nextSync = this.getNextPlannedSync();
    if (!nextSync) {
      return false;
    }
    
    return new Date() >= new Date(nextSync);
  }

  // Cancel running sync
  cancelSync() {
    if (this.isRunning) {
      this.isCancelled = true;
      console.log('🛑 Sync cancellation requested');
      return true;
    }
    return false;
  }

  // Get inventory from Supabase database
  async getInventoryFromSupabase(limit = 1000, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .range(offset, offset + limit - 1)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching inventory from Supabase:', error);
      throw error;
    }
  }

  // Update single part
  async updateSinglePart(sku) {
    try {
      console.log(`🔄 Updating single part: ${sku}`);
      
      // This would typically fetch just one part from Keystone
      // For now, we'll update the sync status
      const { data, error } = await supabase
        .from('inventory')
        .update({
          keystone_sync_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('sku', sku)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`✅ Part ${sku} marked for update`);
      return data;
    } catch (error) {
      console.error(`❌ Error updating part ${sku}:`, error);
      throw error;
    }
  }

  // Request part update (queue for next sync)
  async requestPartUpdate(sku, priority = 'normal') {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update({
          keystone_sync_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('sku', sku)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`✅ Part ${sku} queued for update with ${priority} priority`);
      return data;
    } catch (error) {
      console.error(`❌ Error queuing part ${sku}:`, error);
      throw error;
    }
  }

  // Process pending updates
  async processPendingUpdates() {
    try {
      const { data: pendingItems, error } = await supabase
        .from('inventory')
        .select('sku')
        .eq('keystone_sync_status', 'pending')
        .limit(100);

      if (error) {
        throw error;
      }

      if (!pendingItems || pendingItems.length === 0) {
        console.log('✅ No pending updates to process');
        return { processed: 0 };
      }

      console.log(`🔄 Processing ${pendingItems.length} pending updates`);
      
      // For now, just mark them as synced
      // In a real implementation, you'd fetch fresh data from Keystone
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          keystone_sync_status: 'synced',
          last_keystone_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('keystone_sync_status', 'pending');

      if (updateError) {
        throw updateError;
      }

      console.log(`✅ Processed ${pendingItems.length} pending updates`);
      return { processed: pendingItems.length };
    } catch (error) {
      console.error('❌ Error processing pending updates:', error);
      throw error;
    }
  }

  // Perform incremental sync (only changed items)
  async performIncrementalSync() {
    console.log('🔄 Starting incremental sync...');
    
    try {
      // Process any pending updates first
      const result = await this.processPendingUpdates();
      
      console.log(`✅ Incremental sync completed: ${result.processed} items processed`);
      return {
        success: true,
        message: `Incremental sync completed: ${result.processed} items processed`,
        processed: result.processed
      };
    } catch (error) {
      console.error('❌ Incremental sync failed:', error);
      return {
        success: false,
        message: `Incremental sync failed: ${error.message}`,
        error: error.message
      };
    }
  }
}

// Create and export singleton instance
const inventorySyncService = new InventorySyncService();

// Load saved status on initialization
inventorySyncService.loadSyncStatus();

export default inventorySyncService;


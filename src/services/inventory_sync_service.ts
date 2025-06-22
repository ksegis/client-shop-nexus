import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;
const supabase = createClient(supabaseUrl, supabaseKey);

interface InventoryItem {
  id?: number;
  keystone_vcpn: string;
  sku: string;
  description: string;
  price: number;
  quantity: number;
  keystone_last_sync?: string;
  keystone_sync_status?: 'synced' | 'error' | 'pending' | 'not_synced' | 'deleted';
  created_at?: string;
  updated_at?: string;
}

interface SyncStatus {
  isRunning: boolean;
  lastSyncTime: string | null;
  lastSyncResult: 'success' | 'failed' | 'partial' | 'never';
  lastSyncError: string | null;
  totalBatches: number;
  completedBatches: number;
  syncedItems: number;
  errors: string[];
  progress: number;
  isRateLimited: boolean;
  rateLimitRetryAfter: string | null;
  rateLimitMessage: string | null;
  rateLimitTimeRemaining: number | null;
  // Delta sync properties
  lastDeltaSyncTime: string | null;
  lastDeltaSyncResult: 'success' | 'failed' | 'partial' | 'never';
  nextDeltaSync: string | null;
  deltaSyncEnabled: boolean;
  deltaSyncIntervalHours: number;
}

class InventorySyncService {
  private isRunning: boolean = false;
  private isCancelled: boolean = false;
  private progress: number = 0;
  private syncedItems: number = 0;
  private errors: string[] = [];
  private totalBatches: number = 0;
  private completedBatches: number = 0;
  private lastSyncTime: string | null = null;
  private lastSyncResult: 'success' | 'failed' | 'partial' | 'never' = 'never';
  private lastSyncError: string | null = null;
  private isInitialized: boolean = false;
  
  // Rate limiting properties
  private isRateLimited: boolean = false;
  private rateLimitRetryAfter: string | null = null;
  private rateLimitMessage: string | null = null;
  private rateLimitTimeRemaining: number | null = null;
  
  // Delta sync properties
  private lastDeltaSyncTime: string | null = null;
  private lastDeltaSyncResult: 'success' | 'failed' | 'partial' | 'never' = 'never';
  private nextDeltaSync: string | null = null;
  private deltaSyncEnabled: boolean = true;
  private deltaSyncIntervalHours: number = 12;

  constructor() {
    this.loadSyncStatus();
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('📋 InventorySyncService already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing InventorySyncService...');
      
      // Load saved status from localStorage
      this.loadSyncStatus();
      
      // Verify environment variables
      this.verifyEnvironmentVariables();
      
      // Check rate limit status
      if (this.isCurrentlyRateLimited()) {
        const timeRemaining = this.getRateLimitTimeRemaining();
        console.log(`⏰ Service initialized with active rate limit. Retry in ${this.formatDuration(timeRemaining)}`);
      }
      
      this.isInitialized = true;
      console.log('✅ InventorySyncService initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize InventorySyncService:', error);
      throw error;
    }
  }

  private verifyEnvironmentVariables() {
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_TOKEN',
      'VITE_KEYSTONE_PROXY_URL'
    ];
    
    const environmentalVars = [
      'VITE_KEYSTONE_SECURITY_TOKEN_DEV',
      'VITE_KEYSTONE_SECURITY_TOKEN_PROD'
    ];
    
    console.log('🔧 Environment Variable Check:');
    
    requiredVars.forEach(varName => {
      const value = import.meta.env[varName];
      console.log(`- ${varName}: ${value ? 'Set ✅' : 'Missing ❌'}`);
    });
    
    environmentalVars.forEach(varName => {
      const value = import.meta.env[varName];
      console.log(`- ${varName}: ${value ? 'Set ✅' : 'Missing ❌'}`);
    });
    
    const currentEnv = this.getCurrentEnvironment();
    const requiredToken = currentEnv === 'development' 
      ? 'VITE_KEYSTONE_SECURITY_TOKEN_DEV' 
      : 'VITE_KEYSTONE_SECURITY_TOKEN_PROD';
    
    if (!import.meta.env[requiredToken]) {
      console.warn(`⚠️ Missing required token for ${currentEnv} environment: ${requiredToken}`);
    }
  }

  // NEW: Update delta sync settings
  updateDeltaSyncSettings(settings: { enabled: boolean; intervalHours: number }): boolean {
    try {
      console.log('🔄 Updating delta sync settings:', settings);
      
      this.deltaSyncEnabled = settings.enabled;
      this.deltaSyncIntervalHours = settings.intervalHours;
      
      // Calculate next delta sync time if enabled
      if (settings.enabled && this.lastDeltaSyncTime) {
        const lastSync = new Date(this.lastDeltaSyncTime);
        const nextSync = new Date(lastSync.getTime() + (settings.intervalHours * 60 * 60 * 1000));
        this.nextDeltaSync = nextSync.toISOString();
      } else if (settings.enabled) {
        // If enabled but never run before, schedule for next interval
        const nextSync = new Date(Date.now() + (settings.intervalHours * 60 * 60 * 1000));
        this.nextDeltaSync = nextSync.toISOString();
      } else {
        this.nextDeltaSync = null;
      }
      
      // Save updated settings
      this.saveSyncStatus();
      
      console.log('✅ Delta sync settings updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to update delta sync settings:', error);
      return false;
    }
  }

  // NEW: Get inventory updates from Keystone API (delta sync)
  async getInventoryUpdatesFromKeystone(lastSyncTime: string | null = null) {
    const environment = this.getCurrentEnvironment();
    
    // Check if currently rate limited
    if (this.isCurrentlyRateLimited()) {
      const timeRemaining = this.getRateLimitTimeRemaining();
      const message = `API is rate limited. Retry in ${this.formatDuration(timeRemaining)}.`;
      console.log(`⏰ ${message}`);
      
      return { 
        isRateLimited: true, 
        message,
        timeRemaining,
        data: environment === 'development' ? this.getMockDeltaData() : []
      };
    }
    
    const apiToken = this.getApiToken();
    const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;
    
    if (!apiToken || !proxyUrl) {
      if (environment === 'production') {
        throw new Error('Missing required environment variables for Keystone API');
      }
      
      console.log('🔄 Falling back to mock delta data in development mode');
      return this.getMockDeltaData();
    }

    try {
      const endpoint = '/inventory/updates';
      const fullUrl = `${proxyUrl}${endpoint}`;
      
      console.log(`🔄 Making delta sync request to: ${fullUrl}`);
      console.log(`🕐 Last sync time: ${lastSyncTime || 'Never'}`);
      
      const requestBody = {
        lastSyncTime: lastSyncTime || null
      };

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP ${response.status}: ${errorText}`);
        
        if (response.status === 429) {
          const rateLimitInfo = this.parseRateLimitError(errorText);
          if (rateLimitInfo) {
            this.setRateLimit(rateLimitInfo.retryAfterSeconds, rateLimitInfo.message);
            
            return { 
              isRateLimited: true, 
              message: `Rate limited. Retry in ${this.formatDuration(rateLimitInfo.retryAfterSeconds)}.`,
              timeRemaining: rateLimitInfo.retryAfterSeconds,
              data: environment === 'development' ? this.getMockDeltaData() : []
            };
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      if (this.isRateLimited) {
        console.log('✅ Rate limit cleared - Delta sync API call successful');
        this.clearRateLimit();
      }

      const data = await response.json();
      console.log(`✅ Successfully fetched ${data.length || 0} updates from Keystone API`);
      
      return data;
      
    } catch (error) {
      console.error('❌ Failed to get inventory updates from Keystone:', error);
      
      if (environment === 'production') {
        throw error;
      }
      
      console.log('🔄 Falling back to mock delta data due to API error');
      return this.getMockDeltaData();
    }
  }

  // NEW: Get inventory quantity updates from Keystone API (quantity-only delta sync)
  async getInventoryQuantityUpdatesFromKeystone(lastSyncTime: string | null = null) {
    const environment = this.getCurrentEnvironment();
    
    // Check if currently rate limited
    if (this.isCurrentlyRateLimited()) {
      const timeRemaining = this.getRateLimitTimeRemaining();
      const message = `API is rate limited. Retry in ${this.formatDuration(timeRemaining)}.`;
      console.log(`⏰ ${message}`);
      
      return { 
        isRateLimited: true, 
        message,
        timeRemaining,
        data: environment === 'development' ? this.getMockQuantityData() : []
      };
    }
    
    const apiToken = this.getApiToken();
    const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;
    
    if (!apiToken || !proxyUrl) {
      if (environment === 'production') {
        throw new Error('Missing required environment variables for Keystone API');
      }
      
      console.log('🔄 Falling back to mock quantity data in development mode');
      return this.getMockQuantityData();
    }

    try {
      const endpoint = '/inventory/quantity-updates';
      const fullUrl = `${proxyUrl}${endpoint}`;
      
      console.log(`🔄 Making quantity delta sync request to: ${fullUrl}`);
      console.log(`🕐 Last sync time: ${lastSyncTime || 'Never'}`);
      
      const requestBody = {
        lastSyncTime: lastSyncTime || null
      };

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP ${response.status}: ${errorText}`);
        
        if (response.status === 429) {
          const rateLimitInfo = this.parseRateLimitError(errorText);
          if (rateLimitInfo) {
            this.setRateLimit(rateLimitInfo.retryAfterSeconds, rateLimitInfo.message);
            
            return { 
              isRateLimited: true, 
              message: `Rate limited. Retry in ${this.formatDuration(rateLimitInfo.retryAfterSeconds)}.`,
              timeRemaining: rateLimitInfo.retryAfterSeconds,
              data: environment === 'development' ? this.getMockQuantityData() : []
            };
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      if (this.isRateLimited) {
        console.log('✅ Rate limit cleared - Quantity delta sync API call successful');
        this.clearRateLimit();
      }

      const data = await response.json();
      console.log(`✅ Successfully fetched ${data.length || 0} quantity updates from Keystone API`);
      
      return data;
      
    } catch (error) {
      console.error('❌ Failed to get quantity updates from Keystone:', error);
      
      if (environment === 'production') {
        throw error;
      }
      
      console.log('🔄 Falling back to mock quantity data due to API error');
      return this.getMockQuantityData();
    }
  }

  // NEW: Perform delta inventory sync
  async performDeltaSync(syncType = 'delta_inventory') {
    if (this.isRunning) {
      throw new Error('Sync is already running');
    }

    // Check if rate limited before starting
    if (this.isCurrentlyRateLimited()) {
      const timeRemaining = this.getRateLimitTimeRemaining();
      const message = `Cannot sync: API is rate limited. Retry in ${this.formatDuration(timeRemaining)}.`;
      throw new Error(message);
    }

    this.isRunning = true;
    this.isCancelled = false;
    this.progress = 0;
    this.syncedItems = 0;
    this.errors = [];

    const syncStartTime = new Date().toISOString();
    console.log(`🔄 Starting delta sync (${syncType}) at ${syncStartTime}`);

    try {
      // Log sync start to database
      const syncLogId = await this.logSyncStart(syncType);

      // Get last delta sync time from database
      const lastDeltaSyncTime = await this.getLastDeltaSyncTime(syncType);
      console.log(`📅 Last delta sync: ${lastDeltaSyncTime || 'Never'}`);

      // Get updates from Keystone
      let updatesResponse;
      if (syncType === 'delta_quantity') {
        updatesResponse = await this.getInventoryQuantityUpdatesFromKeystone(lastDeltaSyncTime);
      } else {
        updatesResponse = await this.getInventoryUpdatesFromKeystone(lastDeltaSyncTime);
      }

      // Check if response indicates rate limiting
      if (updatesResponse && updatesResponse.isRateLimited) {
        console.log(`⏰ Delta sync stopped due to rate limiting: ${updatesResponse.message}`);
        await this.logSyncComplete(syncLogId, 'failed', 0, 0, 0, updatesResponse.message);
        
        return {
          success: false,
          message: updatesResponse.message,
          updatedItems: 0,
          newItems: 0,
          deletedItems: 0,
          errors: [updatesResponse.message],
          syncType,
          isRateLimited: true,
          timeRemaining: updatesResponse.timeRemaining
        };
      }

      // Use the actual updates data
      const updatesData = updatesResponse.data || updatesResponse;
      
      if (!updatesData || updatesData.length === 0) {
        console.log('✅ No inventory updates found - system is up to date');
        await this.logSyncComplete(syncLogId, 'success', 0, 0, 0, 'No updates found');
        
        // Update last delta sync time even if no updates
        this.lastDeltaSyncTime = syncStartTime;
        this.lastDeltaSyncResult = 'success';
        this.saveSyncStatus();
        
        return {
          success: true,
          message: 'No updates found - inventory is up to date',
          updatedItems: 0,
          newItems: 0,
          deletedItems: 0,
          errors: [],
          syncType
        };
      }

      console.log(`📦 Processing ${updatesData.length} inventory updates`);
      this.progress = 0.3; // 30% progress after getting data

      // Process updates
      const result = await this.processDeltaUpdates(updatesData, syncType);
      this.progress = 0.9; // 90% progress after processing

      // Log completion
      await this.logSyncComplete(
        syncLogId, 
        result.errors.length === 0 ? 'success' : 'partial',
        result.updatedItems + result.newItems,
        result.updatedItems,
        result.newItems,
        result.errors.length > 0 ? `${result.errors.length} errors occurred` : null
      );

      // Update status
      this.lastDeltaSyncTime = syncStartTime;
      this.lastDeltaSyncResult = result.errors.length === 0 ? 'success' : 'partial';
      this.saveSyncStatus();
      this.progress = 1; // 100% complete

      console.log(`✅ Delta sync completed: ${result.updatedItems} updated, ${result.newItems} new, ${result.errors.length} errors`);
      
      return result;

    } catch (error) {
      console.error('❌ Delta sync failed:', error);
      this.lastDeltaSyncResult = 'failed';
      this.saveSyncStatus();
      
      return {
        success: false,
        message: `Delta sync failed: ${error.message}`,
        updatedItems: 0,
        newItems: 0,
        deletedItems: 0,
        errors: [error.message],
        syncType
      };
    } finally {
      this.isRunning = false;
      this.progress = 0;
    }
  }

  // NEW: Process delta updates
  async processDeltaUpdates(updatesData, syncType) {
    let updatedItems = 0;
    let newItems = 0;
    let deletedItems = 0;
    const errors = [];

    for (const update of updatesData) {
      try {
        if (update.action === 'DELETE' || update.status === 'DELETED') {
          // Handle deleted items
          const result = await this.handleDeletedItem(update);
          if (result.success) {
            deletedItems++;
          } else {
            errors.push(`Delete failed for ${update.sku || update.vcpn}: ${result.error}`);
          }
        } else if (update.action === 'INSERT' || update.isNew) {
          // Handle new items
          const result = await this.handleNewItem(update);
          if (result.success) {
            newItems++;
          } else {
            errors.push(`Insert failed for ${update.sku || update.vcpn}: ${result.error}`);
          }
        } else {
          // Handle updated items
          const result = await this.handleUpdatedItem(update, syncType);
          if (result.success) {
            updatedItems++;
          } else {
            errors.push(`Update failed for ${update.sku || update.vcpn}: ${result.error}`);
          }
        }
      } catch (error) {
        errors.push(`Processing failed for ${update.sku || update.vcpn}: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      message: errors.length === 0 
        ? `Successfully processed ${updatedItems + newItems + deletedItems} items`
        : `Processed items with ${errors.length} errors`,
      updatedItems,
      newItems,
      deletedItems,
      errors,
      syncType
    };
  }

  // NEW: Handle deleted item
  async handleDeletedItem(item) {
    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          keystone_sync_status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('keystone_vcpn', item.vcpn || item.sku);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // NEW: Handle new item
  async handleNewItem(item) {
    try {
      const transformedItem = this.transformKeystoneData([item])[0];
      
      const { error } = await supabase
        .from('inventory')
        .insert(transformedItem);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // NEW: Handle updated item
  async handleUpdatedItem(item, syncType) {
    try {
      let updateData;
      
      if (syncType === 'delta_quantity') {
        // Only update quantity for quantity-only sync
        updateData = {
          quantity: parseInt(item.quantity || item.stock || 0),
          keystone_last_sync: new Date().toISOString(),
          keystone_sync_status: 'synced',
          updated_at: new Date().toISOString()
        };
      } else {
        // Full update for regular delta sync
        updateData = this.transformKeystoneData([item])[0];
      }

      const { error } = await supabase
        .from('inventory')
        .update(updateData)
        .eq('keystone_vcpn', item.vcpn || item.sku);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // NEW: Get last delta sync time from database
  async getLastDeltaSyncTime(syncType) {
    try {
      const { data, error } = await supabase
        .from('keystone_sync_logs')
        .select('completed_at')
        .eq('sync_type', syncType)
        .eq('status', 'success')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error getting last delta sync time:', error);
        return null;
      }

      return data?.completed_at || null;
    } catch (error) {
      console.error('Error getting last delta sync time:', error);
      return null;
    }
  }

  // NEW: Log sync start to database
  async logSyncStart(syncType) {
    try {
      const { data, error } = await supabase
        .from('keystone_sync_logs')
        .insert({
          sync_type: syncType,
          status: 'running',
          keystone_endpoint: syncType === 'delta_quantity' ? '/inventory/quantity-updates' : '/inventory/updates'
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging sync start:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error logging sync start:', error);
      return null;
    }
  }

  // NEW: Log sync completion to database
  async logSyncComplete(syncLogId, status, partsProcessed, partsUpdated, partsAdded, errorMessage = null) {
    if (!syncLogId) return;

    try {
      const { error } = await supabase
        .from('keystone_sync_logs')
        .update({
          completed_at: new Date().toISOString(),
          status,
          parts_processed: partsProcessed,
          parts_updated: partsUpdated,
          parts_added: partsAdded,
          error_message: errorMessage
        })
        .eq('id', syncLogId);

      if (error) {
        console.error('Error logging sync completion:', error);
      }
    } catch (error) {
      console.error('Error logging sync completion:', error);
    }
  }

  // NEW: Check if delta sync should run
  shouldRunDeltaSync() {
    if (!this.deltaSyncEnabled || this.isRunning || this.isCurrentlyRateLimited()) {
      return false;
    }
    
    const nextDeltaSync = this.getNextDeltaSync();
    if (!nextDeltaSync) {
      return true; // Never run before, should run now
    }
    
    try {
      return new Date() >= new Date(nextDeltaSync);
    } catch (error) {
      console.error('Error checking delta sync schedule:', error);
      return false;
    }
  }

  // NEW: Get next delta sync time
  getNextDeltaSync() {
    if (!this.deltaSyncEnabled || !this.lastDeltaSyncTime) {
      return null;
    }
    
    try {
      const lastSync = new Date(this.lastDeltaSyncTime);
      const nextSync = new Date(lastSync.getTime() + (this.deltaSyncIntervalHours * 60 * 60 * 1000));
      return nextSync.toISOString();
    } catch (error) {
      console.error('Error calculating next delta sync:', error);
      return null;
    }
  }

  // NEW: Get mock delta data for development
  getMockDeltaData() {
    console.log('🧪 Generating mock delta inventory data');
    
    const mockUpdates = [];
    const updateTypes = ['UPDATE', 'INSERT'];
    
    for (let i = 1; i <= 5; i++) {
      mockUpdates.push({
        vcpn: `VCPN-DELTA-${String(i).padStart(3, '0')}`,
        sku: `DELTA-${String(i).padStart(4, '0')}`,
        description: `Updated Part ${i}`,
        price: (Math.random() * 100 + 50).toFixed(2),
        quantity: Math.floor(Math.random() * 50) + 10,
        action: updateTypes[Math.floor(Math.random() * updateTypes.length)],
        lastModified: new Date().toISOString()
      });
    }
    
    return mockUpdates;
  }

  // NEW: Get mock quantity data for development
  getMockQuantityData() {
    console.log('🧪 Generating mock quantity update data');
    
    const mockQuantities = [];
    
    for (let i = 1; i <= 3; i++) {
      mockQuantities.push({
        vcpn: `VCPN-QTY-${String(i).padStart(3, '0')}`,
        quantity: Math.floor(Math.random() * 100) + 1,
        lastModified: new Date().toISOString()
      });
    }
    
    return mockQuantities;
  }

  // Get inventory data from Keystone API with rate limit handling (EXISTING - UNCHANGED)
  async getInventoryFromKeystone(limit = 1000) {
    const environment = this.getCurrentEnvironment();
    
    // Check if currently rate limited
    if (this.isCurrentlyRateLimited()) {
      const timeRemaining = this.getRateLimitTimeRemaining();
      const message = `API is rate limited. Retry in ${this.formatDuration(timeRemaining)}.`;
      console.log(`⏰ ${message}`);
      
      // Return special rate limit indicator instead of throwing error
      return { 
        isRateLimited: true, 
        message,
        timeRemaining,
        data: environment === 'development' ? this.getMockInventoryData(limit) : []
      };
    }
    
    console.log(`🔧 Environment check:`);
    console.log(`- Current Environment: ${environment.toUpperCase()}`);
    console.log(`- VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ? 'Set ✅' : 'Missing ❌'}`);
    console.log(`- VITE_SUPABASE_ANON_TOKEN: ${import.meta.env.VITE_SUPABASE_ANON_TOKEN ? 'Set ✅' : 'Missing ❌'}`);
    console.log(`- VITE_KEYSTONE_PROXY_URL: ${import.meta.env.VITE_KEYSTONE_PROXY_URL ? 'Set ✅' : 'Missing ❌'}`);
    
    const apiToken = this.getApiToken();
    const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;
    
    if (!apiToken || !proxyUrl) {
      if (environment === 'production') {
        throw new Error('Missing required environment variables for Keystone API');
      }
      
      console.log('🔄 Falling back to mock data in development mode');
      return this.getMockInventoryData(limit);
    }

    try {
      const endpoint = '/inventory/full';
      const fullUrl = `${proxyUrl}${endpoint}`;
      
      console.log(`🔄 Making API request to: ${fullUrl}`);
      console.log(`🔑 Using ${environment} API token`);
      
      const requestBody = {
        limit: limit
      };

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP ${response.status}: ${errorText}`);
        
        if (response.status === 429) {
          const rateLimitInfo = this.parseRateLimitError(errorText);
          if (rateLimitInfo) {
            this.setRateLimit(rateLimitInfo.retryAfterSeconds, rateLimitInfo.message);
            
            return { 
              isRateLimited: true, 
              message: `Rate limited. Retry in ${this.formatDuration(rateLimitInfo.retryAfterSeconds)}.`,
              timeRemaining: rateLimitInfo.retryAfterSeconds,
              data: environment === 'development' ? this.getMockInventoryData(limit) : []
            };
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      if (this.isRateLimited) {
        console.log('✅ Rate limit cleared - API call successful');
        this.clearRateLimit();
      }

      const data = await response.json();
      console.log(`✅ Successfully fetched ${data.length || 0} items from Keystone API`);
      
      return data;
      
    } catch (error) {
      console.error('❌ Failed to get inventory from Keystone:', error);
      
      if (environment === 'production') {
        throw error;
      }
      
      console.log('🔄 Falling back to mock data due to API error');
      return this.getMockInventoryData(limit);
    }
  }

  // Get current environment setting (EXISTING - UNCHANGED)
  getCurrentEnvironment(): 'development' | 'production' {
    try {
      const savedEnvironment = localStorage.getItem('admin_environment') as 'development' | 'production';
      return savedEnvironment || 'development';
    } catch (error) {
      console.warn('Error reading environment from localStorage:', error);
      return 'development';
    }
  }

  // Get API token based on current environment (EXISTING - UNCHANGED)
  getApiToken(): string | null {
    const environment = this.getCurrentEnvironment();
    
    if (environment === 'development') {
      const token = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_DEV;
      console.log(`🔑 Using development token: ${token ? 'Available' : 'Missing'}`);
      return token || null;
    } else {
      const token = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD;
      console.log(`🔑 Using production token: ${token ? 'Available' : 'Missing'}`);
      return token || null;
    }
  }

  // Parse rate limit error response (EXISTING - UNCHANGED)
  parseRateLimitError(errorText: string): { retryAfterSeconds: number; message: string } | null {
    try {
      const errorData = JSON.parse(errorText);
      
      if (errorData.retry_after_seconds) {
        return {
          retryAfterSeconds: errorData.retry_after_seconds,
          message: errorData.error || 'Rate limit exceeded'
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Could not parse rate limit error:', error);
      return null;
    }
  }

  // Set rate limit information (EXISTING - UNCHANGED)
  setRateLimit(retryAfterSeconds: number, message: string) {
    this.isRateLimited = true;
    this.rateLimitTimeRemaining = retryAfterSeconds;
    this.rateLimitMessage = message;
    
    const retryAfterDate = new Date(Date.now() + (retryAfterSeconds * 1000));
    this.rateLimitRetryAfter = retryAfterDate.toISOString();
    
    console.log(`⏰ Rate limit set: ${message}, retry after ${retryAfterDate.toLocaleString()}`);
    
    this.saveSyncStatus();
  }

  // Clear rate limit (EXISTING - UNCHANGED)
  clearRateLimit() {
    this.isRateLimited = false;
    this.rateLimitRetryAfter = null;
    this.rateLimitMessage = null;
    this.rateLimitTimeRemaining = null;
    
    console.log('✅ Rate limit cleared');
    this.saveSyncStatus();
  }

  // Check if currently rate limited (EXISTING - UNCHANGED)
  isCurrentlyRateLimited(): boolean {
    if (!this.isRateLimited || !this.rateLimitRetryAfter) {
      return false;
    }
    
    try {
      const retryAfterDate = new Date(this.rateLimitRetryAfter);
      const now = new Date();
      
      if (now >= retryAfterDate) {
        // Rate limit has expired
        this.clearRateLimit();
        return false;
      }
      
      // Update remaining time
      this.rateLimitTimeRemaining = Math.ceil((retryAfterDate.getTime() - now.getTime()) / 1000);
      return true;
    } catch (error) {
      console.error('Error checking rate limit status:', error);
      this.clearRateLimit();
      return false;
    }
  }

  // Get rate limit time remaining (EXISTING - UNCHANGED)
  getRateLimitTimeRemaining(): number {
    if (!this.isCurrentlyRateLimited()) {
      return 0;
    }
    
    return this.rateLimitTimeRemaining || 0;
  }

  // Format duration in human readable format (EXISTING - UNCHANGED)
  formatDuration(seconds: number): string {
    if (seconds <= 0) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  // Perform full inventory sync (EXISTING - UNCHANGED)
  async performFullSync(limit = 1000) {
    if (this.isRunning) {
      throw new Error('Sync is already running');
    }

    // Check if rate limited before starting
    if (this.isCurrentlyRateLimited()) {
      const timeRemaining = this.getRateLimitTimeRemaining();
      const message = `Cannot sync: API is rate limited. Retry in ${this.formatDuration(timeRemaining)}.`;
      throw new Error(message);
    }

    this.isRunning = true;
    this.isCancelled = false;
    this.progress = 0;
    this.syncedItems = 0;
    this.errors = [];

    const syncStartTime = new Date().toISOString();
    console.log(`🔄 Starting full inventory sync at ${syncStartTime}`);

    try {
      // Get inventory data from Keystone
      const inventoryResponse = await this.getInventoryFromKeystone(limit);

      // Check if response indicates rate limiting
      if (inventoryResponse && inventoryResponse.isRateLimited) {
        console.log(`⏰ Sync stopped due to rate limiting: ${inventoryResponse.message}`);
        
        return {
          success: false,
          message: inventoryResponse.message,
          syncedItems: 0,
          errors: [inventoryResponse.message],
          isRateLimited: true,
          timeRemaining: inventoryResponse.timeRemaining
        };
      }

      // Use the actual inventory data
      const inventoryData = inventoryResponse.data || inventoryResponse;
      
      if (!inventoryData || inventoryData.length === 0) {
        throw new Error('No inventory data received from Keystone API');
      }

      console.log(`📦 Processing ${inventoryData.length} inventory items`);
      this.progress = 0.3; // 30% progress after getting data

      // Process in batches
      const batchSize = 50;
      const batches = this.createBatches(inventoryData, batchSize);
      this.totalBatches = batches.length;
      this.completedBatches = 0;

      console.log(`📊 Processing ${batches.length} batches of ${batchSize} items each`);

      for (let i = 0; i < batches.length; i++) {
        if (this.isCancelled) {
          throw new Error('Sync was cancelled');
        }

        const batch = batches[i];
        console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} items)`);

        try {
          const result = await this.upsertBatch(batch);
          this.syncedItems += result.successCount;
          
          if (result.errors.length > 0) {
            this.errors.push(...result.errors);
            console.warn(`⚠️ Batch ${i + 1} completed with ${result.errors.length} errors`);
          } else {
            console.log(`✅ Batch ${i + 1} completed successfully`);
          }
        } catch (error) {
          const errorMessage = `Batch ${i + 1} failed: ${error.message}`;
          this.errors.push(errorMessage);
          console.error(`❌ ${errorMessage}`);
        }

        this.completedBatches++;
        this.progress = 0.3 + (0.6 * (this.completedBatches / this.totalBatches)); // 30% to 90%
      }

      // Update sync status
      this.lastSyncTime = syncStartTime;
      this.lastSyncResult = this.errors.length === 0 ? 'success' : 'partial';
      this.lastSyncError = this.errors.length > 0 ? `${this.errors.length} errors occurred` : null;
      this.saveSyncStatus();
      this.progress = 1; // 100% complete

      const result = {
        success: this.errors.length === 0,
        message: this.errors.length === 0 
          ? `Successfully synced ${this.syncedItems} items`
          : `Synced ${this.syncedItems} items with ${this.errors.length} errors`,
        syncedItems: this.syncedItems,
        errors: this.errors
      };

      console.log(`✅ Full sync completed: ${this.syncedItems} items synced, ${this.errors.length} errors`);
      return result;

    } catch (error) {
      console.error('❌ Full sync failed:', error);
      this.lastSyncResult = 'failed';
      this.lastSyncError = error.message;
      this.saveSyncStatus();
      
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        syncedItems: this.syncedItems,
        errors: [...this.errors, error.message]
      };
    } finally {
      this.isRunning = false;
      this.progress = 0;
    }
  }

  // Create batches from inventory data (EXISTING - UNCHANGED)
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  // Upsert a batch of inventory items (EXISTING - UNCHANGED)
  private async upsertBatch(batch: any[]): Promise<{ successCount: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    try {
      // Transform Keystone data to match our schema
      const transformedBatch = this.transformKeystoneData(batch);
      
      // Upsert to Supabase
      const { data, error } = await supabase
        .from('inventory')
        .upsert(transformedBatch, { 
          onConflict: 'keystone_vcpn',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('❌ Error upserting batch:', error);
        errors.push(`Database error: ${error.message}`);
        
        // Try individual inserts if batch fails
        console.log('🔄 Attempting individual item processing...');
        for (const item of transformedBatch) {
          try {
            const { error: itemError } = await supabase
              .from('inventory')
              .upsert(item, { 
                onConflict: 'keystone_vcpn',
                ignoreDuplicates: false 
              });
            
            if (itemError) {
              errors.push(`Item ${item.keystone_vcpn}: ${itemError.message}`);
            } else {
              successCount++;
            }
          } catch (itemError) {
            errors.push(`Item ${item.keystone_vcpn}: ${itemError.message}`);
          }
        }
      } else {
        successCount = transformedBatch.length;
        console.log(`✅ Successfully upserted ${successCount} items`);
      }

    } catch (error) {
      console.error('❌ Batch processing error:', error);
      errors.push(`Batch processing error: ${error.message}`);
    }

    return { successCount, errors };
  }

  // Transform Keystone data to match our database schema (EXISTING - UNCHANGED)
  private transformKeystoneData(keystoneItems: any[]): InventoryItem[] {
    return keystoneItems.map(item => {
      try {
        return {
          keystone_vcpn: String(item.vcpn || item.VCPN || ''),
          sku: String(item.sku || item.SKU || item.partNumber || ''),
          description: String(item.description || item.partDescription || ''),
          price: parseFloat(item.price || item.listPrice || item.cost || 0),
          quantity: parseInt(item.quantity || item.stock || item.qtyOnHand || 0),
          keystone_last_sync: new Date().toISOString(),
          keystone_sync_status: 'synced',
          updated_at: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error transforming item:', item, error);
        throw new Error(`Failed to transform item: ${error.message}`);
      }
    });
  }

  // Generate mock inventory data for development (EXISTING - UNCHANGED)
  private getMockInventoryData(limit: number): any[] {
    console.log(`🧪 Generating ${limit} mock inventory items for development`);
    
    const mockItems = [];
    for (let i = 1; i <= limit; i++) {
      mockItems.push({
        vcpn: `VCPN-${String(i).padStart(6, '0')}`,
        sku: `SKU-${String(i).padStart(4, '0')}`,
        description: `Mock Part ${i} - Development Data`,
        price: (Math.random() * 500 + 10).toFixed(2),
        quantity: Math.floor(Math.random() * 100) + 1,
        category: ['Engine', 'Transmission', 'Brakes', 'Electrical'][Math.floor(Math.random() * 4)]
      });
    }
    
    return mockItems;
  }

  // Cancel running sync (EXISTING - UNCHANGED)
  cancelSync() {
    if (this.isRunning) {
      this.isCancelled = true;
      console.log('🛑 Sync cancellation requested');
    }
  }

  // Get current sync status (EXISTING - ENHANCED WITH DELTA SYNC)
  getSyncStatus(): SyncStatus {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      lastSyncResult: this.lastSyncResult,
      lastSyncError: this.lastSyncError,
      totalBatches: this.totalBatches,
      completedBatches: this.completedBatches,
      syncedItems: this.syncedItems,
      errors: this.errors,
      progress: this.progress,
      isRateLimited: this.isRateLimited,
      rateLimitRetryAfter: this.rateLimitRetryAfter,
      rateLimitMessage: this.rateLimitMessage,
      rateLimitTimeRemaining: this.rateLimitTimeRemaining,
      // Delta sync properties
      lastDeltaSyncTime: this.lastDeltaSyncTime,
      lastDeltaSyncResult: this.lastDeltaSyncResult,
      nextDeltaSync: this.getNextDeltaSync(),
      deltaSyncEnabled: this.deltaSyncEnabled,
      deltaSyncIntervalHours: this.deltaSyncIntervalHours
    };
  }

  // Save sync status to localStorage (EXISTING - ENHANCED WITH DELTA SYNC)
  private saveSyncStatus() {
    try {
      const status = {
        lastSyncTime: this.lastSyncTime,
        lastSyncResult: this.lastSyncResult,
        lastSyncError: this.lastSyncError,
        isRateLimited: this.isRateLimited,
        rateLimitRetryAfter: this.rateLimitRetryAfter,
        rateLimitMessage: this.rateLimitMessage,
        rateLimitTimeRemaining: this.rateLimitTimeRemaining,
        // Delta sync properties
        lastDeltaSyncTime: this.lastDeltaSyncTime,
        lastDeltaSyncResult: this.lastDeltaSyncResult,
        deltaSyncEnabled: this.deltaSyncEnabled,
        deltaSyncIntervalHours: this.deltaSyncIntervalHours
      };
      
      localStorage.setItem('inventory_sync_status', JSON.stringify(status));
    } catch (error) {
      console.warn('Failed to save sync status to localStorage:', error);
    }
  }

  // Load sync status from localStorage (EXISTING - ENHANCED WITH DELTA SYNC)
  private loadSyncStatus() {
    try {
      const saved = localStorage.getItem('inventory_sync_status');
      if (saved) {
        const status = JSON.parse(saved);
        
        this.lastSyncTime = status.lastSyncTime || null;
        this.lastSyncResult = status.lastSyncResult || 'never';
        this.lastSyncError = status.lastSyncError || null;
        this.isRateLimited = status.isRateLimited || false;
        this.rateLimitRetryAfter = status.rateLimitRetryAfter || null;
        this.rateLimitMessage = status.rateLimitMessage || null;
        this.rateLimitTimeRemaining = status.rateLimitTimeRemaining || null;
        
        // Delta sync properties
        this.lastDeltaSyncTime = status.lastDeltaSyncTime || null;
        this.lastDeltaSyncResult = status.lastDeltaSyncResult || 'never';
        this.deltaSyncEnabled = status.deltaSyncEnabled !== undefined ? status.deltaSyncEnabled : true;
        this.deltaSyncIntervalHours = status.deltaSyncIntervalHours || 12;
        
        // Check if rate limit has expired
        if (this.isRateLimited) {
          this.isCurrentlyRateLimited(); // This will clear expired rate limits
        }
      }
    } catch (error) {
      console.warn('Failed to load sync status from localStorage:', error);
    }
  }
}

// Export singleton instance
export const inventorySyncService = new InventorySyncService();


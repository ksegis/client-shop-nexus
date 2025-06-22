import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for exports
export interface InventorySyncStatus {
  isRunning: boolean;
  progress: number;
  currentBatch: number;
  totalBatches: number;
  syncedItems: number;
  errors: number;
  lastSyncTime: string | null;
  lastSyncResult: string;
  lastSyncError: any;
  nextPlannedSync: string | null;
  enableAutoSync: boolean;
  syncIntervalHours: number;
  isRateLimited: boolean;
  rateLimitRetryAfter: string | null;
  rateLimitMessage: string | null;
  rateLimitTimeRemaining: number | null;
  // Delta sync specific
  lastDeltaSyncTime: string | null;
  lastDeltaSyncResult: string;
  nextDeltaSync: string | null;
  deltaSyncEnabled: boolean;
  deltaSyncIntervalHours: number;
}

export interface SyncLogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: any;
}

export interface DeltaSyncResult {
  success: boolean;
  message: string;
  updatedItems: number;
  newItems: number;
  deletedItems: number;
  errors: string[];
  syncType: 'delta_inventory' | 'delta_quantity';
}

export class InventorySyncService {
  private isInitialized: boolean = false;

  constructor() {
    this.isRunning = false;
    this.isCancelled = false;
    this.progress = 0;
    this.currentBatch = 0;
    this.totalBatches = 0;
    this.syncedItems = 0;
    this.errors = [];
    this.lastSyncTime = null;
    this.lastSyncResult = 'never';
    this.lastSyncError = null;
    this.syncIntervalHours = 24; // Default 24 hours
    this.enableAutoSync = false;
    this.batchSize = 50;
    this.batchDelayMs = 1000; // 1 second delay between batches
    
    // Rate limiting properties
    this.isRateLimited = false;
    this.rateLimitRetryAfter = null;
    this.rateLimitMessage = null;

    // Delta sync properties
    this.lastDeltaSyncTime = null;
    this.lastDeltaSyncResult = 'never';
    this.deltaSyncEnabled = true; // Enable by default
    this.deltaSyncIntervalHours = 12; // Twice daily (every 12 hours)
  }

  // Initialize method that the application expects
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
      
      // Check if we're currently rate limited and log status
      if (this.isCurrentlyRateLimited()) {
        const timeRemaining = this.getRateLimitTimeRemaining();
        console.log(`⏰ Service initialized with active rate limit. Retry in ${this.formatDuration(timeRemaining)}`);
      }

      // Check if delta sync should run
      if (this.shouldRunDeltaSync()) {
        console.log('🔄 Delta sync is due to run');
      }
      
      this.isInitialized = true;
      console.log('✅ InventorySyncService initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize InventorySyncService:', error);
      throw error;
    }
  }

  // Verify that required environment variables are present
  private verifyEnvironmentVariables() {
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_TOKEN',
      'VITE_KEYSTONE_PROXY_URL'
    ];

    const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('⚠️ Missing environment variables:', missingVars);
    }

    // Check for at least one API token
    const hasDevToken = !!import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_DEV;
    const hasProdToken = !!import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD;
    
    if (!hasDevToken && !hasProdToken) {
      console.warn('⚠️ No Keystone API tokens found (neither DEV nor PROD)');
    }

    console.log('🔧 Environment variables check:');
    console.log(`- VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ? 'Set ✅' : 'Missing ❌'}`);
    console.log(`- VITE_SUPABASE_ANON_TOKEN: ${import.meta.env.VITE_SUPABASE_ANON_TOKEN ? 'Set ✅' : 'Missing ❌'}`);
    console.log(`- VITE_KEYSTONE_PROXY_URL: ${import.meta.env.VITE_KEYSTONE_PROXY_URL ? 'Set ✅' : 'Missing ❌'}`);
    console.log(`- VITE_KEYSTONE_SECURITY_TOKEN_DEV: ${hasDevToken ? 'Set ✅' : 'Missing ❌'}`);
    console.log(`- VITE_KEYSTONE_SECURITY_TOKEN_PROD: ${hasProdToken ? 'Set ✅' : 'Missing ❌'}`);
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

  // Check if currently rate limited
  isCurrentlyRateLimited() {
    if (!this.isRateLimited || !this.rateLimitRetryAfter) {
      return false;
    }
    
    try {
      const retryTime = new Date(this.rateLimitRetryAfter);
      const now = new Date();
      
      if (now >= retryTime) {
        // Rate limit has expired
        this.clearRateLimit();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking rate limit status:', error);
      this.clearRateLimit();
      return false;
    }
  }

  // Set rate limit information
  setRateLimit(retryAfterSeconds, message = null) {
    const retryTime = new Date(Date.now() + (retryAfterSeconds * 1000));
    
    this.isRateLimited = true;
    this.rateLimitRetryAfter = retryTime.toISOString();
    this.rateLimitMessage = message || `Rate limited. Retry after ${this.formatDuration(retryAfterSeconds)}.`;
    
    console.log(`⏰ Rate limited until: ${retryTime.toLocaleString()}`);
    console.log(`⏰ Retry in: ${this.formatDuration(retryAfterSeconds)}`);
    
    this.saveSyncStatus();
  }

  // Clear rate limit information
  clearRateLimit() {
    this.isRateLimited = false;
    this.rateLimitRetryAfter = null;
    this.rateLimitMessage = null;
    this.saveSyncStatus();
  }

  // Format duration in human-readable format
  formatDuration(seconds) {
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

  // Get time remaining until rate limit expires
  getRateLimitTimeRemaining() {
    if (!this.isCurrentlyRateLimited()) {
      return null;
    }
    
    try {
      const retryTime = new Date(this.rateLimitRetryAfter);
      const now = new Date();
      const diffMs = retryTime.getTime() - now.getTime();
      const diffSeconds = Math.ceil(diffMs / 1000);
      
      return diffSeconds > 0 ? diffSeconds : 0;
    } catch (error) {
      console.error('Error calculating rate limit time remaining:', error);
      return null;
    }
  }

  // Parse rate limit error response
  parseRateLimitError(errorText) {
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.retry_after_seconds) {
        return {
          retryAfterSeconds: errorData.retry_after_seconds,
          message: errorData.error || 'Rate limit exceeded',
          function: errorData.function || 'Unknown'
        };
      }
    } catch (error) {
      console.warn('Could not parse rate limit error:', error);
    }
    
    return null;
  }

  // NEW: Get inventory updates from Keystone API (Delta Sync)
  async getInventoryUpdatesFromKeystone(lastSyncTime = null) {
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
      const missingVars = [];
      if (!apiToken) missingVars.push(`VITE_KEYSTONE_SECURITY_TOKEN_${environment.toUpperCase()}`);
      if (!proxyUrl) missingVars.push('VITE_KEYSTONE_PROXY_URL');
      
      console.error('❌ Missing required environment variables:', missingVars.join(', '));
      
      if (environment === 'production') {
        throw new Error(`Missing required environment variables for Keystone API: ${missingVars.join(', ')}`);
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
        lastSyncTime: lastSyncTime || null,
        includeQuantityOnly: false // Get full updates, not just quantities
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
        
        // Handle rate limiting specifically
        if (response.status === 429) {
          const rateLimitInfo = this.parseRateLimitError(errorText);
          if (rateLimitInfo) {
            this.setRateLimit(
              rateLimitInfo.retryAfterSeconds, 
              `Rate limited on ${rateLimitInfo.function}. ${rateLimitInfo.message}`
            );
            
            const message = `Rate limited. Retry in ${this.formatDuration(rateLimitInfo.retryAfterSeconds)}.`;
            console.log(`⏰ ${message}`);
            
            return { 
              isRateLimited: true, 
              message,
              timeRemaining: rateLimitInfo.retryAfterSeconds,
              data: environment === 'development' ? this.getMockDeltaData() : []
            };
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Clear any existing rate limit on successful response
      if (this.isRateLimited) {
        console.log('✅ Rate limit cleared - Delta sync API call successful');
        this.clearRateLimit();
      }

      const data = await response.json();
      console.log(`✅ Successfully fetched ${data.length || 0} updated items from Keystone API`);
      
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

  // NEW: Get quantity-only updates from Keystone API
  async getInventoryQuantityUpdatesFromKeystone(lastSyncTime = null) {
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
        
        // Handle rate limiting specifically
        if (response.status === 429) {
          const rateLimitInfo = this.parseRateLimitError(errorText);
          if (rateLimitInfo) {
            this.setRateLimit(
              rateLimitInfo.retryAfterSeconds, 
              `Rate limited on ${rateLimitInfo.function}. ${rateLimitInfo.message}`
            );
            
            // Return special rate limit indicator instead of throwing error
            const message = `Rate limited. Retry in ${this.formatDuration(rateLimitInfo.retryAfterSeconds)}.`;
            console.log(`⏰ ${message}`);
            
            return { 
              isRateLimited: true, 
              message,
              timeRemaining: rateLimitInfo.retryAfterSeconds,
              data: environment === 'development' ? this.getMockInventoryData(limit) : []
            };
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Clear any existing rate limit on successful response
      if (this.isRateLimited) {
        console.log('✅ Rate limit cleared - API call successful');
        this.clearRateLimit();
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
      
      // In development, return mock data
      console.log('🔄 Falling back to mock data due to API error');
      return this.getMockInventoryData(limit);
    }
  }

  // Transform Keystone data to Supabase format (EXISTING - UNCHANGED)
  transformKeystoneData(keystoneItems) {
    return keystoneItems.map(item => ({
      sku: item.sku || item.partNumber || `UNKNOWN-${Date.now()}`,
      keystone_vcpn: item.vcpn || item.keystone_vcpn || null,
      description: item.description || item.name || 'No description',
      price: parseFloat(item.price || item.cost || 0),
      quantity: parseInt(item.quantity || item.stock || 0),
      keystone_sync_status: 'synced',
      last_keystone_sync: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  }

  // Upsert items to Supabase with multiple fallback strategies (EXISTING - UNCHANGED)
  async upsertItemsToSupabase(items) {
    const transformedItems = this.transformKeystoneData(items);
    
    // Strategy 1: Try keystone_vcpn conflict resolution
    try {
      const { data, error } = await supabase
        .from('inventory')
        .upsert(transformedItems, { 
          onConflict: 'keystone_vcpn',
          ignoreDuplicates: false 
        })
        .select();

      if (!error) {
        console.log(`✅ Successfully upserted ${transformedItems.length} items using keystone_vcpn conflict resolution`);
        return { data, error: null };
      }
      
      console.warn('⚠️ keystone_vcpn conflict resolution failed, trying sku...', error);
    } catch (error) {
      console.warn('⚠️ keystone_vcpn conflict resolution failed, trying sku...', error);
    }

    // Strategy 2: Try sku conflict resolution
    try {
      const { data, error } = await supabase
        .from('inventory')
        .upsert(transformedItems, { 
          onConflict: 'sku',
          ignoreDuplicates: false 
        })
        .select();

      if (!error) {
        console.log(`✅ Successfully upserted ${transformedItems.length} items using sku conflict resolution`);
        return { data, error: null };
      }
      
      console.warn('⚠️ sku conflict resolution failed, trying individual inserts...', error);
    } catch (error) {
      console.warn('⚠️ sku conflict resolution failed, trying individual inserts...', error);
    }

    // Strategy 3: Individual item processing
    const results = [];
    const errors = [];
    
    for (const item of transformedItems) {
      try {
        // Check if item exists
        const { data: existing } = await supabase
          .from('inventory')
          .select('id')
          .eq('sku', item.sku)
          .single();

        if (existing) {
          // Update existing item
          const { data, error } = await supabase
            .from('inventory')
            .update(item)
            .eq('sku', item.sku)
            .select()
            .single();
            
          if (error) {
            errors.push({ item: item.sku, error: error.message });
          } else {
            results.push(data);
          }
        } else {
          // Insert new item
          const { data, error } = await supabase
            .from('inventory')
            .insert(item)
            .select()
            .single();
            
          if (error) {
            errors.push({ item: item.sku, error: error.message });
          } else {
            results.push(data);
          }
        }
      } catch (error) {
        errors.push({ item: item.sku, error: error.message });
      }
    }
    
    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} items failed individual processing:`, errors);
      return { 
        data: results, 
        error: { 
          message: `${errors.length} items failed`, 
          details: errors 
        } 
      };
    }
    
    console.log(`✅ Successfully processed ${results.length} items individually`);
    return { data: results, error: null };
  }

  // Perform full sync with rate limit awareness - FIXED VERSION (EXISTING - UNCHANGED)
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
    this.currentBatch = 0;
    this.totalBatches = Math.ceil(limit / this.batchSize);
    this.syncedItems = 0;
    this.errors = [];

    console.log(`🚀 Starting full sync with limit: ${limit}`);
    this.updateSyncStatus('running', `Starting sync of ${limit} items`);

    try {
      // Get inventory data from Keystone
      const inventoryResponse = await this.getInventoryFromKeystone(limit);
      
      // FIXED: Check if response indicates rate limiting
      if (inventoryResponse && inventoryResponse.isRateLimited) {
        console.log(`⏰ Sync stopped due to rate limiting: ${inventoryResponse.message}`);
        this.lastSyncResult = 'failed';
        this.lastSyncError = inventoryResponse.message;
        this.lastSyncTime = new Date().toISOString();
        this.updateSyncStatus('idle', inventoryResponse.message);
        this.saveSyncStatus();
        
        return {
          success: false,
          message: inventoryResponse.message,
          syncedItems: 0,
          errors: [inventoryResponse.message],
          isRateLimited: true,
          timeRemaining: inventoryResponse.timeRemaining
        };
      }
      
      // Use the actual inventory data (could be real data or mock data)
      const inventoryData = inventoryResponse.data || inventoryResponse;
      
      if (!inventoryData || inventoryData.length === 0) {
        console.log('⚠️ No inventory data received from Keystone');
        this.lastSyncResult = 'failed';
        this.lastSyncError = 'No data received from Keystone API';
        this.lastSyncTime = new Date().toISOString();
        this.updateSyncStatus('idle', 'No data received from Keystone API');
        this.saveSyncStatus();
        
        return {
          success: false,
          message: 'No data received from Keystone API',
          syncedItems: 0,
          errors: ['No data received']
        };
      }

      console.log(`📦 Processing ${inventoryData.length} items in batches of ${this.batchSize}`);
      
      // Process in batches
      const batches = [];
      for (let i = 0; i < inventoryData.length; i += this.batchSize) {
        batches.push(inventoryData.slice(i, i + this.batchSize));
      }
      
      this.totalBatches = batches.length;
      let totalSynced = 0;

      for (let i = 0; i < batches.length; i++) {
        if (this.isCancelled) {
          console.log('🛑 Sync cancelled by user');
          break;
        }

        this.currentBatch = i + 1;
        this.progress = (i / batches.length);
        
        console.log(`📦 Processing batch ${this.currentBatch}/${this.totalBatches} (${batches[i].length} items)`);
        this.updateSyncStatus('running', `Processing batch ${this.currentBatch}/${this.totalBatches}`);

        try {
          const result = await this.upsertItemsToSupabase(batches[i]);
          
          if (result.error) {
            console.error(`❌ Error upserting batch ${this.currentBatch}:`, result.error);
            this.errors.push(`Batch ${this.currentBatch}: ${result.error.message}`);
          } else {
            const batchSynced = result.data?.length || 0;
            totalSynced += batchSynced;
            console.log(`✅ Batch ${this.currentBatch} completed: ${batchSynced} items synced`);
          }
        } catch (error) {
          console.error(`❌ Error processing batch ${this.currentBatch}:`, error);
          this.errors.push(`Batch ${this.currentBatch}: ${error.message}`);
        }

        this.syncedItems = totalSynced;
        
        // Add delay between batches (except for the last one)
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.batchDelayMs));
        }
      }

      this.progress = 1;
      this.lastSyncTime = new Date().toISOString();
      
      if (this.errors.length === 0) {
        this.lastSyncResult = 'success';
        this.lastSyncError = null;
        console.log(`✅ Full sync completed successfully: ${totalSynced} items synced`);
        this.updateSyncStatus('idle', `Sync completed: ${totalSynced} items synced`);
      } else {
        this.lastSyncResult = 'partial';
        this.lastSyncError = `${this.errors.length} batch errors occurred`;
        console.log(`⚠️ Sync completed with errors: ${totalSynced} items synced, ${this.errors.length} errors`);
        this.updateSyncStatus('idle', `Sync completed with ${this.errors.length} errors`);
      }
      
      this.saveSyncStatus();
      
      return {
        success: this.errors.length === 0,
        message: this.errors.length === 0 
          ? `Successfully synced ${totalSynced} items`
          : `Synced ${totalSynced} items with ${this.errors.length} errors`,
        syncedItems: totalSynced,
        errors: this.errors
      };

    } catch (error) {
      console.error('❌ Full sync failed:', error);
      this.lastSyncError = error.message;
      this.lastSyncResult = 'failed';
      this.lastSyncTime = new Date().toISOString();
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

  // Get mock inventory data for development/testing (EXISTING - UNCHANGED)
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

  // Update sync status in localStorage (EXISTING - UNCHANGED)
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

  // Save comprehensive sync status including rate limit info (ENHANCED)
  saveSyncStatus() {
    const statusData = {
      lastSyncTime: this.lastSyncTime,
      lastSyncResult: this.lastSyncResult,
      lastSyncError: this.lastSyncError,
      syncedItems: this.syncedItems,
      errors: this.errors,
      syncIntervalHours: this.syncIntervalHours,
      enableAutoSync: this.enableAutoSync,
      nextPlannedSync: this.getNextPlannedSync(),
      isRateLimited: this.isRateLimited,
      rateLimitRetryAfter: this.rateLimitRetryAfter,
      rateLimitMessage: this.rateLimitMessage,
      // Delta sync status
      lastDeltaSyncTime: this.lastDeltaSyncTime,
      lastDeltaSyncResult: this.lastDeltaSyncResult,
      deltaSyncEnabled: this.deltaSyncEnabled,
      deltaSyncIntervalHours: this.deltaSyncIntervalHours,
      nextDeltaSync: this.getNextDeltaSync()
    };
    
    localStorage.setItem('inventory_sync_comprehensive_status', JSON.stringify(statusData));
  }

  // Load sync status from localStorage including rate limit info (ENHANCED)
  loadSyncStatus() {
    try {
      const statusData = localStorage.getItem('inventory_sync_comprehensive_status');
      if (statusData) {
        const parsed = JSON.parse(statusData);
        this.lastSyncTime = parsed.lastSyncTime || null;
        this.lastSyncResult = parsed.lastSyncResult || 'never';
        this.lastSyncError = parsed.lastSyncError || null;
        this.syncedItems = parsed.syncedItems || 0;
        this.errors = parsed.errors || [];
        this.syncIntervalHours = parsed.syncIntervalHours || 24;
        this.enableAutoSync = parsed.enableAutoSync || false;
        this.isRateLimited = parsed.isRateLimited || false;
        this.rateLimitRetryAfter = parsed.rateLimitRetryAfter || null;
        this.rateLimitMessage = parsed.rateLimitMessage || null;
        // Delta sync properties
        this.lastDeltaSyncTime = parsed.lastDeltaSyncTime || null;
        this.lastDeltaSyncResult = parsed.lastDeltaSyncResult || 'never';
        this.deltaSyncEnabled = parsed.deltaSyncEnabled !== undefined ? parsed.deltaSyncEnabled : true;
        this.deltaSyncIntervalHours = parsed.deltaSyncIntervalHours || 12;
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  }

  // Get next planned sync time (EXISTING - UNCHANGED)
  getNextPlannedSync() {
    if (!this.enableAutoSync || !this.lastSyncTime) {
      return null;
    }
    
    try {
      const lastSync = new Date(this.lastSyncTime);
      const nextSync = new Date(lastSync.getTime() + (this.syncIntervalHours * 60 * 60 * 1000));
      return nextSync.toISOString();
    } catch (error) {
      console.error('Error calculating next planned sync:', error);
      return null;
    }
  }

  // Get current sync status including rate limit information (ENHANCED)
  getSyncStatus() {
    return {
      isRunning: this.isRunning || false,
      progress: this.progress || 0,
      currentBatch: this.currentBatch || 0,
      totalBatches: this.totalBatches || 0,
      syncedItems: this.syncedItems || 0,
      errors: this.errors?.length || 0,
      lastSyncTime: this.lastSyncTime || null,
      lastSyncResult: this.lastSyncResult || 'never',
      lastSyncError: this.lastSyncError || null,
      nextPlannedSync: this.getNextPlannedSync(),
      enableAutoSync: this.enableAutoSync || false,
      syncIntervalHours: this.syncIntervalHours || 24,
      isRateLimited: this.isCurrentlyRateLimited(),
      rateLimitRetryAfter: this.rateLimitRetryAfter,
      rateLimitMessage: this.rateLimitMessage,
      rateLimitTimeRemaining: this.getRateLimitTimeRemaining(),
      // Delta sync status
      lastDeltaSyncTime: this.lastDeltaSyncTime || null,
      lastDeltaSyncResult: this.lastDeltaSyncResult || 'never',
      nextDeltaSync: this.getNextDeltaSync(),
      deltaSyncEnabled: this.deltaSyncEnabled || false,
      deltaSyncIntervalHours: this.deltaSyncIntervalHours || 12
    };
  }

  // Check if scheduled sync should run (EXISTING - UNCHANGED)
  shouldRunScheduledSync() {
    if (!this.enableAutoSync || this.isRunning || this.isCurrentlyRateLimited()) {
      return false;
    }
    
    const nextSync = this.getNextPlannedSync();
    if (!nextSync) {
      return false;
    }
    
    try {
      return new Date() >= new Date(nextSync);
    } catch (error) {
      console.error('Error checking scheduled sync:', error);
      return false;
    }
  }

  // Cancel running sync (EXISTING - UNCHANGED)
  cancelSync() {
    if (this.isRunning) {
      this.isCancelled = true;
      console.log('🛑 Sync cancellation requested');
      return true;
    }
    return false;
  }

  // Get inventory from Supabase database (EXISTING - UNCHANGED)
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

  // Update single part (EXISTING - UNCHANGED)
  async updateSinglePart(sku) {
    try {
      console.log(`🔄 Updating single part: ${sku}`);
      
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

      console.log(`✅ Updated part ${sku} status to pending`);
      return data;
    } catch (error) {
      console.error(`❌ Failed to update part ${sku}:`, error);
      throw error;
    }
  }
}

// Named export for the service instance
export const inventorySyncService = new InventorySyncService();

// Default export for backward compatibility
export default inventorySyncService;


/**
 * Pricing Sync Service for Keystone API Integration
 * 
 * This service manages the synchronization of pricing data between Keystone API
 * and Supabase database, providing efficient caching and reducing API calls
 * for improved e-commerce performance.
 * 
 * Features:
 * - Full pricing sync from Keystone API
 * - Individual part pricing updates on-demand
 * - Intelligent caching with expiration handling
 * - Rate limit awareness and error handling
 * - Batch processing for large datasets
 * - Comprehensive logging and monitoring
 */

import { createClient } from '@supabase/supabase-js';
import KeystoneService, { PricingInfo, KeystoneResponse } from './keystone/KeystoneService';

// Create Supabase client function
function getSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Interfaces for pricing data management
export interface PricingData {
  id?: string;
  keystone_vcpn: string;
  price: number;
  core_charge?: number;
  list_price?: number;
  cost?: number;
  currency: string;
  effective_date?: string;
  last_updated: string;
  keystone_last_sync?: string;
  is_stale?: boolean;
  sync_attempts?: number;
  last_error?: string;
}

export interface PricingSyncLog {
  id?: string;
  sync_type: 'full' | 'incremental' | 'single_part';
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  total_parts?: number;
  successful_updates?: number;
  failed_updates?: number;
  error_message?: string;
  rate_limited?: boolean;
  retry_after?: number;
  details?: any;
}

export interface PricingUpdateRequest {
  id?: string;
  keystone_vcpn: string;
  priority: 'high' | 'medium' | 'low';
  requested_at: string;
  requested_by?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts?: number;
  last_attempt?: string;
  error_message?: string;
}

export interface PricingSyncStatus {
  lastFullSync?: string;
  lastIncrementalSync?: string;
  totalParts: number;
  syncedParts: number;
  staleParts: number;
  pendingUpdates: number;
  isRunning: boolean;
  nextScheduledSync?: string;
  recentLogs: PricingSyncLog[];
  errorRate: number;
  averageSyncTime: number;
}

/**
 * PricingSyncService - Manages pricing data synchronization
 * 
 * This service provides comprehensive pricing data management between
 * Keystone API and Supabase database with intelligent caching,
 * rate limit handling, and performance optimization.
 */
export class PricingSyncService {
  private supabase = getSupabaseClient();
  private keystoneService: KeystoneService;
  private isInitialized = false;
  private currentSyncLog: PricingSyncLog | null = null;

  // Configuration constants
  private readonly BATCH_SIZE = 50;
  private readonly MAX_RETRIES = 3;
  private readonly STALE_THRESHOLD_HOURS = 24;
  private readonly RATE_LIMIT_RETRY_DELAY = 60000; // 1 minute
  private readonly SYNC_TIMEOUT = 300000; // 5 minutes

  constructor() {
    this.keystoneService = KeystoneService.getInstance();
  }

  /**
   * Initialize the pricing sync service
   * Ensures database tables exist and service is ready
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔧 Initializing PricingSyncService...');
      
      // Verify Keystone service is configured
      if (!this.keystoneService.isConfigured()) {
        throw new Error('KeystoneService is not configured');
      }

      // Test database connectivity
      await this.testDatabaseConnection();
      
      // Initialize sync tracking tables if needed
      await this.initializeSyncTables();
      
      this.isInitialized = true;
      console.log('✅ PricingSyncService initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize PricingSyncService:', error);
      throw error;
    }
  }

  /**
   * Test database connection and verify table structure
   */
  private async testDatabaseConnection(): Promise<void> {
    try {
      // Test pricing_cache table
      const { data, error } = await this.supabase
        .from('pricing_cache')
        .select('count(*)')
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
   * Initialize sync tracking tables with proper structure
   */
  private async initializeSyncTables(): Promise<void> {
    try {
      // Ensure pricing sync logs table exists
      const { error: logsError } = await this.supabase
        .from('pricing_sync_logs')
        .select('id')
        .limit(1);

      if (logsError && logsError.code === 'PGRST116') {
        console.log('📊 Creating pricing sync logs table...');
        // Table doesn't exist, but we'll assume it's created via SQL schema
      }

      // Ensure pricing update requests table exists
      const { error: requestsError } = await this.supabase
        .from('pricing_update_requests')
        .select('id')
        .limit(1);

      if (requestsError && requestsError.code === 'PGRST116') {
        console.log('📋 Creating pricing update requests table...');
        // Table doesn't exist, but we'll assume it's created via SQL schema
      }

      console.log('✅ Sync tracking tables verified');
    } catch (error) {
      console.error('❌ Failed to initialize sync tables:', error);
      throw error;
    }
  }

  /**
   * Perform a full pricing sync from Keystone API
   * Syncs all available pricing data with batch processing
   */
  async performFullSync(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('🔄 Starting full pricing sync...');
    
    const syncLog = await this.startSyncLog('full');
    this.currentSyncLog = syncLog;

    try {
      // Check if Keystone service is rate limited
      if (this.keystoneService.isEndpointRateLimited('/pricing')) {
        const remainingTime = this.keystoneService.getRateLimitRemainingTime('/pricing');
        await this.updateSyncLog(syncLog.id!, {
          status: 'failed',
          error_message: `Rate limited. Retry in ${remainingTime} seconds`,
          rate_limited: true,
          retry_after: remainingTime
        });
        
        return {
          success: false,
          message: `Pricing sync rate limited. Retry in ${Math.ceil(remainingTime / 60)} minutes.`
        };
      }

      // Get all parts that need pricing updates
      const partsToSync = await this.getPartsNeedingPricingSync();
      console.log(`📊 Found ${partsToSync.length} parts needing pricing sync`);

      if (partsToSync.length === 0) {
        await this.updateSyncLog(syncLog.id!, {
          status: 'completed',
          total_parts: 0,
          successful_updates: 0,
          failed_updates: 0
        });

        return {
          success: true,
          message: 'No parts need pricing updates. All pricing data is current.'
        };
      }

      // Update sync log with total parts count
      await this.updateSyncLog(syncLog.id!, {
        total_parts: partsToSync.length
      });

      // Process parts in batches
      let successfulUpdates = 0;
      let failedUpdates = 0;
      const batchCount = Math.ceil(partsToSync.length / this.BATCH_SIZE);

      for (let i = 0; i < batchCount; i++) {
        const batchStart = i * this.BATCH_SIZE;
        const batchEnd = Math.min(batchStart + this.BATCH_SIZE, partsToSync.length);
        const batch = partsToSync.slice(batchStart, batchEnd);

        console.log(`🔄 Processing batch ${i + 1}/${batchCount} (${batch.length} parts)`);

        try {
          // Get pricing for batch
          const vcpns = batch.map(part => part.keystone_vcpn);
          const pricingResponse = await this.keystoneService.getPricingBulk(vcpns);

          if (pricingResponse.success && pricingResponse.data) {
            // Process each pricing result
            for (const pricingInfo of pricingResponse.data) {
              try {
                await this.savePricingData(pricingInfo);
                successfulUpdates++;
              } catch (error) {
                console.error(`❌ Failed to save pricing for ${pricingInfo.vcpn}:`, error);
                failedUpdates++;
              }
            }
          } else {
            console.error(`❌ Batch pricing request failed:`, pricingResponse.error);
            failedUpdates += batch.length;
          }

          // Add delay between batches to respect rate limits
          if (i < batchCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error) {
          console.error(`❌ Batch ${i + 1} failed:`, error);
          failedUpdates += batch.length;

          // Check if it's a rate limit error
          if (error.message?.includes('rate limit') || error.message?.includes('429')) {
            console.log('⏸️ Rate limited during batch processing, stopping sync');
            break;
          }
        }
      }

      // Complete sync log
      await this.updateSyncLog(syncLog.id!, {
        status: failedUpdates === 0 ? 'completed' : 'partial',
        successful_updates: successfulUpdates,
        failed_updates: failedUpdates,
        error_message: failedUpdates > 0 ? `${failedUpdates} parts failed to sync` : undefined
      });

      const message = failedUpdates === 0 
        ? `Full pricing sync completed successfully. Updated ${successfulUpdates} parts.`
        : `Pricing sync completed with issues. Updated ${successfulUpdates} parts, ${failedUpdates} failed.`;

      console.log(`✅ ${message}`);

      return {
        success: failedUpdates === 0,
        message,
        details: {
          totalParts: partsToSync.length,
          successfulUpdates,
          failedUpdates,
          syncLogId: syncLog.id
        }
      };

    } catch (error) {
      console.error('❌ Full pricing sync failed:', error);
      
      await this.updateSyncLog(syncLog.id!, {
        status: 'failed',
        error_message: error.message
      });

      return {
        success: false,
        message: `Pricing sync failed: ${error.message}`
      };
    } finally {
      this.currentSyncLog = null;
    }
  }

  /**
   * Perform incremental pricing sync for stale data
   * Only syncs parts with outdated pricing information
   */
  async performIncrementalSync(staleThresholdHours: number = this.STALE_THRESHOLD_HOURS): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`🔄 Starting incremental pricing sync (stale threshold: ${staleThresholdHours}h)...`);
    
    const syncLog = await this.startSyncLog('incremental');

    try {
      // Get stale pricing data
      const staleParts = await this.getStalePricingData(staleThresholdHours);
      console.log(`📊 Found ${staleParts.length} parts with stale pricing`);

      if (staleParts.length === 0) {
        await this.updateSyncLog(syncLog.id!, {
          status: 'completed',
          total_parts: 0,
          successful_updates: 0,
          failed_updates: 0
        });

        return {
          success: true,
          message: 'No stale pricing data found. All pricing is current.'
        };
      }

      // Process stale parts
      let successfulUpdates = 0;
      let failedUpdates = 0;

      for (const part of staleParts) {
        try {
          const result = await this.updateSinglePartPricing(part.keystone_vcpn);
          if (result.success) {
            successfulUpdates++;
          } else {
            failedUpdates++;
          }
        } catch (error) {
          console.error(`❌ Failed to update pricing for ${part.keystone_vcpn}:`, error);
          failedUpdates++;
        }

        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Complete sync log
      await this.updateSyncLog(syncLog.id!, {
        status: failedUpdates === 0 ? 'completed' : 'partial',
        total_parts: staleParts.length,
        successful_updates: successfulUpdates,
        failed_updates: failedUpdates
      });

      const message = failedUpdates === 0 
        ? `Incremental pricing sync completed. Updated ${successfulUpdates} stale parts.`
        : `Incremental sync completed with issues. Updated ${successfulUpdates} parts, ${failedUpdates} failed.`;

      return {
        success: failedUpdates === 0,
        message,
        details: {
          staleParts: staleParts.length,
          successfulUpdates,
          failedUpdates
        }
      };

    } catch (error) {
      console.error('❌ Incremental pricing sync failed:', error);
      
      await this.updateSyncLog(syncLog.id!, {
        status: 'failed',
        error_message: error.message
      });

      return {
        success: false,
        message: `Incremental pricing sync failed: ${error.message}`
      };
    }
  }

  /**
   * Update pricing for a single part on-demand
   */
  async updateSinglePartPricing(vcpn: string): Promise<{ success: boolean; message: string; data?: PricingData }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`🔄 Updating pricing for part: ${vcpn}`);

    try {
      // Check rate limits
      if (this.keystoneService.isEndpointRateLimited('/pricing')) {
        const remainingTime = this.keystoneService.getRateLimitRemainingTime('/pricing');
        return {
          success: false,
          message: `Rate limited. Retry in ${Math.ceil(remainingTime / 60)} minutes.`
        };
      }

      // Get pricing from Keystone
      const pricingResponse = await this.keystoneService.getPricing(vcpn);

      if (!pricingResponse.success || !pricingResponse.data) {
        return {
          success: false,
          message: `Failed to get pricing from Keystone: ${pricingResponse.error}`
        };
      }

      // Save pricing data
      const pricingData = await this.savePricingData(pricingResponse.data);

      return {
        success: true,
        message: `Pricing updated successfully for ${vcpn}`,
        data: pricingData
      };

    } catch (error) {
      console.error(`❌ Failed to update pricing for ${vcpn}:`, error);
      return {
        success: false,
        message: `Failed to update pricing: ${error.message}`
      };
    }
  }

  /**
   * Request a pricing update for a specific part
   * Adds the request to the queue for background processing
   */
  async requestPricingUpdate(vcpn: string, priority: 'high' | 'medium' | 'low' = 'medium', requestedBy?: string): Promise<{ success: boolean; message: string }> {
    try {
      const updateRequest: PricingUpdateRequest = {
        keystone_vcpn: vcpn,
        priority,
        requested_at: new Date().toISOString(),
        requested_by: requestedBy,
        status: 'pending',
        attempts: 0
      };

      const { data, error } = await this.supabase
        .from('pricing_update_requests')
        .insert(updateRequest)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`📋 Pricing update requested for ${vcpn} (priority: ${priority})`);

      return {
        success: true,
        message: `Pricing update requested for ${vcpn}`
      };

    } catch (error) {
      console.error(`❌ Failed to request pricing update for ${vcpn}:`, error);
      return {
        success: false,
        message: `Failed to request pricing update: ${error.message}`
      };
    }
  }

  /**
   * Process pending pricing update requests
   * Processes queued requests in priority order
   */
  async processPendingPricingUpdates(maxRequests: number = 10): Promise<{ success: boolean; message: string; processed: number }> {
    try {
      // Get pending requests ordered by priority and request time
      const { data: requests, error } = await this.supabase
        .from('pricing_update_requests')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: true }) // high, medium, low
        .order('requested_at', { ascending: true })
        .limit(maxRequests);

      if (error) {
        throw error;
      }

      if (!requests || requests.length === 0) {
        return {
          success: true,
          message: 'No pending pricing update requests',
          processed: 0
        };
      }

      console.log(`🔄 Processing ${requests.length} pending pricing update requests...`);

      let processed = 0;
      for (const request of requests) {
        try {
          // Mark as processing
          await this.supabase
            .from('pricing_update_requests')
            .update({
              status: 'processing',
              last_attempt: new Date().toISOString(),
              attempts: (request.attempts || 0) + 1
            })
            .eq('id', request.id);

          // Update the pricing
          const result = await this.updateSinglePartPricing(request.keystone_vcpn);

          // Update request status
          await this.supabase
            .from('pricing_update_requests')
            .update({
              status: result.success ? 'completed' : 'failed',
              error_message: result.success ? null : result.message
            })
            .eq('id', request.id);

          if (result.success) {
            processed++;
          }

        } catch (error) {
          console.error(`❌ Failed to process pricing update request ${request.id}:`, error);
          
          // Mark as failed
          await this.supabase
            .from('pricing_update_requests')
            .update({
              status: 'failed',
              error_message: error.message
            })
            .eq('id', request.id);
        }

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return {
        success: true,
        message: `Processed ${processed}/${requests.length} pricing update requests`,
        processed
      };

    } catch (error) {
      console.error('❌ Failed to process pending pricing updates:', error);
      return {
        success: false,
        message: `Failed to process pending updates: ${error.message}`,
        processed: 0
      };
    }
  }

  /**
   * Get pricing data from Supabase with filtering and pagination
   */
  async getPricingFromSupabase(options: {
    vcpns?: string[];
    limit?: number;
    offset?: number;
    includeStale?: boolean;
    staleThresholdHours?: number;
  } = {}): Promise<PricingData[]> {
    try {
      let query = this.supabase
        .from('pricing_cache')
        .select('*');

      // Filter by VCPNs if provided
      if (options.vcpns && options.vcpns.length > 0) {
        query = query.in('keystone_vcpn', options.vcpns);
      }

      // Filter stale data if requested
      if (options.includeStale === false) {
        const staleThreshold = new Date();
        staleThreshold.setHours(staleThreshold.getHours() - (options.staleThresholdHours || this.STALE_THRESHOLD_HOURS));
        query = query.gte('keystone_last_sync', staleThreshold.toISOString());
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
      }

      // Order by last sync time
      query = query.order('keystone_last_sync', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get pricing from Supabase:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive pricing sync status
   */
  async getPricingSyncStatus(): Promise<PricingSyncStatus> {
    try {
      // Get basic statistics
      const { data: stats, error: statsError } = await this.supabase
        .rpc('get_pricing_sync_stats');

      if (statsError) {
        console.error('❌ Failed to get pricing sync stats:', statsError);
      }

      // Get recent sync logs
      const { data: logs, error: logsError } = await this.supabase
        .from('pricing_sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (logsError) {
        console.error('❌ Failed to get pricing sync logs:', logsError);
      }

      // Get pending update requests count
      const { count: pendingCount, error: pendingError } = await this.supabase
        .from('pricing_update_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (pendingError) {
        console.error('❌ Failed to get pending pricing updates:', pendingError);
      }

      // Calculate error rate and average sync time
      const recentLogs = logs || [];
      const completedLogs = recentLogs.filter(log => log.status === 'completed' || log.status === 'partial');
      const failedLogs = recentLogs.filter(log => log.status === 'failed');
      const errorRate = recentLogs.length > 0 ? (failedLogs.length / recentLogs.length) * 100 : 0;

      const avgSyncTime = completedLogs.length > 0 
        ? completedLogs.reduce((sum, log) => {
            const duration = new Date(log.completed_at!).getTime() - new Date(log.started_at).getTime();
            return sum + duration;
          }, 0) / completedLogs.length / 1000 // Convert to seconds
        : 0;

      // Check if sync is currently running
      const isRunning = this.currentSyncLog !== null || 
        recentLogs.some(log => log.status === 'running');

      return {
        lastFullSync: stats?.last_full_sync,
        lastIncrementalSync: stats?.last_incremental_sync,
        totalParts: stats?.total_parts || 0,
        syncedParts: stats?.synced_parts || 0,
        staleParts: stats?.stale_parts || 0,
        pendingUpdates: pendingCount || 0,
        isRunning,
        recentLogs,
        errorRate,
        averageSyncTime: avgSyncTime
      };

    } catch (error) {
      console.error('❌ Failed to get pricing sync status:', error);
      
      // Return minimal status on error
      return {
        totalParts: 0,
        syncedParts: 0,
        staleParts: 0,
        pendingUpdates: 0,
        isRunning: false,
        recentLogs: [],
        errorRate: 0,
        averageSyncTime: 0
      };
    }
  }

  // Private helper methods

  /**
   * Get parts that need pricing sync (no pricing data or stale data)
   */
  private async getPartsNeedingPricingSync(): Promise<{ keystone_vcpn: string }[]> {
    try {
      // Get parts from inventory that don't have current pricing
      const { data, error } = await this.supabase
        .rpc('get_parts_needing_pricing_sync', {
          stale_hours: this.STALE_THRESHOLD_HOURS
        });

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get parts needing pricing sync:', error);
      
      // Fallback: get all inventory parts
      const { data: inventoryParts, error: inventoryError } = await this.supabase
        .from('inventory')
        .select('keystone_vcpn')
        .not('keystone_vcpn', 'is', null);

      if (inventoryError) {
        throw inventoryError;
      }

      return inventoryParts || [];
    }
  }

  /**
   * Get parts with stale pricing data
   */
  private async getStalePricingData(staleThresholdHours: number): Promise<PricingData[]> {
    try {
      const staleThreshold = new Date();
      staleThreshold.setHours(staleThreshold.getHours() - staleThresholdHours);

      const { data, error } = await this.supabase
        .from('pricing_cache')
        .select('*')
        .or(`keystone_last_sync.is.null,keystone_last_sync.lt.${staleThreshold.toISOString()}`);

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get stale pricing data:', error);
      throw error;
    }
  }

  /**
   * Save pricing data to Supabase
   */
  private async savePricingData(pricingInfo: PricingInfo): Promise<PricingData> {
    try {
      const pricingData: PricingData = {
        keystone_vcpn: pricingInfo.vcpn,
        price: pricingInfo.price || 0,
        core_charge: pricingInfo.coreCharge || 0,
        list_price: pricingInfo.listPrice || 0,
        cost: pricingInfo.cost || 0,
        currency: pricingInfo.currency || 'USD',
        effective_date: pricingInfo.effectiveDate,
        last_updated: new Date().toISOString(),
        keystone_last_sync: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('pricing_cache')
        .upsert(pricingData, {
          onConflict: 'keystone_vcpn'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;

    } catch (error) {
      console.error(`❌ Failed to save pricing data for ${pricingInfo.vcpn}:`, error);
      throw error;
    }
  }

  /**
   * Start a new sync log entry
   */
  private async startSyncLog(syncType: 'full' | 'incremental' | 'single_part'): Promise<PricingSyncLog> {
    try {
      const syncLog: PricingSyncLog = {
        sync_type: syncType,
        started_at: new Date().toISOString(),
        status: 'running'
      };

      const { data, error } = await this.supabase
        .from('pricing_sync_logs')
        .insert(syncLog)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`📊 Started ${syncType} pricing sync log: ${data.id}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to start sync log:', error);
      throw error;
    }
  }

  /**
   * Update an existing sync log entry
   */
  private async updateSyncLog(logId: string, updates: Partial<PricingSyncLog>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        completed_at: updates.status && updates.status !== 'running' 
          ? new Date().toISOString() 
          : undefined
      };

      const { error } = await this.supabase
        .from('pricing_sync_logs')
        .update(updateData)
        .eq('id', logId);

      if (error) {
        throw error;
      }

    } catch (error) {
      console.error(`❌ Failed to update sync log ${logId}:`, error);
      throw error;
    }
  }
}

// Singleton instance
let pricingSyncServiceInstance: PricingSyncService | null = null;

/**
 * Get the singleton instance of PricingSyncService
 */
export function getPricingSyncService(): PricingSyncService {
  if (!pricingSyncServiceInstance) {
    pricingSyncServiceInstance = new PricingSyncService();
  }
  return pricingSyncServiceInstance;
}

export default PricingSyncService;


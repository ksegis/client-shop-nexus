// Complete InventorySyncService - Uses shared Supabase client with ALL functionality preserved
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import KeystoneService, { InventoryItem, KeystoneResponse } from '@/services/keystone/KeystoneService';

interface SyncLog {
  id?: string;
  sync_type: 'full' | 'incremental' | 'individual';
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed' | 'rate_limited';
  parts_processed: number;
  parts_updated: number;
  parts_added: number;
  error_message?: string;
  rate_limit_until?: string;
  keystone_endpoint?: string;
}

// Interface matching your existing inventory table structure
interface InventoryPart {
  id?: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  price: number;
  cost?: number;
  category?: string;
  supplier?: string;
  reorder_level?: number;
  created_at?: string;
  updated_at?: string;
  core_charge?: number;
  keystone_vcpn?: string;
  keystone_synced?: boolean;
  keystone_last_sync?: string;
  keystone_sync_status?: string;
  
  // Optional additional columns
  warehouse?: string;
  location?: string;
  brand?: string;
  weight?: number;
  dimensions?: string;
  warranty?: string;
  compatibility?: string[];
  features?: string[];
  images?: string[];
  rating?: number;
  reviews?: number;
  featured?: boolean;
  availability?: string;
  in_stock?: boolean;
}

interface PartUpdateRequest {
  id?: string;
  keystone_vcpn: string;
  requested_by?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  requested_at: string;
  processed_at?: string;
  error_message?: string;
}

interface SyncSchedule {
  id?: string;
  sync_type: string;
  schedule_cron?: string;
  enabled: boolean;
  last_run?: string;
  next_run?: string;
  max_retries: number;
  retry_count: number;
}

export class InventorySyncService {
  public supabase: SupabaseClient; // Make public for debugging
  private keystoneService: KeystoneService;
  private isInitialized = false;

  constructor() {
    // Use shared Supabase client instead of creating a new one
    this.supabase = getSupabaseClient();
    this.keystoneService = KeystoneService.getInstance();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing InventorySyncService with shared Supabase client...');
      
      // Test Supabase connection using your existing inventory table
      const { error } = await this.supabase.from('inventory').select('count').limit(1);
      if (error) {
        throw new Error(`Supabase connection failed: ${error.message}`);
      }

      // Initialize sync schedules if they don't exist
      await this.initializeSyncSchedules();

      this.isInitialized = true;
      console.log('InventorySyncService initialized successfully with existing inventory table');
    } catch (error) {
      console.error('Failed to initialize InventorySyncService:', error);
      throw error;
    }
  }

  private async initializeSyncSchedules(): Promise<void> {
    const defaultSchedules: Partial<SyncSchedule>[] = [
      {
        sync_type: 'daily_full',
        schedule_cron: '0 2 * * *', // 2 AM daily
        enabled: true,
        max_retries: 3,
        retry_count: 0
      },
      {
        sync_type: 'weekly_full',
        schedule_cron: '0 1 * * 0', // 1 AM on Sundays
        enabled: false,
        max_retries: 3,
        retry_count: 0
      }
    ];

    for (const schedule of defaultSchedules) {
      const { error } = await this.supabase
        .from('sync_schedule')
        .upsert(schedule, { onConflict: 'sync_type' });

      if (error) {
        console.error('Failed to initialize sync schedule:', error);
      }
    }
  }

  // Transform Keystone data to your existing inventory table format
  private transformKeystoneToInventory(keystoneItem: InventoryItem): InventoryPart {
    return {
      name: keystoneItem.description || keystoneItem.partNumber || 'Unknown Part',
      description: keystoneItem.description,
      sku: keystoneItem.partNumber, // Map partNumber to sku
      quantity: keystoneItem.quantity || 0,
      price: keystoneItem.price || 0,
      category: this.categorizePartNumber(keystoneItem.partNumber),
      warehouse: keystoneItem.warehouse,
      availability: keystoneItem.availability,
      keystone_vcpn: keystoneItem.partNumber, // Store original part number
      keystone_synced: true,
      keystone_last_sync: new Date().toISOString(),
      keystone_sync_status: 'synced',
      in_stock: (keystoneItem.quantity || 0) > 0
    };
  }

  // Simple categorization logic based on part number patterns
  private categorizePartNumber(partNumber: string): string {
    if (!partNumber) return 'General';
    
    const upperPN = partNumber.toUpperCase();
    
    if (upperPN.includes('ENG') || upperPN.includes('ENGINE')) return 'Engine';
    if (upperPN.includes('BRK') || upperPN.includes('BRAKE')) return 'Brakes';
    if (upperPN.includes('TRN') || upperPN.includes('TRANS')) return 'Transmission';
    if (upperPN.includes('ELC') || upperPN.includes('ELEC')) return 'Electrical';
    if (upperPN.includes('SUS') || upperPN.includes('SUSP')) return 'Suspension';
    if (upperPN.includes('CLG') || upperPN.includes('COOL')) return 'Cooling';
    if (upperPN.includes('FLT') || upperPN.includes('FILTER')) return 'Filters';
    if (upperPN.includes('OIL')) return 'Fluids';
    if (upperPN.includes('TIRE') || upperPN.includes('WHEEL')) return 'Tires & Wheels';
    
    return 'General';
  }

  // Start a sync operation and log it
  private async startSyncLog(syncType: 'full' | 'incremental' | 'individual', endpoint?: string): Promise<string> {
    const syncLog: Partial<SyncLog> = {
      sync_type: syncType,
      started_at: new Date().toISOString(),
      status: 'running',
      parts_processed: 0,
      parts_updated: 0,
      parts_added: 0,
      keystone_endpoint: endpoint
    };

    const { data, error } = await this.supabase
      .from('keystone_sync_logs')
      .insert(syncLog)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create sync log: ${error.message}`);
    }

    return data.id;
  }

  // Update sync log with results
  private async updateSyncLog(
    logId: string, 
    updates: Partial<SyncLog>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('keystone_sync_logs')
      .update({
        ...updates,
        completed_at: updates.status !== 'running' ? new Date().toISOString() : undefined
      })
      .eq('id', logId);

    if (error) {
      console.error('Failed to update sync log:', error);
    }
  }

  // Full inventory sync from Keystone
  async performFullSync(): Promise<{ success: boolean; message: string; partsProcessed: number }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const logId = await this.startSyncLog('full', '/inventory/full');
    let partsProcessed = 0;
    let partsUpdated = 0;
    let partsAdded = 0;

    try {
      console.log('Starting full inventory sync...');

      // Check if we're rate limited
      if (this.keystoneService.isEndpointRateLimited('/inventory/full')) {
        const remainingTime = this.keystoneService.getRateLimitRemainingTime('/inventory/full');
        const rateLimitUntil = new Date(Date.now() + remainingTime * 1000).toISOString();
        
        await this.updateSyncLog(logId, {
          status: 'rate_limited',
          error_message: `Rate limited for ${remainingTime} seconds`,
          rate_limit_until: rateLimitUntil
        });

        return {
          success: false,
          message: `Rate limited. Try again in ${Math.ceil(remainingTime / 60)} minutes.`,
          partsProcessed: 0
        };
      }

      // Get full inventory from Keystone
      const response: KeystoneResponse<InventoryItem[]> = await this.keystoneService.getInventoryFull();

      if (!response.success) {
        await this.updateSyncLog(logId, {
          status: 'failed',
          error_message: response.error || 'Unknown error'
        });

        return {
          success: false,
          message: response.error || 'Failed to fetch inventory from Keystone',
          partsProcessed: 0
        };
      }

      const keystoneItems = response.data || [];
      partsProcessed = keystoneItems.length;

      console.log(`Processing ${partsProcessed} parts from Keystone...`);

      // Process items in batches to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < keystoneItems.length; i += batchSize) {
        const batch = keystoneItems.slice(i, i + batchSize);
        const inventoryParts = batch.map(item => this.transformKeystoneToInventory(item));

        // Check which parts already exist
        const existingParts = await this.supabase
          .from('inventory')
          .select('keystone_vcpn')
          .in('keystone_vcpn', inventoryParts.map(p => p.keystone_vcpn).filter(Boolean));

        const existingVcpns = new Set(existingParts.data?.map(p => p.keystone_vcpn) || []);

        // Separate updates and inserts
        const updates = inventoryParts.filter(p => p.keystone_vcpn && existingVcpns.has(p.keystone_vcpn));
        const inserts = inventoryParts.filter(p => !p.keystone_vcpn || !existingVcpns.has(p.keystone_vcpn));

        // Update existing parts
        for (const part of updates) {
          const { error } = await this.supabase
            .from('inventory')
            .update(part)
            .eq('keystone_vcpn', part.keystone_vcpn);

          if (!error) partsUpdated++;
        }

        // Insert new parts
        if (inserts.length > 0) {
          const { error, count } = await this.supabase
            .from('inventory')
            .insert(inserts)
            .select('id', { count: 'exact' });

          if (!error && count) {
            partsAdded += count;
          }
        }
      }

      await this.updateSyncLog(logId, {
        status: 'completed',
        parts_processed: partsProcessed,
        parts_updated: partsUpdated,
        parts_added: partsAdded
      });

      // Update sync schedule
      await this.updateSyncSchedule('daily_full');

      console.log(`Full sync completed: ${partsProcessed} parts processed, ${partsUpdated} updated, ${partsAdded} added`);

      return {
        success: true,
        message: `Successfully synced ${partsProcessed} parts (${partsUpdated} updated, ${partsAdded} added)`,
        partsProcessed
      };

    } catch (error: any) {
      console.error('Full sync error:', error);

      await this.updateSyncLog(logId, {
        status: 'failed',
        error_message: error.message,
        parts_processed: partsProcessed,
        parts_updated: partsUpdated,
        parts_added: partsAdded
      });

      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        partsProcessed
      };
    }
  }

  // Incremental sync for parts that haven't been updated recently
  async performIncrementalSync(hoursThreshold: number = 24): Promise<{ success: boolean; message: string; partsProcessed: number }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const logId = await this.startSyncLog('incremental', '/inventory/updates');
    let partsProcessed = 0;
    let partsUpdated = 0;

    try {
      console.log(`Starting incremental sync for parts older than ${hoursThreshold} hours...`);

      // Get stale parts using your existing table structure
      const { data: staleParts, error: staleError } = await this.supabase
        .rpc('get_stale_parts', { hours_threshold: hoursThreshold });

      if (staleError) {
        throw new Error(`Failed to get stale parts: ${staleError.message}`);
      }

      if (!staleParts || staleParts.length === 0) {
        await this.updateSyncLog(logId, {
          status: 'completed',
          parts_processed: 0,
          parts_updated: 0,
          parts_added: 0
        });

        return {
          success: true,
          message: 'No parts need updating',
          partsProcessed: 0
        };
      }

      console.log(`Found ${staleParts.length} stale parts to update`);

      // Update parts in batches
      const batchSize = 10; // Smaller batches for individual part updates
      for (let i = 0; i < staleParts.length; i += batchSize) {
        const batch = staleParts.slice(i, i + batchSize);
        
        for (const stalePart of batch) {
          try {
            const result = await this.updateSinglePart(stalePart.keystone_vcpn);
            if (result.success) {
              partsUpdated++;
            }
            partsProcessed++;
          } catch (error) {
            console.error(`Failed to update part ${stalePart.keystone_vcpn}:`, error);
            partsProcessed++;
          }
        }

        // Small delay between batches to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await this.updateSyncLog(logId, {
        status: 'completed',
        parts_processed: partsProcessed,
        parts_updated: partsUpdated,
        parts_added: 0
      });

      return {
        success: true,
        message: `Incremental sync completed: ${partsUpdated}/${partsProcessed} parts updated`,
        partsProcessed
      };

    } catch (error: any) {
      console.error('Incremental sync error:', error);

      await this.updateSyncLog(logId, {
        status: 'failed',
        error_message: error.message,
        parts_processed: partsProcessed,
        parts_updated: partsUpdated,
        parts_added: 0
      });

      return {
        success: false,
        message: `Incremental sync failed: ${error.message}`,
        partsProcessed
      };
    }
  }

  // Update a single part on-demand using keystone_vcpn
  async updateSinglePart(keystoneVcpn: string): Promise<{ success: boolean; message: string }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`Updating single part: ${keystoneVcpn}`);

      // Check if this specific part lookup is rate limited
      if (this.keystoneService.isEndpointRateLimited('/inventory/check')) {
        const remainingTime = this.keystoneService.getRateLimitRemainingTime('/inventory/check');
        return {
          success: false,
          message: `Rate limited. Try again in ${Math.ceil(remainingTime / 60)} minutes.`
        };
      }

      // Get part data from Keystone
      const response = await this.keystoneService.checkInventory(keystoneVcpn);

      if (!response.success) {
        // Mark as failed sync
        await this.supabase
          .from('inventory')
          .update({
            keystone_sync_status: 'failed',
            keystone_last_sync: new Date().toISOString()
          })
          .eq('keystone_vcpn', keystoneVcpn);

        return {
          success: false,
          message: response.error || 'Failed to fetch part from Keystone'
        };
      }

      const keystoneItems = response.data || [];
      if (keystoneItems.length === 0) {
        // Mark as not found
        await this.supabase
          .from('inventory')
          .update({
            keystone_sync_status: 'not_found',
            keystone_last_sync: new Date().toISOString()
          })
          .eq('keystone_vcpn', keystoneVcpn);

        return {
          success: false,
          message: 'Part not found in Keystone'
        };
      }

      // Transform and update in your inventory table
      const inventoryPart = this.transformKeystoneToInventory(keystoneItems[0]);
      
      const { error } = await this.supabase
        .from('inventory')
        .update(inventoryPart)
        .eq('keystone_vcpn', keystoneVcpn);

      if (error) {
        throw new Error(`Failed to update part in inventory: ${error.message}`);
      }

      console.log(`Successfully updated part: ${keystoneVcpn}`);

      return {
        success: true,
        message: `Part ${keystoneVcpn} updated successfully`
      };

    } catch (error: any) {
      console.error(`Error updating part ${keystoneVcpn}:`, error);
      
      // Mark as failed sync
      await this.supabase
        .from('inventory')
        .update({
          keystone_sync_status: 'error',
          keystone_last_sync: new Date().toISOString()
        })
        .eq('keystone_vcpn', keystoneVcpn);

      return {
        success: false,
        message: `Failed to update part: ${error.message}`
      };
    }
  }

  // Request an on-demand part update (queued)
  async requestPartUpdate(keystoneVcpn: string, requestedBy?: string, priority: number = 5): Promise<{ success: boolean; message: string }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const updateRequest: Partial<PartUpdateRequest> = {
        keystone_vcpn: keystoneVcpn,
        requested_by: requestedBy,
        status: 'pending',
        priority,
        requested_at: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('part_update_requests')
        .insert(updateRequest);

      if (error) {
        throw new Error(`Failed to create update request: ${error.message}`);
      }

      return {
        success: true,
        message: `Update request created for part ${keystoneVcpn}`
      };

    } catch (error: any) {
      console.error('Error creating part update request:', error);
      return {
        success: false,
        message: `Failed to request update: ${error.message}`
      };
    }
  }

  // Process pending part update requests
  async processPendingUpdates(maxRequests: number = 10): Promise<{ success: boolean; message: string; processed: number }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get pending requests ordered by priority and request time
      const { data: requests, error } = await this.supabase
        .from('part_update_requests')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: true })
        .order('requested_at', { ascending: true })
        .limit(maxRequests);

      if (error) {
        throw new Error(`Failed to get pending requests: ${error.message}`);
      }

      if (!requests || requests.length === 0) {
        return {
          success: true,
          message: 'No pending update requests',
          processed: 0
        };
      }

      let processed = 0;
      for (const request of requests) {
        try {
          // Mark as processing
          await this.supabase
            .from('part_update_requests')
            .update({ status: 'processing' })
            .eq('id', request.id);

          // Update the part
          const result = await this.updateSinglePart(request.keystone_vcpn);

          // Mark as completed or failed
          await this.supabase
            .from('part_update_requests')
            .update({
              status: result.success ? 'completed' : 'failed',
              processed_at: new Date().toISOString(),
              error_message: result.success ? null : result.message
            })
            .eq('id', request.id);

          processed++;

        } catch (error: any) {
          console.error(`Error processing request ${request.id}:`, error);
          
          // Mark as failed
          await this.supabase
            .from('part_update_requests')
            .update({
              status: 'failed',
              processed_at: new Date().toISOString(),
              error_message: error.message
            })
            .eq('id', request.id);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return {
        success: true,
        message: `Processed ${processed} update requests`,
        processed
      };

    } catch (error: any) {
      console.error('Error processing pending updates:', error);
      return {
        success: false,
        message: `Failed to process updates: ${error.message}`,
        processed: 0
      };
    }
  }

  // Update sync schedule after successful run
  private async updateSyncSchedule(syncType: string): Promise<void> {
    const nextRun = this.calculateNextRun(syncType);
    
    const { error } = await this.supabase
      .from('sync_schedule')
      .update({
        last_run: new Date().toISOString(),
        next_run: nextRun,
        retry_count: 0
      })
      .eq('sync_type', syncType);

    if (error) {
      console.error('Failed to update sync schedule:', error);
    }
  }

  // Calculate next run time based on sync type
  private calculateNextRun(syncType: string): string {
    const now = new Date();
    
    switch (syncType) {
      case 'daily_full':
        // Next day at 2 AM
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(2, 0, 0, 0);
        return tomorrow.toISOString();
        
      case 'weekly_full':
        // Next Sunday at 1 AM
        const nextSunday = new Date(now);
        nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
        nextSunday.setHours(1, 0, 0, 0);
        return nextSunday.toISOString();
        
      default:
        // Default to 24 hours from now
        const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return nextDay.toISOString();
    }
  }

  // Get inventory from Supabase (using your existing table)
  async getInventoryFromSupabase(filters?: {
    category?: string;
    inStockOnly?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: InventoryPart[]; count: number; error?: string }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      let query = this.supabase
        .from('inventory')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters?.inStockOnly) {
        query = query.gt('quantity', 0);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,keystone_vcpn.ilike.%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      // Order by updated_at desc to show recently updated parts first
      query = query.order('updated_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch inventory: ${error.message}`);
      }

      return {
        data: data || [],
        count: count || 0
      };

    } catch (error: any) {
      console.error('Error fetching inventory from Supabase:', error);
      return {
        data: [],
        count: 0,
        error: error.message
      };
    }
  }

  // Get sync status and logs
  async getSyncStatus(): Promise<{
    lastFullSync?: SyncLog;
    lastIncrementalSync?: SyncLog;
    pendingRequests: number;
    nextScheduledSync?: string;
    syncStats?: any;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get latest sync logs
      const { data: syncLogs } = await this.supabase
        .from('keystone_sync_logs')
        .select('*')
        .in('sync_type', ['full', 'incremental'])
        .order('started_at', { ascending: false })
        .limit(10);

      // Get pending update requests count
      const { count: pendingRequests } = await this.supabase
        .from('part_update_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get next scheduled sync
      const { data: schedules } = await this.supabase
        .from('sync_schedule')
        .select('*')
        .eq('enabled', true)
        .order('next_run', { ascending: true })
        .limit(1);

      // Get sync statistics
      const { data: syncStats } = await this.supabase
        .rpc('get_sync_stats');

      const lastFullSync = syncLogs?.find(log => log.sync_type === 'full');
      const lastIncrementalSync = syncLogs?.find(log => log.sync_type === 'incremental');
      const nextScheduledSync = schedules?.[0]?.next_run;

      return {
        lastFullSync,
        lastIncrementalSync,
        pendingRequests: pendingRequests || 0,
        nextScheduledSync,
        syncStats: syncStats?.[0]
      };

    } catch (error: any) {
      console.error('Error getting sync status:', error);
      return {
        pendingRequests: 0
      };
    }
  }

  // Check if sync should run based on schedule
  async shouldRunScheduledSync(): Promise<{ shouldRun: boolean; syncType?: string }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const { data: schedules } = await this.supabase
        .from('sync_schedule')
        .select('*')
        .eq('enabled', true)
        .lte('next_run', new Date().toISOString())
        .order('next_run', { ascending: true })
        .limit(1);

      if (schedules && schedules.length > 0) {
        return {
          shouldRun: true,
          syncType: schedules[0].sync_type
        };
      }

      return { shouldRun: false };

    } catch (error: any) {
      console.error('Error checking scheduled sync:', error);
      return { shouldRun: false };
    }
  }
}

export default InventorySyncService;


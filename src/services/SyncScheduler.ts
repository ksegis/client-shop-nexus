// Updated Sync Scheduler - Works with existing inventory table
import { InventorySyncService } from './InventorySyncService';

interface SchedulerConfig {
  enableDailySync: boolean;
  dailySyncTime: string; // HH:MM format
  enableIncrementalSync: boolean;
  incrementalSyncInterval: number; // hours
  maxConcurrentUpdates: number;
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

interface SchedulerStatus {
  isRunning: boolean;
  lastSync?: Date;
  nextSync?: Date;
  currentOperation?: string;
  pendingUpdates: number;
  errors: string[];
}

export class SyncScheduler {
  private syncService: InventorySyncService;
  private config: SchedulerConfig;
  private status: SchedulerStatus;
  private dailyTimer?: NodeJS.Timeout;
  private incrementalTimer?: NodeJS.Timeout;
  private processingTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config?: Partial<SchedulerConfig>) {
    this.syncService = new InventorySyncService();
    
    this.config = {
      enableDailySync: true,
      dailySyncTime: '02:00', // 2 AM
      enableIncrementalSync: false, // Disabled by default due to rate limits
      incrementalSyncInterval: 6, // 6 hours
      maxConcurrentUpdates: 5,
      retryAttempts: 3,
      retryDelay: 60000, // 1 minute
      ...config
    };

    this.status = {
      isRunning: false,
      pendingUpdates: 0,
      errors: []
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.syncService.initialize();
      
      // Start schedulers if enabled
      if (this.config.enableDailySync) {
        this.scheduleDailySync();
      }

      if (this.config.enableIncrementalSync) {
        this.scheduleIncrementalSync();
      }

      // Start processing pending updates
      this.startProcessingPendingUpdates();

      // Check for missed syncs on startup
      await this.checkMissedSyncs();

      this.isInitialized = true;
      console.log('SyncScheduler initialized successfully with existing inventory table');
    } catch (error) {
      console.error('Failed to initialize SyncScheduler:', error);
      throw error;
    }
  }

  // Schedule daily full sync
  private scheduleDailySync(): void {
    const now = new Date();
    const [hours, minutes] = this.config.dailySyncTime.split(':').map(Number);
    
    // Calculate next sync time
    const nextSync = new Date();
    nextSync.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (nextSync <= now) {
      nextSync.setDate(nextSync.getDate() + 1);
    }

    const msUntilSync = nextSync.getTime() - now.getTime();
    
    console.log(`Daily sync scheduled for ${nextSync.toLocaleString()}`);
    this.status.nextSync = nextSync;

    this.dailyTimer = setTimeout(async () => {
      await this.runDailySync();
      // Reschedule for next day
      this.scheduleDailySync();
    }, msUntilSync);
  }

  // Schedule incremental sync
  private scheduleIncrementalSync(): void {
    const intervalMs = this.config.incrementalSyncInterval * 60 * 60 * 1000;
    
    this.incrementalTimer = setInterval(async () => {
      await this.runIncrementalSync();
    }, intervalMs);

    console.log(`Incremental sync scheduled every ${this.config.incrementalSyncInterval} hours`);
  }

  // Start processing pending part update requests
  private startProcessingPendingUpdates(): void {
    // Process pending updates every 5 minutes
    this.processingTimer = setInterval(async () => {
      await this.processPendingUpdates();
    }, 5 * 60 * 1000);

    console.log('Started processing pending part updates every 5 minutes');
  }

  // Check for missed syncs on startup
  private async checkMissedSyncs(): Promise<void> {
    try {
      const syncStatus = await this.syncService.getSyncStatus();
      
      // Check if we should run a scheduled sync
      const { shouldRun, syncType } = await this.syncService.shouldRunScheduledSync();
      
      if (shouldRun) {
        console.log(`Running missed ${syncType} sync...`);
        
        if (syncType === 'daily_full') {
          await this.runDailySync();
        } else if (syncType === 'incremental') {
          await this.runIncrementalSync();
        }
      }

      // Check if last full sync was more than 48 hours ago
      if (syncStatus.lastFullSync) {
        const lastSyncTime = new Date(syncStatus.lastFullSync.started_at);
        const hoursSinceLastSync = (Date.now() - lastSyncTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastSync > 48) {
          console.log('Last full sync was more than 48 hours ago, running emergency sync...');
          await this.runDailySync();
        }
      } else {
        console.log('No previous full sync found, running initial sync...');
        await this.runDailySync();
      }

    } catch (error) {
      console.error('Error checking missed syncs:', error);
      this.addError(`Failed to check missed syncs: ${error}`);
    }
  }

  // Run daily full sync
  private async runDailySync(): Promise<void> {
    if (this.status.isRunning) {
      console.log('Sync already running, skipping daily sync');
      return;
    }

    this.status.isRunning = true;
    this.status.currentOperation = 'Daily Full Sync';
    this.status.lastSync = new Date();

    try {
      console.log('Starting daily full sync...');
      
      const result = await this.syncService.performFullSync();
      
      if (result.success) {
        console.log(`Daily sync completed successfully: ${result.message}`);
        this.clearErrors();
      } else {
        console.error(`Daily sync failed: ${result.message}`);
        this.addError(`Daily sync failed: ${result.message}`);
        
        // Schedule retry if it's not a rate limit issue
        if (!result.message.includes('Rate limited')) {
          await this.scheduleRetry('daily');
        }
      }

    } catch (error: any) {
      console.error('Daily sync error:', error);
      this.addError(`Daily sync error: ${error.message}`);
      await this.scheduleRetry('daily');
    } finally {
      this.status.isRunning = false;
      this.status.currentOperation = undefined;
    }
  }

  // Run incremental sync
  private async runIncrementalSync(): Promise<void> {
    if (this.status.isRunning) {
      console.log('Sync already running, skipping incremental sync');
      return;
    }

    this.status.isRunning = true;
    this.status.currentOperation = 'Incremental Sync';

    try {
      console.log('Starting incremental sync...');
      
      const result = await this.syncService.performIncrementalSync(24);
      
      if (result.success) {
        console.log(`Incremental sync completed: ${result.message}`);
      } else {
        console.error(`Incremental sync failed: ${result.message}`);
        this.addError(`Incremental sync failed: ${result.message}`);
      }

    } catch (error: any) {
      console.error('Incremental sync error:', error);
      this.addError(`Incremental sync error: ${error.message}`);
    } finally {
      this.status.isRunning = false;
      this.status.currentOperation = undefined;
    }
  }

  // Process pending part update requests
  private async processPendingUpdates(): Promise<void> {
    if (this.status.isRunning) {
      return; // Don't process updates during full sync
    }

    try {
      const result = await this.syncService.processPendingUpdates(this.config.maxConcurrentUpdates);
      
      if (result.processed > 0) {
        console.log(`Processed ${result.processed} pending part updates`);
      }

      // Update pending count
      const syncStatus = await this.syncService.getSyncStatus();
      this.status.pendingUpdates = syncStatus.pendingRequests;

    } catch (error: any) {
      console.error('Error processing pending updates:', error);
      this.addError(`Failed to process pending updates: ${error.message}`);
    }
  }

  // Schedule retry for failed sync
  private async scheduleRetry(syncType: 'daily' | 'incremental'): Promise<void> {
    console.log(`Scheduling retry for ${syncType} sync in ${this.config.retryDelay / 1000} seconds`);
    
    setTimeout(async () => {
      if (syncType === 'daily') {
        await this.runDailySync();
      } else {
        await this.runIncrementalSync();
      }
    }, this.config.retryDelay);
  }

  // Manual sync triggers
  async triggerFullSync(): Promise<{ success: boolean; message: string }> {
    if (this.status.isRunning) {
      return {
        success: false,
        message: 'Sync already in progress'
      };
    }

    try {
      await this.runDailySync();
      return {
        success: true,
        message: 'Full sync completed successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Full sync failed: ${error.message}`
      };
    }
  }

  async triggerIncrementalSync(): Promise<{ success: boolean; message: string }> {
    if (this.status.isRunning) {
      return {
        success: false,
        message: 'Sync already in progress'
      };
    }

    try {
      await this.runIncrementalSync();
      return {
        success: true,
        message: 'Incremental sync completed successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Incremental sync failed: ${error.message}`
      };
    }
  }

  // Request on-demand part update using keystone_vcpn
  async requestPartUpdate(keystoneVcpn: string, priority: number = 5): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.syncService.requestPartUpdate(keystoneVcpn, 'user', priority);
      
      if (result.success) {
        this.status.pendingUpdates++;
      }
      
      return result;
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to request part update: ${error.message}`
      };
    }
  }

  // Update individual part immediately (bypasses queue) using keystone_vcpn
  async updatePartNow(keystoneVcpn: string): Promise<{ success: boolean; message: string }> {
    try {
      return await this.syncService.updateSinglePart(keystoneVcpn);
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to update part: ${error.message}`
      };
    }
  }

  // Configuration management
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    // Restart schedulers if timing changed
    if (oldConfig.dailySyncTime !== this.config.dailySyncTime && this.config.enableDailySync) {
      if (this.dailyTimer) {
        clearTimeout(this.dailyTimer);
      }
      this.scheduleDailySync();
    }

    if (oldConfig.incrementalSyncInterval !== this.config.incrementalSyncInterval && this.config.enableIncrementalSync) {
      if (this.incrementalTimer) {
        clearInterval(this.incrementalTimer);
      }
      this.scheduleIncrementalSync();
    }

    // Enable/disable schedulers
    if (!oldConfig.enableDailySync && this.config.enableDailySync) {
      this.scheduleDailySync();
    } else if (oldConfig.enableDailySync && !this.config.enableDailySync) {
      if (this.dailyTimer) {
        clearTimeout(this.dailyTimer);
        this.dailyTimer = undefined;
      }
    }

    if (!oldConfig.enableIncrementalSync && this.config.enableIncrementalSync) {
      this.scheduleIncrementalSync();
    } else if (oldConfig.enableIncrementalSync && !this.config.enableIncrementalSync) {
      if (this.incrementalTimer) {
        clearInterval(this.incrementalTimer);
        this.incrementalTimer = undefined;
      }
    }

    console.log('Scheduler configuration updated');
  }

  // Status and monitoring
  getStatus(): SchedulerStatus {
    return { ...this.status };
  }

  getConfig(): SchedulerConfig {
    return { ...this.config };
  }

  async getSyncHistory(): Promise<any> {
    return await this.syncService.getSyncStatus();
  }

  // Error management
  private addError(error: string): void {
    this.status.errors.push(`${new Date().toISOString()}: ${error}`);
    
    // Keep only last 10 errors
    if (this.status.errors.length > 10) {
      this.status.errors = this.status.errors.slice(-10);
    }
  }

  private clearErrors(): void {
    this.status.errors = [];
  }

  // Cleanup
  destroy(): void {
    if (this.dailyTimer) {
      clearTimeout(this.dailyTimer);
    }
    
    if (this.incrementalTimer) {
      clearInterval(this.incrementalTimer);
    }
    
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }

    console.log('SyncScheduler destroyed');
  }
}

// Singleton instance for global use
let schedulerInstance: SyncScheduler | null = null;

export const getSyncScheduler = (config?: Partial<SchedulerConfig>): SyncScheduler => {
  if (!schedulerInstance) {
    schedulerInstance = new SyncScheduler(config);
  }
  return schedulerInstance;
};

export default SyncScheduler;


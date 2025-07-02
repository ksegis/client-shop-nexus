// =====================================================
// PHASE 1 - WEEK 4: KEYSTONE SYNC SCHEDULER
// Automated synchronization scheduler for Keystone data
// =====================================================

import { keystoneAPI } from './KeystoneAPIService';

export interface SyncSchedule {
  inventory: {
    enabled: boolean;
    interval: number; // minutes
    lastRun?: Date;
    nextRun?: Date;
  };
  pricing: {
    enabled: boolean;
    interval: number; // minutes
    lastRun?: Date;
    nextRun?: Date;
  };
  catalog: {
    enabled: boolean;
    interval: number; // minutes
    lastRun?: Date;
    nextRun?: Date;
  };
}

/**
 * Keystone synchronization scheduler
 * Manages automated data synchronization with Keystone API
 */
export class KeystoneSyncScheduler {
  private schedule: SyncSchedule;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor() {
    // Default schedule - can be configured via admin interface
    this.schedule = {
      inventory: {
        enabled: true,
        interval: 30, // 30 minutes
      },
      pricing: {
        enabled: true,
        interval: 240, // 4 hours
      },
      catalog: {
        enabled: false,
        interval: 1440, // 24 hours
      }
    };
  }

  /**
   * Start the sync scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('Keystone sync scheduler is already running');
      return;
    }

    console.log('Starting Keystone sync scheduler...');
    this.isRunning = true;

    // Schedule inventory sync
    if (this.schedule.inventory.enabled) {
      this.scheduleSync('inventory', this.schedule.inventory.interval, () => {
        return keystoneAPI.runInventorySync();
      });
    }

    // Schedule pricing sync
    if (this.schedule.pricing.enabled) {
      this.scheduleSync('pricing', this.schedule.pricing.interval, () => {
        return keystoneAPI.runPricingSync();
      });
    }

    // Schedule catalog sync
    if (this.schedule.catalog.enabled) {
      this.scheduleSync('catalog', this.schedule.catalog.interval, () => {
        return keystoneAPI.getFullCatalog();
      });
    }

    console.log('Keystone sync scheduler started successfully');
  }

  /**
   * Stop the sync scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Keystone sync scheduler is not running');
      return;
    }

    console.log('Stopping Keystone sync scheduler...');
    
    // Clear all timers
    for (const [syncType, timer] of this.timers) {
      clearInterval(timer);
      console.log(`Stopped ${syncType} sync timer`);
    }
    
    this.timers.clear();
    this.isRunning = false;
    
    console.log('Keystone sync scheduler stopped');
  }

  /**
   * Schedule a specific sync type
   */
  private scheduleSync(syncType: string, intervalMinutes: number, syncFunction: () => Promise<any>): void {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    // Run immediately on start
    this.runSync(syncType, syncFunction);
    
    // Schedule recurring runs
    const timer = setInterval(() => {
      this.runSync(syncType, syncFunction);
    }, intervalMs);
    
    this.timers.set(syncType, timer);
    
    // Update next run time
    const nextRun = new Date(Date.now() + intervalMs);
    this.updateSchedule(syncType, { nextRun });
    
    console.log(`Scheduled ${syncType} sync every ${intervalMinutes} minutes (next: ${nextRun.toLocaleString()})`);
  }

  /**
   * Run a specific sync operation
   */
  private async runSync(syncType: string, syncFunction: () => Promise<any>): Promise<void> {
    try {
      console.log(`Running ${syncType} sync...`);
      const startTime = new Date();
      
      await syncFunction();
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      // Update last run time
      this.updateSchedule(syncType, { lastRun: endTime });
      
      console.log(`${syncType} sync completed in ${duration}ms`);
    } catch (error) {
      console.error(`${syncType} sync failed:`, error);
    }
  }

  /**
   * Update schedule for a specific sync type
   */
  private updateSchedule(syncType: string, updates: Partial<SyncSchedule[keyof SyncSchedule]>): void {
    if (syncType in this.schedule) {
      Object.assign(this.schedule[syncType as keyof SyncSchedule], updates);
    }
  }

  /**
   * Get current schedule
   */
  getSchedule(): SyncSchedule {
    return { ...this.schedule };
  }

  /**
   * Update schedule configuration
   */
  updateSchedule(newSchedule: Partial<SyncSchedule>): void {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.stop();
    }
    
    // Update schedule
    Object.assign(this.schedule, newSchedule);
    
    if (wasRunning) {
      this.start();
    }
    
    console.log('Sync schedule updated:', this.schedule);
  }

  /**
   * Manually trigger a sync operation
   */
  async triggerSync(syncType: 'inventory' | 'pricing' | 'catalog'): Promise<void> {
    console.log(`Manually triggering ${syncType} sync...`);
    
    try {
      switch (syncType) {
        case 'inventory':
          await keystoneAPI.runInventorySync();
          break;
        case 'pricing':
          await keystoneAPI.runPricingSync();
          break;
        case 'catalog':
          await keystoneAPI.getFullCatalog();
          break;
        default:
          throw new Error(`Unknown sync type: ${syncType}`);
      }
      
      console.log(`Manual ${syncType} sync completed`);
    } catch (error) {
      console.error(`Manual ${syncType} sync failed:`, error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  getStatus(): {
    isRunning: boolean;
    schedule: SyncSchedule;
    activeTimers: string[];
  } {
    return {
      isRunning: this.isRunning,
      schedule: this.getSchedule(),
      activeTimers: Array.from(this.timers.keys())
    };
  }

  /**
   * Check if Keystone is configured and ready
   */
  async isKeystoneReady(): Promise<boolean> {
    try {
      await keystoneAPI.loadConfig();
      return keystoneAPI.isConfigured();
    } catch (error) {
      console.error('Keystone configuration check failed:', error);
      return false;
    }
  }

  /**
   * Initialize scheduler with configuration check
   */
  async initialize(): Promise<void> {
    try {
      const isReady = await this.isKeystoneReady();
      
      if (isReady) {
        console.log('Keystone is configured and ready');
        // Auto-start scheduler if in production
        if (process.env.NODE_ENV === 'production') {
          this.start();
        }
      } else {
        console.log('Keystone is not configured - scheduler will not start automatically');
      }
    } catch (error) {
      console.error('Failed to initialize Keystone sync scheduler:', error);
    }
  }
}

// Export singleton instance
export const keystoneSyncScheduler = new KeystoneSyncScheduler();

// Auto-initialize when module is loaded
if (typeof window === 'undefined') { // Server-side only
  keystoneSyncScheduler.initialize();
}


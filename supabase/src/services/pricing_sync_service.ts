/**
 * Minimal Pricing Sync Service for Keystone API Integration
 * 
 * This is a simplified version that focuses on core functionality
 * and avoids complex imports that might cause build issues.
 */

import { createClient } from '@supabase/supabase-js';

// Create Supabase client directly to avoid import issues
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

export interface PricingSyncStatus {
  lastFullSync?: string;
  lastIncrementalSync?: string;
  totalParts: number;
  syncedParts: number;
  staleParts: number;
  pendingUpdates: number;
  isRunning: boolean;
  recentLogs: any[];
  errorRate: number;
  averageSyncTime: number;
}

/**
 * Minimal PricingSyncService - Core functionality only
 */
export class PricingSyncService {
  private supabase = createSupabaseClient();
  private isInitialized = false;

  constructor() {
    // No KeystoneService dependency for now to avoid import issues
  }

  /**
   * Initialize the pricing sync service
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔧 Initializing PricingSyncService...');
      
      // Test database connectivity
      await this.testDatabaseConnection();
      
      this.isInitialized = true;
      console.log('✅ PricingSyncService initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize PricingSyncService:', error);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  private async testDatabaseConnection(): Promise<void> {
    try {
      console.log('🔍 Testing database connection...');
      
      // Test basic Supabase connection
      const { data, error } = await this.supabase
        .from('inventory')
        .select('id')
        .limit(1);

      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }

      console.log('✅ Database connection verified');
      
      // Test if pricing_cache table exists
      const { data: pricingData, error: pricingError } = await this.supabase
        .from('pricing_cache')
        .select('id')
        .limit(1);

      if (pricingError && pricingError.code === 'PGRST116') {
        console.warn('⚠️ pricing_cache table does not exist. Please run the pricing system database schema.');
      } else if (pricingError) {
        console.warn('⚠️ pricing_cache table access issue:', pricingError.message);
      } else {
        console.log('✅ pricing_cache table found');
      }

    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      throw error;
    }
  }

  /**
   * Get pricing data from Supabase
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

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Order by last sync time
      query = query.order('keystone_last_sync', { ascending: false });

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('⚠️ pricing_cache table not found, returning empty array');
          return [];
        }
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get pricing from Supabase:', error);
      return [];
    }
  }

  /**
   * Save pricing data to Supabase
   */
  async savePricingData(pricingData: Omit<PricingData, 'id'>): Promise<PricingData | null> {
    try {
      const { data, error } = await this.supabase
        .from('pricing_cache')
        .upsert(pricingData, {
          onConflict: 'keystone_vcpn'
        })
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.error('❌ pricing_cache table does not exist. Please run the pricing system database schema.');
          return null;
        }
        throw error;
      }

      return data;

    } catch (error) {
      console.error(`❌ Failed to save pricing data for ${pricingData.keystone_vcpn}:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive pricing sync status
   */
  async getPricingSyncStatus(): Promise<PricingSyncStatus> {
    try {
      // Return basic status for now
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

    } catch (error) {
      console.error('❌ Failed to get pricing sync status:', error);
      
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

  /**
   * Request a pricing update (placeholder for now)
   */
  async requestPricingUpdate(vcpn: string, priority: 'high' | 'medium' | 'low' = 'medium', requestedBy?: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📋 Pricing update requested for ${vcpn} (priority: ${priority})`);
      
      // For now, just return success
      // Later we can integrate with KeystoneService when import issues are resolved
      return {
        success: true,
        message: `Pricing update requested for ${vcpn} - will be processed when KeystoneService is available`
      };

    } catch (error) {
      console.error(`❌ Failed to request pricing update for ${vcpn}:`, error);
      return {
        success: false,
        message: `Failed to request pricing update: ${error.message}`
      };
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


import { getSupabaseClient } from '@/lib/supabase';
import { FTPSyncService, SyncResult } from './ftp_sync_service';
// REMOVED: import { KitComponentService } from './kit_component_service'; - This was causing the build error

// Types for sync decisions and results
interface SyncConditions {
  isRateLimited: boolean;
  itemCount: number;
  isFullRefresh: boolean;
  lastSyncAge: number; // hours
  apiErrorCount: number;
  forceMethod?: 'api' | 'ftp';
}

interface SyncDecision {
  method: 'api' | 'ftp';
  reason: string;
  confidence: number; // 0-1
}

interface SyncOptions {
  syncType: 'inventory' | 'pricing' | 'kits' | 'all';
  forceMethod?: 'api' | 'ftp';
  batchSize?: number;
  maxRetries?: number;
}

interface ComprehensiveSyncResult {
  overall_success: boolean;
  sync_method: 'api' | 'ftp' | 'hybrid';
  total_duration: number;
  results: {
    inventory?: SyncResult;
    pricing?: SyncResult;
    kits?: SyncResult;
  };
  decision_log: SyncDecision[];
  recommendations: string[];
}

class KeystoneSyncController {
  private supabase = getSupabaseClient();
  private ftpService = new FTPSyncService();
  // REMOVED: private kitService = new KitComponentService(); - This was causing the build error

  // Rate limit tracking
  private rateLimitStatus = {
    inventory: { limited: false, resetTime: null as Date | null },
    pricing: { limited: false, resetTime: null as Date | null },
    kits: { limited: false, resetTime: null as Date | null }
  };

  /**
   * Main orchestration method - decides and executes sync strategy
   */
  async performIntelligentSync(options: SyncOptions): Promise<ComprehensiveSyncResult> {
    const startTime = Date.now();
    const result: ComprehensiveSyncResult = {
      overall_success: false,
      sync_method: 'api',
      total_duration: 0,
      results: {},
      decision_log: [],
      recommendations: []
    };

    try {
      console.log('🧠 Starting intelligent sync orchestration...');
      
      // Analyze current conditions
      const conditions = await this.analyzeSyncConditions(options.syncType);
      
      // Make sync decisions for each type
      const decisions = await this.makeSyncDecisions(conditions, options);
      result.decision_log = decisions;

      // Execute syncs based on decisions
      if (options.syncType === 'all') {
        result.sync_method = 'hybrid';
        await this.executeHybridSync(decisions, result);
      } else {
        const decision = decisions.find(d => d.method) || decisions[0];
        result.sync_method = decision.method;
        await this.executeSingleSync(options.syncType, decision, result);
      }

      // Calculate overall success
      const syncResults = Object.values(result.results);
      const successCount = syncResults.filter(r => r.success).length;
      result.overall_success = successCount > 0 && successCount >= syncResults.length * 0.5;

      // Generate recommendations
      result.recommendations = this.generateRecommendations(result);

      result.total_duration = Date.now() - startTime;
      console.log(`✅ Intelligent sync completed in ${result.total_duration}ms`);

      return result;

    } catch (error) {
      console.error('❌ Intelligent sync failed:', error);
      result.total_duration = Date.now() - startTime;
      result.recommendations.push(`Sync failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Analyze current conditions to inform sync decisions
   */
  private async analyzeSyncConditions(syncType: string): Promise<SyncConditions> {
    const conditions: SyncConditions = {
      isRateLimited: false,
      itemCount: 0,
      isFullRefresh: false,
      lastSyncAge: 0,
      apiErrorCount: 0
    };

    try {
      // Check rate limit status
      conditions.isRateLimited = await this.checkRateLimitStatus(syncType);

      // Get item count estimate
      conditions.itemCount = await this.getItemCountEstimate(syncType);

      // Check last sync age
      conditions.lastSyncAge = await this.getLastSyncAge(syncType);

      // Check recent API error count
      conditions.apiErrorCount = await this.getRecentApiErrorCount();

      // Determine if full refresh is needed
      conditions.isFullRefresh = conditions.lastSyncAge > 24 || conditions.itemCount > 5000;

      console.log('📊 Sync conditions analyzed:', conditions);
      return conditions;

    } catch (error) {
      console.error('❌ Failed to analyze sync conditions:', error);
      return conditions;
    }
  }

  /**
   * Make intelligent decisions about sync methods
   */
  private async makeSyncDecisions(conditions: SyncConditions, options: SyncOptions): Promise<SyncDecision[]> {
    const decisions: SyncDecision[] = [];

    // Force method if specified
    if (options.forceMethod) {
      decisions.push({
        method: options.forceMethod,
        reason: `Forced to use ${options.forceMethod} method`,
        confidence: 1.0
      });
      return decisions;
    }

    // Decision logic for each sync type
    const syncTypes = options.syncType === 'all' ? ['inventory', 'pricing', 'kits'] : [options.syncType];

    for (const type of syncTypes) {
      const decision = this.decideSyncMethod(type, conditions);
      decisions.push(decision);
    }

    return decisions;
  }

  /**
   * Decide sync method for a specific type
   */
  private decideSyncMethod(syncType: string, conditions: SyncConditions): SyncDecision {
    let score = 0;
    const reasons: string[] = [];

    // Rate limiting strongly favors FTP
    if (conditions.isRateLimited) {
      score += 50;
      reasons.push('API rate limited');
    }

    // Large item counts favor FTP
    if (conditions.itemCount > 5000) {
      score += 30;
      reasons.push(`Large dataset (${conditions.itemCount} items)`);
    } else if (conditions.itemCount > 1000) {
      score += 15;
      reasons.push(`Medium dataset (${conditions.itemCount} items)`);
    }

    // Full refresh favors FTP
    if (conditions.isFullRefresh) {
      score += 20;
      reasons.push('Full refresh needed');
    }

    // Recent API errors favor FTP
    if (conditions.apiErrorCount > 5) {
      score += 25;
      reasons.push(`Recent API errors (${conditions.apiErrorCount})`);
    }

    // Small datasets favor API for real-time updates
    if (conditions.itemCount < 100 && !conditions.isRateLimited) {
      score -= 30;
      reasons.push('Small dataset suitable for API');
    }

    // Recent successful sync favors API for delta updates
    if (conditions.lastSyncAge < 2 && !conditions.isRateLimited) {
      score -= 20;
      reasons.push('Recent sync, delta update suitable');
    }

    // Kit-specific logic
    if (syncType === 'kits') {
      // Kits are typically smaller datasets, prefer API unless rate limited
      if (!conditions.isRateLimited && conditions.itemCount < 1000) {
        score -= 25;
        reasons.push('Kit data suitable for API');
      }
    }

    // Pricing-specific logic
    if (syncType === 'pricing') {
      // Pricing updates are frequent, prefer API for real-time
      if (!conditions.isRateLimited && conditions.lastSyncAge < 6) {
        score -= 15;
        reasons.push('Pricing updates benefit from API real-time sync');
      }
    }

    const method = score > 0 ? 'ftp' : 'api';
    const confidence = Math.min(Math.abs(score) / 100, 1.0);

    return {
      method,
      reason: reasons.join(', ') || `Default ${method} selection`,
      confidence
    };
  }

  /**
   * Execute hybrid sync (different methods for different types)
   */
  private async executeHybridSync(decisions: SyncDecision[], result: ComprehensiveSyncResult): Promise<void> {
    const syncPromises: Promise<void>[] = [];

    for (const decision of decisions) {
      const syncType = this.getSyncTypeFromDecision(decision, decisions);
      
      if (syncType) {
        syncPromises.push(this.executeSingleSync(syncType, decision, result));
      }
    }

    // Execute all syncs in parallel
    await Promise.allSettled(syncPromises);
  }

  /**
   * Execute single sync based on decision
   */
  private async executeSingleSync(syncType: string, decision: SyncDecision, result: ComprehensiveSyncResult): Promise<void> {
    try {
      console.log(`🔄 Executing ${decision.method} sync for ${syncType}: ${decision.reason}`);

      let syncResult: SyncResult;

      if (decision.method === 'ftp') {
        syncResult = await this.executeFTPSync(syncType);
      } else {
        syncResult = await this.executeAPISync(syncType);
      }

      result.results[syncType as keyof typeof result.results] = syncResult;

      // Update rate limit status based on results
      if (!syncResult.success && syncResult.errors.some(e => e.includes('429') || e.includes('rate limit'))) {
        this.updateRateLimitStatus(syncType, true);
      }

    } catch (error) {
      console.error(`❌ ${syncType} sync failed:`, error);
      result.results[syncType as keyof typeof result.results] = {
        success: false,
        processed: 0,
        updated: 0,
        failed: 0,
        errors: [error.message],
        duration: 0,
        source: decision.method
      };
    }
  }

  /**
   * Execute FTP sync for specific type
   */
  private async executeFTPSync(syncType: string): Promise<SyncResult> {
    switch (syncType) {
      case 'inventory':
        return await this.ftpService.syncInventoryFromFTP();
      case 'pricing':
        return await this.ftpService.syncPricingFromFTP();
      case 'kits':
        return await this.ftpService.syncKitsFromFTP();
      default:
        throw new Error(`Unknown sync type: ${syncType}`);
    }
  }

  /**
   * Execute API sync for specific type (fallback to existing methods)
   */
  private async executeAPISync(syncType: string): Promise<SyncResult> {
    // This would integrate with existing API sync methods
    // For now, return a placeholder that indicates API method was attempted
    
    const startTime = Date.now();
    
    try {
      switch (syncType) {
        case 'kits':
          // MODIFIED: Direct kit sync without separate service to avoid import error
          // This is a simplified version - you'd integrate with existing API methods
          // For now, we'll use FTP service for kit sync as well
          return await this.ftpService.syncKitsFromFTP();
        
        case 'inventory':
        case 'pricing':
          // These would integrate with existing inventory/pricing API methods
          // For now, simulate API call
          throw new Error(`API sync for ${syncType} not yet implemented - use FTP`);
        
        default:
          throw new Error(`Unknown sync type: ${syncType}`);
      }
    } catch (error) {
      return {
        success: false,
        processed: 0,
        updated: 0,
        failed: 1,
        errors: [error.message],
        duration: Date.now() - startTime,
        source: 'api'
      };
    }
  }

  /**
   * Check if API is currently rate limited
   */
  private async checkRateLimitStatus(syncType: string): Promise<boolean> {
    // Check stored rate limit status
    const status = this.rateLimitStatus[syncType as keyof typeof this.rateLimitStatus];
    
    if (status?.limited && status.resetTime && new Date() < status.resetTime) {
      return true;
    }

    // Check recent sync logs for rate limit errors
    try {
      const { data } = await this.supabase
        .from('keystone_sync_logs')
        .select('error_message, completed_at')
        .eq('sync_type', syncType)
        .gte('completed_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order('completed_at', { ascending: false })
        .limit(5);

      const hasRecentRateLimit = data?.some(log => 
        log.error_message?.includes('429') || 
        log.error_message?.includes('rate limit') ||
        log.error_message?.includes('Rate limit exceeded')
      );

      return hasRecentRateLimit || false;
    } catch (error) {
      console.warn('⚠️ Failed to check rate limit status:', error);
      return false;
    }
  }

  /**
   * Get estimated item count for sync type
   */
  private async getItemCountEstimate(syncType: string): Promise<number> {
    try {
      switch (syncType) {
        case 'inventory':
          const { count: inventoryCount } = await this.supabase
            .from('inventory')
            .select('*', { count: 'exact', head: true });
          return inventoryCount || 0;

        case 'pricing':
          const { count: pricingCount } = await this.supabase
            .from('keystone_pricing')
            .select('*', { count: 'exact', head: true });
          return pricingCount || 0;

        case 'kits':
          const { count: kitCount } = await this.supabase
            .from('keystone_kit_components')
            .select('*', { count: 'exact', head: true });
          return kitCount || 0;

        default:
          return 0;
      }
    } catch (error) {
      console.warn('⚠️ Failed to get item count estimate:', error);
      return 0;
    }
  }

  /**
   * Get age of last successful sync in hours
   */
  private async getLastSyncAge(syncType: string): Promise<number> {
    try {
      const { data } = await this.supabase
        .from('keystone_sync_logs')
        .select('completed_at')
        .eq('sync_type', syncType)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1);

      if (data?.[0]?.completed_at) {
        const lastSync = new Date(data[0].completed_at);
        const ageMs = Date.now() - lastSync.getTime();
        return ageMs / (1000 * 60 * 60); // Convert to hours
      }

      return 999; // Very old if no successful sync found
    } catch (error) {
      console.warn('⚠️ Failed to get last sync age:', error);
      return 999;
    }
  }

  /**
   * Get count of recent API errors
   */
  private async getRecentApiErrorCount(): Promise<number> {
    try {
      const { data } = await this.supabase
        .from('keystone_sync_logs')
        .select('error_message')
        .eq('status', 'failed')
        .gte('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .not('error_message', 'is', null);

      return data?.length || 0;
    } catch (error) {
      console.warn('⚠️ Failed to get recent API error count:', error);
      return 0;
    }
  }

  /**
   * Update rate limit status
   */
  private updateRateLimitStatus(syncType: string, isLimited: boolean, resetTime?: Date): void {
    if (this.rateLimitStatus[syncType as keyof typeof this.rateLimitStatus]) {
      this.rateLimitStatus[syncType as keyof typeof this.rateLimitStatus] = {
        limited: isLimited,
        resetTime: resetTime || (isLimited ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null)
      };
    }
  }

  /**
   * Generate recommendations based on sync results
   */
  private generateRecommendations(result: ComprehensiveSyncResult): string[] {
    const recommendations: string[] = [];

    // Analyze results and provide recommendations
    const failedSyncs = Object.entries(result.results).filter(([_, r]) => !r.success);
    
    if (failedSyncs.length > 0) {
      recommendations.push(`${failedSyncs.length} sync(s) failed. Consider using FTP method for better reliability.`);
    }

    if (result.sync_method === 'ftp' && result.overall_success) {
      recommendations.push('FTP sync successful. Monitor API rate limits before switching back to API method.');
    }

    if (result.total_duration > 300000) { // 5 minutes
      recommendations.push('Sync took longer than expected. Consider reducing batch sizes or using parallel processing.');
    }

    const errorPatterns = this.analyzeErrorPatterns(result);
    recommendations.push(...errorPatterns);

    return recommendations;
  }

  /**
   * Analyze error patterns and suggest solutions
   */
  private analyzeErrorPatterns(result: ComprehensiveSyncResult): string[] {
    const suggestions: string[] = [];
    
    const allErrors = Object.values(result.results)
      .flatMap(r => r.errors)
      .join(' ');

    if (allErrors.includes('rate limit') || allErrors.includes('429')) {
      suggestions.push('Rate limiting detected. FTP sync recommended for next 24 hours.');
    }

    if (allErrors.includes('timeout') || allErrors.includes('network')) {
      suggestions.push('Network issues detected. Consider retrying with smaller batch sizes.');
    }

    if (allErrors.includes('database') || allErrors.includes('constraint')) {
      suggestions.push('Database constraint issues. Check table schema and unique constraints.');
    }

    return suggestions;
  }

  /**
   * Helper to get sync type from decision context
   */
  private getSyncTypeFromDecision(decision: SyncDecision, allDecisions: SyncDecision[]): string | null {
    const index = allDecisions.indexOf(decision);
    const types = ['inventory', 'pricing', 'kits'];
    return types[index] || null;
  }

  /**
   * Get sync status for admin display
   */
  async getSyncStatus(): Promise<any> {
    try {
      const [inventoryStatus, pricingStatus, kitStatus] = await Promise.all([
        this.ftpService.getLastSyncInfo('inventory'),
        this.ftpService.getLastSyncInfo('pricing'),
        this.ftpService.getLastSyncInfo('kits')
      ]);

      return {
        inventory: inventoryStatus,
        pricing: pricingStatus,
        kits: kitStatus,
        rateLimits: this.rateLimitStatus
      };
    } catch (error) {
      console.error('❌ Failed to get sync status:', error);
      return null;
    }
  }
}

export default KeystoneSyncController;
export { KeystoneSyncController };
export type { SyncOptions, ComprehensiveSyncResult, SyncDecision };


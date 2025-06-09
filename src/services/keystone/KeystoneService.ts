// =====================================================
// PHASE 1 - WEEK 3: KEYSTONE SERVICE INTERFACE
// Main service interface for Keystone API operations
// =====================================================

import { KeystoneSoapClient, KeystoneResponse } from './KeystoneSoapClient';
import { supabase } from '@/integrations/supabase/client';

/**
 * Main Keystone service class that extends the SOAP client
 * Provides high-level methods for common Keystone operations
 */
export class KeystoneService extends KeystoneSoapClient {
  
  /**
   * Load configuration from Supabase database
   */
  async loadConfig(): Promise<void> {
    try {
      // Try to load from database first
      const { data: config, error } = await supabase
        .from('keystone_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (config) {
        // Use database configuration
        const securityKey = config.environment === 'production' 
          ? config.security_key_prod 
          : config.security_key_dev;

        this.config = {
          accountNumber: config.account_number,
          securityKey: securityKey,
          environment: config.environment,
          apiEndpoint: config.api_endpoint,
          wsdlUrl: config.wsdl_url,
          approvedIPs: config.approved_ips || []
        };

        console.log('Keystone configuration loaded from database');
      } else {
        // Fall back to parent class method (environment variables)
        await super.loadConfig();
        console.log('Keystone configuration loaded from environment variables');
      }

    } catch (error) {
      console.error('Failed to load Keystone configuration:', error);
      throw error;
    }
  }

  /**
   * Save configuration to database
   */
  async saveConfig(config: {
    accountNumber: string;
    securityKeyDev: string;
    securityKeyProd: string;
    environment: 'development' | 'production';
    approvedIPs: string[];
  }): Promise<void> {
    try {
      // Deactivate existing configurations
      await supabase
        .from('keystone_config')
        .update({ is_active: false })
        .eq('is_active', true);

      // Insert new configuration
      const { error } = await supabase
        .from('keystone_config')
        .insert({
          account_number: config.accountNumber,
          security_key_dev: config.securityKeyDev,
          security_key_prod: config.securityKeyProd,
          environment: config.environment,
          approved_ips: config.approvedIPs,
          is_active: true
        });

      if (error) throw error;

      // Reload configuration
      await this.loadConfig();

      console.log('Keystone configuration saved successfully');
    } catch (error) {
      console.error('Failed to save Keystone configuration:', error);
      throw error;
    }
  }

  /**
   * Test Keystone API connection and log result
   */
  async testConnection(): Promise<KeystoneResponse> {
    const syncLogId = await this.startSyncLog('connection_test', 'manual');
    
    try {
      const result = await super.testConnection();
      
      await this.logAPICall(syncLogId, 'UtilityReportMyIP', {}, result);
      
      if (result.success) {
        await this.completeSyncLog(syncLogId, 'completed', {
          message: 'Connection test successful',
          ipAddress: result.data
        });
      } else {
        await this.completeSyncLog(syncLogId, 'failed', {
          error: result.error || result.statusMessage
        });
      }

      return result;
    } catch (error) {
      await this.completeSyncLog(syncLogId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Report current IP address
   */
  async utilityReportMyIP(): Promise<string> {
    const response = await this.makeSOAPCall('UtilityReportMyIP');
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get IP address');
  }

  /**
   * Report approved IP addresses
   */
  async utilityReportApprovedIPs(): Promise<KeystoneResponse> {
    return await this.makeSOAPCall('UtilityReportApprovedIPs');
  }

  /**
   * Report approved methods for current account
   */
  async utilityReportApprovedMethods(): Promise<string[]> {
    const response = await this.makeSOAPCall('UtilityReportApprovedMethods');
    if (response.success) {
      // Parse the response to extract method names
      const methods = response.data?.split(',') || [];
      return methods.map((method: string) => method.trim());
    }
    throw new Error(response.error || 'Failed to get approved methods');
  }

  // =====================================================
  // INVENTORY METHODS (Placeholder for Week 4)
  // =====================================================

  /**
   * Check inventory for a single part
   */
  async checkInventory(partNumber: string): Promise<KeystoneResponse> {
    return await this.makeSOAPCall('CheckInventory', {
      FullPartNo: partNumber
    });
  }

  /**
   * Check inventory for multiple parts
   */
  async checkInventoryBulk(partNumbers: string[]): Promise<KeystoneResponse> {
    return await this.makeSOAPCall('CheckInventoryBulk', {
      FullPartNo: partNumbers.join(',')
    });
  }

  // =====================================================
  // LOGGING METHODS
  // =====================================================

  /**
   * Start a sync log entry
   */
  private async startSyncLog(
    syncType: string, 
    triggeredBy: string = 'api_call',
    userId?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('keystone_sync_logs')
        .insert({
          sync_type: syncType,
          status: 'running',
          triggered_by: triggeredBy,
          user_id: userId,
          started_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Failed to start sync log:', error);
      // Return a dummy ID to prevent breaking the flow
      return 'error-' + Date.now();
    }
  }

  /**
   * Complete a sync log entry
   */
  private async completeSyncLog(
    syncLogId: string,
    status: 'completed' | 'failed' | 'cancelled',
    details: any = {}
  ): Promise<void> {
    try {
      if (syncLogId.startsWith('error-')) return; // Skip if dummy ID

      await supabase
        .from('keystone_sync_logs')
        .update({
          status,
          completed_at: new Date().toISOString(),
          records_processed: details.recordsProcessed || 0,
          records_updated: details.recordsUpdated || 0,
          records_created: details.recordsCreated || 0,
          records_failed: details.recordsFailed || 0,
          error_message: details.error || null,
          sync_details: details
        })
        .eq('id', syncLogId);
    } catch (error) {
      console.error('Failed to complete sync log:', error);
    }
  }

  /**
   * Log individual API call
   */
  private async logAPICall(
    syncLogId: string,
    methodName: string,
    requestData: any,
    response: KeystoneResponse
  ): Promise<void> {
    try {
      if (syncLogId.startsWith('error-')) return; // Skip if dummy ID

      // Sanitize request data (remove sensitive information)
      const sanitizedRequest = { ...requestData };
      delete sanitizedRequest.SecurityKey;
      delete sanitizedRequest.AccountNumber;

      await supabase
        .from('keystone_api_logs')
        .insert({
          sync_log_id: syncLogId,
          method_name: methodName,
          request_data: sanitizedRequest,
          response_data: response.data,
          response_time_ms: response.responseTime,
          status_code: response.statusCode,
          success: response.success,
          error_message: response.error,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log API call:', error);
    }
  }

  /**
   * Get sync logs for monitoring
   */
  async getSyncLogs(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('keystone_sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get sync logs:', error);
      return [];
    }
  }

  /**
   * Get API call logs for debugging
   */
  async getAPILogs(syncLogId?: string, limit: number = 100): Promise<any[]> {
    try {
      let query = supabase
        .from('keystone_api_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (syncLogId) {
        query = query.eq('sync_log_id', syncLogId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get API logs:', error);
      return [];
    }
  }
}

// Export singleton instance
export const keystoneService = new KeystoneService();


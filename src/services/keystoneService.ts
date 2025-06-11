// Keystone API Service with DigitalOcean Proxy Integration
import { createClient } from '@supabase/supabase-js';

interface KeystoneConfig {
  proxyUrl: string;
  apiToken: string;
  environment: string;
  accountNumber: string;
  securityToken: string;
}

interface KeystoneResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  statusMessage?: string;
}

class KeystoneService {
  private config: KeystoneConfig;
  private supabase;
  private loadedConfig: any = null;

  constructor() {
    // DEBUG: Check environment variables (REMOVE THIS AFTER TESTING)
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_TOKEN:', process.env.NEXT_PUBLIC_SUPABASE_ANON_TOKEN ? 'SET' : 'NOT SET');
    
    this.config = {
      proxyUrl: process.env.KEYSTONE_PROXY_URL || '',
      apiToken: process.env.KEYSTONE_API_TOKEN || '',
      environment: process.env.APP_ENVIRONMENT || 'development',
      accountNumber: process.env.KEYSTONE_ACCOUNT_NUMBER || '',
      securityToken: process.env.KEYSTONE_SECURITY_TOKEN || ''
    };

    // Initialize Supabase client with fallback values
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vqkxrbflwhunvbotjdds.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa3hyYmZsd2h1bnZib3RqZGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5ODc4ODksImV4cCI6MjA2MjU2Mzg4OX0.9cDur61j55TrjPY3SDDW4EHKGWjReC8Vk5eaojC4_sk';

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration in KeystoneService');
      this.supabase = null;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client initialized successfully'); // DEBUG (REMOVE AFTER TESTING)
    }

    if (!this.config.proxyUrl || !this.config.apiToken) {
      console.warn('Keystone service not properly configured');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<KeystoneResponse<T>> {
    try {
      const url = `${this.config.proxyUrl}/keystone-api/${endpoint}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiToken,
      };

      const requestOptions: RequestInit = {
        method,
        headers,
        mode: 'cors',
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        requestOptions.body = JSON.stringify(data);
      }

      console.log(`Keystone API Call: ${method} ${url}`);
      
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      return {
        success: true,
        data: responseData,
        statusCode: response.status
      };

    } catch (error) {
      console.error('Keystone API Error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      };
    }
  }

  // Health check for the proxy service
  async healthCheck(): Promise<KeystoneResponse> {
    try {
      const url = `${this.config.proxyUrl}/health`;
      const response = await fetch(url);
      const data = await response.json();
      
      return {
        success: response.ok,
        data,
        statusCode: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  // Proxy service status
  async getProxyStatus(): Promise<KeystoneResponse> {
    return this.makeRequest('proxy-status');
  }

  // Configuration Management Methods (for UI component)
  async loadConfig(): Promise<void> {
    if (!this.supabase) {
      console.warn('Supabase not available, using default config');
      this.loadedConfig = {
        accountNumber: '',
        securityKey: '',
        securityKeyDev: '',
        securityKeyProd: '',
        environment: 'development',
        approvedIPs: []
      };
      return;
    }

    try {
      const { data, error } = await this.supabase
        .from('keystone_config')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      this.loadedConfig = data ? {
        accountNumber: data.account_number || '',
        securityKey: data.security_key || '',
        securityKeyDev: data.security_key_dev || data.security_key || '',
        securityKeyProd: data.security_key_prod || data.security_key || '',
        environment: data.environment || 'development',
        approvedIPs: data.approved_ips || []
      } : {
        accountNumber: '',
        securityKey: '',
        securityKeyDev: '',
        securityKeyProd: '',
        environment: 'development',
        approvedIPs: []
      };
    } catch (error) {
      console.error('Failed to load configuration:', error);
      this.loadedConfig = {
        accountNumber: '',
        securityKey: '',
        securityKeyDev: '',
        securityKeyProd: '',
        environment: 'development',
        approvedIPs: []
      };
    }
  }

  async saveConfig(config: any): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase not available - cannot save configuration');
    }

    try {
      // First, deactivate any existing configs
      await this.supabase
        .from('keystone_config')
        .update({ is_active: false })
        .eq('is_active', true);

      // Insert new config
      const { error } = await this.supabase
        .from('keystone_config')
        .insert({
          account_number: config.accountNumber,
          security_key: config.environment === 'development' ? config.securityKeyDev : config.securityKeyProd,
          security_key_dev: config.securityKeyDev,
          security_key_prod: config.securityKeyProd,
          environment: config.environment,
          approved_ips: config.approvedIPs,
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      
      this.loadedConfig = config;
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw new Error('Failed to save Keystone configuration');
    }
  }

  getConfig(): any {
    return this.loadedConfig || {
      accountNumber: '',
      securityKey: '',
      securityKeyDev: '',
      securityKeyProd: '',
      environment: 'development',
      approvedIPs: []
    };
  }

  async testConnection(): Promise<KeystoneResponse> {
    try {
      // Test the proxy health first
      const healthResult = await this.healthCheck();
      if (!healthResult.success) {
        return {
          success: false,
          error: 'Proxy service is not available',
          statusMessage: 'Proxy health check failed'
        };
      }

      // Try a simple API call to test connectivity through the proxy
      const result = await this.makeRequest('test-connection');
      return {
        success: result.success,
        error: result.error,
        statusMessage: result.success ? 'Connection successful' : 'Connection failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        statusMessage: 'Connection test failed'
      };
    }
  }

  async getSyncLogs(limit: number = 20): Promise<any[]> {
    if (!this.supabase) {
      console.warn('Supabase not available - cannot load sync logs');
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to load sync logs:', error);
      return [];
    }
  }

  // Utility methods that the UI expects (using proxy)
  async utilityReportMyIP(): Promise<string> {
    try {
      const result = await this.makeRequest('utility/my-ip');
      return result.data?.ip || 'Unknown';
    } catch (error) {
      console.error('Failed to get IP:', error);
      return 'Unknown';
    }
  }

  async utilityReportApprovedIPs(): Promise<any> {
    try {
      const result = await this.makeRequest('utility/approved-ips');
      return result.data || { data: '' };
    } catch (error) {
      console.error('Failed to get approved IPs:', error);
      return { data: '' };
    }
  }

  async utilityReportApprovedMethods(): Promise<string[]> {
    try {
      const result = await this.makeRequest('utility/approved-methods');
      return result.data?.methods || [];
    } catch (error) {
      console.error('Failed to get approved methods:', error);
      return [];
    }
  }

  // Original Keystone API methods (using proxy)
  async searchParts(query: string): Promise<KeystoneResponse> {
    return this.makeRequest(`SearchParts?query=${encodeURIComponent(query)}`);
  }

  async getPartDetails(partNumber: string): Promise<KeystoneResponse> {
    return this.makeRequest(`GetPartDetails?partNumber=${encodeURIComponent(partNumber)}`);
  }

  async checkInventory(partNumber: string): Promise<KeystoneResponse> {
    return this.makeRequest(`CheckInventory?partNumber=${encodeURIComponent(partNumber)}`);
  }

  async getPricing(partNumber: string): Promise<KeystoneResponse> {
    return this.makeRequest(`GetPricing?partNumber=${encodeURIComponent(partNumber)}`);
  }

  // Configuration getters (original methods)
  getOriginalConfig(): KeystoneConfig {
    return { ...this.config };
  }

  isConfigured(): boolean {
    return !!(this.config.proxyUrl && this.config.apiToken);
  }

  getEnvironment(): string {
    return this.config.environment;
  }
}

// Export singleton instance
export const keystoneService = new KeystoneService();
export default keystoneService;


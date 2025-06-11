// Updated to use NEXT_PUBLIC_ prefixed environment variables and user-selected environment
// Version: 2.1.0 - Fixed environment variables and database issues
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
    // Load configuration from environment variables (using NEXT_PUBLIC_ prefix)
    this.config = {
      proxyUrl: process.env.NEXT_PUBLIC_KEYSTONE_PROXY_URL || '',
      apiToken: process.env.NEXT_PUBLIC_KEYSTONE_API_TOKEN || '',
      environment: 'development', // Default, will be updated from saved config
      accountNumber: process.env.NEXT_PUBLIC_KEYSTONE_ACCOUNT_NUMBER || '',
      securityToken: '' // Will be set after loading config
    };

    // Initialize Supabase client (no hardcoded fallbacks)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_TOKEN;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration - NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_TOKEN environment variables are required');
      this.supabase = null;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client initialized successfully');
    }

    // Load configuration and set security token
    this.initializeConfig();
  }

  private async initializeConfig(): Promise<void> {
    try {
      const config = await this.loadConfig();
      this.config.environment = config.environment || 'development';
      this.config.securityToken = this.getSecurityTokenForEnvironment(this.config.environment as 'development' | 'production');
      
      // Validate after loading config
      this.validateConfiguration();
    } catch (error) {
      console.error('Failed to initialize config:', error);
      // Use default development environment if config loading fails
      this.config.environment = 'development';
      this.config.securityToken = this.getSecurityTokenForEnvironment('development');
      this.validateConfiguration();
    }
  }

  private validateConfiguration(): void {
    const missing = [];
    
    if (!this.config.proxyUrl) {
      missing.push('NEXT_PUBLIC_KEYSTONE_PROXY_URL');
    }
    
    if (!this.config.accountNumber) {
      missing.push('NEXT_PUBLIC_KEYSTONE_ACCOUNT_NUMBER');
    }
    
    if (!this.config.securityToken) {
      const envVar = this.config.environment === 'development' 
        ? 'NEXT_PUBLIC_KEYSTONE_SECURITY_TOKEN_DEV' 
        : 'NEXT_PUBLIC_KEYSTONE_SECURITY_TOKEN_PROD';
      missing.push(envVar);
    }

    if (missing.length > 0) {
      console.warn(`Missing Keystone environment variables: ${missing.join(', ')}`);
    } else {
      console.log('Keystone configuration loaded successfully from environment variables');
    }
  }

  private getSecurityTokenForEnvironment(environment: 'development' | 'production'): string {
    if (environment === 'development') {
      return process.env.NEXT_PUBLIC_KEYSTONE_SECURITY_TOKEN_DEV || '';
    } else {
      return process.env.NEXT_PUBLIC_KEYSTONE_SECURITY_TOKEN_PROD || '';
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<KeystoneResponse<T>> {
    try {
      if (!this.config.proxyUrl) {
        throw new Error('Proxy URL not configured');
      }

      const url = `${this.config.proxyUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiToken}`,
        },
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const responseData = await response.json();

      return {
        success: response.ok,
        data: responseData,
        statusCode: response.status,
        statusMessage: response.statusText,
        error: response.ok ? undefined : responseData.message || 'Request failed'
      };
    } catch (error) {
      console.error('Keystone API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Health check for the proxy service
  async healthCheck(): Promise<KeystoneResponse> {
    return this.makeRequest('/health');
  }

  // Get proxy service status
  async getProxyStatus(): Promise<KeystoneResponse> {
    return this.makeRequest('/status');
  }

  // Test connection to Keystone API
  async testConnection(): Promise<KeystoneResponse> {
    try {
      console.log('Making Keystone API call: UtilityReportMyIP');
      
      if (!this.config.accountNumber || !this.config.securityToken || !this.config.proxyUrl) {
        const missing = [];
        if (!this.config.accountNumber) missing.push('NEXT_PUBLIC_KEYSTONE_ACCOUNT_NUMBER');
        if (!this.config.securityToken) missing.push('NEXT_PUBLIC_KEYSTONE_SECURITY_TOKEN_DEV/PROD');
        if (!this.config.proxyUrl) missing.push('NEXT_PUBLIC_KEYSTONE_PROXY_URL');
        
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }

      const result = await this.utilityReportMyIP();
      
      if (result.success) {
        console.log('Keystone API connection successful');
        return {
          success: true,
          data: result.data,
          statusMessage: 'Connection successful'
        };
      } else {
        console.error('Keystone API call failed:', result.error);
        return {
          success: false,
          error: result.error || 'Connection test failed'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Keystone API call failed:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Utility method to report current IP
  async utilityReportMyIP(): Promise<KeystoneResponse> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      method: 'UtilityReportMyIP'
    };

    return this.makeRequest('/keystone/utility/reportmyip', 'POST', requestData);
  }

  // Utility method to report approved IPs
  async utilityReportApprovedIPs(): Promise<KeystoneResponse> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      method: 'UtilityReportApprovedIPs'
    };

    return this.makeRequest('/keystone/utility/reportapprovedips', 'POST', requestData);
  }

  // Utility method to report approved methods
  async utilityReportApprovedMethods(): Promise<KeystoneResponse> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      method: 'UtilityReportApprovedMethods'
    };

    return this.makeRequest('/keystone/utility/reportapprovedmethods', 'POST', requestData);
  }

  // Search for parts
  async searchParts(searchTerm: string, limit: number = 50): Promise<KeystoneResponse> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      searchTerm,
      limit
    };

    return this.makeRequest('/keystone/parts/search', 'POST', requestData);
  }

  // Get part details
  async getPartDetails(partNumber: string): Promise<KeystoneResponse> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      partNumber
    };

    return this.makeRequest('/keystone/parts/details', 'POST', requestData);
  }

  // Check inventory for a part
  async checkInventory(partNumber: string): Promise<KeystoneResponse> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      partNumber
    };

    return this.makeRequest('/keystone/inventory/check', 'POST', requestData);
  }

  // Get pricing for a part
  async getPricing(partNumber: string, quantity: number = 1): Promise<KeystoneResponse> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      partNumber,
      quantity
    };

    return this.makeRequest('/keystone/pricing/get', 'POST', requestData);
  }

  // Configuration management - Fixed to only save minimal config to avoid database schema issues
  async loadConfig(): Promise<any> {
    if (this.loadedConfig) {
      return this.loadedConfig;
    }

    try {
      if (!this.supabase) {
        console.warn('Supabase not available, using default configuration');
        return {
          environment: 'development',
          approvedIPs: [],
          accountNumber: this.config.accountNumber,
          securityToken: this.getSecurityTokenForEnvironment('development')
        };
      }

      const { data, error } = await this.supabase
        .from('keystone_config')
        .select('environment, approved_ips, updated_at')
        .single();

      if (error) {
        console.warn('Failed to load config from database, using defaults:', error.message);
        return {
          environment: 'development',
          approvedIPs: [],
          accountNumber: this.config.accountNumber,
          securityToken: this.getSecurityTokenForEnvironment('development')
        };
      }

      this.loadedConfig = {
        environment: data?.environment || 'development',
        approvedIPs: data?.approved_ips || [],
        // Override with environment variables for credentials
        accountNumber: this.config.accountNumber,
        securityToken: this.getSecurityTokenForEnvironment(data?.environment || 'development')
      };

      return this.loadedConfig;
    } catch (error) {
      console.error('Error loading configuration:', error);
      return {
        environment: 'development',
        approvedIPs: [],
        accountNumber: this.config.accountNumber,
        securityToken: this.getSecurityTokenForEnvironment('development')
      };
    }
  }

  async saveConfig(config: any): Promise<void> {
    try {
      if (!this.supabase) {
        console.warn('Supabase not available, cannot save config to database');
        return;
      }

      // Normalize environment to lowercase to avoid case sensitivity issues
      const normalizedEnvironment = config.environment.toLowerCase();

      // Only save minimal config to avoid database schema issues
      const configToSave = {
        environment: normalizedEnvironment,
        approved_ips: config.approvedIPs || [],
        updated_at: new Date().toISOString()
      };

      console.log('Saving minimal config to database:', configToSave);

      const { error } = await this.supabase
        .from('keystone_config')
        .upsert(configToSave, { onConflict: 'id' });

      if (error) {
        console.error('Database save error:', error);
        throw new Error(`Failed to save configuration: ${error.message}`);
      }

      // Update internal config with new environment
      this.config.environment = normalizedEnvironment;
      this.config.securityToken = this.getSecurityTokenForEnvironment(normalizedEnvironment as 'development' | 'production');

      // Update loaded config cache
      this.loadedConfig = {
        environment: normalizedEnvironment,
        approvedIPs: config.approvedIPs || [],
        // Keep environment variables for credentials
        accountNumber: this.config.accountNumber,
        securityToken: this.config.securityToken
      };

      console.log('Configuration saved successfully');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw error;
    }
  }

  getConfig(): any {
    return {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      securityKeyDev: this.getSecurityTokenForEnvironment('development'),
      securityKeyProd: this.getSecurityTokenForEnvironment('production'),
      environment: this.config.environment,
      proxyUrl: this.config.proxyUrl,
      approvedIPs: this.loadedConfig?.approvedIPs || []
    };
  }

  getOriginalConfig(): any {
    return {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      environment: this.config.environment,
      proxyUrl: this.config.proxyUrl
    };
  }

  isConfigured(): boolean {
    return !!(this.config.accountNumber && this.config.securityToken && this.config.proxyUrl);
  }

  getEnvironment(): string {
    return this.config.environment;
  }

  // Get sync logs from database
  async getSyncLogs(limit: number = 50): Promise<any[]> {
    try {
      if (!this.supabase) {
        console.warn('Supabase not available, cannot fetch sync logs');
        return [];
      }

      const { data, error } = await this.supabase
        .from('keystone_sync_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch sync logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching sync logs:', error);
      return [];
    }
  }

  // Get environment status for UI
  getEnvironmentStatus(): {
    hasAccountNumber: boolean;
    hasDevKey: boolean;
    hasProdKey: boolean;
    hasProxyUrl: boolean;
    hasSupabaseUrl: boolean;
    hasSupabaseKey: boolean;
    accountNumberPreview?: string;
    proxyUrl?: string;
  } {
    return {
      hasAccountNumber: !!process.env.NEXT_PUBLIC_KEYSTONE_ACCOUNT_NUMBER,
      hasDevKey: !!process.env.NEXT_PUBLIC_KEYSTONE_SECURITY_TOKEN_DEV,
      hasProdKey: !!process.env.NEXT_PUBLIC_KEYSTONE_SECURITY_TOKEN_PROD,
      hasProxyUrl: !!process.env.NEXT_PUBLIC_KEYSTONE_PROXY_URL,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_TOKEN,
      accountNumberPreview: process.env.NEXT_PUBLIC_KEYSTONE_ACCOUNT_NUMBER ? 
        `${process.env.NEXT_PUBLIC_KEYSTONE_ACCOUNT_NUMBER.substring(0, 3)}***` : undefined,
      proxyUrl: process.env.NEXT_PUBLIC_KEYSTONE_PROXY_URL
    };
  }

  // Update environment (for runtime switching)
  setEnvironment(environment: 'development' | 'production'): void {
    this.config.environment = environment;
    this.config.securityToken = this.getSecurityTokenForEnvironment(environment);
  }
}

// Export singleton instance
export const keystoneService = new KeystoneService();
export default keystoneService;


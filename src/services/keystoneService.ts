// Updated to use VITE_ prefixed environment variables and user-selected environment
// Version 2.3.1 - Updated for Vite environment variables and snake_case column names
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
    // Load configuration from environment variables (using VITE_ prefix)
    this.config = {
      proxyUrl: import.meta.env.VITE_KEYSTONE_PROXY_URL || '',
      apiToken: import.meta.env.VITE_KEYSTONE_API_TOKEN || '',
      environment: 'development', // Default, will be updated from saved config
      accountNumber: import.meta.env.VITE_KEYSTONE_ACCOUNT_NUMBER || '',
      securityToken: '' // Will be set after loading config
    };

    // Initialize Supabase client (no hardcoded fallbacks)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration - VITE_SUPABASE_URL and VITE_SUPABASE_ANON_TOKEN environment variables are required');
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
      missing.push('VITE_KEYSTONE_PROXY_URL');
    }
    
    if (!this.config.accountNumber) {
      missing.push('VITE_KEYSTONE_ACCOUNT_NUMBER');
    }
    
    if (!this.config.securityToken) {
      const envVar = this.config.environment === 'development' 
        ? 'VITE_KEYSTONE_SECURITY_TOKEN_DEV' 
        : 'VITE_KEYSTONE_SECURITY_TOKEN_PROD';
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
      return import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_DEV || '';
    } else {
      return import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD || '';
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
        if (!this.config.accountNumber) missing.push('VITE_KEYSTONE_ACCOUNT_NUMBER');
        if (!this.config.securityToken) missing.push('VITE_KEYSTONE_SECURITY_TOKEN_DEV/PROD');
        if (!this.config.proxyUrl) missing.push('VITE_KEYSTONE_PROXY_URL');
        
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
    // Get the appropriate IP list based on current environment
    const approvedIPs = this.getApprovedIPsForCurrentEnvironment();
    
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      method: 'UtilityReportApprovedIPs',
      approvedIPs: approvedIPs // Send environment-specific IPs
    };

    return this.makeRequest('/keystone/utility/reportapprovedips', 'POST', requestData);
  }

  // Get the appropriate IP list based on current environment
  private getApprovedIPsForCurrentEnvironment(): string[] {
    if (!this.loadedConfig) {
      return [];
    }
    
    if (this.config.environment === 'development') {
      return this.loadedConfig.development_ips || [];
    } else {
      return this.loadedConfig.production_ips || [];
    }
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

  // Configuration management
  async loadConfig(): Promise<any> {
    if (this.loadedConfig) {
      return this.loadedConfig;
    }

    try {
      if (!this.supabase) {
        console.warn('Supabase not available, using default configuration');
        return {
          environment: 'development',
          development_ips: [],
          production_ips: [],
          accountNumber: this.config.accountNumber,
          securityToken: this.getSecurityTokenForEnvironment('development')
        };
      }

      const { data, error } = await this.supabase
        .from('keystone_config')
        .select('*')
        .single();

      if (error) {
        console.warn('Failed to load config from database, using defaults:', error.message);
        return {
          environment: 'development',
          development_ips: [],
          production_ips: [],
          accountNumber: this.config.accountNumber,
          securityToken: this.getSecurityTokenForEnvironment('development')
        };
      }

      // Handle legacy data format (single approvedIPs array)
      if (data.approved_ips && !data.development_ips && !data.production_ips) {
        console.log('Converting legacy IP format to environment-specific format');
        data.development_ips = data.approved_ips;
        data.production_ips = data.approved_ips;
      }

      this.loadedConfig = {
        ...data,
        // Ensure environment-specific IP arrays exist
        development_ips: data.development_ips || [],
        production_ips: data.production_ips || [],
        // Override with environment variables for credentials
        accountNumber: this.config.accountNumber,
        securityToken: this.getSecurityTokenForEnvironment(data.environment || 'development')
      };

      return this.loadedConfig;
    } catch (error) {
      console.error('Error loading configuration:', error);
      return {
        environment: 'development',
        development_ips: [],
        production_ips: [],
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

      // Get current config to preserve IP lists for the non-active environment
      const currentConfig = await this.loadConfig();
      
      // Determine which IP list to update based on environment
      const isDevEnvironment = config.environment === 'development';
      
      // Don't save credentials to database - only runtime settings
const configToSave = {
  environment: config.environment,
  // Add this line to include the account number
  account_number: this.config.accountNumber,
  // Update the appropriate IP list based on current environment
  development_ips: isDevEnvironment ? config.approvedIPs : (currentConfig.development_ips || []),
  production_ips: !isDevEnvironment ? config.approvedIPs : (currentConfig.production_ips || []),
  updated_at: new Date().toISOString()
};


      console.log('Saving configuration:', configToSave);
      
      try {
        const { error } = await this.supabase
          .from('keystone_config')
          .upsert(configToSave);

        if (error) {
          console.error('Database error when saving config:', error);
          throw new Error(`Database error: ${error.message || 'Unknown database error'}`);
        }
      } catch (dbError) {
        console.error('Failed to save to database:', dbError);
        throw new Error(`Failed to save to database: ${dbError instanceof Error ? dbError.message : 'Database error'}`);
      }

      // Update internal config with new environment
      this.config.environment = config.environment;
      this.config.securityToken = this.getSecurityTokenForEnvironment(config.environment);

      // Update loaded config cache
      this.loadedConfig = {
        ...configToSave,
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
    const currentConfig = this.loadedConfig || {
      development_ips: [],
      production_ips: []
    };
    
    // Get the appropriate IP list based on current environment
    const approvedIPs = this.config.environment === 'development' 
      ? currentConfig.development_ips || []
      : currentConfig.production_ips || [];
    
    return {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      securityKeyDev: this.getSecurityTokenForEnvironment('development'),
      securityKeyProd: this.getSecurityTokenForEnvironment('production'),
      environment: this.config.environment,
      proxyUrl: this.config.proxyUrl,
      approvedIPs: approvedIPs,
      // Include both IP lists for reference
      development_ips: currentConfig.development_ips || [],
      production_ips: currentConfig.production_ips || []
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
      hasAccountNumber: !!import.meta.env.VITE_KEYSTONE_ACCOUNT_NUMBER,
      hasDevKey: !!import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_DEV,
      hasProdKey: !!import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD,
      hasProxyUrl: !!import.meta.env.VITE_KEYSTONE_PROXY_URL,
      hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_TOKEN,
      accountNumberPreview: import.meta.env.VITE_KEYSTONE_ACCOUNT_NUMBER ? 
        `${import.meta.env.VITE_KEYSTONE_ACCOUNT_NUMBER.substring(0, 3)}***` : undefined,
      proxyUrl: import.meta.env.VITE_KEYSTONE_PROXY_URL
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

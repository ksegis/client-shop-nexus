// Keystone API Service with DigitalOcean Proxy Integration
// Updated to use environment variables for credentials (no hardcoded fallbacks)
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
    // Load configuration from environment variables
    this.config = {
      proxyUrl: process.env.KEYSTONE_PROXY_URL || '',
      apiToken: process.env.KEYSTONE_API_TOKEN || '',
      environment: process.env.APP_ENVIRONMENT || 'development',
      accountNumber: process.env.KEYSTONE_ACCOUNT_NUMBER || '',
      securityToken: this.getEnvironmentSecurityToken()
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

    // Validate Keystone configuration
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    const missing = [];
    
    if (!this.config.proxyUrl) {
      missing.push('KEYSTONE_PROXY_URL');
    }
    
    if (!this.config.accountNumber) {
      missing.push('KEYSTONE_ACCOUNT_NUMBER');
    }
    
    if (!this.config.securityToken) {
      const envVar = this.config.environment === 'development' 
        ? 'KEYSTONE_SECURITY_TOKEN_DEV' 
        : 'KEYSTONE_SECURITY_TOKEN_PROD';
      missing.push(envVar);
    }

    if (missing.length > 0) {
      console.warn(`Missing Keystone environment variables: ${missing.join(', ')}`);
    } else {
      console.log('Keystone configuration loaded successfully from environment variables');
    }
  }

  private getEnvironmentSecurityToken(): string {
    const environment = process.env.APP_ENVIRONMENT || 'development';
    if (environment === 'development') {
      return process.env.KEYSTONE_SECURITY_TOKEN_DEV || '';
    } else {
      return process.env.KEYSTONE_SECURITY_TOKEN_PROD || '';
    }
  }

  private getSecurityTokenForEnvironment(environment: 'development' | 'production'): string {
    if (environment === 'development') {
      return process.env.KEYSTONE_SECURITY_TOKEN_DEV || '';
    } else {
      return process.env.KEYSTONE_SECURITY_TOKEN_PROD || '';
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<KeystoneResponse<T>> {
    try {
      if (!this.config.proxyUrl) {
        throw new Error('Proxy URL not configured - check KEYSTONE_PROXY_URL environment variable');
      }

      if (!this.config.accountNumber) {
        throw new Error('Account number not configured - check KEYSTONE_ACCOUNT_NUMBER environment variable');
      }

      if (!this.config.securityToken) {
        const envVar = this.config.environment === 'development' 
          ? 'KEYSTONE_SECURITY_TOKEN_DEV' 
          : 'KEYSTONE_SECURITY_TOKEN_PROD';
        throw new Error(`Security token not configured - check ${envVar} environment variable`);
      }

      const url = `${this.config.proxyUrl}/keystone-api/${endpoint}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiToken,
        'X-Account-Number': this.config.accountNumber,
        'X-Security-Token': this.config.securityToken
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
      if (!this.config.proxyUrl) {
        return {
          success: false,
          error: 'Proxy URL not configured - check KEYSTONE_PROXY_URL environment variable'
        };
      }

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
      console.warn('Supabase not available, using environment variables only');
      this.loadedConfig = {
        accountNumber: this.config.accountNumber,
        securityKey: this.config.securityToken,
        securityKeyDev: this.getSecurityTokenForEnvironment('development'),
        securityKeyProd: this.getSecurityTokenForEnvironment('production'),
        environment: this.config.environment,
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

      // Merge environment variables with database config
      this.loadedConfig = {
        accountNumber: this.config.accountNumber, // Always use environment variable
        securityKey: this.config.securityToken, // Always use environment variable
        securityKeyDev: this.getSecurityTokenForEnvironment('development'), // Always use environment variable
        securityKeyProd: this.getSecurityTokenForEnvironment('production'), // Always use environment variable
        environment: data?.environment || this.config.environment,
        approvedIPs: data?.approved_ips || []
      };
    } catch (error) {
      console.error('Failed to load configuration:', error);
      this.loadedConfig = {
        accountNumber: this.config.accountNumber,
        securityKey: this.config.securityToken,
        securityKeyDev: this.getSecurityTokenForEnvironment('development'),
        securityKeyProd: this.getSecurityTokenForEnvironment('production'),
        environment: this.config.environment,
        approvedIPs: []
      };
    }
  }

  async saveConfig(config: any): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase not available - cannot save configuration. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_TOKEN environment variables.');
    }

    try {
      // First, deactivate any existing configs
      await this.supabase
        .from('keystone_config')
        .update({ is_active: false })
        .eq('is_active', true);

      // Insert new config (only save runtime settings, not credentials)
      const { error } = await this.supabase
        .from('keystone_config')
        .insert({
          account_number: this.config.accountNumber, // Use environment variable
          security_key: this.getSecurityTokenForEnvironment(config.environment), // Use environment variable
          security_key_dev: this.getSecurityTokenForEnvironment('development'), // Use environment variable
          security_key_prod: this.getSecurityTokenForEnvironment('production'), // Use environment variable
          environment: config.environment,
          approved_ips: config.approvedIPs,
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // Update loaded config
      this.loadedConfig = {
        accountNumber: this.config.accountNumber,
        securityKey: this.getSecurityTokenForEnvironment(config.environment),
        securityKeyDev: this.getSecurityTokenForEnvironment('development'),
        securityKeyProd: this.getSecurityTokenForEnvironment('production'),
        environment: config.environment,
        approvedIPs: config.approvedIPs
      };

      // Update current security token based on environment
      this.config.securityToken = this.getSecurityTokenForEnvironment(config.environment);
      this.config.environment = config.environment;
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw new Error('Failed to save Keystone configuration');
    }
  }

  getConfig(): any {
    return this.loadedConfig || {
      accountNumber: this.config.accountNumber,
      securityKey: this.config.securityToken,
      securityKeyDev: this.getSecurityTokenForEnvironment('development'),
      securityKeyProd: this.getSecurityTokenForEnvironment('production'),
      environment: this.config.environment,
      approvedIPs: []
    };
  }

  async testConnection(): Promise<KeystoneResponse> {
    try {
      // Validate environment variables first
      if (!this.config.accountNumber) {
        return {
          success: false,
          error: 'Account number not configured in environment variables',
          statusMessage: 'Missing KEYSTONE_ACCOUNT_NUMBER environment variable'
        };
      }

      if (!this.config.securityToken) {
        const envVar = this.config.environment === 'development' 
          ? 'KEYSTONE_SECURITY_TOKEN_DEV' 
          : 'KEYSTONE_SECURITY_TOKEN_PROD';
        return {
          success: false,
          error: `Security token for ${this.config.environment} environment not configured`,
          statusMessage: `Missing ${envVar} environment variable`
        };
      }

      if (!this.config.proxyUrl) {
        return {
          success: false,
          error: 'Proxy URL not configured in environment variables',
          statusMessage: 'Missing KEYSTONE_PROXY_URL environment variable'
        };
      }

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
      console.warn('Supabase not available - cannot load sync logs. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_TOKEN environment variables.');
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
    return !!(this.config.proxyUrl && this.config.accountNumber && this.config.securityToken);
  }

  getEnvironment(): string {
    return this.config.environment;
  }

  // Environment variable status check (for UI)
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
      hasAccountNumber: !!process.env.KEYSTONE_ACCOUNT_NUMBER,
      hasDevKey: !!process.env.KEYSTONE_SECURITY_TOKEN_DEV,
      hasProdKey: !!process.env.KEYSTONE_SECURITY_TOKEN_PROD,
      hasProxyUrl: !!process.env.KEYSTONE_PROXY_URL,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_TOKEN,
      accountNumberPreview: process.env.KEYSTONE_ACCOUNT_NUMBER ? 
        `${process.env.KEYSTONE_ACCOUNT_NUMBER.substring(0, 3)}***` : undefined,
      proxyUrl: process.env.KEYSTONE_PROXY_URL
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


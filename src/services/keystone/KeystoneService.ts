// Enhanced KeystoneService.ts - Version 3.0.0
// Builds upon existing functionality while adding complete Keystone API coverage
// Updated to use VITE_ prefixed environment variables and user-selected environment
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
  result?: any;
}

interface InventoryItem {
  partNumber: string;
  quantity: number;
  warehouse: string;
  lastUpdated: string;
}

interface PricingInfo {
  partNumber: string;
  price: number;
  currency: string;
  quantity: number;
  discountTier: string;
}

interface ShippingOption {
  method: string;
  cost: number;
  estimatedDays: number;
  carrier: string;
}

interface OrderInfo {
  orderNumber: string;
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export default class KeystoneService {
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
          'X-API-Key': this.config.apiToken,
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

  // Get rate limiting status
  async getRateLimitStatus(): Promise<KeystoneResponse> {
    return this.makeRequest(`/status/rate-limits?accountNumber=${this.config.accountNumber}`);
  }

  // Get cache status
  async getCacheStatus(): Promise<KeystoneResponse> {
    return this.makeRequest('/status/cache');
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

    return this.makeRequest('/utility/reportmyip', 'POST', requestData);
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

    return this.makeRequest('/utility/reportapprovedips', 'POST', requestData);
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

    return this.makeRequest('/utility/reportapprovedmethods', 'POST', requestData);
  }

  // ENHANCED INVENTORY MANAGEMENT METHODS

  // Check inventory for a single part
  async checkInventory(partNumber: string): Promise<KeystoneResponse<InventoryItem[]>> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      partNumber
    };

    return this.makeRequest('/inventory/check', 'POST', requestData);
  }

  // Check inventory for multiple parts (bulk operation)
  async checkInventoryBulk(partNumbers: string[]): Promise<KeystoneResponse<InventoryItem[]>> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      partNumbers
    };

    return this.makeRequest('/inventory/bulk', 'POST', requestData);
  }

  // Get full inventory dataset (once per day limit)
  async getInventoryFull(): Promise<KeystoneResponse<InventoryItem[]>> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken
    };

    return this.makeRequest('/inventory/full', 'POST', requestData);
  }

  // Get inventory updates since last check (every 15 minutes)
  async getInventoryUpdates(lastUpdateTime?: string): Promise<KeystoneResponse<InventoryItem[]>> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      lastUpdateTime: lastUpdateTime || new Date(Date.now() - 15 * 60 * 1000).toISOString()
    };

    return this.makeRequest('/inventory/updates', 'POST', requestData);
  }

  // ENHANCED PRICING METHODS

  // Get pricing for multiple parts (once per hour limit)
  async getPricingBulk(partNumbers: string[], currency: string = 'USD'): Promise<KeystoneResponse<PricingInfo[]>> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      partNumbers,
      currency
    };

    return this.makeRequest('/pricing/bulk', 'POST', requestData);
  }

  // Get pricing for a single part (legacy method maintained for compatibility)
  async getPricing(partNumber: string, quantity: number = 1): Promise<KeystoneResponse<PricingInfo>> {
    const result = await this.getPricingBulk([partNumber]);
    if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
      return {
        ...result,
        data: result.data[0]
      };
    }
    return result;
  }

  // ENHANCED SHIPPING METHODS

  // Get shipping options for a single part
  async getShippingOptions(partNumber: string, quantity: number = 1, zipCode?: string): Promise<KeystoneResponse<ShippingOption[]>> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      partNumber,
      quantity,
      zipCode
    };

    return this.makeRequest('/shipping/options', 'POST', requestData);
  }

  // Get shipping options for multiple parts
  async getShippingOptionsMultiple(items: Array<{partNumber: string, quantity: number}>, zipCode?: string): Promise<KeystoneResponse<ShippingOption[]>> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      items,
      zipCode
    };

    return this.makeRequest('/shipping/options/multiple', 'POST', requestData);
  }

  // ENHANCED ORDER MANAGEMENT METHODS

  // Place a standard order (ships to account address)
  async shipOrder(partNumber: string, quantity: number, shippingMethod?: string): Promise<KeystoneResponse<OrderInfo>> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      partNumber,
      quantity,
      shippingMethod
    };

    return this.makeRequest('/orders/ship', 'POST', requestData);
  }

  // Place a dropship order (ships to custom address)
  async shipOrderDropship(
    partNumber: string, 
    quantity: number, 
    shippingAddress: any, 
    shippingMethod?: string
  ): Promise<KeystoneResponse<OrderInfo>> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      partNumber,
      quantity,
      shippingAddress,
      shippingMethod
    };

    return this.makeRequest('/orders/ship/dropship', 'POST', requestData);
  }

  // Get order history
  async getOrderHistory(startDate?: string, endDate?: string): Promise<KeystoneResponse<OrderInfo[]>> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      startDate,
      endDate
    };

    return this.makeRequest('/orders/history', 'POST', requestData);
  }

  // ENHANCED PARTS SEARCH METHODS

  // Search for parts with enhanced filtering
  async searchParts(searchTerm: string, limit: number = 50, filters?: any): Promise<KeystoneResponse> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      searchTerm,
      limit,
      filters
    };

    return this.makeRequest('/parts/search', 'POST', requestData);
  }

  // Get part details (enhanced with more information)
  async getPartDetails(partNumber: string): Promise<KeystoneResponse> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      partNumber
    };

    return this.makeRequest('/parts/details', 'POST', requestData);
  }

  // Get kit components
  async getKitComponents(kitPartNumber: string): Promise<KeystoneResponse> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      kitPartNumber
    };

    return this.makeRequest('/kits/components', 'POST', requestData);
  }

  // CONFIGURATION MANAGEMENT (PRESERVED FROM ORIGINAL)

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
        // Add account_number to configToSave
        account_number: this.config.accountNumber,
        // Update the appropriate IP list based on current environment
        development_ips: isDevEnvironment ? config.approvedIPs : (currentConfig.development_ips || []),
        production_ips: !isDevEnvironment ? config.approvedIPs : (currentConfig.production_ips || []),
        // Add security_key_dev and security_key_prod to configToSave
        security_key_dev: this.getSecurityTokenForEnvironment('development'),
        security_key_prod: this.getSecurityTokenForEnvironment('production'),
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
        .order('started_at', { ascending: false })
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
    current: string;
    available: string[];
    hasDevCredentials: boolean;
    hasProdCredentials: boolean;
  } {
    return {
      current: this.config.environment,
      available: ['development', 'production'],
      hasDevCredentials: !!this.getSecurityTokenForEnvironment('development'),
      hasProdCredentials: !!this.getSecurityTokenForEnvironment('production')
    };
  }

  // ENHANCED MONITORING AND DIAGNOSTICS

  // Get comprehensive system status
  async getSystemStatus(): Promise<{
    proxy: KeystoneResponse;
    rateLimits: KeystoneResponse;
    cache: KeystoneResponse;
    connection: KeystoneResponse;
  }> {
    const [proxy, rateLimits, cache, connection] = await Promise.all([
      this.healthCheck(),
      this.getRateLimitStatus(),
      this.getCacheStatus(),
      this.testConnection()
    ]);

    return { proxy, rateLimits, cache, connection };
  }

  // Clear cache (admin function)
  async clearCache(): Promise<KeystoneResponse> {
    return this.makeRequest('/admin/cache/clear', 'POST');
  }

  // Reset rate limits (admin function)
  async resetRateLimits(): Promise<KeystoneResponse> {
    return this.makeRequest('/admin/rate-limits/reset', 'POST');
  }
}


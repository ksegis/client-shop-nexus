// Enhanced KeystoneService.ts - Version 4.0.0 with Comprehensive Rate Limiting and Error Handling
// Singleton pattern with complete Keystone API coverage, prioritized environment variables, and advanced error handling
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
  retry_after_seconds?: number;
  function?: string;
  rate_limited?: boolean;
}

interface InventoryItem {
  partNumber: string;
  quantity: number;
  warehouse: string;
  lastUpdated: string;
  availability?: string;
  description?: string;
  price?: number;
}

interface PricingInfo {
  partNumber: string;
  price: number;
  currency: string;
  quantity: number;
  discountTier: string;
  customerPrice?: number;
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

// Enhanced interfaces for rate limiting and error handling
interface RateLimitInfo {
  isRateLimited: boolean;
  retryAfterSeconds: number;
  endpoint: string;
  timestamp: number;
}

interface ErrorInfo {
  message: string;
  type: 'network' | 'rate_limit' | 'auth' | 'server' | 'unknown';
  statusCode?: number;
  retryable: boolean;
  retryAfterSeconds?: number;
}

export default class KeystoneService {
  private static instance: KeystoneService;
  private config: KeystoneConfig;
  private supabase;
  private loadedConfig: any = null;
  
  // Enhanced error handling and rate limiting
  private rateLimitInfo: Map<string, RateLimitInfo> = new Map();
  private errorCallbacks: ((error: ErrorInfo) => void)[] = [];
  private rateLimitCallbacks: ((info: RateLimitInfo) => void)[] = [];

  private constructor() {
    // Load configuration from environment variables (using VITE_ prefix)
    this.config = {
      proxyUrl: import.meta.env.VITE_KEYSTONE_PROXY_URL || '',
      apiToken: import.meta.env.VITE_KEYSTONE_API_TOKEN || '',
      environment: 'development', // Default, will be updated from saved config
      accountNumber: import.meta.env.VITE_KEYSTONE_ACCOUNT_NUMBER || '',
      securityToken: '' // Will be set after loading config
    };

    // DEBUG LOGGING - Add this right here
    console.log('🔧 KeystoneService Constructor Debug:');
    console.log('- VITE_KEYSTONE_PROXY_URL env:', import.meta.env.VITE_KEYSTONE_PROXY_URL);
    console.log('- VITE_KEYSTONE_API_TOKEN env:', import.meta.env.VITE_KEYSTONE_API_TOKEN);
    console.log('- VITE_KEYSTONE_ACCOUNT_NUMBER env:', import.meta.env.VITE_KEYSTONE_ACCOUNT_NUMBER);
    console.log('- Config proxyUrl:', this.config.proxyUrl);
    console.log('- Config apiToken:', this.config.apiToken);
    console.log('- Config accountNumber:', this.config.accountNumber);

    // Initialize Supabase client only if needed
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase configuration missing - will use environment variables only');
      this.supabase = null;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client initialized successfully');
    }

    // Load configuration and set security token
    this.initializeConfig();
  }

  public static getInstance(): KeystoneService {
    if (!KeystoneService.instance) {
      KeystoneService.instance = new KeystoneService();
    }
    return KeystoneService.instance;
  }

  // Enhanced factory method for creating instances with error handling
  public static async create(): Promise<KeystoneService> {
    const instance = KeystoneService.getInstance();
    await instance.initializeConfig();
    return instance;
  }

  // Event listeners for error and rate limit handling
  onError(callback: (error: ErrorInfo) => void): void {
    this.errorCallbacks.push(callback);
  }

  onRateLimit(callback: (info: RateLimitInfo) => void): void {
    this.rateLimitCallbacks.push(callback);
  }

  // Remove event listeners
  removeErrorListener(callback: (error: ErrorInfo) => void): void {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  removeRateLimitListener(callback: (info: RateLimitInfo) => void): void {
    const index = this.rateLimitCallbacks.indexOf(callback);
    if (index > -1) {
      this.rateLimitCallbacks.splice(index, 1);
    }
  }

  // Check if an endpoint is currently rate limited
  isEndpointRateLimited(endpoint: string): boolean {
    const rateLimitInfo = this.rateLimitInfo.get(endpoint);
    if (!rateLimitInfo) return false;
    
    const now = Date.now();
    const rateLimitExpiry = rateLimitInfo.timestamp + (rateLimitInfo.retryAfterSeconds * 1000);
    
    if (now >= rateLimitExpiry) {
      this.rateLimitInfo.delete(endpoint);
      return false;
    }
    
    return true;
  }

  // Get remaining time for rate limit
  getRateLimitRemainingTime(endpoint: string): number {
    const rateLimitInfo = this.rateLimitInfo.get(endpoint);
    if (!rateLimitInfo) return 0;
    
    const now = Date.now();
    const rateLimitExpiry = rateLimitInfo.timestamp + (rateLimitInfo.retryAfterSeconds * 1000);
    
    return Math.max(0, Math.ceil((rateLimitExpiry - now) / 1000));
  }

  // Get all current rate limits
  getAllRateLimits(): RateLimitInfo[] {
    const now = Date.now();
    const activeLimits: RateLimitInfo[] = [];
    
    for (const [endpoint, info] of this.rateLimitInfo.entries()) {
      const rateLimitExpiry = info.timestamp + (info.retryAfterSeconds * 1000);
      if (now < rateLimitExpiry) {
        activeLimits.push({
          ...info,
          retryAfterSeconds: Math.ceil((rateLimitExpiry - now) / 1000)
        });
      } else {
        this.rateLimitInfo.delete(endpoint);
      }
    }
    
    return activeLimits;
  }

  // Enhanced error handling
  private handleError(error: any, endpoint: string): ErrorInfo {
    let errorInfo: ErrorInfo;

    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      errorInfo = {
        message: 'Network connection failed. Please check your internet connection.',
        type: 'network',
        retryable: true
      };
    } else if (error.statusCode === 429 || (error.error && error.error.toLowerCase().includes('rate limit'))) {
      const retryAfterSeconds = error.retry_after_seconds || 60;
      
      // Store rate limit info
      const rateLimitInfo: RateLimitInfo = {
        isRateLimited: true,
        retryAfterSeconds,
        endpoint,
        timestamp: Date.now()
      };
      this.rateLimitInfo.set(endpoint, rateLimitInfo);
      
      // Notify rate limit listeners
      this.rateLimitCallbacks.forEach(callback => callback(rateLimitInfo));
      
      errorInfo = {
        message: `Rate limit exceeded. Please wait ${retryAfterSeconds} seconds before trying again.`,
        type: 'rate_limit',
        statusCode: 429,
        retryable: true,
        retryAfterSeconds
      };
    } else if (error.statusCode === 401 || error.statusCode === 403) {
      errorInfo = {
        message: 'Authentication failed. Please check your credentials.',
        type: 'auth',
        statusCode: error.statusCode,
        retryable: false
      };
    } else if (error.statusCode >= 500) {
      errorInfo = {
        message: 'Server error occurred. Please try again later.',
        type: 'server',
        statusCode: error.statusCode,
        retryable: true
      };
    } else {
      errorInfo = {
        message: error.message || error.error || 'An unknown error occurred',
        type: 'unknown',
        statusCode: error.statusCode,
        retryable: true
      };
    }

    // Notify error listeners
    this.errorCallbacks.forEach(callback => callback(errorInfo));
    
    return errorInfo;
  }

  private async initializeConfig(): Promise<void> {
    try {
      // First, check if all required environment variables are available
      const envAccountNumber = import.meta.env.VITE_KEYSTONE_ACCOUNT_NUMBER;
      const envSecurityTokenDev = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_DEV;
      const envSecurityTokenProd = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD;
      
      // If we have the required environment variables, use them directly
      if (envAccountNumber && (envSecurityTokenDev || envSecurityTokenProd)) {
        console.log('✅ Using environment variables for Keystone configuration');
        this.config.accountNumber = envAccountNumber;
        this.config.environment = 'development'; // Default to development
        this.config.securityToken = this.getSecurityTokenForEnvironment('development');
        this.validateConfiguration();
        return;
      }
      
      // Only try to load from Supabase if environment variables are missing
      console.log('⚠️ Environment variables incomplete, trying to load from Supabase');
      const config = await this.loadConfig();
      this.config.environment = config.environment || 'development';
      this.config.accountNumber = config.account_number || this.config.accountNumber;
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
      console.log('✅ Keystone configuration loaded successfully from environment variables');
    }
  }

  private getSecurityTokenForEnvironment(environment: 'development' | 'production'): string {
    if (environment === 'development') {
      return import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_DEV || '';
    } else {
      return import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD || '';
    }
  }

  // Enhanced makeRequest with comprehensive error handling and rate limiting
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    timeout: number = 30000
  ): Promise<KeystoneResponse<T>> {
    // Check if endpoint is rate limited
    if (this.isEndpointRateLimited(endpoint)) {
      const remainingTime = this.getRateLimitRemainingTime(endpoint);
      return {
        success: false,
        error: `Rate limit active. Please wait ${remainingTime} seconds.`,
        rate_limited: true,
        retry_after_seconds: remainingTime
      };
    }

    try {
      // DEBUG LOGGING
      console.log('🔧 Making request to:', `${this.config.proxyUrl}${endpoint}`);
      
      if (!this.config.proxyUrl) {
        throw new Error('Proxy URL not configured');
      }

      const url = `${this.config.proxyUrl}${endpoint}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiToken,
        },
        signal: controller.signal
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      clearTimeout(timeoutId);
      
      const responseData = await response.json();

      if (!response.ok) {
        const errorInfo = this.handleError({
          statusCode: response.status,
          error: responseData.error || `HTTP ${response.status}`,
          retry_after_seconds: responseData.retry_after_seconds
        }, endpoint);

        return {
          success: false,
          error: errorInfo.message,
          statusCode: response.status,
          statusMessage: response.statusText,
          retry_after_seconds: errorInfo.retryAfterSeconds,
          rate_limited: errorInfo.type === 'rate_limit'
        };
      }

      // Handle successful response that might still contain rate limit info
      if (responseData.error && responseData.error.toLowerCase().includes('rate limit')) {
        const errorInfo = this.handleError(responseData, endpoint);
        return {
          success: false,
          error: errorInfo.message,
          retry_after_seconds: errorInfo.retryAfterSeconds,
          rate_limited: true
        };
      }

      return {
        success: response.ok,
        data: responseData,
        statusCode: response.status,
        statusMessage: response.statusText,
        error: response.ok ? undefined : responseData.message || responseData.error || 'Request failed'
      };
    } catch (error: any) {
      console.error('Keystone API request failed:', error);
      
      const errorInfo = this.handleError(error, endpoint);
      
      return {
        success: false,
        error: errorInfo.message,
        statusCode: errorInfo.statusCode,
        retry_after_seconds: errorInfo.retryAfterSeconds
      };
    }
  }

  // Enhanced retry mechanism
  async retryRequest<T = any>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST', 
    data?: any, 
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<KeystoneResponse<T>> {
    let lastResponse: KeystoneResponse<T>;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      lastResponse = await this.makeRequest<T>(endpoint, method, data);
      
      if (lastResponse.success) {
        return lastResponse;
      }
      
      // Don't retry on auth errors or non-retryable errors
      if (lastResponse.statusCode === 401 || lastResponse.statusCode === 403) {
        break;
      }
      
      // For rate limits, wait the specified time
      if (lastResponse.rate_limited && lastResponse.retry_after_seconds) {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, lastResponse.retry_after_seconds! * 1000));
          continue;
        }
      }
      
      // For other errors, use exponential backoff
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return lastResponse!;
  }

  // Health check for the proxy service
  async healthCheck(): Promise<KeystoneResponse> {
    return this.makeRequest('/health');
  }

  // Get proxy service status
  async getProxyStatus(): Promise<KeystoneResponse> {
    return this.makeRequest('/admin/status');
  }

  // Get rate limiting status
  async getRateLimitStatus(): Promise<KeystoneResponse> {
    return this.makeRequest('/admin/rate-limits');
  }

  // Get cache status
  async getCacheStatus(): Promise<KeystoneResponse> {
    return this.makeRequest('/admin/cache/status');
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

    return this.retryRequest('/utility/reportmyip', 'POST', requestData);
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

    return this.retryRequest('/utility/reportapprovedips', 'POST', requestData);
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

    return this.retryRequest('/utility/reportapprovedmethods', 'POST', requestData);
  }

  // ENHANCED INVENTORY MANAGEMENT METHODS

  // Check inventory for a single part
  async checkInventory(partNumber: string): Promise<KeystoneResponse<InventoryItem[]>> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      partNumber
    };

    return this.retryRequest('/inventory/check', 'POST', requestData);
  }

  // Check inventory for multiple parts (bulk operation)
  async checkInventoryBulk(partNumbers: string[]): Promise<KeystoneResponse<InventoryItem[]>> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      partNumbers
    };

    return this.retryRequest('/inventory/bulk', 'POST', requestData);
  }

  // Get full inventory dataset (once per day limit)
  async getInventoryFull(): Promise<KeystoneResponse<InventoryItem[]>> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken
    };

    return this.retryRequest('/inventory/full', 'POST', requestData);
  }

  // Get inventory updates since last check (every 15 minutes)
  async getInventoryUpdates(lastUpdateTime?: string): Promise<KeystoneResponse<InventoryItem[]>> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      lastUpdateTime: lastUpdateTime || new Date(Date.now() - 15 * 60 * 1000).toISOString()
    };

    return this.retryRequest('/inventory/updates', 'POST', requestData);
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

    return this.retryRequest('/pricing/bulk', 'POST', requestData);
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

    return this.retryRequest('/shipping/options', 'POST', requestData);
  }

  // Get shipping options for multiple parts
  async getShippingOptionsMultiple(items: Array<{partNumber: string, quantity: number}>, zipCode?: string): Promise<KeystoneResponse<ShippingOption[]>> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      items,
      zipCode
    };

    return this.retryRequest('/shipping/options/multiple', 'POST', requestData);
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

    return this.retryRequest('/orders/ship', 'POST', requestData);
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

    return this.retryRequest('/orders/ship/dropship', 'POST', requestData);
  }

  // Get order history
  async getOrderHistory(startDate?: string, endDate?: string): Promise<KeystoneResponse<OrderInfo[]>> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      startDate,
      endDate
    };

    return this.retryRequest('/orders/history', 'POST', requestData);
  }

  // ENHANCED PARTS SEARCH METHODS

  // Search for parts with enhanced filtering
  async searchParts(searchTerm: string, options?: { limit?: number; filters?: any; category?: string; page?: number; pageSize?: number }): Promise<KeystoneResponse> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      searchTerm,
      limit: options?.limit || 50,
      filters: options?.filters,
      category: options?.category,
      page: options?.page || 1,
      pageSize: options?.pageSize || 50
    };

    return this.retryRequest('/parts/search', 'POST', requestData);
  }

  // Get part details (enhanced with more information)
  async getPartDetails(partNumber: string): Promise<KeystoneResponse> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      partNumber
    };

    return this.retryRequest('/parts/details', 'POST', requestData);
  }

  // Get kit components
  async getKitComponents(kitPartNumber: string): Promise<KeystoneResponse> {
    const requestData = {
      accountNumber: this.config.accountNumber,
      securityToken: this.config.securityToken,
      kitPartNumber
    };

    return this.retryRequest('/kits/components', 'POST', requestData);
  }

  // UTILITY METHODS

  // Check if response indicates rate limiting
  isRateLimited(response: KeystoneResponse): boolean {
    return response.rate_limited === true || 
           response.statusCode === 429 || 
           (response.error && response.error.toLowerCase().includes('rate limit'));
  }

  // Get retry after time from rate limited response
  getRetryAfter(response: KeystoneResponse): number {
    if (response.retry_after_seconds) {
      return response.retry_after_seconds;
    }
    return 60; // Default 1 minute
  }

  // Format price for display
  formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  }

  // CONFIGURATION MANAGEMENT

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
          account_number: this.config.accountNumber,
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
          account_number: this.config.accountNumber,
          securityToken: this.getSecurityTokenForEnvironment('development')
        };
      }

      // Handle legacy data format (single approvedIPs array)
      if (data.approved_ips && !data.development_ips && !data.production_ips) {
        console.log('Converting legacy IP format to environment-specific format');
        data.development_ips = data.approved_ips;
        data.production_ips = data.approved_ips;
      }

      this.loadedConfig = data;
      console.log('Configuration loaded from database');
      return data;
    } catch (error) {
      console.error('Error loading configuration:', error);
      return {
        environment: 'development',
        development_ips: [],
        production_ips: [],
        account_number: this.config.accountNumber,
        securityToken: this.getSecurityTokenForEnvironment('development')
      };
    }
  }

  async saveConfig(config: any): Promise<void> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not available');
      }

      // Get current config to preserve existing data
      const currentConfig = await this.loadConfig();
      
      // Determine if we're in development environment
      const isDevEnvironment = config.environment === 'development';
      
      // Prepare config to save with environment-specific IP handling
      const configToSave = {
        id: currentConfig.id || 'ac1a4977-53ce-41f5-bf45-37abe54a1a75',
        account_number: config.accountNumber || this.config.accountNumber,
        api_endpoint: config.apiEndpoint || 'http://legacy.ekeystone.com/SDK/api/ekeystoneapi.asmx',
        wsdl_url: config.wsdlUrl || 'http://legacy.ekeystone.com/SDK/api/ekeystoneapi.asmx?WSDL',
        approved_ips: config.approvedIPs || [],
        is_active: config.isActive !== undefined ? config.isActive : true,
        ip_approval_status: config.ipApprovalStatus || 'pending',
        ip_approval_date: config.ipApprovalDate || null,
        created_at: currentConfig.created_at || '2025-06-12T20:45:47.347159',
        updated_at: new Date().toISOString(),
        environment: config.environment || 'development',
        // Handle environment-specific IPs
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

  getCurrentEnvironment(): string {
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

  // Get current configuration for external access
  getKeystoneConfig(): KeystoneConfig {
    return { ...this.config };
  }

  // Update configuration for external access
  updateKeystoneConfig(updates: Partial<KeystoneConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Export types for use in other components
export type { 
  KeystoneResponse, 
  InventoryItem, 
  PricingInfo, 
  ShippingOption, 
  OrderInfo, 
  RateLimitInfo, 
  ErrorInfo,
  KeystoneConfig 
};


import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ShippingQuoteItem {
  vcpn: string;
  quantity: number;
  warehouseId?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

interface ShippingAddress {
  name?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  email?: string;
}

interface ShippingOption {
  carrierId: string;
  carrierName: string;
  serviceCode: string;
  serviceName: string;
  cost: number;
  currency: string;
  estimatedDeliveryDays: number;
  estimatedDeliveryDate?: string;
  trackingAvailable: boolean;
  insuranceAvailable: boolean;
  signatureRequired?: boolean;
  warehouseId: string;
  warehouseName: string;
  warehouseLocation: string;
}

interface ShippingQuoteRequest {
  items: ShippingQuoteItem[];
  shippingAddress: ShippingAddress;
  requestId?: string;
  includeInsurance?: boolean;
  includeSignature?: boolean;
  preferredCarriers?: string[];
}

interface ShippingQuoteResponse {
  success: boolean;
  message: string;
  requestId: string;
  timestamp: string;
  shippingOptions: ShippingOption[];
  totalItems: number;
  totalWeight?: number;
  estimatedPackages: number;
  isRateLimited?: boolean;
  nextAllowedTime?: string;
  rateLimitMessage?: string;
}

interface ShippingQuoteStatus {
  isRateLimited: boolean;
  lastQuoteTime: string | null;
  nextAllowedTime: string | null;
  rateLimitMessage: string | null;
  totalQuotesToday: number;
  remainingQuotes: number;
  quoteHistory: ShippingQuoteHistoryItem[];
}

interface ShippingQuoteHistoryItem {
  id: string;
  timestamp: string;
  itemCount: number;
  optionCount: number;
  success: boolean;
  shippingAddress: ShippingAddress;
  errorMessage?: string;
}

class ShippingQuoteService {
  private static readonly RATE_LIMIT_MINUTES = 5; // 5 minutes between quotes
  private static readonly MAX_ITEMS_PER_REQUEST = 50;
  private static readonly STORAGE_KEY = 'shipping_quote_status';
  
  private isRateLimited: boolean = false;
  private lastQuoteTime: string | null = null;
  private nextAllowedTime: string | null = null;
  private rateLimitMessage: string | null = null;
  private totalQuotesToday: number = 0;
  private quoteHistory: ShippingQuoteHistoryItem[] = [];

  constructor() {
    this.loadStatus();
  }

  /**
   * Check if shipping quote is currently allowed (not rate limited)
   */
  isQuoteAllowed(): boolean {
    this.updateRateLimitStatus();
    return !this.isRateLimited;
  }

  /**
   * Get time remaining until next quote is allowed (in seconds)
   */
  getTimeUntilNextQuote(): number {
    if (!this.isRateLimited || !this.nextAllowedTime) {
      return 0;
    }

    try {
      const nextTime = new Date(this.nextAllowedTime);
      const now = new Date();
      const diffMs = nextTime.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diffMs / 1000));
    } catch (error) {
      console.error('Error calculating time until next quote:', error);
      return 0;
    }
  }

  /**
   * Format duration in human readable format
   */
  formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return '0s';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  /**
   * Get current environment setting
   */
  private getCurrentEnvironment(): 'development' | 'production' {
    try {
      const savedEnvironment = localStorage.getItem('admin_environment') as 'development' | 'production';
      return savedEnvironment || 'development';
    } catch (error) {
      console.warn('Error reading environment from localStorage:', error);
      return 'development';
    }
  }

  /**
   * Get API token based on current environment
   */
  private getApiToken(): string | null {
    const environment = this.getCurrentEnvironment();
    
    if (environment === 'development') {
      const token = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_DEV;
      return token || null;
    } else {
      const token = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD;
      return token || null;
    }
  }

  /**
   * Validate shipping quote request
   */
  private validateQuoteRequest(request: ShippingQuoteRequest): { valid: boolean; message?: string } {
    if (!request.items || request.items.length === 0) {
      return { valid: false, message: 'No items provided for shipping quote' };
    }

    if (request.items.length > ShippingQuoteService.MAX_ITEMS_PER_REQUEST) {
      return { 
        valid: false, 
        message: `Too many items. Maximum ${ShippingQuoteService.MAX_ITEMS_PER_REQUEST} allowed per request` 
      };
    }

    // Validate items
    for (const item of request.items) {
      if (!item.vcpn || item.vcpn.trim().length === 0) {
        return { valid: false, message: 'All items must have a valid VCPN' };
      }
      if (!item.quantity || item.quantity <= 0) {
        return { valid: false, message: 'All items must have a valid quantity greater than 0' };
      }
    }

    // Validate shipping address
    const addr = request.shippingAddress;
    if (!addr.address1 || !addr.city || !addr.state || !addr.zipCode || !addr.country) {
      return { valid: false, message: 'Shipping address is incomplete. Required: address1, city, state, zipCode, country' };
    }

    return { valid: true };
  }

  /**
   * Update rate limit status based on last quote time
   */
  private updateRateLimitStatus(): void {
    if (!this.lastQuoteTime) {
      this.isRateLimited = false;
      this.nextAllowedTime = null;
      this.rateLimitMessage = null;
      return;
    }

    try {
      const lastQuote = new Date(this.lastQuoteTime);
      const now = new Date();
      const minutesSinceLastQuote = (now.getTime() - lastQuote.getTime()) / (1000 * 60);

      if (minutesSinceLastQuote >= ShippingQuoteService.RATE_LIMIT_MINUTES) {
        // Rate limit has expired
        this.isRateLimited = false;
        this.nextAllowedTime = null;
        this.rateLimitMessage = null;
      } else {
        // Still rate limited
        this.isRateLimited = true;
        const nextAllowed = new Date(lastQuote.getTime() + (ShippingQuoteService.RATE_LIMIT_MINUTES * 60 * 1000));
        this.nextAllowedTime = nextAllowed.toISOString();
        
        const timeRemaining = this.getTimeUntilNextQuote();
        this.rateLimitMessage = `Shipping quote rate limited. Next quote allowed in ${this.formatTimeRemaining(timeRemaining)}.`;
      }
    } catch (error) {
      console.error('Error updating rate limit status:', error);
      // Clear rate limit on error
      this.isRateLimited = false;
      this.nextAllowedTime = null;
      this.rateLimitMessage = null;
    }

    this.saveStatus();
  }

  /**
   * Set rate limit after a successful quote
   */
  private setRateLimit(): void {
    const now = new Date();
    this.lastQuoteTime = now.toISOString();
    this.isRateLimited = true;
    
    const nextAllowed = new Date(now.getTime() + (ShippingQuoteService.RATE_LIMIT_MINUTES * 60 * 1000));
    this.nextAllowedTime = nextAllowed.toISOString();
    
    const timeRemaining = this.getTimeUntilNextQuote();
    this.rateLimitMessage = `Shipping quote completed. Next quote allowed in ${this.formatTimeRemaining(timeRemaining)}.`;
    
    console.log(`⏰ Shipping quote rate limit set. Next quote allowed at: ${nextAllowed.toLocaleString()}`);
    this.saveStatus();
  }

  /**
   * Generate mock shipping options for development
   */
  private generateMockShippingOptions(items: ShippingQuoteItem[], address: ShippingAddress): ShippingOption[] {
    console.log('🧪 Generating mock shipping options for development');
    
    const carriers = [
      { id: 'ups', name: 'UPS' },
      { id: 'fedex', name: 'FedEx' },
      { id: 'usps', name: 'USPS' },
      { id: 'dhl', name: 'DHL' }
    ];

    const services = [
      { code: 'ground', name: 'Ground', days: 5, costMultiplier: 1.0 },
      { code: 'express', name: 'Express', days: 2, costMultiplier: 2.5 },
      { code: 'overnight', name: 'Overnight', days: 1, costMultiplier: 4.0 },
      { code: 'economy', name: 'Economy', days: 7, costMultiplier: 0.8 }
    ];

    const warehouses = [
      { id: 'wh001', name: 'Main Warehouse', location: 'Los Angeles, CA' },
      { id: 'wh002', name: 'East Coast Hub', location: 'Atlanta, GA' },
      { id: 'wh003', name: 'Midwest Center', location: 'Chicago, IL' }
    ];

    const options: ShippingOption[] = [];
    const baseCost = items.reduce((sum, item) => sum + (item.quantity * 5), 0); // $5 per item base

    carriers.forEach(carrier => {
      services.forEach(service => {
        warehouses.forEach(warehouse => {
          const cost = parseFloat((baseCost * service.costMultiplier + Math.random() * 10).toFixed(2));
          const deliveryDate = new Date();
          deliveryDate.setDate(deliveryDate.getDate() + service.days);

          options.push({
            carrierId: carrier.id,
            carrierName: carrier.name,
            serviceCode: service.code,
            serviceName: service.name,
            cost,
            currency: 'USD',
            estimatedDeliveryDays: service.days,
            estimatedDeliveryDate: deliveryDate.toISOString(),
            trackingAvailable: true,
            insuranceAvailable: carrier.id !== 'usps',
            signatureRequired: service.code === 'overnight',
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            warehouseLocation: warehouse.location
          });
        });
      });
    });

    // Sort by cost (cheapest first)
    return options.sort((a, b) => a.cost - b.cost);
  }

  /**
   * Call Keystone GetShippingOptionsMultiplePartsPerWarehouse API
   */
  private async callShippingQuoteApi(request: ShippingQuoteRequest): Promise<ShippingOption[]> {
    const environment = this.getCurrentEnvironment();
    const apiToken = this.getApiToken();
    const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;

    if (!apiToken || !proxyUrl) {
      if (environment === 'production') {
        throw new Error('Missing required environment variables for Keystone API');
      }
      
      console.log('🔄 Falling back to mock shipping options in development mode');
      return this.generateMockShippingOptions(request.items, request.shippingAddress);
    }

    try {
      const endpoint = '/shipping/options/multiple';
      const fullUrl = `${proxyUrl}${endpoint}`;
      
      console.log(`🔄 Making shipping quote request to: ${fullUrl}`);
      console.log(`📦 Getting shipping quotes for ${request.items.length} items to ${request.shippingAddress.city}, ${request.shippingAddress.state}`);
      
      const requestBody = {
        items: request.items.map(item => ({
          vcpn: item.vcpn,
          quantity: item.quantity,
          warehouseId: item.warehouseId,
          weight: item.weight,
          dimensions: item.dimensions
        })),
        shippingAddress: request.shippingAddress,
        includeInsurance: request.includeInsurance || false,
        includeSignature: request.includeSignature || false,
        preferredCarriers: request.preferredCarriers || []
      };

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP ${response.status}: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Successfully retrieved ${data.length || 0} shipping options from Keystone API`);
      
      return data;
      
    } catch (error) {
      console.error('❌ Failed to get shipping quotes from Keystone:', error);
      
      if (environment === 'production') {
        throw error;
      }
      
      console.log('🔄 Falling back to mock shipping options due to API error');
      return this.generateMockShippingOptions(request.items, request.shippingAddress);
    }
  }

  /**
   * Log shipping quote to database
   */
  private async logShippingQuote(
    request: ShippingQuoteRequest,
    success: boolean, 
    optionCount: number, 
    errorMessage?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('keystone_api_logs')
        .insert({
          endpoint: '/shipping/quote-multiple-parts-per-warehouse',
          method: 'POST',
          request_data: {
            itemCount: request.items.length,
            shippingAddress: request.shippingAddress,
            includeInsurance: request.includeInsurance,
            includeSignature: request.includeSignature
          },
          success,
          response_data: success ? { optionCount } : null,
          error_message: errorMessage,
          environment: this.getCurrentEnvironment()
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging shipping quote:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error logging shipping quote:', error);
      return null;
    }
  }

  /**
   * Add to quote history
   */
  private addToHistory(
    request: ShippingQuoteRequest,
    success: boolean, 
    optionCount: number, 
    errorMessage?: string
  ): void {
    const historyItem: ShippingQuoteHistoryItem = {
      id: `sq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      itemCount: request.items.length,
      optionCount,
      success,
      shippingAddress: { ...request.shippingAddress },
      errorMessage
    };

    this.quoteHistory.unshift(historyItem);
    
    // Keep only last 10 items
    if (this.quoteHistory.length > 10) {
      this.quoteHistory = this.quoteHistory.slice(0, 10);
    }

    this.saveStatus();
  }

  /**
   * Main method to get shipping quotes
   */
  async getShippingQuotes(request: ShippingQuoteRequest): Promise<ShippingQuoteResponse> {
    const requestId = request.requestId || `sq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    console.log(`🚚 Starting shipping quote request: ${requestId}`);

    // Validate request
    const validation = this.validateQuoteRequest(request);
    if (!validation.valid) {
      const errorResponse: ShippingQuoteResponse = {
        success: false,
        message: validation.message!,
        requestId,
        timestamp,
        shippingOptions: [],
        totalItems: request.items?.length || 0,
        estimatedPackages: 0
      };

      this.addToHistory(request, false, 0, validation.message);
      return errorResponse;
    }

    // Check rate limiting
    this.updateRateLimitStatus();
    if (this.isRateLimited) {
      const timeRemaining = this.getTimeUntilNextQuote();
      const message = `Shipping quote rate limited. Next quote allowed in ${this.formatTimeRemaining(timeRemaining)}.`;
      
      console.log(`⏰ ${message}`);
      
      const rateLimitedResponse: ShippingQuoteResponse = {
        success: false,
        message,
        requestId,
        timestamp,
        shippingOptions: [],
        totalItems: request.items.length,
        estimatedPackages: 0,
        isRateLimited: true,
        nextAllowedTime: this.nextAllowedTime!,
        rateLimitMessage: this.rateLimitMessage!
      };

      this.addToHistory(request, false, 0, message);
      return rateLimitedResponse;
    }

    try {
      // Call Keystone API
      const shippingOptions = await this.callShippingQuoteApi(request);
      
      // Set rate limit after successful call
      this.setRateLimit();
      
      // Update daily counter
      this.totalQuotesToday++;
      
      // Calculate totals
      const totalWeight = request.items.reduce((sum, item) => sum + ((item.weight || 1) * item.quantity), 0);
      const estimatedPackages = Math.ceil(request.items.length / 10); // Estimate 10 items per package
      
      // Log to database
      await this.logShippingQuote(request, true, shippingOptions.length);
      
      // Add to history
      this.addToHistory(request, true, shippingOptions.length);
      
      const successResponse: ShippingQuoteResponse = {
        success: true,
        message: `Successfully retrieved ${shippingOptions.length} shipping options`,
        requestId,
        timestamp,
        shippingOptions,
        totalItems: request.items.length,
        totalWeight,
        estimatedPackages
      };

      console.log(`✅ Shipping quote completed: ${shippingOptions.length} options retrieved`);
      return successResponse;

    } catch (error) {
      console.error('❌ Shipping quote failed:', error);
      
      // Log error to database
      await this.logShippingQuote(request, false, 0, error.message);
      
      // Add to history
      this.addToHistory(request, false, 0, error.message);
      
      const errorResponse: ShippingQuoteResponse = {
        success: false,
        message: `Shipping quote failed: ${error.message}`,
        requestId,
        timestamp,
        shippingOptions: [],
        totalItems: request.items.length,
        estimatedPackages: 0
      };

      return errorResponse;
    }
  }

  /**
   * Get current shipping quote status
   */
  getStatus(): ShippingQuoteStatus {
    this.updateRateLimitStatus();
    
    return {
      isRateLimited: this.isRateLimited,
      lastQuoteTime: this.lastQuoteTime,
      nextAllowedTime: this.nextAllowedTime,
      rateLimitMessage: this.rateLimitMessage,
      totalQuotesToday: this.totalQuotesToday,
      remainingQuotes: this.isRateLimited ? 0 : 1,
      quoteHistory: [...this.quoteHistory]
    };
  }

  /**
   * Clear rate limit (for testing purposes)
   */
  clearRateLimit(): void {
    this.isRateLimited = false;
    this.lastQuoteTime = null;
    this.nextAllowedTime = null;
    this.rateLimitMessage = null;
    
    console.log('✅ Shipping quote rate limit cleared');
    this.saveStatus();
  }

  /**
   * Reset daily counters (typically called at midnight)
   */
  resetDailyCounters(): void {
    this.totalQuotesToday = 0;
    console.log('🔄 Daily shipping quote counters reset');
    this.saveStatus();
  }

  /**
   * Get available warehouses from database
   */
  async getAvailableWarehouses(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('keystone_warehouses')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching warehouses:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      return [];
    }
  }

  /**
   * Save status to localStorage
   */
  private saveStatus(): void {
    try {
      const status = {
        isRateLimited: this.isRateLimited,
        lastQuoteTime: this.lastQuoteTime,
        nextAllowedTime: this.nextAllowedTime,
        rateLimitMessage: this.rateLimitMessage,
        totalQuotesToday: this.totalQuotesToday,
        quoteHistory: this.quoteHistory
      };
      
      localStorage.setItem(ShippingQuoteService.STORAGE_KEY, JSON.stringify(status));
    } catch (error) {
      console.warn('Failed to save shipping quote status to localStorage:', error);
    }
  }

  /**
   * Load status from localStorage
   */
  private loadStatus(): void {
    try {
      const saved = localStorage.getItem(ShippingQuoteService.STORAGE_KEY);
      if (saved) {
        const status = JSON.parse(saved);
        
        this.isRateLimited = status.isRateLimited || false;
        this.lastQuoteTime = status.lastQuoteTime || null;
        this.nextAllowedTime = status.nextAllowedTime || null;
        this.rateLimitMessage = status.rateLimitMessage || null;
        this.totalQuotesToday = status.totalQuotesToday || 0;
        this.quoteHistory = status.quoteHistory || [];
        
        // Update rate limit status on load
        this.updateRateLimitStatus();
      }
    } catch (error) {
      console.warn('Failed to load shipping quote status from localStorage:', error);
    }
  }
}

// Export both the class and singleton instance
export { ShippingQuoteService };
export const shippingQuoteService = new ShippingQuoteService();


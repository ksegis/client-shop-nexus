import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;
const supabase = createClient(supabaseUrl, supabaseKey);

interface DropshipOrderItem {
  vcpn: string;
  quantity: number;
  unitPrice?: number;
  description?: string;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  company?: string;
  email: string;
  phone?: string;
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

interface BillingAddress {
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

interface DropshipOrderRequest {
  orderReference: string;
  customerInfo: CustomerInfo;
  shippingAddress: ShippingAddress;
  billingAddress?: BillingAddress;
  items: DropshipOrderItem[];
  shippingMethod?: string;
  specialInstructions?: string;
  poNumber?: string;
  requestedDeliveryDate?: string;
}

interface DropshipOrderResponse {
  success: boolean;
  message: string;
  orderReference: string;
  keystoneOrderId?: string;
  timestamp: string;
  totalItems: number;
  totalValue?: number;
  estimatedShipping?: number;
  estimatedDeliveryDate?: string;
  trackingInfo?: {
    trackingNumber?: string;
    carrier?: string;
    trackingUrl?: string;
  };
  isRateLimited?: boolean;
  nextAllowedTime?: string;
  rateLimitMessage?: string;
}

interface DropshipOrderStatus {
  isRateLimited: boolean;
  lastOrderTime: string | null;
  nextAllowedTime: string | null;
  rateLimitMessage: string | null;
  totalOrdersToday: number;
  remainingOrders: number;
  orderHistory: DropshipOrderHistoryItem[];
}

interface DropshipOrderHistoryItem {
  id: string;
  timestamp: string;
  orderReference: string;
  keystoneOrderId?: string;
  itemCount: number;
  totalValue?: number;
  success: boolean;
  customerInfo: CustomerInfo;
  shippingAddress: ShippingAddress;
  errorMessage?: string;
}

class DropshipOrderService {
  private static readonly RATE_LIMIT_MINUTES = 2; // 2 minutes between orders (reasonable for order placement)
  private static readonly MAX_ITEMS_PER_ORDER = 100;
  private static readonly STORAGE_KEY = 'dropship_order_status';
  
  private isRateLimited: boolean = false;
  private lastOrderTime: string | null = null;
  private nextAllowedTime: string | null = null;
  private rateLimitMessage: string | null = null;
  private totalOrdersToday: number = 0;
  private orderHistory: DropshipOrderHistoryItem[] = [];

  constructor() {
    this.loadStatus();
  }

  /**
   * Check if order placement is currently allowed (not rate limited)
   */
  isOrderAllowed(): boolean {
    this.updateRateLimitStatus();
    return !this.isRateLimited;
  }

  /**
   * Get time remaining until next order is allowed (in seconds)
   */
  getTimeUntilNextOrder(): number {
    if (!this.isRateLimited || !this.nextAllowedTime) {
      return 0;
    }

    try {
      const nextTime = new Date(this.nextAllowedTime);
      const now = new Date();
      const diffMs = nextTime.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diffMs / 1000));
    } catch (error) {
      console.error('Error calculating time until next order:', error);
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
   * Generate unique order reference
   */
  private generateOrderReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `DO-${timestamp}-${random}`;
  }

  /**
   * Validate dropship order request
   */
  private validateOrderRequest(request: DropshipOrderRequest): { valid: boolean; message?: string } {
    // Validate order reference
    if (!request.orderReference || request.orderReference.trim().length === 0) {
      return { valid: false, message: 'Order reference is required' };
    }

    // Validate customer info
    const customer = request.customerInfo;
    if (!customer.firstName || !customer.lastName || !customer.email) {
      return { valid: false, message: 'Customer first name, last name, and email are required' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email)) {
      return { valid: false, message: 'Invalid email format' };
    }

    // Validate items
    if (!request.items || request.items.length === 0) {
      return { valid: false, message: 'No items provided for order' };
    }

    if (request.items.length > DropshipOrderService.MAX_ITEMS_PER_ORDER) {
      return { 
        valid: false, 
        message: `Too many items. Maximum ${DropshipOrderService.MAX_ITEMS_PER_ORDER} allowed per order` 
      };
    }

    // Validate each item
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
   * Update rate limit status based on last order time
   */
  private updateRateLimitStatus(): void {
    if (!this.lastOrderTime) {
      this.isRateLimited = false;
      this.nextAllowedTime = null;
      this.rateLimitMessage = null;
      return;
    }

    try {
      const lastOrder = new Date(this.lastOrderTime);
      const now = new Date();
      const minutesSinceLastOrder = (now.getTime() - lastOrder.getTime()) / (1000 * 60);

      if (minutesSinceLastOrder >= DropshipOrderService.RATE_LIMIT_MINUTES) {
        // Rate limit has expired
        this.isRateLimited = false;
        this.nextAllowedTime = null;
        this.rateLimitMessage = null;
      } else {
        // Still rate limited
        this.isRateLimited = true;
        const nextAllowed = new Date(lastOrder.getTime() + (DropshipOrderService.RATE_LIMIT_MINUTES * 60 * 1000));
        this.nextAllowedTime = nextAllowed.toISOString();
        
        const timeRemaining = this.getTimeUntilNextOrder();
        this.rateLimitMessage = `Order placement rate limited. Next order allowed in ${this.formatTimeRemaining(timeRemaining)}.`;
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
   * Set rate limit after a successful order
   */
  private setRateLimit(): void {
    const now = new Date();
    this.lastOrderTime = now.toISOString();
    this.isRateLimited = true;
    
    const nextAllowed = new Date(now.getTime() + (DropshipOrderService.RATE_LIMIT_MINUTES * 60 * 1000));
    this.nextAllowedTime = nextAllowed.toISOString();
    
    const timeRemaining = this.getTimeUntilNextOrder();
    this.rateLimitMessage = `Order placed successfully. Next order allowed in ${this.formatTimeRemaining(timeRemaining)}.`;
    
    console.log(`⏰ Dropship order rate limit set. Next order allowed at: ${nextAllowed.toLocaleString()}`);
    this.saveStatus();
  }

  /**
   * Generate mock order response for development
   */
  private generateMockOrderResponse(request: DropshipOrderRequest): any {
    console.log('🧪 Generating mock order response for development');
    
    const keystoneOrderId = `KS-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const totalValue = request.items.reduce((sum, item) => sum + ((item.unitPrice || 25.99) * item.quantity), 0);
    const estimatedShipping = Math.round((totalValue * 0.1 + 5.99) * 100) / 100; // 10% + $5.99 base
    
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 5) + 3); // 3-7 days

    return {
      success: true,
      keystoneOrderId,
      orderReference: request.orderReference,
      status: 'confirmed',
      totalValue: Math.round(totalValue * 100) / 100,
      estimatedShipping,
      estimatedDeliveryDate: deliveryDate.toISOString(),
      trackingInfo: {
        trackingNumber: `1Z${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
        carrier: 'UPS',
        trackingUrl: `https://www.ups.com/track?tracknum=1Z${Math.random().toString(36).substr(2, 12).toUpperCase()}`
      },
      items: request.items.map(item => ({
        vcpn: item.vcpn,
        quantity: item.quantity,
        unitPrice: item.unitPrice || 25.99,
        status: 'confirmed',
        estimatedShipDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
      }))
    };
  }

  /**
   * Call Keystone PlaceDropshipOrder API
   */
  private async callDropshipOrderApi(request: DropshipOrderRequest): Promise<any> {
    const environment = this.getCurrentEnvironment();
    const apiToken = this.getApiToken();
    const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;

    if (!apiToken || !proxyUrl) {
      if (environment === 'production') {
        throw new Error('Missing required environment variables for Keystone API');
      }
      
      console.log('🔄 Falling back to mock order response in development mode');
      return this.generateMockOrderResponse(request);
    }

    try {
      const endpoint = '/orders/place-dropship';
      const fullUrl = `${proxyUrl}${endpoint}`;
      
      console.log(`🔄 Making dropship order request to: ${fullUrl}`);
      console.log(`📦 Placing order ${request.orderReference} with ${request.items.length} items`);
      
      const requestBody = {
        orderReference: request.orderReference,
        customerInfo: request.customerInfo,
        shippingAddress: request.shippingAddress,
        billingAddress: request.billingAddress || request.shippingAddress,
        items: request.items,
        shippingMethod: request.shippingMethod || 'standard',
        specialInstructions: request.specialInstructions,
        poNumber: request.poNumber,
        requestedDeliveryDate: request.requestedDeliveryDate
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
      console.log(`✅ Successfully placed dropship order: ${data.keystoneOrderId || 'Unknown ID'}`);
      
      return data;
      
    } catch (error) {
      console.error('❌ Failed to place dropship order with Keystone:', error);
      
      if (environment === 'production') {
        throw error;
      }
      
      console.log('🔄 Falling back to mock order response due to API error');
      return this.generateMockOrderResponse(request);
    }
  }

  /**
   * Log dropship order to database
   */
  private async logDropshipOrder(
    request: DropshipOrderRequest,
    success: boolean, 
    keystoneOrderId?: string,
    totalValue?: number,
    errorMessage?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('keystone_api_logs')
        .insert({
          endpoint: '/orders/place-dropship',
          method: 'POST',
          request_data: {
            orderReference: request.orderReference,
            itemCount: request.items.length,
            customerEmail: request.customerInfo.email,
            shippingCity: request.shippingAddress.city,
            shippingState: request.shippingAddress.state
          },
          success,
          response_data: success ? { 
            keystoneOrderId, 
            totalValue,
            itemCount: request.items.length 
          } : null,
          error_message: errorMessage,
          environment: this.getCurrentEnvironment()
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging dropship order:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error logging dropship order:', error);
      return null;
    }
  }

  /**
   * Add to order history
   */
  private addToHistory(
    request: DropshipOrderRequest,
    success: boolean, 
    keystoneOrderId?: string,
    totalValue?: number,
    errorMessage?: string
  ): void {
    const historyItem: DropshipOrderHistoryItem = {
      id: `do_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      orderReference: request.orderReference,
      keystoneOrderId,
      itemCount: request.items.length,
      totalValue,
      success,
      customerInfo: { ...request.customerInfo },
      shippingAddress: { ...request.shippingAddress },
      errorMessage
    };

    this.orderHistory.unshift(historyItem);
    
    // Keep only last 20 items
    if (this.orderHistory.length > 20) {
      this.orderHistory = this.orderHistory.slice(0, 20);
    }

    this.saveStatus();
  }

  /**
   * Main method to place dropship order
   */
  async placeDropshipOrder(request: DropshipOrderRequest): Promise<DropshipOrderResponse> {
    const orderReference = request.orderReference || this.generateOrderReference();
    const timestamp = new Date().toISOString();

    console.log(`📦 Starting dropship order placement: ${orderReference}`);

    // Validate request
    const validation = this.validateOrderRequest({ ...request, orderReference });
    if (!validation.valid) {
      const errorResponse: DropshipOrderResponse = {
        success: false,
        message: validation.message!,
        orderReference,
        timestamp,
        totalItems: request.items?.length || 0
      };

      this.addToHistory({ ...request, orderReference }, false, undefined, undefined, validation.message);
      return errorResponse;
    }

    // Check rate limiting
    this.updateRateLimitStatus();
    if (this.isRateLimited) {
      const timeRemaining = this.getTimeUntilNextOrder();
      const message = `Order placement rate limited. Next order allowed in ${this.formatTimeRemaining(timeRemaining)}.`;
      
      console.log(`⏰ ${message}`);
      
      const rateLimitedResponse: DropshipOrderResponse = {
        success: false,
        message,
        orderReference,
        timestamp,
        totalItems: request.items.length,
        isRateLimited: true,
        nextAllowedTime: this.nextAllowedTime!,
        rateLimitMessage: this.rateLimitMessage!
      };

      this.addToHistory({ ...request, orderReference }, false, undefined, undefined, message);
      return rateLimitedResponse;
    }

    try {
      // Call Keystone API
      const orderData = await this.callDropshipOrderApi({ ...request, orderReference });
      
      // Set rate limit after successful call
      this.setRateLimit();
      
      // Update daily counter
      this.totalOrdersToday++;
      
      // Log to database
      await this.logDropshipOrder(
        { ...request, orderReference }, 
        true, 
        orderData.keystoneOrderId,
        orderData.totalValue
      );
      
      // Add to history
      this.addToHistory(
        { ...request, orderReference }, 
        true, 
        orderData.keystoneOrderId,
        orderData.totalValue
      );
      
      const successResponse: DropshipOrderResponse = {
        success: true,
        message: `Order placed successfully with Keystone`,
        orderReference,
        keystoneOrderId: orderData.keystoneOrderId,
        timestamp,
        totalItems: request.items.length,
        totalValue: orderData.totalValue,
        estimatedShipping: orderData.estimatedShipping,
        estimatedDeliveryDate: orderData.estimatedDeliveryDate,
        trackingInfo: orderData.trackingInfo
      };

      console.log(`✅ Dropship order placed successfully: ${orderData.keystoneOrderId || 'Unknown ID'}`);
      return successResponse;

    } catch (error) {
      console.error('❌ Dropship order placement failed:', error);
      
      // Log error to database
      await this.logDropshipOrder(
        { ...request, orderReference }, 
        false, 
        undefined,
        undefined,
        error.message
      );
      
      // Add to history
      this.addToHistory(
        { ...request, orderReference }, 
        false, 
        undefined,
        undefined,
        error.message
      );
      
      const errorResponse: DropshipOrderResponse = {
        success: false,
        message: `Order placement failed: ${error.message}`,
        orderReference,
        timestamp,
        totalItems: request.items.length
      };

      return errorResponse;
    }
  }

  /**
   * Get current dropship order status
   */
  getStatus(): DropshipOrderStatus {
    this.updateRateLimitStatus();
    
    return {
      isRateLimited: this.isRateLimited,
      lastOrderTime: this.lastOrderTime,
      nextAllowedTime: this.nextAllowedTime,
      rateLimitMessage: this.rateLimitMessage,
      totalOrdersToday: this.totalOrdersToday,
      remainingOrders: this.isRateLimited ? 0 : 1,
      orderHistory: [...this.orderHistory]
    };
  }

  /**
   * Clear rate limit (for testing purposes)
   */
  clearRateLimit(): void {
    this.isRateLimited = false;
    this.lastOrderTime = null;
    this.nextAllowedTime = null;
    this.rateLimitMessage = null;
    
    console.log('✅ Dropship order rate limit cleared');
    this.saveStatus();
  }

  /**
   * Reset daily counters (typically called at midnight)
   */
  resetDailyCounters(): void {
    this.totalOrdersToday = 0;
    console.log('🔄 Daily dropship order counters reset');
    this.saveStatus();
  }

  /**
   * Get order by reference
   */
  async getOrderByReference(orderReference: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('keystone_api_logs')
        .select('*')
        .eq('endpoint', '/orders/place-dropship')
        .eq('request_data->>orderReference', orderReference)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching order by reference:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching order by reference:', error);
      return null;
    }
  }

  /**
   * Save status to localStorage
   */
  private saveStatus(): void {
    try {
      const status = {
        isRateLimited: this.isRateLimited,
        lastOrderTime: this.lastOrderTime,
        nextAllowedTime: this.nextAllowedTime,
        rateLimitMessage: this.rateLimitMessage,
        totalOrdersToday: this.totalOrdersToday,
        orderHistory: this.orderHistory
      };
      
      localStorage.setItem(DropshipOrderService.STORAGE_KEY, JSON.stringify(status));
    } catch (error) {
      console.warn('Failed to save dropship order status to localStorage:', error);
    }
  }

  /**
   * Load status from localStorage
   */
  private loadStatus(): void {
    try {
      const saved = localStorage.getItem(DropshipOrderService.STORAGE_KEY);
      if (saved) {
        const status = JSON.parse(saved);
        
        this.isRateLimited = status.isRateLimited || false;
        this.lastOrderTime = status.lastOrderTime || null;
        this.nextAllowedTime = status.nextAllowedTime || null;
        this.rateLimitMessage = status.rateLimitMessage || null;
        this.totalOrdersToday = status.totalOrdersToday || 0;
        this.orderHistory = status.orderHistory || [];
        
        // Update rate limit status on load
        this.updateRateLimitStatus();
      }
    } catch (error) {
      console.warn('Failed to load dropship order status from localStorage:', error);
    }
  }
}

// Export both the class and singleton instance
export { DropshipOrderService };
export const dropshipOrderService = new DropshipOrderService();


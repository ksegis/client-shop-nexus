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
  private static readonly KEYSTONE_SOAP_URL = 'http://order.ekeystone.com/wselectronicorder/electronicorder.asmx';
  
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
   * Get Keystone account number
   */
  private getAccountNumber(): string | null {
    // Directly read the Vercel environment variable
    const accountNo = import.meta.env.VITE_KEYSTONE_ACCOUNT_NUMBER;

    // --- NEW DEBUGGING LINE ---
    console.log('🔍 Debug - Raw VITE_KEYSTONE_ACCOUNT_NUMBER value:', import.meta.env.VITE_KEYSTONE_ACCOUNT_NUMBER);
    
    return accountNo || null;
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
   * Create SOAP envelope for GetShippingOptionsMultiplePartsPerWarehouse
   */
  private createSOAPEnvelope(securityKey: string, accountNumber: string, partNumbersQty: string, toZip: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetShippingOptionsMultiplePartsPerWarehouse xmlns="http://eKeystone.com">
      <Key>${securityKey}</Key>
      <FullAccountNo>${accountNumber}</FullAccountNo>
      <PartNumbersQty>${partNumbersQty}</PartNumbersQty>
      <ToZip>${toZip}</ToZip>
    </GetShippingOptionsMultiplePartsPerWarehouse>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Format items for Keystone PartNumbersQty parameter
   */
  private formatPartNumbersQty(items: ShippingQuoteItem[]): string {
    return items.map(item => `K,${item.vcpn},${item.quantity}`).join('|');
  }

  /**
   * Parse SOAP response and extract shipping options
   */
  private parseSOAPResponse(soapResponse: string): ShippingOption[] {
    console.log('🔍 Parsing SOAP response from Keystone');
    
    try {
      // Parse the XML response
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(soapResponse, 'text/xml');
      
      // Check for SOAP faults
      const faultNode = xmlDoc.querySelector('soap\\:Fault, Fault');
      if (faultNode) {
        const faultString = faultNode.querySelector('faultstring')?.textContent || 'Unknown SOAP fault';
        throw new Error(`SOAP Fault: ${faultString}`);
      }

      // Extract the dataset from the response
      const resultNode = xmlDoc.querySelector('GetShippingOptionsMultiplePartsPerWarehouseResult');
      if (!resultNode) {
        throw new Error('No result found in SOAP response');
      }

      // Parse the dataset tables
      const options: ShippingOption[] = [];
      
      // Look for warehouse-specific tables (Warehouse_[Name]_[Number])
      const warehouseTables = xmlDoc.querySelectorAll('Table[TableName*="Warehouse_"]');
      
      warehouseTables.forEach((table, index) => {
        const tableName = table.getAttribute('TableName') || '';
        const warehouseMatch = tableName.match(/Warehouse_(.+)_(\d+)/);
        
        if (warehouseMatch) {
          const warehouseName = warehouseMatch[1];
          const warehouseId = warehouseMatch[2];
          
          // Parse rows in this warehouse table
          const rows = table.querySelectorAll('Row');
          rows.forEach(row => {
            const shipVia = row.querySelector('ShipVia')?.textContent || '';
            const serviceLevel = row.querySelector('ServiceLevel')?.textContent || '';
            const description = row.querySelector('Description')?.textContent || '';
            const totalFreightCharge = parseFloat(row.querySelector('TotalFreightCharge')?.textContent || '0');
            
            if (shipVia && serviceLevel) {
              options.push({
                carrierId: shipVia,
                carrierName: this.getCarrierName(shipVia),
                serviceCode: serviceLevel,
                serviceName: description || serviceLevel,
                cost: totalFreightCharge,
                currency: 'USD',
                estimatedDeliveryDays: this.getEstimatedDays(serviceLevel),
                trackingAvailable: true,
                insuranceAvailable: true,
                signatureRequired: serviceLevel.includes('overnight') || serviceLevel.includes('express'),
                warehouseId: warehouseId,
                warehouseName: warehouseName,
                warehouseLocation: this.getWarehouseLocation(warehouseId)
              });
            }
          });
        }
      });

      console.log(`✅ Parsed ${options.length} shipping options from Keystone SOAP response`);
      return options.sort((a, b) => a.cost - b.cost);
      
    } catch (error) {
      console.error('❌ Error parsing SOAP response:', error);
      throw new Error(`Failed to parse SOAP response: ${error.message}`);
    }
  }

  /**
   * Get carrier name from ShipVia code
   */
  private getCarrierName(shipVia: string): string {
    const carrierMap: { [key: string]: string } = {
      '3': 'UPS',
      '2': 'FedEx',
      '6': 'Keystone Truck',
      '7': 'USPS',
      '8': 'UPS Mail Innovations',
      'L': 'LTL Freight'
    };
    return carrierMap[shipVia] || `Carrier ${shipVia}`;
  }

  /**
   * Get estimated delivery days from service level
   */
  private getEstimatedDays(serviceLevel: string): number {
    const serviceMap: { [key: string]: number } = {
      'U01': 1, // UPS Next Day Air
      'U11': 1, // UPS Next Day Air Early
      'F11': 1, // FedEx Priority Overnight
      'F06': 2, // FedEx 2Day
      'K06': 3, // Keystone Truck Run
      'P02': 7, // USPS Priority Mail
      'UPM': 5  // UPS Mail Innovations
    };
    return serviceMap[serviceLevel] || 5;
  }

  /**
   * Get warehouse location from warehouse ID
   */
  private getWarehouseLocation(warehouseId: string): string {
    const warehouseMap: { [key: string]: string } = {
      '1': 'Exeter, Pennsylvania',
      '14': 'Kansas City, Kansas',
      '25': 'Eastvale, California',
      '30': 'Atlanta, Georgia',
      '45': 'Spokane, Washington',
      '50': 'Flower Mound, Texas',
      '55': 'Dallas-Fort Worth, Texas',
      '60': 'Brownstown, Michigan'
    };
    return warehouseMap[warehouseId] || `Warehouse ${warehouseId}`;
  }

  /**
   * Call Keystone SOAP API for shipping quotes
   */
  private async callKeystoneSOAPAPI(request: ShippingQuoteRequest): Promise<ShippingOption[]> {
    const securityKey = this.getApiToken();
    const accountNumber = this.getAccountNumber();
    const environment = this.getCurrentEnvironment();

    // --- DEBUGGING LOGS START ---
    console.log('🔍 Debug - Environment:', environment);
    console.log('🔍 Debug - Security Key:', securityKey ? 'Present' : 'Missing');
    console.log('🔍 Debug - Account Number:', accountNumber ? 'Present' : 'Missing');
    console.log('🔍 Debug - SOAP URL:', ShippingQuoteService.KEYSTONE_SOAP_URL);
    // --- DEBUGGING LOGS END ---

    if (!securityKey || !accountNumber) {
      if (environment === 'production') {
        throw new Error('Missing required Keystone API credentials for production environment');
      }
      
      console.log('🔄 Falling back to mock shipping options in development mode');
      return this.generateMockShippingOptions(request.items, request.shippingAddress);
    }

    try {
      // Format the request data
      const partNumbersQty = this.formatPartNumbersQty(request.items);
      const toZip = request.shippingAddress.zipCode;

      // Create SOAP envelope
      const soapEnvelope = this.createSOAPEnvelope(securityKey, accountNumber, partNumbersQty, toZip);
      
      console.log('🔍 SOAP Envelope:', soapEnvelope);

      // Make the SOAP request
      console.log('🔄 Making SOAP request to Keystone API...');
      const response = await fetch(ShippingQuoteService.KEYSTONE_SOAP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://eKeystone.com/GetShippingOptionsMultiplePartsPerWarehouse'
        },
        body: soapEnvelope
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log('🔍 SOAP Response:', responseText);

      // Parse the SOAP response
      const shippingOptions = this.parseSOAPResponse(responseText);
      
      console.log(`✅ Successfully retrieved ${shippingOptions.length} shipping options from Keystone SOAP API`);
      return shippingOptions;

    } catch (error) {
      console.error('❌ Error calling Keystone SOAP API:', error);
      
      if (environment === 'development') {
        console.log('🔄 Falling back to mock shipping options due to API error');
        return this.generateMockShippingOptions(request.items, request.shippingAddress);
      } else {
        throw error;
      }
    }
  }

  /**
   * Add quote to history
   */
  private addToHistory(request: ShippingQuoteRequest, optionCount: number, success: boolean, errorMessage?: string): void {
    const historyItem: ShippingQuoteHistoryItem = {
      id: `sq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      itemCount: request.items.length,
      optionCount,
      success,
      shippingAddress: request.shippingAddress,
      errorMessage
    };

    this.quoteHistory.unshift(historyItem);
    
    // Keep only last 10 quotes
    if (this.quoteHistory.length > 10) {
      this.quoteHistory = this.quoteHistory.slice(0, 10);
    }

    this.saveStatus();
  }

  /**
   * Log shipping quote to database
   */
  private async logShippingQuote(request: ShippingQuoteRequest, success: boolean, optionCount: number, errorMessage?: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('keystone_api_logs')
        .insert({
          method_name: 'GetShippingOptionsMultiplePartsPerWarehouse',
          endpoint: 'GetShippingOptionsMultiplePartsPerWarehouse',
          method: 'SOAP',
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
        });

      if (error) {
        console.error('Error logging shipping quote:', error);
      }
    } catch (error) {
      console.error('Error logging shipping quote:', error);
    }
  }

  /**
   * Get shipping quotes for multiple items
   */
  public async getShippingQuotes(request: ShippingQuoteRequest): Promise<ShippingQuoteResponse> {
    const requestId = request.requestId || `sq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    console.log(`🚚 Starting shipping quote request: ${requestId}`);

    // Validate request
    const validation = this.validateQuoteRequest(request);
    if (!validation.valid) {
      const errorMessage = validation.message || 'Invalid shipping quote request';
      await this.logShippingQuote(request, false, 0, errorMessage);
      return {
        success: false,
        message: errorMessage,
        requestId,
        timestamp,
        shippingOptions: [],
        totalItems: request.items.length,
        estimatedPackages: 0
      };
    }

    // Check rate limit
    this.updateRateLimitStatus();
    if (this.isRateLimited) {
      const errorMessage = this.rateLimitMessage || 'Rate limited';
      return {
        success: false,
        message: errorMessage,
        requestId,
        timestamp,
        shippingOptions: [],
        totalItems: request.items.length,
        estimatedPackages: 0,
        isRateLimited: true,
        nextAllowedTime: this.nextAllowedTime,
        rateLimitMessage: this.rateLimitMessage
      };
    }

    try {
      console.log(`📦 Getting shipping quotes for ${request.items.length} items to ${request.shippingAddress.city}, ${request.shippingAddress.state}`);

      // Call Keystone SOAP API
      const shippingOptions = await this.callKeystoneSOAPAPI(request);

      // Set rate limit after successful quote
      this.setRateLimit();

      // Add to history
      this.addToHistory(request, shippingOptions.length, true);

      // Log to database
      await this.logShippingQuote(request, true, shippingOptions.length);

      console.log(`✅ Shipping quote completed: ${shippingOptions.length} options retrieved`);

      return {
        success: true,
        message: `Found ${shippingOptions.length} shipping options`,
        requestId,
        timestamp,
        shippingOptions,
        totalItems: request.items.length,
        estimatedPackages: Math.ceil(request.items.length / 10), // Estimate 10 items per package
        isRateLimited: this.isRateLimited,
        nextAllowedTime: this.nextAllowedTime,
        rateLimitMessage: this.rateLimitMessage
      };

    } catch (error) {
      console.error('❌ Failed to get shipping quotes from Keystone:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      // Add to history
      this.addToHistory(request, 0, false, errorMessage);

      // Log to database
      await this.logShippingQuote(request, false, 0, errorMessage);

      return {
        success: false,
        message: errorMessage,
        requestId,
        timestamp,
        shippingOptions: [],
        totalItems: request.items.length,
        estimatedPackages: 0
      };
    }
  }

  /**
   * Get shipping quote by history ID
   */
  public getQuoteFromHistory(historyId: string): ShippingQuoteResponse | null {
    const historyItem = this.quoteHistory.find(item => item.id === historyId);
    
    if (!historyItem) {
      return null;
    }

    if (historyItem.success) {
      // For successful quotes, we would need to store the actual options
      // For now, return a basic response indicating the quote was found
      return {
        success: true,
        message: `Historical quote found with ${historyItem.optionCount} options`,
        requestId: historyItem.id,
        timestamp: historyItem.timestamp,
        shippingOptions: [], // Would need to store actual options to return them
        totalItems: historyItem.itemCount,
        estimatedPackages: Math.ceil(historyItem.itemCount / 10),
      };
    } else {
      return {
        success: false,
        message: historyItem.errorMessage || 'Historical quote failed',
        requestId: historyItem.id,
        timestamp: historyItem.timestamp,
        shippingOptions: [],
        totalItems: historyItem.itemCount,
        estimatedPackages: 0,
      };
    }
  }

  /**
   * Get warehouses from Supabase
   */
  private async getWarehouses(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
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

  /**
   * Get current shipping quote status
   */
  public getStatus(): ShippingQuoteStatus {
    this.updateRateLimitStatus();
    return {
      isRateLimited: this.isRateLimited,
      lastQuoteTime: this.lastQuoteTime,
      nextAllowedTime: this.nextAllowedTime,
      rateLimitMessage: this.rateLimitMessage,
      totalQuotesToday: this.totalQuotesToday,
      remainingQuotes: this.getRemainingQuotes(),
      quoteHistory: this.quoteHistory,
    };
  }

  /**
   * Get remaining quotes for the day (mock implementation)
   */
  private getRemainingQuotes(): number {
    // This is a mock implementation. In a real scenario, this would come from the API.
    return 100 - this.totalQuotesToday; 
  }
}

// Export both the class and singleton instance
export { ShippingQuoteService };
export const shippingQuoteService = new ShippingQuoteService();


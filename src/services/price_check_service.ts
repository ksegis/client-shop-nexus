import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;
const supabase = createClient(supabaseUrl, supabaseKey);

interface PriceCheckRequest {
  vcpns: string[];
  requestId?: string;
}

interface PriceCheckResult {
  vcpn: string;
  cost: number;
  listPrice?: number;
  currency: string;
  lastUpdated: string;
  availability?: string;
  error?: string;
}

interface PriceCheckResponse {
  success: boolean;
  message: string;
  results: PriceCheckResult[];
  requestId: string;
  timestamp: string;
  isRateLimited?: boolean;
  nextAllowedTime?: string;
  rateLimitMessage?: string;
}

interface PriceCheckStatus {
  isRateLimited: boolean;
  lastCheckTime: string | null;
  nextAllowedTime: string | null;
  rateLimitMessage: string | null;
  totalChecksToday: number;
  remainingChecks: number;
  checkHistory: PriceCheckHistoryItem[];
}

interface PriceCheckHistoryItem {
  id: string;
  timestamp: string;
  vcpns: string[];
  success: boolean;
  resultCount: number;
  errorMessage?: string;
}

class PriceCheckService {
  private static readonly RATE_LIMIT_HOURS = 1; // 1 hour between checks
  private static readonly MAX_VCPNS_PER_REQUEST = 12;
  private static readonly STORAGE_KEY = 'price_check_status';
  
  private isRateLimited: boolean = false;
  private lastCheckTime: string | null = null;
  private nextAllowedTime: string | null = null;
  private rateLimitMessage: string | null = null;
  private totalChecksToday: number = 0;
  private checkHistory: PriceCheckHistoryItem[] = [];

  constructor() {
    this.loadStatus();
  }

  /**
   * Check if price checking is currently allowed (not rate limited)
   */
  isCheckAllowed(): boolean {
    this.updateRateLimitStatus();
    return !this.isRateLimited;
  }

  /**
   * Get time remaining until next check is allowed (in seconds)
   */
  getTimeUntilNextCheck(): number {
    if (!this.isRateLimited || !this.nextAllowedTime) {
      return 0;
    }

    try {
      const nextTime = new Date(this.nextAllowedTime);
      const now = new Date();
      const diffMs = nextTime.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diffMs / 1000));
    } catch (error) {
      console.error('Error calculating time until next check:', error);
      return 0;
    }
  }

  /**
   * Format duration in human readable format
   */
  formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
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
   * Validate VCPNs for price check request
   */
  private validateVcpns(vcpns: string[]): { valid: boolean; message?: string } {
    if (!vcpns || vcpns.length === 0) {
      return { valid: false, message: 'No VCPNs provided' };
    }

    if (vcpns.length > PriceCheckService.MAX_VCPNS_PER_REQUEST) {
      return { 
        valid: false, 
        message: `Too many VCPNs. Maximum ${PriceCheckService.MAX_VCPNS_PER_REQUEST} allowed per request` 
      };
    }

    // Check for empty or invalid VCPNs
    const invalidVcpns = vcpns.filter(vcpn => !vcpn || vcpn.trim().length === 0);
    if (invalidVcpns.length > 0) {
      return { valid: false, message: 'Some VCPNs are empty or invalid' };
    }

    return { valid: true };
  }

  /**
   * Update rate limit status based on last check time
   */
  private updateRateLimitStatus(): void {
    if (!this.lastCheckTime) {
      this.isRateLimited = false;
      this.nextAllowedTime = null;
      this.rateLimitMessage = null;
      return;
    }

    try {
      const lastCheck = new Date(this.lastCheckTime);
      const now = new Date();
      const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastCheck >= PriceCheckService.RATE_LIMIT_HOURS) {
        // Rate limit has expired
        this.isRateLimited = false;
        this.nextAllowedTime = null;
        this.rateLimitMessage = null;
      } else {
        // Still rate limited
        this.isRateLimited = true;
        const nextAllowed = new Date(lastCheck.getTime() + (PriceCheckService.RATE_LIMIT_HOURS * 60 * 60 * 1000));
        this.nextAllowedTime = nextAllowed.toISOString();
        
        const timeRemaining = this.getTimeUntilNextCheck();
        this.rateLimitMessage = `Price check rate limited. Next check allowed in ${this.formatTimeRemaining(timeRemaining)}.`;
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
   * Set rate limit after a successful check
   */
  private setRateLimit(): void {
    const now = new Date();
    this.lastCheckTime = now.toISOString();
    this.isRateLimited = true;
    
    const nextAllowed = new Date(now.getTime() + (PriceCheckService.RATE_LIMIT_HOURS * 60 * 60 * 1000));
    this.nextAllowedTime = nextAllowed.toISOString();
    
    const timeRemaining = this.getTimeUntilNextCheck();
    this.rateLimitMessage = `Price check completed. Next check allowed in ${this.formatTimeRemaining(timeRemaining)}.`;
    
    console.log(`⏰ Price check rate limit set. Next check allowed at: ${nextAllowed.toLocaleString()}`);
    this.saveStatus();
  }

  /**
   * Generate mock price data for development
   */
  private generateMockPriceData(vcpns: string[]): PriceCheckResult[] {
    console.log('🧪 Generating mock price data for development');
    
    return vcpns.map(vcpn => ({
      vcpn,
      cost: parseFloat((Math.random() * 500 + 50).toFixed(2)),
      listPrice: parseFloat((Math.random() * 600 + 100).toFixed(2)),
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
      availability: ['In Stock', 'Limited', 'Backorder'][Math.floor(Math.random() * 3)]
    }));
  }

  /**
   * Call Keystone CheckPriceBulk API
   */
  private async callCheckPriceBulkApi(vcpns: string[]): Promise<PriceCheckResult[]> {
    const environment = this.getCurrentEnvironment();
    const apiToken = this.getApiToken();
    const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;

    if (!apiToken || !proxyUrl) {
      if (environment === 'production') {
        throw new Error('Missing required environment variables for Keystone API');
      }
      
      console.log('🔄 Falling back to mock price data in development mode');
      return this.generateMockPriceData(vcpns);
    }

    try {
      const endpoint = '/pricing/check-bulk';
      const fullUrl = `${proxyUrl}${endpoint}`;
      
      console.log(`🔄 Making CheckPriceBulk request to: ${fullUrl}`);
      console.log(`📋 Checking prices for ${vcpns.length} VCPNs: ${vcpns.join(', ')}`);
      
      const requestBody = {
        vcpns: vcpns,
        includeAvailability: true
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
      console.log(`✅ Successfully retrieved prices for ${data.length || 0} items from Keystone API`);
      
      return data;
      
    } catch (error) {
      console.error('❌ Failed to get prices from Keystone:', error);
      
      if (environment === 'production') {
        throw error;
      }
      
      console.log('🔄 Falling back to mock price data due to API error');
      return this.generateMockPriceData(vcpns);
    }
  }

  /**
   * Log price check to database
   */
  private async logPriceCheck(
    vcpns: string[], 
    success: boolean, 
    resultCount: number, 
    errorMessage?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('keystone_api_logs')
        .insert({
          endpoint: '/pricing/check-bulk',
          method: 'POST',
          request_data: { vcpns },
          success,
          response_data: success ? { resultCount } : null,
          error_message: errorMessage,
          environment: this.getCurrentEnvironment()
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging price check:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error logging price check:', error);
      return null;
    }
  }

  /**
   * Add to check history
   */
  private addToHistory(vcpns: string[], success: boolean, resultCount: number, errorMessage?: string): void {
    const historyItem: PriceCheckHistoryItem = {
      id: `pc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      vcpns: [...vcpns],
      success,
      resultCount,
      errorMessage
    };

    this.checkHistory.unshift(historyItem);
    
    // Keep only last 10 items
    if (this.checkHistory.length > 10) {
      this.checkHistory = this.checkHistory.slice(0, 10);
    }

    this.saveStatus();
  }

  /**
   * Main method to check prices for VCPNs
   */
  async checkPrices(request: PriceCheckRequest): Promise<PriceCheckResponse> {
    const requestId = request.requestId || `pc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    console.log(`🔍 Starting price check request: ${requestId}`);

    // Validate VCPNs
    const validation = this.validateVcpns(request.vcpns);
    if (!validation.valid) {
      const errorResponse: PriceCheckResponse = {
        success: false,
        message: validation.message!,
        results: [],
        requestId,
        timestamp
      };

      this.addToHistory(request.vcpns, false, 0, validation.message);
      return errorResponse;
    }

    // Check rate limiting
    this.updateRateLimitStatus();
    if (this.isRateLimited) {
      const timeRemaining = this.getTimeUntilNextCheck();
      const message = `Price check rate limited. Next check allowed in ${this.formatTimeRemaining(timeRemaining)}.`;
      
      console.log(`⏰ ${message}`);
      
      const rateLimitedResponse: PriceCheckResponse = {
        success: false,
        message,
        results: [],
        requestId,
        timestamp,
        isRateLimited: true,
        nextAllowedTime: this.nextAllowedTime!,
        rateLimitMessage: this.rateLimitMessage!
      };

      this.addToHistory(request.vcpns, false, 0, message);
      return rateLimitedResponse;
    }

    try {
      // Call Keystone API
      const priceResults = await this.callCheckPriceBulkApi(request.vcpns);
      
      // Set rate limit after successful call
      this.setRateLimit();
      
      // Update daily counter
      this.totalChecksToday++;
      
      // Log to database
      await this.logPriceCheck(request.vcpns, true, priceResults.length);
      
      // Add to history
      this.addToHistory(request.vcpns, true, priceResults.length);
      
      const successResponse: PriceCheckResponse = {
        success: true,
        message: `Successfully retrieved prices for ${priceResults.length} items`,
        results: priceResults,
        requestId,
        timestamp
      };

      console.log(`✅ Price check completed: ${priceResults.length} prices retrieved`);
      return successResponse;

    } catch (error) {
      console.error('❌ Price check failed:', error);
      
      // Log error to database
      await this.logPriceCheck(request.vcpns, false, 0, error.message);
      
      // Add to history
      this.addToHistory(request.vcpns, false, 0, error.message);
      
      const errorResponse: PriceCheckResponse = {
        success: false,
        message: `Price check failed: ${error.message}`,
        results: [],
        requestId,
        timestamp
      };

      return errorResponse;
    }
  }

  /**
   * Get current price check status
   */
  getStatus(): PriceCheckStatus {
    this.updateRateLimitStatus();
    
    return {
      isRateLimited: this.isRateLimited,
      lastCheckTime: this.lastCheckTime,
      nextAllowedTime: this.nextAllowedTime,
      rateLimitMessage: this.rateLimitMessage,
      totalChecksToday: this.totalChecksToday,
      remainingChecks: this.isRateLimited ? 0 : 1,
      checkHistory: [...this.checkHistory]
    };
  }

  /**
   * Clear rate limit (for testing purposes)
   */
  clearRateLimit(): void {
    this.isRateLimited = false;
    this.lastCheckTime = null;
    this.nextAllowedTime = null;
    this.rateLimitMessage = null;
    
    console.log('✅ Price check rate limit cleared');
    this.saveStatus();
  }

  /**
   * Reset daily counters (typically called at midnight)
   */
  resetDailyCounters(): void {
    this.totalChecksToday = 0;
    console.log('🔄 Daily price check counters reset');
    this.saveStatus();
  }

  /**
   * Save status to localStorage
   */
  private saveStatus(): void {
    try {
      const status = {
        isRateLimited: this.isRateLimited,
        lastCheckTime: this.lastCheckTime,
        nextAllowedTime: this.nextAllowedTime,
        rateLimitMessage: this.rateLimitMessage,
        totalChecksToday: this.totalChecksToday,
        checkHistory: this.checkHistory
      };
      
      localStorage.setItem(PriceCheckService.STORAGE_KEY, JSON.stringify(status));
    } catch (error) {
      console.warn('Failed to save price check status to localStorage:', error);
    }
  }

  /**
   * Load status from localStorage
   */
  private loadStatus(): void {
    try {
      const saved = localStorage.getItem(PriceCheckService.STORAGE_KEY);
      if (saved) {
        const status = JSON.parse(saved);
        
        this.isRateLimited = status.isRateLimited || false;
        this.lastCheckTime = status.lastCheckTime || null;
        this.nextAllowedTime = status.nextAllowedTime || null;
        this.rateLimitMessage = status.rateLimitMessage || null;
        this.totalChecksToday = status.totalChecksToday || 0;
        this.checkHistory = status.checkHistory || [];
        
        // Update rate limit status on load
        this.updateRateLimitStatus();
      }
    } catch (error) {
      console.warn('Failed to load price check status from localStorage:', error);
    }
  }
}

// Export both the class and singleton instance
export { PriceCheckService };
export const priceCheckService = new PriceCheckService();


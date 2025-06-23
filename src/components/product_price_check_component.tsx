import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

// Fixed Price Check Service with correct environment detection
class FixedPriceCheckService {
  private static readonly RATE_LIMIT_HOURS = 1; // 1 hour between checks
  private static readonly MAX_VCPNS_PER_REQUEST = 12;
  private static readonly STORAGE_KEY = 'price_check_status';
  
  private isRateLimited: boolean = false;
  private lastCheckTime: string | null = null;
  private nextAllowedTime: string | null = null;
  private rateLimitMessage: string | null = null;
  private totalChecksToday: number = 0;
  private checkHistory: any[] = [];

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
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    this.updateRateLimitStatus();
    
    return {
      isRateLimited: this.isRateLimited,
      lastCheckTime: this.lastCheckTime,
      nextAllowedTime: this.nextAllowedTime,
      rateLimitMessage: this.rateLimitMessage,
      totalChecksToday: this.totalChecksToday,
      remainingChecks: Math.max(0, 24 - this.totalChecksToday), // Assuming 24 checks per day max
      checkHistory: this.checkHistory.slice(-10) // Last 10 checks
    };
  }

  /**
   * Load status from localStorage
   */
  private loadStatus(): void {
    try {
      const stored = localStorage.getItem(FixedPriceCheckService.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.isRateLimited = data.isRateLimited || false;
        this.lastCheckTime = data.lastCheckTime || null;
        this.nextAllowedTime = data.nextAllowedTime || null;
        this.rateLimitMessage = data.rateLimitMessage || null;
        this.totalChecksToday = data.totalChecksToday || 0;
        this.checkHistory = data.checkHistory || [];
      }
    } catch (error) {
      console.error('Error loading price check status:', error);
    }
    
    this.updateRateLimitStatus();
  }

  /**
   * Save status to localStorage
   */
  private saveStatus(): void {
    try {
      const data = {
        isRateLimited: this.isRateLimited,
        lastCheckTime: this.lastCheckTime,
        nextAllowedTime: this.nextAllowedTime,
        rateLimitMessage: this.rateLimitMessage,
        totalChecksToday: this.totalChecksToday,
        checkHistory: this.checkHistory
      };
      localStorage.setItem(FixedPriceCheckService.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving price check status:', error);
    }
  }

  /**
   * Update rate limit status based on current time
   */
  private updateRateLimitStatus(): void {
    if (!this.nextAllowedTime) {
      this.isRateLimited = false;
      this.rateLimitMessage = null;
      this.saveStatus();
      return;
    }

    try {
      const nextTime = new Date(this.nextAllowedTime);
      const now = new Date();
      
      if (now >= nextTime) {
        this.isRateLimited = false;
        this.nextAllowedTime = null;
        this.rateLimitMessage = null;
        console.log('✅ Rate limit expired, price checking is now allowed');
      } else {
        this.isRateLimited = true;
        const remainingMs = nextTime.getTime() - now.getTime();
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        this.rateLimitMessage = `Rate limited. Next check allowed in ${this.formatTimeRemaining(remainingSeconds)}`;
      }
    } catch (error) {
      console.error('Error updating rate limit status:', error);
      this.isRateLimited = false;
      this.nextAllowedTime = null;
      this.rateLimitMessage = null;
    }
    
    this.saveStatus();
  }

  /**
   * FIXED: Get current environment from localStorage (same as cart shipping)
   */
  private getCurrentEnvironment(): string {
    try {
      const saved = localStorage.getItem('admin_environment');
      return saved || 'development';
    } catch (error) {
      console.error('Error loading environment from localStorage:', error);
      return 'development';
    }
  }

  /**
   * Get API token for current environment
   */
  private getApiToken(): string | null {
    const environment = this.getCurrentEnvironment();
    
    if (environment === 'production') {
      return import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD;
    } else {
      return import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_DEV;
    }
  }

  /**
   * Generate mock price data for development
   */
  private generateMockPriceData(vcpns: string[]): any[] {
    console.log('🧪 Generating mock price data for development mode');
    
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
   * Call Keystone pricing API with FIXED endpoint
   */
  private async callPricingApi(vcpns: string[]): Promise<any[]> {
    const environment = this.getCurrentEnvironment();
    
    // FIXED: Always use mock data in development mode
    if (environment === 'development') {
      console.log('🧪 Development mode detected - using mock price data');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      return this.generateMockPriceData(vcpns);
    }

    // Production mode - try real API
    const apiToken = this.getApiToken();
    const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;

    if (!apiToken || !proxyUrl) {
      throw new Error('Missing required environment variables for Keystone API');
    }

    try {
      // FIXED: Use the correct endpoint from the available endpoints list
      const endpoint = '/pricing/bulk';  // Changed from '/pricing/check-bulk'
      const fullUrl = `${proxyUrl}${endpoint}`;
      
      console.log(`🔄 Making pricing request to: ${fullUrl}`);
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
      throw error;
    }
  }

  /**
   * Add check to history (simplified - no database logging)
   */
  private addToHistory(vcpns: string[], success: boolean, resultCount: number, errorMessage?: string): void {
    const historyItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      vcpns: vcpns,
      success: success,
      resultCount: resultCount,
      errorMessage: errorMessage || null,
      environment: this.getCurrentEnvironment()
    };

    this.checkHistory.unshift(historyItem);
    
    // Keep only last 50 items
    if (this.checkHistory.length > 50) {
      this.checkHistory = this.checkHistory.slice(0, 50);
    }
    
    this.saveStatus();
  }

  /**
   * Set rate limit after successful check
   */
  private setRateLimit(): void {
    const now = new Date();
    const nextAllowed = new Date(now.getTime() + (FixedPriceCheckService.RATE_LIMIT_HOURS * 60 * 60 * 1000));
    
    this.isRateLimited = true;
    this.lastCheckTime = now.toISOString();
    this.nextAllowedTime = nextAllowed.toISOString();
    this.totalChecksToday += 1;
    
    const remainingSeconds = Math.ceil((nextAllowed.getTime() - now.getTime()) / 1000);
    this.rateLimitMessage = `Rate limited. Next check allowed in ${this.formatTimeRemaining(remainingSeconds)}`;
    
    console.log(`⏰ Rate limit set. Next check allowed at: ${nextAllowed.toLocaleString()}`);
    this.saveStatus();
  }

  /**
   * Clear rate limit (for admin/debug purposes)
   */
  clearRateLimit(): void {
    this.isRateLimited = false;
    this.nextAllowedTime = null;
    this.rateLimitMessage = null;
    this.saveStatus();
    console.log('✅ Rate limit cleared manually');
  }

  /**
   * Main method to check prices for VCPNs
   */
  async checkPrices(params: { vcpns: string[] }): Promise<any> {
    const { vcpns } = params;
    
    // Validate input
    if (!vcpns || vcpns.length === 0) {
      return {
        success: false,
        message: 'No VCPNs provided for price check',
        results: []
      };
    }

    if (vcpns.length > FixedPriceCheckService.MAX_VCPNS_PER_REQUEST) {
      return {
        success: false,
        message: `Too many VCPNs. Maximum ${FixedPriceCheckService.MAX_VCPNS_PER_REQUEST} allowed per request.`,
        results: []
      };
    }

    // Check rate limiting
    this.updateRateLimitStatus();
    if (this.isRateLimited) {
      const timeRemaining = this.getTimeUntilNextCheck();
      return {
        success: false,
        message: `Rate limited. Please wait ${this.formatTimeRemaining(timeRemaining)} before next check.`,
        results: []
      };
    }

    try {
      console.log(`🔄 Starting price check for ${vcpns.length} VCPNs in ${this.getCurrentEnvironment()} mode`);
      
      const results = await this.callPricingApi(vcpns);
      
      // Set rate limit after successful check (only in production)
      if (this.getCurrentEnvironment() === 'production') {
        this.setRateLimit();
      }
      
      // Add to history
      this.addToHistory(vcpns, true, results.length);
      
      console.log(`✅ Price check completed successfully. Retrieved ${results.length} results.`);
      
      return {
        success: true,
        message: `Successfully retrieved prices for ${results.length} items`,
        results: results.map(item => ({
          vcpn: item.vcpn,
          cost: item.cost,
          listPrice: item.listPrice,
          availability: item.availability,
          error: null
        }))
      };
      
    } catch (error) {
      console.error('❌ Price check failed:', error);
      
      // Add failed attempt to history
      this.addToHistory(vcpns, false, 0, error.message);
      
      return {
        success: false,
        message: error.message || 'Failed to check prices',
        results: []
      };
    }
  }
}

// Create singleton instance
const fixedPriceCheckService = new FixedPriceCheckService();

interface ProductPriceCheckProps {
  vcpn: string;
  listPrice?: number;
  productName?: string;
  className?: string;
  showComparison?: boolean;
  autoCheck?: boolean;
}

interface PriceResult {
  vcpn: string;
  cost: number;
  listPrice?: number;
  availability: string;
  lastUpdated: string;
  error?: string;
}

const ProductPriceCheck: React.FC<ProductPriceCheckProps> = ({
  vcpn,
  listPrice,
  productName,
  className = '',
  showComparison = true,
  autoCheck = false
}) => {
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [rateLimitStatus, setRateLimitStatus] = useState<any>(null);

  // Check rate limit status on component mount and periodically
  useEffect(() => {
    checkRateLimitStatus();
    const interval = setInterval(checkRateLimitStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto-check price on mount if enabled and not rate limited
  useEffect(() => {
    if (autoCheck && vcpn && !rateLimitStatus?.isRateLimited) {
      handlePriceCheck();
    }
  }, [autoCheck, vcpn, rateLimitStatus?.isRateLimited]);

  const checkRateLimitStatus = () => {
    try {
      const status = fixedPriceCheckService.getStatus();
      setRateLimitStatus(status);
    } catch (error) {
      console.error('Error checking rate limit status:', error);
    }
  };

  const handlePriceCheck = async () => {
    if (!vcpn) {
      setError('Product VCPN is required');
      return;
    }

    if (rateLimitStatus?.isRateLimited) {
      setError('Price check is currently rate limited. Please try again later.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fixedPriceCheckService.checkPrices({ vcpns: [vcpn] });
      
      if (result.success && result.results.length > 0) {
        const priceData = result.results[0];
        
        if (priceData.error) {
          setError(priceData.error);
          setPriceResult(null);
        } else {
          setPriceResult({
            vcpn: priceData.vcpn,
            cost: priceData.cost,
            listPrice: priceData.listPrice || listPrice,
            availability: priceData.availability || 'In Stock',
            lastUpdated: new Date().toISOString(),
            error: undefined
          });
          setLastChecked(new Date());
        }
      } else {
        setError(result.message || 'Failed to get price information');
        setPriceResult(null);
      }

      // Update rate limit status after check
      checkRateLimitStatus();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setPriceResult(null);
      checkRateLimitStatus();
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getAvailabilityBadge = (availability: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      'In Stock': { variant: 'default', className: 'bg-green-100 text-green-800 border-green-300' },
      'Limited': { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      'Backorder': { variant: 'outline', className: 'bg-red-100 text-red-800 border-red-300' }
    };
    
    const config = variants[availability] || variants['In Stock'];
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {availability}
      </Badge>
    );
  };

  // Calculate price comparison
  const priceComparison = priceResult && priceResult.listPrice && showComparison ? (() => {
    const current = priceResult.cost;
    const list = priceResult.listPrice;
    const diff = list - current;
    const percent = Math.round((diff / list) * 100);
    
    if (Math.abs(diff) < 0.01) {
      return { type: 'same' };
    } else if (diff > 0) {
      return {
        type: 'savings',
        amount: diff,
        percent: percent,
        icon: TrendingDown,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else {
      return {
        type: 'increase',
        amount: Math.abs(diff),
        percent: Math.abs(percent),
        icon: TrendingUp,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }
  })() : null;

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-lg">Current Pricing</h3>
            </div>
            {lastChecked && (
              <span className="text-xs text-muted-foreground">
                Updated {formatRelativeTime(lastChecked)}
              </span>
            )}
          </div>

          {/* Price Display */}
          {priceResult && !error && (
            <div className="space-y-3">
              {/* Current Price */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(priceResult.cost)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Availability</p>
                  {getAvailabilityBadge(priceResult.availability)}
                </div>
              </div>

              {/* Price Comparison */}
              {priceComparison && priceComparison.type !== 'same' && (
                <div className={`p-3 rounded-lg border ${priceComparison.bgColor} ${priceComparison.borderColor}`}>
                  <div className="flex items-center gap-2">
                    <priceComparison.icon className={`h-4 w-4 ${priceComparison.color}`} />
                    <div className="flex-1">
                      {priceComparison.type === 'savings' ? (
                        <div>
                          <p className={`font-medium ${priceComparison.color}`}>
                            Save {formatPrice(priceComparison.amount)} ({priceComparison.percent}% off)
                          </p>
                          <p className="text-sm text-muted-foreground">
                            List Price: <span className="line-through">{formatPrice(priceResult.listPrice!)}</span>
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className={`font-medium ${priceComparison.color}`}>
                            Price increased by {formatPrice(priceComparison.amount)} ({priceComparison.percent}%)
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Previous Price: {formatPrice(priceResult.listPrice!)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Product Info */}
              <div className="text-sm text-muted-foreground">
                <p><strong>VCPN:</strong> {priceResult.vcpn}</p>
                {productName && <p><strong>Product:</strong> {productName}</p>}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Rate Limit Warning */}
          {rateLimitStatus?.isRateLimited && (
            <Alert className="border-orange-200 bg-orange-50">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="flex items-center justify-between">
                  <span>Price checking is temporarily limited</span>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                    {rateLimitStatus.rateLimitMessage}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Button */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePriceCheck}
              disabled={isLoading || rateLimitStatus?.isRateLimited}
              className="flex items-center gap-2"
              variant={priceResult ? "outline" : "default"}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <DollarSign className="h-4 w-4" />
              )}
              {isLoading ? 'Checking Price...' : priceResult ? 'Refresh Price' : 'Get Current Price'}
            </Button>

            {priceResult && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Live pricing</span>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground">
            Prices are updated in real-time from our supplier. 
            {rateLimitStatus?.isRateLimited ? 
              ' Price checking is temporarily limited to prevent system overload.' :
              ' Click "Get Current Price" for the most up-to-date pricing.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductPriceCheck;


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
import { priceCheckService } from '@/services/price_check_service';

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
      const status = priceCheckService.getStatus();
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
      const result = await priceCheckService.checkPrices({ vcpns: [vcpn] });
      
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

      // Update rate limit status
      checkRateLimitStatus();

    } catch (error) {
      console.error('Price check error:', error);
      setError('Unable to check current pricing. Please try again later.');
      setPriceResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getPriceComparison = () => {
    if (!priceResult || !showComparison || !priceResult.listPrice) return null;

    const currentPrice = priceResult.cost;
    const originalPrice = priceResult.listPrice;
    const savings = originalPrice - currentPrice;
    const savingsPercent = Math.round((savings / originalPrice) * 100);

    if (savings > 0) {
      return {
        type: 'savings',
        amount: savings,
        percent: savingsPercent,
        icon: TrendingDown,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else if (savings < 0) {
      return {
        type: 'increase',
        amount: Math.abs(savings),
        percent: Math.abs(savingsPercent),
        icon: TrendingUp,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    } else {
      return {
        type: 'same',
        amount: 0,
        percent: 0,
        icon: Minus,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
    }
  };

  const getAvailabilityBadge = (availability: string) => {
    const availabilityMap: { [key: string]: { variant: string; className: string } } = {
      'In Stock': { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
      'Limited Stock': { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'Out of Stock': { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200' },
      'Backordered': { variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'Discontinued': { variant: 'outline', className: 'bg-gray-100 text-gray-800 border-gray-200' }
    };

    const config = availabilityMap[availability] || availabilityMap['In Stock'];
    return (
      <Badge variant={config.variant as any} className={config.className}>
        {availability}
      </Badge>
    );
  };

  const priceComparison = getPriceComparison();

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


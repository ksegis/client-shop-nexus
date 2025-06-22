import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Database, 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  RotateCcw,
  DollarSign,
  Search,
  Timer,
  TrendingUp,
  History,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  Activity,
  Home,
  MapPin,
  Building,
  Warehouse
} from 'lucide-react';
import { inventorySyncService } from '@/services/inventory_sync_service';
import { priceCheckService } from '@/services/price_check_service';
import { shippingQuoteService } from '@/services/shipping_quote_service';
import { dropshipOrderService } from '@/services/dropship_order_service';
import { orderTrackingService } from '@/services/order_tracking_service';

const AdminSettings = () => {
  // Existing state variables
  const [debugMode, setDebugMode] = useState(false);
  const [environment, setEnvironment] = useState('development');
  const [syncStatus, setSyncStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [deltaSyncSettings, setDeltaSyncSettings] = useState({
    enabled: true,
    intervalHours: 12
  });

  // Price check state variables
  const [priceCheckStatus, setPriceCheckStatus] = useState(null);
  const [priceCheckVcpns, setPriceCheckVcpns] = useState('');
  const [priceCheckResults, setPriceCheckResults] = useState([]);
  const [priceCheckLoading, setPriceCheckLoading] = useState(false);

  // Shipping quote state variables
  const [shippingQuoteStatus, setShippingQuoteStatus] = useState(null);
  const [shippingQuoteItems, setShippingQuoteItems] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    address1: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  const [shippingQuoteResults, setShippingQuoteResults] = useState([]);
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);

  // Dropship order state variables
  const [dropshipOrderStatus, setDropshipOrderStatus] = useState(null);
  const [dropshipOrderItems, setDropshipOrderItems] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [orderShippingAddress, setOrderShippingAddress] = useState({
    address1: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  const [orderDetails, setOrderDetails] = useState({
    specialInstructions: '',
    poNumber: '',
    shippingMethod: 'standard'
  });
  const [dropshipOrderResults, setDropshipOrderResults] = useState(null);
  const [dropshipOrderLoading, setDropshipOrderLoading] = useState(false);

  // Order tracking state variables
  const [orderTrackingStatus, setOrderTrackingStatus] = useState(null);
  const [trackingOrderRefs, setTrackingOrderRefs] = useState('');
  const [trackingResults, setTrackingResults] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingStatistics, setTrackingStatistics] = useState(null);

  // Load initial data
  useEffect(() => {
    loadDebugMode();
    loadEnvironment();
    loadDeltaSyncSettings();
    refreshStatus();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(refreshStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh status every 10 seconds when rate limited
  useEffect(() => {
    if (priceCheckStatus?.isRateLimited || shippingQuoteStatus?.isRateLimited || dropshipOrderStatus?.isRateLimited || orderTrackingStatus?.isRateLimited) {
      const interval = setInterval(() => {
        refreshPriceCheckStatus();
        refreshShippingQuoteStatus();
        refreshDropshipOrderStatus();
        refreshOrderTrackingStatus();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [priceCheckStatus?.isRateLimited, shippingQuoteStatus?.isRateLimited, dropshipOrderStatus?.isRateLimited, orderTrackingStatus?.isRateLimited]);

  const loadDebugMode = () => {
    try {
      const saved = localStorage.getItem('admin_debug_mode');
      setDebugMode(saved === 'true');
    } catch (error) {
      console.error('Error loading debug mode:', error);
    }
  };

  const loadEnvironment = () => {
    try {
      const saved = localStorage.getItem('admin_environment');
      setEnvironment(saved || 'development');
    } catch (error) {
      console.error('Error loading environment:', error);
    }
  };

  const loadDeltaSyncSettings = () => {
    try {
      const saved = localStorage.getItem('delta_sync_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        setDeltaSyncSettings(settings);
      }
    } catch (error) {
      console.error('Error loading delta sync settings:', error);
    }
  };

  const refreshStatus = async () => {
    try {
      const status = inventorySyncService.getSyncStatus();
      setSyncStatus(status);
      setLastRefresh(new Date());
      
      // Also refresh other service statuses
      refreshPriceCheckStatus();
      refreshShippingQuoteStatus();
      refreshDropshipOrderStatus();
      refreshOrderTrackingStatus();
    } catch (error) {
      console.error('Error refreshing status:', error);
    }
  };

  const refreshPriceCheckStatus = () => {
    try {
      const status = priceCheckService.getStatus();
      setPriceCheckStatus(status);
    } catch (error) {
      console.error('Error refreshing price check status:', error);
    }
  };

  const refreshShippingQuoteStatus = () => {
    try {
      const status = shippingQuoteService.getStatus();
      setShippingQuoteStatus(status);
    } catch (error) {
      console.error('Error refreshing shipping quote status:', error);
    }
  };

  const refreshDropshipOrderStatus = () => {
    try {
      const status = dropshipOrderService.getStatus();
      setDropshipOrderStatus(status);
    } catch (error) {
      console.error('Error refreshing dropship order status:', error);
    }
  };

  const refreshOrderTrackingStatus = () => {
    try {
      const status = orderTrackingService.getStatus();
      setOrderTrackingStatus(status);
      
      const stats = orderTrackingService.getTrackingStatistics();
      setTrackingStatistics(stats);
    } catch (error) {
      console.error('Error refreshing order tracking status:', error);
    }
  };

  const handleDebugToggle = (checked) => {
    setDebugMode(checked);
    try {
      localStorage.setItem('admin_debug_mode', checked.toString());
    } catch (error) {
      console.error('Error saving debug mode:', error);
    }
  };

  const handleEnvironmentChange = (newEnvironment) => {
    setEnvironment(newEnvironment);
    try {
      localStorage.setItem('admin_environment', newEnvironment);
      refreshStatus();
    } catch (error) {
      console.error('Error saving environment:', error);
    }
  };

  const handleDeltaSyncSettingsChange = (newSettings) => {
    setDeltaSyncSettings(newSettings);
    
    try {
      // Save to localStorage as fallback
      localStorage.setItem('delta_sync_settings', JSON.stringify(newSettings));
      
      // Try to update service if available
      if (inventorySyncService && typeof inventorySyncService.updateDeltaSyncSettings === 'function') {
        const success = inventorySyncService.updateDeltaSyncSettings(newSettings);
        if (success) {
          console.log('✅ Delta sync settings updated successfully');
          refreshStatus();
        } else {
          console.warn('⚠️ Failed to update delta sync settings in service, using localStorage fallback');
        }
      } else {
        console.warn('⚠️ Delta sync service method not available, using localStorage fallback');
      }
    } catch (error) {
      console.error('Error updating delta sync settings:', error);
    }
  };

  const handleTestSync = async () => {
    setIsLoading(true);
    try {
      const result = await inventorySyncService.performFullSync(10);
      console.log('Test sync result:', result);
      refreshStatus();
    } catch (error) {
      console.error('Test sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestDeltaSync = async () => {
    setIsLoading(true);
    try {
      const result = await inventorySyncService.performDeltaSync('delta_inventory');
      console.log('Test delta sync result:', result);
      refreshStatus();
    } catch (error) {
      console.error('Test delta sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestQuantityDelta = async () => {
    setIsLoading(true);
    try {
      const result = await inventorySyncService.performDeltaSync('delta_quantity');
      console.log('Test quantity delta result:', result);
      refreshStatus();
    } catch (error) {
      console.error('Test quantity delta failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle price check
  const handlePriceCheck = async () => {
    if (!priceCheckVcpns.trim()) {
      alert('Please enter at least one VCPN');
      return;
    }

    setPriceCheckLoading(true);
    setPriceCheckResults([]);

    try {
      // Parse VCPNs from textarea (split by newlines, commas, or spaces)
      const vcpns = priceCheckVcpns
        .split(/[\n,\s]+/)
        .map(vcpn => vcpn.trim())
        .filter(vcpn => vcpn.length > 0);

      if (vcpns.length === 0) {
        alert('Please enter valid VCPNs');
        return;
      }

      if (vcpns.length > 12) {
        alert('Maximum 12 VCPNs allowed per request');
        return;
      }

      const result = await priceCheckService.checkPrices({ vcpns });
      
      if (result.success) {
        setPriceCheckResults(result.results);
        console.log('Price check successful:', result);
      } else {
        console.error('Price check failed:', result.message);
        alert(`Price check failed: ${result.message}`);
      }

      // Refresh status to update rate limiting info
      refreshPriceCheckStatus();

    } catch (error) {
      console.error('Price check error:', error);
      alert(`Price check error: ${error.message}`);
    } finally {
      setPriceCheckLoading(false);
    }
  };

  // Clear price check rate limit (for testing)
  const handleClearPriceRateLimit = () => {
    priceCheckService.clearRateLimit();
    refreshPriceCheckStatus();
  };

  // Handle shipping quote
  const handleShippingQuote = async () => {
    if (!shippingQuoteItems.trim()) {
      alert('Please enter at least one item');
      return;
    }

    if (!shippingAddress.address1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      alert('Please fill in all required shipping address fields');
      return;
    }

    setShippingQuoteLoading(true);
    setShippingQuoteResults([]);

    try {
      // Parse items from textarea (format: VCPN:quantity)
      const items = shippingQuoteItems
        .split(/[\n,]+/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          const parts = line.split(':');
          if (parts.length !== 2) {
            throw new Error(`Invalid item format: ${line}. Use format: VCPN:quantity`);
          }
          return {
            vcpn: parts[0].trim(),
            quantity: parseInt(parts[1].trim())
          };
        });

      if (items.length === 0) {
        alert('Please enter valid items');
        return;
      }

      if (items.length > 50) {
        alert('Maximum 50 items allowed per request');
        return;
      }

      const result = await shippingQuoteService.getShippingQuotes({
        items,
        shippingAddress
      });
      
      if (result.success) {
        setShippingQuoteResults(result.shippingOptions);
        console.log('Shipping quote successful:', result);
      } else {
        console.error('Shipping quote failed:', result.message);
        alert(`Shipping quote failed: ${result.message}`);
      }

      // Refresh status to update rate limiting info
      refreshShippingQuoteStatus();

    } catch (error) {
      console.error('Shipping quote error:', error);
      alert(`Shipping quote error: ${error.message}`);
    } finally {
      setShippingQuoteLoading(false);
    }
  };

  // Clear shipping quote rate limit (for testing)
  const handleClearShippingRateLimit = () => {
    shippingQuoteService.clearRateLimit();
    refreshShippingQuoteStatus();
  };

  // Handle dropship order placement
  const handleDropshipOrder = async () => {
    // Validate required fields
    if (!dropshipOrderItems.trim()) {
      alert('Please enter at least one item');
      return;
    }

    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email) {
      alert('Please fill in customer first name, last name, and email');
      return;
    }

    if (!orderShippingAddress.address1 || !orderShippingAddress.city || !orderShippingAddress.state || !orderShippingAddress.zipCode) {
      alert('Please fill in all required shipping address fields');
      return;
    }

    setDropshipOrderLoading(true);
    setDropshipOrderResults(null);

    try {
      // Parse items from textarea (format: VCPN:quantity)
      const items = dropshipOrderItems
        .split(/[\n,]+/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          const parts = line.split(':');
          if (parts.length !== 2) {
            throw new Error(`Invalid item format: ${line}. Use format: VCPN:quantity`);
          }
          return {
            vcpn: parts[0].trim(),
            quantity: parseInt(parts[1].trim()),
            unitPrice: 25.99 // Default price for testing
          };
        });

      if (items.length === 0) {
        alert('Please enter valid items');
        return;
      }

      if (items.length > 100) {
        alert('Maximum 100 items allowed per order');
        return;
      }

      const orderRequest = {
        customerInfo,
        shippingAddress: orderShippingAddress,
        items,
        shippingMethod: orderDetails.shippingMethod,
        specialInstructions: orderDetails.specialInstructions,
        poNumber: orderDetails.poNumber
      };

      const result = await dropshipOrderService.placeDropshipOrder(orderRequest);
      
      if (result.success) {
        setDropshipOrderResults(result);
        console.log('Dropship order successful:', result);
        
        // Clear form on success
        setDropshipOrderItems('');
        setCustomerInfo({ firstName: '', lastName: '', email: '', phone: '' });
        setOrderShippingAddress({ address1: '', city: '', state: '', zipCode: '', country: 'US' });
        setOrderDetails({ specialInstructions: '', poNumber: '', shippingMethod: 'standard' });
      } else {
        console.error('Dropship order failed:', result.message);
        alert(`Order placement failed: ${result.message}`);
      }

      // Refresh status to update rate limiting info
      refreshDropshipOrderStatus();

    } catch (error) {
      console.error('Dropship order error:', error);
      alert(`Order placement error: ${error.message}`);
    } finally {
      setDropshipOrderLoading(false);
    }
  };

  // Clear dropship order rate limit (for testing)
  const handleClearDropshipRateLimit = () => {
    dropshipOrderService.clearRateLimit();
    refreshDropshipOrderStatus();
  };

  // Handle order tracking
  const handleOrderTracking = async () => {
    if (!trackingOrderRefs.trim()) {
      alert('Please enter at least one order reference');
      return;
    }

    setTrackingLoading(true);
    setTrackingResults([]);

    try {
      // Parse order references from textarea
      const orderReferences = trackingOrderRefs
        .split(/[\n,\s]+/)
        .map(ref => ref.trim())
        .filter(ref => ref.length > 0);

      if (orderReferences.length === 0) {
        alert('Please enter valid order references');
        return;
      }

      if (orderReferences.length > 20) {
        alert('Maximum 20 orders can be tracked per request');
        return;
      }

      const result = await orderTrackingService.trackOrders(orderReferences);
      
      if (result.success) {
        setTrackingResults(result.results);
        console.log('Order tracking successful:', result);
      } else {
        console.error('Order tracking failed:', result.message);
        alert(`Order tracking failed: ${result.message}`);
      }

      // Refresh status to update rate limiting info
      refreshOrderTrackingStatus();

    } catch (error) {
      console.error('Order tracking error:', error);
      alert(`Order tracking error: ${error.message}`);
    } finally {
      setTrackingLoading(false);
    }
  };

  // Clear order tracking rate limit (for testing)
  const handleClearTrackingRateLimit = () => {
    orderTrackingService.clearRateLimit();
    refreshOrderTrackingStatus();
  };

  // Safe formatting functions
  const safeFormatDate = (dateValue) => {
    if (!dateValue) return 'Never';
    try {
      return new Date(dateValue).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const safeFormatRelativeTime = (dateValue) => {
    if (!dateValue) return 'Never';
    try {
      const date = new Date(dateValue);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hours ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    } catch (error) {
      return 'Unknown';
    }
  };

  const safeFormatFutureTime = (dateValue) => {
    if (!dateValue) return 'Not scheduled';
    try {
      const date = new Date(dateValue);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      
      if (diffMs <= 0) return 'Now';
      
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 60) return `In ${diffMins} minutes`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `In ${diffHours} hours`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `In ${diffDays} days`;
    } catch (error) {
      return 'Unknown';
    }
  };

  const safeDisplayValue = (value, fallback = 'N/A') => {
    if (value === null || value === undefined || value === '') return fallback;
    return String(value);
  };

  const getEnvVar = (key) => {
    try {
      return import.meta.env?.[key] || null;
    } catch (error) {
      return null;
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'success': { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
      'failed': { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200' },
      'partial': { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'never': { variant: 'outline', className: 'bg-gray-100 text-gray-600 border-gray-200' },
      'running': { variant: 'default', className: 'bg-blue-100 text-blue-800 border-blue-200' }
    };
    
    const config = statusMap[status] || statusMap['never'];
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>;
  };

  const getTrackingStatusBadge = (status) => {
    const statusMap = {
      'Order Received': { className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'Processing': { className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'Shipped': { className: 'bg-purple-100 text-purple-800 border-purple-200' },
      'In Transit': { className: 'bg-orange-100 text-orange-800 border-orange-200' },
      'Out for Delivery': { className: 'bg-green-100 text-green-800 border-green-200' },
      'Delivered': { className: 'bg-green-100 text-green-800 border-green-200' },
      'Exception': { className: 'bg-red-100 text-red-800 border-red-200' },
      'Returned': { className: 'bg-gray-100 text-gray-800 border-gray-200' }
    };
    
    const config = statusMap[status] || { className: 'bg-gray-100 text-gray-600 border-gray-200' };
    return <Badge variant="outline" className={config.className}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Admin Settings</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDebugMode(!debugMode)}
          >
            {debugMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {debugMode ? 'Hide' : 'Show'} Debug
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Rate Limit Alert */}
      {(syncStatus?.isRateLimited || priceCheckStatus?.isRateLimited || shippingQuoteStatus?.isRateLimited || dropshipOrderStatus?.isRateLimited || orderTrackingStatus?.isRateLimited) && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>API Rate Limited</strong>
                <br />
                {syncStatus?.isRateLimited && (
                  <>
                    Inventory Sync: Rate limited on GetInventoryFull
                    <br />
                    <strong>Time remaining:</strong> {syncStatus.rateLimitTimeRemaining ? 
                      `${Math.floor(syncStatus.rateLimitTimeRemaining / 3600)}h ${Math.floor((syncStatus.rateLimitTimeRemaining % 3600) / 60)}m` : 
                      'Calculating...'}
                    <br />
                  </>
                )}
                {priceCheckStatus?.isRateLimited && (
                  <>
                    Price Check: {priceCheckStatus.rateLimitMessage}
                    <br />
                  </>
                )}
                {shippingQuoteStatus?.isRateLimited && (
                  <>
                    Shipping Quote: {shippingQuoteStatus.rateLimitMessage}
                    <br />
                  </>
                )}
                {dropshipOrderStatus?.isRateLimited && (
                  <>
                    Dropship Order: {dropshipOrderStatus.rateLimitMessage}
                    <br />
                  </>
                )}
                {orderTrackingStatus?.isRateLimited && (
                  <>
                    Order Tracking: {orderTrackingStatus.rateLimitMessage}
                    <br />
                  </>
                )}
              </div>
              <Badge variant="destructive">Rate Limited</Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Environment Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Environment Control
          </CardTitle>
          <CardDescription>
            Control which environment the system uses for API calls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Current Environment</Label>
            <p className="text-sm text-muted-foreground">
              {environment === 'development' ? 'Development (Test Data)' : 'Production (Live Data)'}
            </p>
            
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={environment === 'development'}
                  onCheckedChange={(checked) => handleEnvironmentChange(checked ? 'development' : 'production')}
                />
                <Label>Development</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={environment === 'production'}
                  onCheckedChange={(checked) => handleEnvironmentChange(checked ? 'production' : 'development')}
                />
                <Label>Production</Label>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant="outline" 
                className={environment === 'development' ? 
                  "bg-blue-50 text-blue-700 border-blue-200" : 
                  "bg-red-50 text-red-700 border-red-200"
                }
              >
                {environment === 'development' ? 'DEV' : 'PROD'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {environment === 'development' ? 'DEVELOPMENT' : 'PRODUCTION'} mode active
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground mt-1">
              Last changed: {safeFormatDate(lastRefresh)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delta Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Delta Sync Settings
          </CardTitle>
          <CardDescription>
            Configure automatic delta inventory synchronization for efficient updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Delta Sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync only changed inventory items at regular intervals
              </p>
            </div>
            <Switch
              checked={deltaSyncSettings.enabled}
              onCheckedChange={(checked) => 
                handleDeltaSyncSettingsChange({ ...deltaSyncSettings, enabled: checked })
              }
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium">Sync Interval</Label>
            <select
              value={deltaSyncSettings.intervalHours}
              onChange={(e) => 
                handleDeltaSyncSettingsChange({ 
                  ...deltaSyncSettings, 
                  intervalHours: parseInt(e.target.value) 
                })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value={6}>Every 6 hours (4x daily)</option>
              <option value={12}>Every 12 hours (Twice daily)</option>
              <option value={24}>Every 24 hours (Daily)</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Recommended: 12 hours for twice-daily updates
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={deltaSyncSettings.enabled ? "default" : "secondary"}
              className={deltaSyncSettings.enabled ? "bg-green-100 text-green-800 border-green-200" : ""}
            >
              {deltaSyncSettings.enabled ? "Enabled" : "Disabled"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Every {deltaSyncSettings.intervalHours} hours
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Price Check Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Real-Time Price Check
          </CardTitle>
          <CardDescription>
            Check current pricing for VCPNs using Keystone CheckPriceBulk API (1 check per hour)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price Check Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Price Check Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {priceCheckStatus?.isRateLimited ? (
                  <>
                    <Badge variant="destructive">Rate Limited</Badge>
                    <Timer className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">
                      {priceCheckStatus.rateLimitMessage}
                    </span>
                  </>
                ) : (
                  <>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      Available
                    </Badge>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Ready for price check</span>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Last Price Check</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {safeFormatRelativeTime(priceCheckStatus?.lastCheckTime)}
              </p>
            </div>
          </div>

          {/* VCPN Input */}
          <div>
            <Label className="text-sm font-medium">VCPNs to Check (max 12)</Label>
            <Textarea
              placeholder="Enter VCPNs separated by commas, spaces, or new lines&#10;Example:&#10;VCPN-001&#10;VCPN-002, VCPN-003&#10;VCPN-004 VCPN-005"
              value={priceCheckVcpns}
              onChange={(e) => setPriceCheckVcpns(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Price Check Button */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePriceCheck}
              disabled={priceCheckLoading || priceCheckStatus?.isRateLimited || !priceCheckVcpns.trim()}
              className="flex items-center gap-2"
            >
              {priceCheckLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {priceCheckLoading ? 'Checking Prices...' : 'Check Prices'}
            </Button>
            
            {debugMode && !priceCheckStatus?.isRateLimited && (
              <Button
                variant="outline"
                onClick={handleClearPriceRateLimit}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Clear Rate Limit
              </Button>
            )}
          </div>

          {/* Price Check Results */}
          {priceCheckResults.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Price Check Results</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {priceCheckResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{result.vcpn}</p>
                      {result.error ? (
                        <p className="text-sm text-red-600">{result.error}</p>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          <span>Cost: ${result.cost}</span>
                          {result.listPrice && <span> | List: ${result.listPrice}</span>}
                          {result.availability && <span> | {result.availability}</span>}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {result.error ? (
                        <Badge variant="destructive">Error</Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                          ${result.cost}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping Quote Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Quote Integration
          </CardTitle>
          <CardDescription>
            Get shipping quotes for multiple parts across warehouses (1 quote per 5 minutes)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Shipping Quote Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Shipping Quote Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {shippingQuoteStatus?.isRateLimited ? (
                  <>
                    <Badge variant="destructive">Rate Limited</Badge>
                    <Timer className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">
                      {shippingQuoteStatus.rateLimitMessage}
                    </span>
                  </>
                ) : (
                  <>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      Available
                    </Badge>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Ready for shipping quote</span>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Last Shipping Quote</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {safeFormatRelativeTime(shippingQuoteStatus?.lastQuoteTime)}
              </p>
            </div>
          </div>

          {/* Items Input */}
          <div>
            <Label className="text-sm font-medium">Items to Ship (max 50)</Label>
            <Textarea
              placeholder="Enter items in format VCPN:quantity, one per line&#10;Example:&#10;VCPN-001:2&#10;VCPN-002:1&#10;VCPN-003:5"
              value={shippingQuoteItems}
              onChange={(e) => setShippingQuoteItems(e.target.value)}
              className="mt-1"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter up to 50 items. Format: VCPN:quantity (one per line)
            </p>
          </div>

          {/* Shipping Address */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Address</Label>
              <Input
                placeholder="123 Main Street"
                value={shippingAddress.address1}
                onChange={(e) => setShippingAddress({...shippingAddress, address1: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">City</Label>
              <Input
                placeholder="Los Angeles"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">State</Label>
              <Input
                placeholder="CA"
                value={shippingAddress.state}
                onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">ZIP Code</Label>
              <Input
                placeholder="90210"
                value={shippingAddress.zipCode}
                onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                className="mt-1"
              />
            </div>
          </div>

          {/* Shipping Quote Button */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleShippingQuote}
              disabled={shippingQuoteLoading || shippingQuoteStatus?.isRateLimited || !shippingQuoteItems.trim() || !shippingAddress.address1}
              className="flex items-center gap-2"
            >
              {shippingQuoteLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              {shippingQuoteLoading ? 'Getting Quotes...' : 'Get Shipping Quotes'}
            </Button>
            
            {debugMode && !shippingQuoteStatus?.isRateLimited && (
              <Button
                variant="outline"
                onClick={handleClearShippingRateLimit}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Clear Rate Limit
              </Button>
            )}
          </div>

          {/* Shipping Quote Results */}
          {shippingQuoteResults.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Shipping Options</Label>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {shippingQuoteResults.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{option.carrierName} - {option.serviceName}</p>
                      <div className="text-sm text-muted-foreground">
                        <span>{option.estimatedDeliveryDays} days delivery</span>
                        <span> | From: {option.warehouseName}</span>
                        {option.trackingAvailable && <span> | Tracking available</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                        ${option.cost}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {option.estimatedDeliveryDate ? 
                          new Date(option.estimatedDeliveryDate).toLocaleDateString() : 
                          'Est. delivery'
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dropship Order Placement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Dropship Order Placement
          </CardTitle>
          <CardDescription>
            Place dropship orders directly with Keystone (1 order per 2 minutes)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dropship Order Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Order Placement Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {dropshipOrderStatus?.isRateLimited ? (
                  <>
                    <Badge variant="destructive">Rate Limited</Badge>
                    <Timer className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">
                      {dropshipOrderStatus.rateLimitMessage}
                    </span>
                  </>
                ) : (
                  <>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      Available
                    </Badge>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Ready to place order</span>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Last Order Placed</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {safeFormatRelativeTime(dropshipOrderStatus?.lastOrderTime)}
              </p>
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <Label className="text-sm font-medium">Customer Information</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Input
                  placeholder="First Name *"
                  value={customerInfo.firstName}
                  onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                />
              </div>
              <div>
                <Input
                  placeholder="Last Name *"
                  value={customerInfo.lastName}
                  onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                />
              </div>
              <div>
                <Input
                  placeholder="Email Address *"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                />
              </div>
              <div>
                <Input
                  placeholder="Phone Number"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <Label className="text-sm font-medium">Order Items (max 100)</Label>
            <Textarea
              placeholder="Enter items in format VCPN:quantity, one per line&#10;Example:&#10;WIDGET-001:2&#10;GADGET-002:1&#10;DEVICE-003:5"
              value={dropshipOrderItems}
              onChange={(e) => setDropshipOrderItems(e.target.value)}
              className="mt-1"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter up to 100 items. Format: VCPN:quantity (one per line)
            </p>
          </div>

          {/* Shipping Address */}
          <div>
            <Label className="text-sm font-medium">Shipping Address</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Input
                  placeholder="Address *"
                  value={orderShippingAddress.address1}
                  onChange={(e) => setOrderShippingAddress({...orderShippingAddress, address1: e.target.value})}
                />
              </div>
              <div>
                <Input
                  placeholder="City *"
                  value={orderShippingAddress.city}
                  onChange={(e) => setOrderShippingAddress({...orderShippingAddress, city: e.target.value})}
                />
              </div>
              <div>
                <Input
                  placeholder="State *"
                  value={orderShippingAddress.state}
                  onChange={(e) => setOrderShippingAddress({...orderShippingAddress, state: e.target.value})}
                />
              </div>
              <div>
                <Input
                  placeholder="ZIP Code *"
                  value={orderShippingAddress.zipCode}
                  onChange={(e) => setOrderShippingAddress({...orderShippingAddress, zipCode: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div>
            <Label className="text-sm font-medium">Order Details</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label className="text-xs text-muted-foreground">Shipping Method</Label>
                <select
                  value={orderDetails.shippingMethod}
                  onChange={(e) => setOrderDetails({...orderDetails, shippingMethod: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="standard">Standard Shipping</option>
                  <option value="expedited">Expedited Shipping</option>
                  <option value="overnight">Overnight Shipping</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">PO Number</Label>
                <Input
                  placeholder="Purchase Order Number"
                  value={orderDetails.poNumber}
                  onChange={(e) => setOrderDetails({...orderDetails, poNumber: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-2">
              <Label className="text-xs text-muted-foreground">Special Instructions</Label>
              <Textarea
                placeholder="Any special delivery instructions..."
                value={orderDetails.specialInstructions}
                onChange={(e) => setOrderDetails({...orderDetails, specialInstructions: e.target.value})}
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          {/* Place Order Button */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDropshipOrder}
              disabled={dropshipOrderLoading || dropshipOrderStatus?.isRateLimited || !dropshipOrderItems.trim() || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !orderShippingAddress.address1}
              className="flex items-center gap-2"
            >
              {dropshipOrderLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Package className="h-4 w-4" />
              )}
              {dropshipOrderLoading ? 'Placing Order...' : 'Place Dropship Order'}
            </Button>
            
            {debugMode && !dropshipOrderStatus?.isRateLimited && (
              <Button
                variant="outline"
                onClick={handleClearDropshipRateLimit}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Clear Rate Limit
              </Button>
            )}
          </div>

          {/* Order Results */}
          {dropshipOrderResults && (
            <div>
              <Label className="text-sm font-medium">Order Confirmation</Label>
              <div className="mt-2 p-4 border rounded-lg bg-green-50 border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Order Placed Successfully!</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Order Reference:</strong> {dropshipOrderResults.orderReference}</p>
                    <p><strong>Keystone Order ID:</strong> {dropshipOrderResults.keystoneOrderId || 'Pending'}</p>
                    <p><strong>Total Items:</strong> {dropshipOrderResults.totalItems}</p>
                  </div>
                  <div>
                    <p><strong>Total Value:</strong> ${dropshipOrderResults.totalValue?.toFixed(2) || 'Calculating...'}</p>
                    <p><strong>Est. Shipping:</strong> ${dropshipOrderResults.estimatedShipping?.toFixed(2) || 'TBD'}</p>
                    <p><strong>Est. Delivery:</strong> {dropshipOrderResults.estimatedDeliveryDate ? 
                      new Date(dropshipOrderResults.estimatedDeliveryDate).toLocaleDateString() : 'TBD'}</p>
                  </div>
                </div>
                
                {dropshipOrderResults.trackingInfo && (
                  <div className="mt-3 pt-3 border-t border-green-300">
                    <p className="text-sm"><strong>Tracking Number:</strong> {dropshipOrderResults.trackingInfo.trackingNumber}</p>
                    <p className="text-sm"><strong>Carrier:</strong> {dropshipOrderResults.trackingInfo.carrier}</p>
                    {dropshipOrderResults.trackingInfo.trackingUrl && (
                      <p className="text-sm">
                        <strong>Track Order:</strong> 
                        <a href={dropshipOrderResults.trackingInfo.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                          {dropshipOrderResults.trackingInfo.trackingUrl}
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order History */}
          {debugMode && dropshipOrderStatus?.orderHistory?.length > 0 && (
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Orders
              </Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {dropshipOrderStatus.orderHistory.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div>
                      <p className="font-medium">{item.orderReference}</p>
                      <p className="text-muted-foreground">
                        {safeFormatRelativeTime(item.timestamp)} • {item.itemCount} items
                        {item.keystoneOrderId && <span> • {item.keystoneOrderId}</span>}
                        {item.customerInfo && (
                          <span> • {item.customerInfo.firstName} {item.customerInfo.lastName}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.success ? "default" : "destructive"} className="text-xs">
                        {item.success ? 'Success' : 'Failed'}
                      </Badge>
                      {item.totalValue && (
                        <p className="text-xs text-muted-foreground mt-1">${item.totalValue.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Order Tracking
          </CardTitle>
          <CardDescription>
            Track order status and delivery information (1 tracking request per 3 minutes)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order Tracking Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Tracking Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {orderTrackingStatus?.isRateLimited ? (
                  <>
                    <Badge variant="destructive">Rate Limited</Badge>
                    <Timer className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">
                      {orderTrackingStatus.rateLimitMessage}
                    </span>
                  </>
                ) : (
                  <>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      Available
                    </Badge>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Ready to track orders</span>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Last Tracking Request</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {safeFormatRelativeTime(orderTrackingStatus?.lastTrackingTime)}
              </p>
            </div>
          </div>

          {/* Order References Input */}
          <div>
            <Label className="text-sm font-medium">Order References to Track (max 20)</Label>
            <Textarea
              placeholder="Enter order references separated by commas, spaces, or new lines&#10;Example:&#10;DO-1750623630250-A5CN01&#10;DO-1750623630251-B6DN02&#10;DO-1750623630252-C7EO03"
              value={trackingOrderRefs}
              onChange={(e) => setTrackingOrderRefs(e.target.value)}
              className="mt-1"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter up to 20 order references. Use order references from placed dropship orders.
            </p>
          </div>

          {/* Track Orders Button */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleOrderTracking}
              disabled={trackingLoading || orderTrackingStatus?.isRateLimited || !trackingOrderRefs.trim()}
              className="flex items-center gap-2"
            >
              {trackingLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {trackingLoading ? 'Tracking Orders...' : 'Track Orders'}
            </Button>
            
            {debugMode && !orderTrackingStatus?.isRateLimited && (
              <Button
                variant="outline"
                onClick={handleClearTrackingRateLimit}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Clear Rate Limit
              </Button>
            )}
          </div>

          {/* Tracking Results */}
          {trackingResults.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Tracking Results</Label>
              <div className="mt-2 space-y-4 max-h-96 overflow-y-auto">
                {trackingResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">{result.orderReference}</p>
                        <p className="text-sm text-muted-foreground">
                          {result.carrier} • {result.trackingNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        {getTrackingStatusBadge(result.status)}
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.currentLocation}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p><strong>Est. Delivery:</strong> {result.estimatedDeliveryDate ? 
                          new Date(result.estimatedDeliveryDate).toLocaleDateString() : 'TBD'}</p>
                        <p><strong>Last Updated:</strong> {safeFormatRelativeTime(result.lastUpdated)}</p>
                      </div>
                      <div>
                        {result.signatureRequired && (
                          <p><strong>Signature Required:</strong> Yes</p>
                        )}
                        {result.insuranceValue && (
                          <p><strong>Insurance:</strong> ${result.insuranceValue}</p>
                        )}
                        {result.deliveryInstructions && (
                          <p><strong>Instructions:</strong> {result.deliveryInstructions}</p>
                        )}
                      </div>
                    </div>

                    {/* Tracking Events */}
                    {result.events && result.events.length > 0 && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Tracking History</Label>
                        <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                          {result.events.map((event, eventIndex) => (
                            <div key={eventIndex} className="flex items-start gap-3 text-xs">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{event.status}</span>
                                  <span className="text-muted-foreground">
                                    {new Date(event.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-muted-foreground">{event.description}</p>
                                <p className="text-muted-foreground">{event.location}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracking Statistics */}
          {debugMode && trackingStatistics && (
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Tracking Statistics
              </Label>
              <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                <div className="p-3 border rounded">
                  <p className="font-medium">{trackingStatistics.totalRequests}</p>
                  <p className="text-muted-foreground">Total Requests</p>
                </div>
                <div className="p-3 border rounded">
                  <p className="font-medium">{trackingStatistics.totalOrdersTracked}</p>
                  <p className="text-muted-foreground">Orders Tracked</p>
                </div>
                <div className="p-3 border rounded">
                  <p className="font-medium">{trackingStatistics.successRate}%</p>
                  <p className="text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Tracking History */}
          {debugMode && orderTrackingStatus?.trackingHistory?.length > 0 && (
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Tracking Requests
              </Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {orderTrackingStatus.trackingHistory.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div>
                      <p className="font-medium">{item.orderReferences?.length || 0} orders tracked</p>
                      <p className="text-muted-foreground">
                        {safeFormatRelativeTime(item.timestamp)} • {item.environment}
                        {item.orderReferences && item.orderReferences.length > 0 && (
                          <span> • {item.orderReferences[0]}{item.orderReferences.length > 1 ? ` +${item.orderReferences.length - 1} more` : ''}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.success ? "default" : "destructive"} className="text-xs">
                        {item.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            API Status
          </CardTitle>
          <CardDescription>
            Current API availability and rate limiting status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-6">
            <div>
              <Label className="text-sm font-medium">Keystone API</Label>
              <div className="flex items-center gap-2 mt-1">
                {syncStatus?.isRateLimited ? (
                  <>
                    <Badge variant="destructive">Rate Limited</Badge>
                    <span className="text-sm text-muted-foreground">
                      ({syncStatus.rateLimitTimeRemaining ? 
                        `${Math.floor(syncStatus.rateLimitTimeRemaining / 3600)}h ${Math.floor((syncStatus.rateLimitTimeRemaining % 3600) / 60)}m remaining` : 
                        'Calculating...'})
                    </span>
                  </>
                ) : (
                  <>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      Available
                    </Badge>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Price Check API</Label>
              <div className="flex items-center gap-2 mt-1">
                {priceCheckStatus?.isRateLimited ? (
                  <>
                    <Badge variant="destructive">Rate Limited</Badge>
                    <span className="text-sm text-muted-foreground">
                      ({priceCheckService.formatTimeRemaining(priceCheckService.getTimeUntilNextCheck())} remaining)
                    </span>
                  </>
                ) : (
                  <>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      Available
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Shipping Quote API</Label>
              <div className="flex items-center gap-2 mt-1">
                {shippingQuoteStatus?.isRateLimited ? (
                  <>
                    <Badge variant="destructive">Rate Limited</Badge>
                    <span className="text-sm text-muted-foreground">
                      ({shippingQuoteService.formatTimeRemaining(shippingQuoteService.getTimeUntilNextQuote())} remaining)
                    </span>
                  </>
                ) : (
                  <>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      Available
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Dropship Order API</Label>
              <div className="flex items-center gap-2 mt-1">
                {dropshipOrderStatus?.isRateLimited ? (
                  <>
                    <Badge variant="destructive">Rate Limited</Badge>
                    <span className="text-sm text-muted-foreground">
                      ({dropshipOrderService.formatTimeRemaining(dropshipOrderService.getTimeUntilNextOrder())} remaining)
                    </span>
                  </>
                ) : (
                  <>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      Available
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Order Tracking API</Label>
              <div className="flex items-center gap-2 mt-1">
                {orderTrackingStatus?.isRateLimited ? (
                  <>
                    <Badge variant="destructive">Rate Limited</Badge>
                    <span className="text-sm text-muted-foreground">
                      ({orderTrackingService.formatTimeRemaining(orderTrackingService.getTimeUntilNextTracking())} remaining)
                    </span>
                  </>
                ) : (
                  <>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      Available
                    </Badge>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Supabase Database</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  Available
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Inventory Sync Status
          </CardTitle>
          <CardDescription>
            Monitor the status and health of your inventory synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <Label className="text-sm font-medium">Last Successful Sync</Label>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{safeFormatRelativeTime(syncStatus?.lastSyncTime)}</span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Next Planned Sync</Label>
              <div className="flex items-center gap-2 mt-1">
                {syncStatus?.isRateLimited ? (
                  <>
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-orange-600">Delayed (Rate Limited)</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Waiting for API availability</span>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Last Sync Result</Label>
              <div className="flex items-center gap-2 mt-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                {getStatusBadge(syncStatus?.lastSyncResult || 'never')}
              </div>
            </div>
          </div>

          {/* Delta Sync Status */}
          {deltaSyncSettings.enabled && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium mb-3">Delta Sync Status</h4>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm font-medium">Last Delta Sync</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <RotateCcw className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{safeFormatRelativeTime(syncStatus?.lastDeltaSyncTime)}</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Next Delta Sync</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Timer className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{safeFormatFutureTime(syncStatus?.nextDeltaSync)}</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Delta Sync Result</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(syncStatus?.lastDeltaSyncResult || 'never')}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-3">Sync Statistics</h4>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <Label className="text-sm font-medium">Total Items</Label>
                <p className="text-2xl font-bold mt-1">{safeDisplayValue(syncStatus?.syncedItems, '0')}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Synced Items</Label>
                <p className="text-2xl font-bold mt-1">{safeDisplayValue(syncStatus?.syncedItems, '0')}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Failed Items</Label>
                <p className="text-2xl font-bold mt-1">{safeDisplayValue(syncStatus?.failedItems, '0')}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Success Rate</Label>
                <p className="text-2xl font-bold mt-1">
                  {syncStatus?.syncedItems && syncStatus?.totalItems ? 
                    `${Math.round((syncStatus.syncedItems / syncStatus.totalItems) * 100)}%` : 
                    '0%'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Test and manage system operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Inventory Sync</Label>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleTestSync}
                  disabled={isLoading || syncStatus?.isRateLimited}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {syncStatus?.isRateLimited ? 'Test Sync (Rate Limited)' : 'Test Sync (10 items)'}
                </Button>
                
                {deltaSyncSettings.enabled && (
                  <>
                    <Button
                      onClick={handleTestDeltaSync}
                      disabled={isLoading || syncStatus?.isRateLimited}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <RotateCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      {syncStatus?.isRateLimited ? 'Test Delta Sync (Rate Limited)' : 'Test Delta Sync'}
                    </Button>
                    
                    <Button
                      onClick={handleTestQuantityDelta}
                      disabled={isLoading || syncStatus?.isRateLimited}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <TrendingUp className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      {syncStatus?.isRateLimited ? 'Test Quantity Delta (Rate Limited)' : 'Test Quantity Delta'}
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Navigation</Label>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => window.location.href = '/shop/admin/inventory-sync'}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Inventory Sync
                </Button>
                
                <Button
                  onClick={() => window.location.href = '/shop/admin'}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Information */}
      {debugMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Debug Information
            </CardTitle>
            <CardDescription>
              Detailed system information for troubleshooting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Environment Variables</Label>
                <div className="mt-2 space-y-1 text-xs font-mono bg-gray-50 p-3 rounded">
                  <p><strong>VITE_SUPABASE_URL:</strong> {getEnvVar('VITE_SUPABASE_URL') ? '✅ Set' : '❌ Missing'}</p>
                  <p><strong>VITE_SUPABASE_ANON_TOKEN:</strong> {getEnvVar('VITE_SUPABASE_ANON_TOKEN') ? '✅ Set' : '❌ Missing'}</p>
                  <p><strong>VITE_KEYSTONE_PROXY_URL:</strong> {getEnvVar('VITE_KEYSTONE_PROXY_URL') ? '✅ Set' : '❌ Missing'}</p>
                  <p><strong>VITE_KEYSTONE_SECURITY_TOKEN_DEV:</strong> {getEnvVar('VITE_KEYSTONE_SECURITY_TOKEN_DEV') ? '✅ Set' : '❌ Missing'}</p>
                  <p><strong>VITE_KEYSTONE_SECURITY_TOKEN_PROD:</strong> {getEnvVar('VITE_KEYSTONE_SECURITY_TOKEN_PROD') ? '✅ Set' : '❌ Missing'}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Current Settings</Label>
                <div className="mt-2 space-y-1 text-xs font-mono bg-gray-50 p-3 rounded">
                  <p><strong>Environment:</strong> {environment}</p>
                  <p><strong>Debug Mode:</strong> {debugMode ? 'Enabled' : 'Disabled'}</p>
                  <p><strong>Delta Sync Enabled:</strong> {deltaSyncSettings.enabled ? 'Yes' : 'No'}</p>
                  <p><strong>Delta Sync Interval:</strong> {deltaSyncSettings.intervalHours} hours</p>
                  <p><strong>Last Refresh:</strong> {safeFormatDate(lastRefresh)}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Service Status Details</Label>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="text-sm font-medium">Inventory Sync Status</p>
                    <div className="text-xs font-mono bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                      <pre>{JSON.stringify(syncStatus, null, 2)}</pre>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Price Check Status</p>
                    <div className="text-xs font-mono bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                      <pre>{JSON.stringify(priceCheckStatus, null, 2)}</pre>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Shipping Quote Status</p>
                    <div className="text-xs font-mono bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                      <pre>{JSON.stringify(shippingQuoteStatus, null, 2)}</pre>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Dropship Order Status</p>
                    <div className="text-xs font-mono bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                      <pre>{JSON.stringify(dropshipOrderStatus, null, 2)}</pre>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Order Tracking Status</p>
                    <div className="text-xs font-mono bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                      <pre>{JSON.stringify(orderTrackingStatus, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSettings;


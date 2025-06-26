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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Warehouse,
  Box
} from 'lucide-react';
import { inventorySyncService } from '@/services/inventory_sync_service';
import { priceCheckService } from '@/services/price_check_service';
import { shippingQuoteService } from '@/services/shipping_quote_service';
import { dropshipOrderService } from '@/services/dropship_order_service';
import { orderTrackingService } from '@/services/order_tracking_service';
import KitManagement from './kit_management_admin';

const AdminSettings = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('inventory');

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

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Tracking
          </TabsTrigger>
          <TabsTrigger value="kits" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            Kits
          </TabsTrigger>
        </TabsList>

        {/* Environment Control - Always visible */}
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

        {/* Tab Contents */}
        <TabsContent value="inventory" className="space-y-6">
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

          {/* Test Sync Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Test Sync Operations</CardTitle>
              <CardDescription>
                Test different sync operations with limited data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={handleTestSync}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                  Test Full Sync (10 items)
                </Button>
                
                <Button
                  onClick={handleTestDeltaSync}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Test Delta Sync
                </Button>
                
                <Button
                  onClick={handleTestQuantityDelta}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4" />
                  )}
                  Test Quantity Delta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          {/* Price Check Content - Add your existing price check content here */}
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
            <CardContent>
              <p className="text-muted-foreground">Price check functionality will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          {/* Shipping Quote Content - Add your existing shipping content here */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Quote Testing
              </CardTitle>
              <CardDescription>
                Test shipping quotes using Keystone GetShippingQuote API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Shipping quote functionality will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          {/* Dropship Orders Content - Add your existing orders content here */}
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
            <CardContent>
              <p className="text-muted-foreground">Dropship order functionality will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking">
          {/* Order Tracking Content - Add your existing tracking content here */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Order Tracking
              </CardTitle>
              <CardDescription>
                Track order status and delivery information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Order tracking functionality will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kits">
          {/* Kit Management Content */}
          <KitManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;


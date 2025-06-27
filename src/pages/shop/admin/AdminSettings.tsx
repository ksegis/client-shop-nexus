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
  Box,
  HardDrive,
  Cloud,
  Wifi,
  Download,
  Upload,
  FileText,
  Layers,
  GitBranch
} from 'lucide-react';
import { inventorySyncService } from '@/services/inventory_sync_service';
import { priceCheckService } from '@/services/price_check_service';
import { shippingQuoteService } from '@/services/shipping_quote_service';
import { dropshipOrderService } from '@/services/dropship_order_service';
import { orderTrackingService } from '@/services/order_tracking_service';
import { ftpSyncService } from '@/services/ftp_sync_service';
import { keystoneSyncController } from '@/services/keystone_sync_controller';
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

  // FTP Sync state variables (NEW)
  const [ftpSyncStatus, setFtpSyncStatus] = useState(null);
  const [ftpSyncLoading, setFtpSyncLoading] = useState(false);
  const [ftpSyncResults, setFtpSyncResults] = useState(null);
  const [syncRecommendations, setSyncRecommendations] = useState([]);
  const [syncMethodTest, setSyncMethodTest] = useState(null);
  const [selectedSyncType, setSelectedSyncType] = useState('inventory');
  const [syncStrategy, setSyncStrategy] = useState(null);
  const [rateLimitStatus, setRateLimitStatus] = useState(null);

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
    loadFtpSyncStatus(); // NEW
    loadSyncRecommendations(); // NEW
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshStatus();
      loadFtpSyncStatus(); // NEW
    }, 30000);
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

  // NEW FTP Sync Functions
  const loadFtpSyncStatus = async () => {
    try {
      const status = await ftpSyncService.getFTPSyncStatus();
      setFtpSyncStatus(status);
      
      // Update rate limit status
      const rateLimitInfo = keystoneSyncController.getRateLimitStatus();
      setRateLimitStatus(rateLimitInfo);
    } catch (error) {
      console.error('Error loading FTP sync status:', error);
      setFtpSyncStatus({ success: false, message: error.message });
    }
  };

  const loadSyncRecommendations = async () => {
    try {
      const recommendations = await keystoneSyncController.getSyncRecommendations();
      setSyncRecommendations(recommendations.recommendations || []);
    } catch (error) {
      console.error('Error loading sync recommendations:', error);
    }
  };

  const testSyncMethods = async () => {
    try {
      setFtpSyncLoading(true);
      const results = await keystoneSyncController.testSyncMethods();
      setSyncMethodTest(results);
    } catch (error) {
      console.error('Error testing sync methods:', error);
      setSyncMethodTest({ error: error.message });
    } finally {
      setFtpSyncLoading(false);
    }
  };

  const executeFtpSync = async (syncType = 'inventory', forceMethod = null) => {
    try {
      setFtpSyncLoading(true);
      setFtpSyncResults(null);

      // Determine sync conditions
      const conditions = {
        syncType,
        forceMethod,
        priority: 'normal',
        isRateLimited: rateLimitStatus?.isRateLimited
      };

      // Get strategy first
      const strategy = keystoneSyncController.determineSyncStrategy(conditions);
      setSyncStrategy(strategy);

      // Execute sync
      const result = await keystoneSyncController.executeSync(conditions, { syncType });
      setFtpSyncResults(result);

      // Refresh status after sync
      await loadFtpSyncStatus();
      await loadSyncRecommendations();

    } catch (error) {
      console.error('Error executing FTP sync:', error);
      setFtpSyncResults({
        success: false,
        message: error.message,
        errors: [error.message]
      });
    } finally {
      setFtpSyncLoading(false);
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

  // NEW FTP Sync Helper Functions
  const renderSyncStrategyBadge = (strategy) => {
    if (!strategy) return null;

    const methodColors = {
      ftp: 'bg-blue-100 text-blue-800',
      api: 'bg-green-100 text-green-800',
      hybrid: 'bg-purple-100 text-purple-800'
    };

    return (
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          {strategy.method === 'ftp' && <HardDrive className="h-4 w-4" />}
          {strategy.method === 'api' && <Cloud className="h-4 w-4" />}
          {strategy.method === 'hybrid' && <GitBranch className="h-4 w-4" />}
          <Badge className={methodColors[strategy.method]}>
            {strategy.method.toUpperCase()}
          </Badge>
        </div>
        <div className="text-sm text-gray-600">
          {strategy.reason}
        </div>
        <div className="text-xs text-gray-500 ml-auto">
          Est: {strategy.estimatedTime}
        </div>
      </div>
    );
  };

  const renderRateLimitStatus = () => {
    if (!rateLimitStatus) return null;

    if (rateLimitStatus.isRateLimited) {
      const timeRemaining = Math.ceil(rateLimitStatus.timeRemaining / 1000 / 60);
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>API Rate Limited</strong> - Reset in {timeRemaining} minutes. Use FTP sync instead.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          API is available for sync operations.
        </AlertDescription>
      </Alert>
    );
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

      {/* Tabs Navigation - UPDATED to include FTP Sync */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="ftp-sync" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            FTP Sync
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

        {/* NEW FTP Sync Tab */}
        <TabsContent value="ftp-sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                FTP Sync Management
              </CardTitle>
              <CardDescription>
                Intelligent sync routing between FTP and API methods based on conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Rate Limit Status */}
              {renderRateLimitStatus()}

              {/* Sync Recommendations */}
              {syncRecommendations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Sync Recommendations</h3>
                  {syncRecommendations.map((rec, index) => (
                    <Alert key={index} className={
                      rec.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                      rec.type === 'info' ? 'border-blue-200 bg-blue-50' :
                      'border-gray-200 bg-gray-50'
                    }>
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <div>
                            <strong>{rec.title}</strong> - {rec.message}
                          </div>
                          <Badge variant="outline">{rec.priority}</Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Sync Strategy Display */}
              {syncStrategy && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Current Sync Strategy</h3>
                  {renderSyncStrategyBadge(syncStrategy)}
                </div>
              )}

              {/* Quick Sync Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Database className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium">Inventory Sync</h3>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => executeFtpSync('inventory')}
                      disabled={ftpSyncLoading}
                      className="w-full"
                      size="sm"
                    >
                      {ftpSyncLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                      Smart Sync
                    </Button>
                    <Button 
                      onClick={() => executeFtpSync('inventory', 'ftp')}
                      disabled={ftpSyncLoading}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <HardDrive className="h-4 w-4 mr-2" />
                      Force FTP
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Package className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium">Kits Sync</h3>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => executeFtpSync('kits')}
                      disabled={ftpSyncLoading}
                      className="w-full"
                      size="sm"
                    >
                      {ftpSyncLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                      Smart Sync
                    </Button>
                    <Button 
                      onClick={() => executeFtpSync('kits', 'ftp')}
                      disabled={ftpSyncLoading}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <HardDrive className="h-4 w-4 mr-2" />
                      Force FTP
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <h3 className="font-medium">Pricing Sync</h3>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => executeFtpSync('pricing')}
                      disabled={ftpSyncLoading}
                      className="w-full"
                      size="sm"
                    >
                      {ftpSyncLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                      Smart Sync
                    </Button>
                    <Button 
                      onClick={() => executeFtpSync('pricing', 'ftp')}
                      disabled={ftpSyncLoading}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <HardDrive className="h-4 w-4 mr-2" />
                      Force FTP
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Full Sync Options */}
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <Layers className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium">Full Sync Operations</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button 
                    onClick={() => executeFtpSync('full')}
                    disabled={ftpSyncLoading}
                    variant="outline"
                    className="border-blue-300 hover:bg-blue-100"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Smart Full Sync
                  </Button>
                  <Button 
                    onClick={() => executeFtpSync('full', 'ftp')}
                    disabled={ftpSyncLoading}
                    variant="outline"
                    className="border-blue-300 hover:bg-blue-100"
                  >
                    <HardDrive className="h-4 w-4 mr-2" />
                    Force FTP Full Sync
                  </Button>
                </div>
              </Card>

              {/* Sync Method Testing */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Sync Method Testing</h3>
                  <Button 
                    onClick={testSyncMethods}
                    disabled={ftpSyncLoading}
                    variant="outline"
                    size="sm"
                  >
                    <Wifi className="h-4 w-4 mr-2" />
                    Test Methods
                  </Button>
                </div>
                
                {syncMethodTest && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <HardDrive className="h-4 w-4" />
                          <span className="font-medium">FTP Method</span>
                          <Badge variant={syncMethodTest.ftp.available ? "default" : "destructive"}>
                            {syncMethodTest.ftp.available ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{syncMethodTest.ftp.message}</p>
                        {syncMethodTest.ftp.responseTime > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Response time: {syncMethodTest.ftp.responseTime}ms
                          </p>
                        )}
                      </div>
                      
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Cloud className="h-4 w-4" />
                          <span className="font-medium">API Method</span>
                          <Badge variant={syncMethodTest.api.available ? "default" : "destructive"}>
                            {syncMethodTest.api.available ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{syncMethodTest.api.message}</p>
                        {syncMethodTest.api.responseTime > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Response time: {syncMethodTest.api.responseTime}ms
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertDescription className="text-blue-800">
                        <strong>Recommendation:</strong> {syncMethodTest.recommendation}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </Card>

              {/* Sync Results */}
              {ftpSyncResults && (
                <Card className="p-4">
                  <h3 className="font-medium mb-3">Last Sync Results</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {ftpSyncResults.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={ftpSyncResults.success ? "text-green-800" : "text-red-800"}>
                        {ftpSyncResults.message}
                      </span>
                      <Badge variant="outline" className="ml-auto">
                        {ftpSyncResults.method?.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {ftpSyncResults.success && (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">{ftpSyncResults.itemsProcessed}</div>
                          <div className="text-gray-600">Processed</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">{ftpSyncResults.itemsUpdated}</div>
                          <div className="text-gray-600">Updated</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">{ftpSyncResults.itemsAdded}</div>
                          <div className="text-gray-600">Added</div>
                        </div>
                      </div>
                    )}
                    
                    {ftpSyncResults.errors && ftpSyncResults.errors.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-red-800">Errors:</h4>
                        {ftpSyncResults.errors.slice(0, 5).map((error, index) => (
                          <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            {error}
                          </p>
                        ))}
                        {ftpSyncResults.errors.length > 5 && (
                          <p className="text-xs text-gray-500">
                            ... and {ftpSyncResults.errors.length - 5} more errors
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Duration: {ftpSyncResults.duration ? `${Math.round(ftpSyncResults.duration / 1000)}s` : 'N/A'} | 
                      Timestamp: {new Date(ftpSyncResults.timestamp).toLocaleString()}
                    </div>
                  </div>
                </Card>
              )}

              {/* FTP Status */}
              {ftpSyncStatus && (
                <Card className="p-4">
                  <h3 className="font-medium mb-3">FTP Service Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {ftpSyncStatus.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">{ftpSyncStatus.message}</span>
                    </div>
                    
                    {ftpSyncStatus.status && (
                      <div className="text-sm text-gray-600">
                        Status: {ftpSyncStatus.status}
                      </div>
                    )}
                    
                    {ftpSyncStatus.lastSync && (
                      <div className="text-sm text-gray-600">
                        Last sync: {new Date(ftpSyncStatus.lastSync).toLocaleString()}
                      </div>
                    )}
                    
                    {ftpSyncStatus.availableFiles && ftpSyncStatus.availableFiles.length > 0 && (
                      <div className="text-sm text-gray-600">
                        Available files: {ftpSyncStatus.availableFiles.join(', ')}
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXISTING Tab Contents - ALL PRESERVED */}
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
                    <Timer className="h-4 w-4" />
                  )}
                  Test Quantity Delta
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Test operations use limited data to avoid rate limiting. Use these to verify connectivity and functionality.
              </p>
            </CardContent>
          </Card>

          {/* Sync Status Display */}
          {syncStatus && (
            <Card>
              <CardHeader>
                <CardTitle>Current Sync Status</CardTitle>
                <CardDescription>
                  Real-time status of inventory synchronization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Last Full Sync</span>
                    </div>
                    <p className="text-lg font-semibold">{safeFormatRelativeTime(syncStatus.lastFullSync)}</p>
                    <p className="text-xs text-muted-foreground">{safeFormatDate(syncStatus.lastFullSync)}</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <RotateCcw className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Last Delta Sync</span>
                    </div>
                    <p className="text-lg font-semibold">{safeFormatRelativeTime(syncStatus.lastDeltaSync)}</p>
                    <p className="text-xs text-muted-foreground">{safeFormatDate(syncStatus.lastDeltaSync)}</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Next Scheduled</span>
                    </div>
                    <p className="text-lg font-semibold">{safeFormatFutureTime(syncStatus.nextScheduledSync)}</p>
                    <p className="text-xs text-muted-foreground">{safeFormatDate(syncStatus.nextScheduledSync)}</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(syncStatus.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {safeDisplayValue(syncStatus.statusMessage, 'No additional information')}
                    </p>
                  </div>
                </div>
                
                {syncStatus.isRateLimited && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Rate Limited:</strong> {syncStatus.rateLimitMessage}
                      <br />
                      <strong>Reset Time:</strong> {safeFormatDate(syncStatus.rateLimitResetTime)}
                    </AlertDescription>
                  </Alert>
                )}
                
                {debugMode && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Debug Information</h4>
                    <pre className="text-xs text-gray-600 overflow-auto">
                      {JSON.stringify(syncStatus, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          {/* Price Check Tool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Price Check Tool
              </CardTitle>
              <CardDescription>
                Check current pricing for specific VCPNs from Keystone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="price-check-vcpns" className="text-sm font-medium">
                  VCPNs to Check (max 12)
                </Label>
                <Textarea
                  id="price-check-vcpns"
                  placeholder="Enter VCPNs separated by newlines, commas, or spaces&#10;Example:&#10;VCPN123&#10;VCPN456&#10;VCPN789"
                  value={priceCheckVcpns}
                  onChange={(e) => setPriceCheckVcpns(e.target.value)}
                  className="mt-1"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter up to 12 VCPNs. Separate multiple VCPNs with newlines, commas, or spaces.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handlePriceCheck}
                  disabled={priceCheckLoading || priceCheckStatus?.isRateLimited}
                  className="flex items-center gap-2"
                >
                  {priceCheckLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Check Prices
                </Button>
                
                {priceCheckStatus?.isRateLimited && (
                  <Button
                    onClick={handleClearPriceRateLimit}
                    variant="outline"
                    size="sm"
                  >
                    Clear Rate Limit (Test)
                  </Button>
                )}
              </div>
              
              {priceCheckStatus?.isRateLimited && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Rate Limited:</strong> {priceCheckStatus.rateLimitMessage}
                  </AlertDescription>
                </Alert>
              )}
              
              {priceCheckResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Price Check Results</h4>
                  <div className="space-y-2">
                    {priceCheckResults.map((result, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{result.vcpn}</span>
                            {result.description && (
                              <p className="text-sm text-muted-foreground">{result.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            {result.success ? (
                              <>
                                <div className="text-lg font-semibold text-green-600">
                                  ${result.price?.toFixed(2) || 'N/A'}
                                </div>
                                {result.cost && (
                                  <div className="text-sm text-muted-foreground">
                                    Cost: ${result.cost.toFixed(2)}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-sm text-red-600">
                                {result.error || 'Price not available'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {debugMode && priceCheckStatus && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Price Check Debug Information</h4>
                  <pre className="text-xs text-gray-600 overflow-auto">
                    {JSON.stringify(priceCheckStatus, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-6">
          {/* Shipping Quote Tool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Quote Tool
              </CardTitle>
              <CardDescription>
                Get shipping quotes for items to specific addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shipping-items" className="text-sm font-medium">
                    Items to Ship (max 50)
                  </Label>
                  <Textarea
                    id="shipping-items"
                    placeholder="Enter items in format: VCPN:quantity&#10;Example:&#10;VCPN123:2&#10;VCPN456:1&#10;VCPN789:3"
                    value={shippingQuoteItems}
                    onChange={(e) => setShippingQuoteItems(e.target.value)}
                    className="mt-1"
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: VCPN:quantity (one per line)
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="shipping-address1" className="text-sm font-medium">
                      Shipping Address
                    </Label>
                    <Input
                      id="shipping-address1"
                      placeholder="Street Address"
                      value={shippingAddress.address1}
                      onChange={(e) => setShippingAddress({...shippingAddress, address1: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="City"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                    />
                    <Input
                      placeholder="State"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="ZIP Code"
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                    />
                    <select
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleShippingQuote}
                  disabled={shippingQuoteLoading || shippingQuoteStatus?.isRateLimited}
                  className="flex items-center gap-2"
                >
                  {shippingQuoteLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Truck className="h-4 w-4" />
                  )}
                  Get Shipping Quote
                </Button>
                
                {shippingQuoteStatus?.isRateLimited && (
                  <Button
                    onClick={handleClearShippingRateLimit}
                    variant="outline"
                    size="sm"
                  >
                    Clear Rate Limit (Test)
                  </Button>
                )}
              </div>
              
              {shippingQuoteStatus?.isRateLimited && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Rate Limited:</strong> {shippingQuoteStatus.rateLimitMessage}
                  </AlertDescription>
                </Alert>
              )}
              
              {shippingQuoteResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Shipping Options</h4>
                  <div className="space-y-2">
                    {shippingQuoteResults.map((option, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{option.carrier} - {option.service}</span>
                            <p className="text-sm text-muted-foreground">
                              Estimated delivery: {option.estimatedDelivery}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">
                              ${option.cost?.toFixed(2) || 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {option.transitTime}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          {/* Dropship Order Tool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Dropship Order Tool
              </CardTitle>
              <CardDescription>
                Place dropship orders directly through Keystone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dropship-items" className="text-sm font-medium">
                    Items to Order (max 100)
                  </Label>
                  <Textarea
                    id="dropship-items"
                    placeholder="Enter items in format: VCPN:quantity&#10;Example:&#10;VCPN123:2&#10;VCPN456:1&#10;VCPN789:3"
                    value={dropshipOrderItems}
                    onChange={(e) => setDropshipOrderItems(e.target.value)}
                    className="mt-1"
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: VCPN:quantity (one per line)
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Customer Information</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Input
                        placeholder="First Name *"
                        value={customerInfo.firstName}
                        onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                      />
                      <Input
                        placeholder="Last Name *"
                        value={customerInfo.lastName}
                        onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <Input
                        placeholder="Email *"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      />
                      <Input
                        placeholder="Phone"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Shipping Address</Label>
                    <div className="space-y-2 mt-1">
                      <Input
                        placeholder="Street Address *"
                        value={orderShippingAddress.address1}
                        onChange={(e) => setOrderShippingAddress({...orderShippingAddress, address1: e.target.value})}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="City *"
                          value={orderShippingAddress.city}
                          onChange={(e) => setOrderShippingAddress({...orderShippingAddress, city: e.target.value})}
                        />
                        <Input
                          placeholder="State *"
                          value={orderShippingAddress.state}
                          onChange={(e) => setOrderShippingAddress({...orderShippingAddress, state: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="ZIP Code *"
                          value={orderShippingAddress.zipCode}
                          onChange={(e) => setOrderShippingAddress({...orderShippingAddress, zipCode: e.target.value})}
                        />
                        <select
                          value={orderShippingAddress.country}
                          onChange={(e) => setOrderShippingAddress({...orderShippingAddress, country: e.target.value})}
                          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="shipping-method" className="text-sm font-medium">
                    Shipping Method
                  </Label>
                  <select
                    id="shipping-method"
                    value={orderDetails.shippingMethod}
                    onChange={(e) => setOrderDetails({...orderDetails, shippingMethod: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="standard">Standard</option>
                    <option value="expedited">Expedited</option>
                    <option value="overnight">Overnight</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="po-number" className="text-sm font-medium">
                    PO Number
                  </Label>
                  <Input
                    id="po-number"
                    placeholder="Optional"
                    value={orderDetails.poNumber}
                    onChange={(e) => setOrderDetails({...orderDetails, poNumber: e.target.value})}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="special-instructions" className="text-sm font-medium">
                    Special Instructions
                  </Label>
                  <Input
                    id="special-instructions"
                    placeholder="Optional"
                    value={orderDetails.specialInstructions}
                    onChange={(e) => setOrderDetails({...orderDetails, specialInstructions: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleDropshipOrder}
                  disabled={dropshipOrderLoading || dropshipOrderStatus?.isRateLimited}
                  className="flex items-center gap-2"
                >
                  {dropshipOrderLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  Place Dropship Order
                </Button>
                
                {dropshipOrderStatus?.isRateLimited && (
                  <Button
                    onClick={handleClearDropshipRateLimit}
                    variant="outline"
                    size="sm"
                  >
                    Clear Rate Limit (Test)
                  </Button>
                )}
              </div>
              
              {dropshipOrderStatus?.isRateLimited && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Rate Limited:</strong> {dropshipOrderStatus.rateLimitMessage}
                  </AlertDescription>
                </Alert>
              )}
              
              {dropshipOrderResults && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Order Results</h4>
                  <div className="p-4 border rounded-lg">
                    {dropshipOrderResults.success ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-800">Order Placed Successfully</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p><strong>Order Reference:</strong> {dropshipOrderResults.orderReference}</p>
                          <p><strong>Total Amount:</strong> ${dropshipOrderResults.totalAmount?.toFixed(2)}</p>
                          <p><strong>Estimated Delivery:</strong> {dropshipOrderResults.estimatedDelivery}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="font-medium text-red-800">Order Failed</span>
                        </div>
                        <div className="text-sm text-red-600">
                          <p>{dropshipOrderResults.message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          {/* Order Tracking Tool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Order Tracking Tool
              </CardTitle>
              <CardDescription>
                Track order status and delivery information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tracking-orders" className="text-sm font-medium">
                  Order References to Track (max 20)
                </Label>
                <Textarea
                  id="tracking-orders"
                  placeholder="Enter order references separated by newlines, commas, or spaces&#10;Example:&#10;ORD-2024-001&#10;ORD-2024-002&#10;ORD-2024-003"
                  value={trackingOrderRefs}
                  onChange={(e) => setTrackingOrderRefs(e.target.value)}
                  className="mt-1"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter up to 20 order references. Separate multiple references with newlines, commas, or spaces.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleOrderTracking}
                  disabled={trackingLoading || orderTrackingStatus?.isRateLimited}
                  className="flex items-center gap-2"
                >
                  {trackingLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Track Orders
                </Button>
                
                {orderTrackingStatus?.isRateLimited && (
                  <Button
                    onClick={handleClearTrackingRateLimit}
                    variant="outline"
                    size="sm"
                  >
                    Clear Rate Limit (Test)
                  </Button>
                )}
              </div>
              
              {orderTrackingStatus?.isRateLimited && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Rate Limited:</strong> {orderTrackingStatus.rateLimitMessage}
                  </AlertDescription>
                </Alert>
              )}
              
              {trackingResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Tracking Results</h4>
                  <div className="space-y-3">
                    {trackingResults.map((result, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{result.orderReference}</span>
                          {getTrackingStatusBadge(result.status)}
                        </div>
                        
                        {result.success ? (
                          <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p><strong>Carrier:</strong> {result.carrier}</p>
                                <p><strong>Tracking Number:</strong> {result.trackingNumber}</p>
                                <p><strong>Service:</strong> {result.service}</p>
                              </div>
                              <div>
                                <p><strong>Ship Date:</strong> {safeFormatDate(result.shipDate)}</p>
                                <p><strong>Estimated Delivery:</strong> {safeFormatDate(result.estimatedDelivery)}</p>
                                <p><strong>Last Update:</strong> {safeFormatDate(result.lastUpdate)}</p>
                              </div>
                            </div>
                            
                            {result.trackingEvents && result.trackingEvents.length > 0 && (
                              <div className="mt-3">
                                <h5 className="font-medium mb-2">Tracking Events</h5>
                                <div className="space-y-1">
                                  {result.trackingEvents.slice(0, 3).map((event, eventIndex) => (
                                    <div key={eventIndex} className="text-xs p-2 bg-gray-50 rounded">
                                      <div className="flex justify-between">
                                        <span>{event.description}</span>
                                        <span>{safeFormatDate(event.timestamp)}</span>
                                      </div>
                                      {event.location && (
                                        <div className="text-gray-500 mt-1">{event.location}</div>
                                      )}
                                    </div>
                                  ))}
                                  {result.trackingEvents.length > 3 && (
                                    <p className="text-xs text-gray-500">
                                      ... and {result.trackingEvents.length - 3} more events
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-red-600">
                            {result.error || 'Tracking information not available'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {trackingStatistics && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Tracking Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-lg font-semibold">{trackingStatistics.totalOrders}</div>
                      <div className="text-xs text-muted-foreground">Total Orders</div>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-lg font-semibold text-green-600">{trackingStatistics.delivered}</div>
                      <div className="text-xs text-muted-foreground">Delivered</div>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-lg font-semibold text-blue-600">{trackingStatistics.inTransit}</div>
                      <div className="text-xs text-muted-foreground">In Transit</div>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-lg font-semibold text-red-600">{trackingStatistics.exceptions}</div>
                      <div className="text-xs text-muted-foreground">Exceptions</div>
                    </div>
                  </div>
                </div>
              )}
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


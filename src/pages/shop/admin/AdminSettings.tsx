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
  Users,
  Globe,
  Shield,
  Wifi,
  WifiOff,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Monitor,
  Calendar,
  FileText,
  Download,
  Upload,
  Link,
  ExternalLink,
  Home,
  ArrowRight,
  Info,
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  X,
  Check,
  Copy,
  Share,
  Star,
  Heart,
  Bookmark,
  Flag,
  Tag,
  Filter,
  Sort,
  Grid,
  List,
  Map,
  Navigation,
  Compass,
  Target,
  Crosshair,
  Focus,
  Maximize,
  Minimize,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Move,
  MousePointer,
  Hand,
  Grab,
  ZoomIn,
  ZoomOut,
  Scan,
  QrCode,
  Barcode,
  Camera,
  Video,
  Mic,
  MicOff,
  Volume,
  VolumeOff,
  Play,
  Pause,
  Stop,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
  Repeat,
  Shuffle,
  Music,
  Headphones,
  Radio,
  Tv,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Watch,
  Gamepad2,
  Joystick,
  Keyboard,
  Mouse,
  Printer,
  Scanner,
  Fax,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneForwarded,
  Voicemail,
  MessageSquare,
  MessageCircle,
  Mail,
  MailOpen,
  Send,
  Inbox,
  Outbox,
  Archive,
  Trash,
  Spam,
  Reply,
  ReplyAll,
  Forward,
  AtSign,
  Hash,
  Percent,
  Equal,
  NotEqual,
  Asterisk,
  Slash,
  Backslash,
  Pipe,
  Ampersand,
  Quote,
  Apostrophe,
  Semicolon,
  Colon,
  Comma,
  Period,
  Question,
  Exclamation,
  Tilde,
  Grave,
  Caret,
  Underscore,
  Hyphen,
  Space,
  Tab,
  Enter,
  Escape,
  Delete,
  Backspace,
  Insert,
  End,
  PageUp,
  PageDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUp,
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  TriangleUp,
  TriangleDown,
  TriangleLeft,
  TriangleRight,
  Square,
  Circle,
  Triangle,
  Diamond,
  Pentagon,
  Hexagon,
  Octagon,
  Spade,
  Club,
  Clubs,
  Diamonds,
  Hearts,
  Spades,
  MapPin,
  Building,
  Warehouse
} from 'lucide-react';
import { inventorySyncService } from '@/services/inventory_sync_service';
import { priceCheckService } from '@/services/price_check_service';
import { shippingQuoteService } from '@/services/shipping_quote_service';

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
  const [showShippingHistory, setShowShippingHistory] = useState(false);

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
    if (priceCheckStatus?.isRateLimited || shippingQuoteStatus?.isRateLimited) {
      const interval = setInterval(() => {
        refreshPriceCheckStatus();
        refreshShippingQuoteStatus();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [priceCheckStatus?.isRateLimited, shippingQuoteStatus?.isRateLimited]);

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
      {(syncStatus?.isRateLimited || priceCheckStatus?.isRateLimited || shippingQuoteStatus?.isRateLimited) && (
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

          {/* Shipping Quote History */}
          {debugMode && shippingQuoteStatus?.quoteHistory?.length > 0 && (
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Shipping Quotes
              </Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {shippingQuoteStatus.quoteHistory.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div>
                      <p className="font-medium">{safeFormatRelativeTime(item.timestamp)}</p>
                      <p className="text-muted-foreground">
                        {item.itemCount} items • {item.success ? `${item.optionCount} options` : 'Failed'}
                        {item.shippingAddress && (
                          <span> • {item.shippingAddress.city}, {item.shippingAddress.state}</span>
                        )}
                      </p>
                    </div>
                    <Badge variant={item.success ? "default" : "destructive"} className="text-xs">
                      {item.success ? 'Success' : 'Failed'}
                    </Badge>
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
          <div className="grid grid-cols-4 gap-6">
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


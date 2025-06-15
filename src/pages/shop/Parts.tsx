// Enhanced Parts.tsx with Comprehensive Error Handling and Rate Limiting
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Package, ShoppingCart, Search, Plus, Filter, Grid, List, Star, Heart, Eye, Truck, Wrench, Settings, BarChart3, TrendingUp, Package2, Clock, CheckCircle, XCircle, AlertTriangle, FileText, Download, RefreshCw, Zap, Timer, Wifi, WifiOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

// Import enhanced Keystone service and UI components
import KeystoneService, { InventoryItem, PricingInfo, KeystoneResponse, RateLimitInfo, ErrorInfo } from "./enhanced_keystone_service_with_rate_limiting";
import { 
  RateLimitStatus, 
  ConnectionStatus, 
  ErrorDisplay, 
  RetryCountdown, 
  LoadingState, 
  ApiStatusIndicator, 
  ErrorBoundary,
  useKeystoneStatus 
} from "./keystone_ui_components";

// Enhanced interfaces for Keystone integration
interface EnhancedPart extends InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  cost?: number;
  reorder_level?: number;
  supplier?: string;
  location?: string;
  weight?: number;
  dimensions?: string;
  warranty?: string;
  brand?: string;
  compatibility?: string[];
  features?: string[];
  images?: string[];
  rating?: number;
  reviews?: number;
  inStock: boolean;
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
  pricing?: PricingInfo;
}

// Mock data for fallback when Keystone is not available
const mockParts: EnhancedPart[] = [
  {
    id: "1",
    sku: "ENG-001",
    partNumber: "ENG-001",
    name: "Heavy Duty Engine Oil Filter",
    description: "Premium high-performance oil filter designed for diesel engines. Features advanced filtration technology with 99.5% efficiency rating. Compatible with Caterpillar, Cummins, and Detroit Diesel engines.",
    category: "Engine",
    subcategory: "Filters",
    price: 24.99,
    cost: 15.00,
    quantity: 50,
    reorder_level: 10,
    supplier: "ACME Parts",
    location: "A1-B2",
    weight: 2.5,
    dimensions: "6x4x4 inches",
    warranty: "12 months",
    brand: "FilterPro",
    compatibility: ["CAT 3406", "Cummins ISX", "Detroit DD15"],
    features: ["99.5% Efficiency", "Heavy Duty", "OEM Quality"],
    images: ["/api/placeholder/300/300"],
    rating: 4.8,
    reviews: 127,
    inStock: true,
    featured: true,
    warehouse: "Main",
    lastUpdated: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    sku: "BRK-002",
    partNumber: "BRK-002",
    name: "Ceramic Brake Pads Set",
    description: "High-performance ceramic brake pads for commercial vehicles. Low dust formula with excellent stopping power and extended wear life.",
    category: "Brakes",
    subcategory: "Brake Pads",
    price: 89.99,
    cost: 55.00,
    quantity: 25,
    reorder_level: 5,
    supplier: "BrakeTech",
    location: "B2-C3",
    weight: 8.5,
    dimensions: "12x8x2 inches",
    warranty: "24 months",
    brand: "CeramicPro",
    compatibility: ["Freightliner Cascadia", "Volvo VNL", "Peterbilt 579"],
    features: ["Low Dust", "High Performance", "Extended Life"],
    images: ["/api/placeholder/300/300"],
    rating: 4.5,
    reviews: 89,
    inStock: true,
    featured: false,
    warehouse: "Main",
    lastUpdated: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    sku: "TRN-003",
    partNumber: "TRN-003",
    name: "Automatic Transmission Filter Kit",
    description: "Complete transmission service kit including filter, gasket, and fluid. Designed for Allison 1000/2000 series transmissions.",
    category: "Transmission",
    subcategory: "Filters",
    price: 156.99,
    cost: 95.00,
    quantity: 15,
    reorder_level: 3,
    supplier: "TransParts",
    location: "C3-D4",
    weight: 12.0,
    dimensions: "14x10x6 inches",
    warranty: "18 months",
    brand: "AllTrans",
    compatibility: ["Allison 1000", "Allison 2000", "Allison 2400"],
    features: ["Complete Kit", "OEM Spec", "Professional Grade"],
    images: ["/api/placeholder/300/300"],
    rating: 4.9,
    reviews: 203,
    inStock: true,
    featured: true,
    warehouse: "Main",
    lastUpdated: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    sku: "ELC-004",
    partNumber: "ELC-004",
    name: "LED Headlight Assembly",
    description: "High-intensity LED headlight assembly with integrated DRL. DOT approved for commercial vehicles with enhanced visibility and energy efficiency.",
    category: "Electrical",
    subcategory: "Lighting",
    price: 299.99,
    cost: 180.00,
    quantity: 8,
    reorder_level: 2,
    supplier: "LightTech",
    location: "D4-E5",
    weight: 5.5,
    dimensions: "16x12x8 inches",
    warranty: "36 months",
    brand: "BrightLED",
    compatibility: ["Kenworth T680", "Peterbilt 389", "Mack Anthem"],
    features: ["LED Technology", "DOT Approved", "Energy Efficient"],
    images: ["/api/placeholder/300/300"],
    rating: 4.7,
    reviews: 156,
    inStock: true,
    featured: false,
    warehouse: "Main",
    lastUpdated: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    sku: "SUS-005",
    partNumber: "SUS-005",
    name: "Air Suspension Bellows",
    description: "Heavy-duty air suspension bellows for commercial truck applications. Reinforced rubber construction with steel end caps.",
    category: "Suspension",
    subcategory: "Air Springs",
    price: 189.99,
    cost: 115.00,
    quantity: 12,
    reorder_level: 4,
    supplier: "SuspensionPro",
    location: "E5-F6",
    weight: 15.0,
    dimensions: "18x8x8 inches",
    warranty: "24 months",
    brand: "AirRide",
    compatibility: ["Freightliner Columbia", "International ProStar", "Volvo VN"],
    features: ["Heavy Duty", "Reinforced", "OEM Quality"],
    images: ["/api/placeholder/300/300"],
    rating: 4.6,
    reviews: 94,
    inStock: false,
    featured: false,
    warehouse: "Main",
    lastUpdated: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "6",
    sku: "CLG-006",
    partNumber: "CLG-006",
    name: "Radiator Coolant System",
    description: "Complete radiator assembly with integrated cooling system. Aluminum core construction with plastic tanks for optimal heat dissipation.",
    category: "Cooling",
    subcategory: "Radiators",
    price: 445.99,
    cost: 270.00,
    quantity: 6,
    reorder_level: 2,
    supplier: "CoolTech",
    location: "F6-G7",
    weight: 35.0,
    dimensions: "32x24x4 inches",
    warranty: "24 months",
    brand: "CoolMax",
    compatibility: ["Caterpillar C15", "Cummins ISX15", "Detroit DD16"],
    features: ["Aluminum Core", "High Efficiency", "OEM Replacement"],
    images: ["/api/placeholder/300/300"],
    rating: 4.8,
    reviews: 78,
    inStock: true,
    featured: true,
    warehouse: "Main",
    lastUpdated: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

// Enhanced Parts component with comprehensive error handling
const Parts: React.FC = () => {
  // State management
  const [parts, setParts] = useState<EnhancedPart[]>([]);
  const [filteredParts, setFilteredParts] = useState<EnhancedPart[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedPart, setSelectedPart] = useState<EnhancedPart | null>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [lastInventoryUpdate, setLastInventoryUpdate] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(300000); // 5 minutes

  // Enhanced error and rate limit management
  const {
    errors,
    rateLimits,
    isConnected,
    lastChecked,
    addError,
    removeError,
    clearErrors,
    updateRateLimits,
    updateConnectionStatus
  } = useKeystoneStatus();

  // Additional state for enhanced functionality
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [keystoneService, setKeystoneService] = useState<KeystoneService | null>(null);
  const [healthCheckStatus, setHealthCheckStatus] = useState<'checking' | 'connected' | 'disconnected' | 'rate_limited' | 'error'>('checking');

  // Refs for cleanup
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  // Initialize Keystone service with enhanced error handling
  useEffect(() => {
    const initializeKeystone = async () => {
      try {
        console.log('Initializing Keystone service...');
        const service = await KeystoneService.create();
        
        // Set up error and rate limit listeners
        service.onError((error: ErrorInfo) => {
          console.error('Keystone error:', error);
          addError(error);
          
          // Show toast notification for user-facing errors
          if (error.type !== 'rate_limit') {
            toast({
              title: "Keystone API Error",
              description: error.message,
              variant: error.type === 'network' ? 'destructive' : 'default',
            });
          }
        });

        service.onRateLimit((rateLimitInfo: RateLimitInfo) => {
          console.warn('Rate limit encountered:', rateLimitInfo);
          updateRateLimits([rateLimitInfo]);
          
          toast({
            title: "Rate Limit Reached",
            description: `Please wait ${rateLimitInfo.retryAfterSeconds} seconds before trying again.`,
            variant: "default",
          });
          
          // Set up automatic retry
          if (rateLimitInfo.retryAfterSeconds > 0) {
            setRetryCountdown(rateLimitInfo.retryAfterSeconds);
          }
        });

        setKeystoneService(service);
        console.log('Keystone service initialized successfully');
        
        // Perform initial health check
        await performHealthCheck(service);
        
      } catch (error) {
        console.error('Failed to initialize Keystone service:', error);
        addError({
          message: 'Failed to initialize Keystone service. Using mock data.',
          type: 'unknown',
          retryable: true
        });
        setIsUsingMockData(true);
        updateConnectionStatus(false);
        setHealthCheckStatus('error');
      }
    };

    initializeKeystone();

    // Cleanup function
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced health check function
  const performHealthCheck = async (service?: KeystoneService) => {
    const serviceToUse = service || keystoneService;
    if (!serviceToUse) return;

    try {
      setHealthCheckStatus('checking');
      console.log('Performing health check...');
      
      const response = await serviceToUse.healthCheck();
      
      if (response.success) {
        console.log('Health check successful');
        updateConnectionStatus(true);
        setHealthCheckStatus('connected');
        setIsUsingMockData(false);
        
        // Clear any existing errors
        clearErrors();
        
        // Load inventory data
        await loadInventoryData(serviceToUse);
      } else {
        console.warn('Health check failed:', response.error);
        
        if (response.rate_limited) {
          setHealthCheckStatus('rate_limited');
          updateRateLimits([{
            isRateLimited: true,
            retryAfterSeconds: response.retry_after_seconds || 60,
            endpoint: '/health',
            timestamp: Date.now()
          }]);
        } else {
          setHealthCheckStatus('error');
          updateConnectionStatus(false);
          addError({
            message: response.error || 'Health check failed',
            type: 'server',
            retryable: true
          });
        }
        
        // Fall back to mock data
        setIsUsingMockData(true);
        setParts(mockParts);
        setFilteredParts(mockParts);
      }
    } catch (error: any) {
      console.error('Health check error:', error);
      setHealthCheckStatus('error');
      updateConnectionStatus(false);
      addError({
        message: 'Failed to connect to Keystone API',
        type: 'network',
        retryable: true
      });
      
      // Fall back to mock data
      setIsUsingMockData(true);
      setParts(mockParts);
      setFilteredParts(mockParts);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced inventory loading with retry logic
  const loadInventoryData = async (service?: KeystoneService, retryCount = 0) => {
    const serviceToUse = service || keystoneService;
    if (!serviceToUse) return;

    try {
      setIsLoading(true);
      console.log('Loading inventory data...');
      
      // Check if inventory updates endpoint is rate limited
      if (serviceToUse.isEndpointRateLimited('/inventory/updates')) {
        const remainingTime = serviceToUse.getRateLimitRemainingTime('/inventory/updates');
        console.log(`Inventory updates endpoint is rate limited. ${remainingTime}s remaining.`);
        
        toast({
          title: "Rate Limited",
          description: `Inventory updates are rate limited. Using cached data. Retry in ${remainingTime}s.`,
          variant: "default",
        });
        
        // Use mock data while rate limited
        setParts(mockParts);
        setFilteredParts(mockParts);
        setIsUsingMockData(true);
        return;
      }

      const response = await serviceToUse.getInventoryUpdates();
      
      if (response.success && response.data) {
        console.log('Inventory data loaded successfully');
        
        // Transform Keystone data to our part format
        const transformedParts = transformKeystoneData(response.data);
        setParts(transformedParts);
        setFilteredParts(transformedParts);
        setIsUsingMockData(false);
        setLastInventoryUpdate(new Date());
        
        toast({
          title: "Inventory Updated",
          description: `Loaded ${transformedParts.length} parts from Keystone API`,
          variant: "default",
        });
        
      } else if (response.rate_limited) {
        console.warn('Inventory loading rate limited');
        
        // Update rate limit info
        updateRateLimits([{
          isRateLimited: true,
          retryAfterSeconds: response.retry_after_seconds || 60,
          endpoint: '/inventory/updates',
          timestamp: Date.now()
        }]);
        
        // Use mock data while rate limited
        setParts(mockParts);
        setFilteredParts(mockParts);
        setIsUsingMockData(true);
        
      } else {
        console.warn('Failed to load inventory:', response.error);
        
        // Retry logic for non-rate-limit errors
        if (retryCount < 3) {
          console.log(`Retrying inventory load (attempt ${retryCount + 1}/3)...`);
          setTimeout(() => {
            loadInventoryData(serviceToUse, retryCount + 1);
          }, Math.pow(2, retryCount) * 1000); // Exponential backoff
          return;
        }
        
        addError({
          message: response.error || 'Failed to load inventory data',
          type: 'server',
          retryable: true
        });
        
        // Fall back to mock data
        setParts(mockParts);
        setFilteredParts(mockParts);
        setIsUsingMockData(true);
      }
    } catch (error: any) {
      console.error('Error loading inventory:', error);
      
      addError({
        message: 'Error loading inventory data',
        type: 'network',
        retryable: true
      });
      
      // Fall back to mock data
      setParts(mockParts);
      setFilteredParts(mockParts);
      setIsUsingMockData(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Transform Keystone API data to our part format
  const transformKeystoneData = (keystoneData: any[]): EnhancedPart[] => {
    return keystoneData.map((item, index) => ({
      id: item.partNumber || `keystone-${index}`,
      sku: item.partNumber || `SKU-${index}`,
      partNumber: item.partNumber || '',
      name: item.description || item.partNumber || 'Unknown Part',
      description: item.longDescription || item.description || '',
      category: item.category || 'General',
      subcategory: item.subcategory || 'Parts',
      price: item.price || 0,
      cost: item.cost || 0,
      quantity: item.quantity || 0,
      reorder_level: item.reorderLevel || 5,
      supplier: item.supplier || 'Keystone',
      location: item.location || 'Unknown',
      weight: item.weight || 0,
      dimensions: item.dimensions || '',
      warranty: item.warranty || '12 months',
      brand: item.brand || item.manufacturer || 'Unknown',
      compatibility: item.compatibility || [],
      features: item.features || [],
      images: item.images || ['/api/placeholder/300/300'],
      rating: item.rating || 4.0,
      reviews: item.reviews || 0,
      inStock: (item.quantity || 0) > 0,
      featured: item.featured || false,
      warehouse: item.warehouse || 'Main',
      lastUpdated: item.lastUpdated || new Date().toISOString(),
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      pricing: item.pricing
    }));
  };

  // Enhanced retry mechanism
  const handleRetry = useCallback(async (endpoint?: string) => {
    if (!keystoneService) return;
    
    setIsRetrying(true);
    clearErrors();
    
    try {
      if (endpoint === '/health' || !endpoint) {
        await performHealthCheck();
      } else if (endpoint === '/inventory/updates') {
        await loadInventoryData();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [keystoneService]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefreshEnabled || !keystoneService || isUsingMockData) return;

    refreshIntervalRef.current = setInterval(() => {
      console.log('Auto-refreshing inventory data...');
      loadInventoryData();
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefreshEnabled, refreshInterval, keystoneService, isUsingMockData]);

  // Retry countdown effect
  useEffect(() => {
    if (retryCountdown === null || retryCountdown <= 0) return;

    retryTimeoutRef.current = setTimeout(() => {
      setRetryCountdown(prev => {
        if (prev === null || prev <= 1) {
          // Auto-retry when countdown reaches 0
          handleRetry();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [retryCountdown, handleRetry]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...parts];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(part =>
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(part => part.category === selectedCategory);
    }

    // Price range filter
    filtered = filtered.filter(part => part.price >= priceRange[0] && part.price <= priceRange[1]);

    // In stock filter
    if (inStockOnly) {
      filtered = filtered.filter(part => part.inStock);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof EnhancedPart];
      let bValue: any = b[sortBy as keyof EnhancedPart];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredParts(filtered);
  }, [parts, searchTerm, selectedCategory, priceRange, inStockOnly, sortBy, sortOrder]);

  // Get unique categories
  const categories = Array.from(new Set(parts.map(part => part.category)));

  // Cart management
  const addToCart = (partId: string, quantity: number = 1) => {
    setCart(prev => ({
      ...prev,
      [partId]: (prev[partId] || 0) + quantity
    }));
    
    const part = parts.find(p => p.id === partId);
    toast({
      title: "Added to Cart",
      description: `${part?.name} (${quantity}) added to cart`,
    });
  };

  const removeFromCart = (partId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[partId];
      return newCart;
    });
  };

  const updateCartQuantity = (partId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(partId);
    } else {
      setCart(prev => ({
        ...prev,
        [partId]: quantity
      }));
    }
  };

  // Favorites management
  const toggleFavorite = (partId: string) => {
    setFavorites(prev => 
      prev.includes(partId) 
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    );
  };

  // Calculate cart totals
  const cartTotal = Object.entries(cart).reduce((total, [partId, quantity]) => {
    const part = parts.find(p => p.id === partId);
    return total + (part?.price || 0) * quantity;
  }, 0);

  const cartItemCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0);

  // Manual refresh function
  const handleManualRefresh = () => {
    if (keystoneService) {
      loadInventoryData();
    } else {
      performHealthCheck();
    }
  };

  // Render loading state
  if (isLoading && parts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-gray-600">Loading parts inventory...</p>
            <LoadingState isLoading={true} message="Connecting to Keystone API..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header with Status Indicators */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Parts Inventory</h1>
            <p className="text-gray-600 mt-1">
              Manage and browse your parts catalog
              {lastInventoryUpdate && (
                <span className="ml-2 text-sm">
                  (Last updated: {lastInventoryUpdate.toLocaleTimeString()})
                </span>
              )}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Connection Status */}
            <ConnectionStatus
              isConnected={isConnected}
              lastChecked={lastChecked}
              onReconnect={handleRetry}
            />
            
            {/* API Status Indicator */}
            <ApiStatusIndicator
              status={healthCheckStatus}
              message={isUsingMockData ? "Using mock data" : undefined}
            />
            
            {/* Manual Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isLoading || isRetrying}
            >
              {isLoading || isRetrying ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="space-y-2">
            {errors.map((error, index) => (
              <ErrorDisplay
                key={index}
                error={error}
                onRetry={() => handleRetry()}
                onDismiss={() => removeError(index)}
              />
            ))}
          </div>
        )}

        {/* Rate Limit Status */}
        <RateLimitStatus
          rateLimits={rateLimits}
          onRetry={handleRetry}
        />

        {/* Retry Countdown */}
        {retryCountdown !== null && retryCountdown > 0 && (
          <RetryCountdown
            seconds={retryCountdown}
            onRetry={() => handleRetry()}
          />
        )}

        {/* Mock Data Warning */}
        {isUsingMockData && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Using Mock Data</AlertTitle>
            <AlertDescription>
              Keystone API is not available. Displaying sample data for demonstration purposes.
              {!isConnected && (
                <Button
                  variant="link"
                  className="p-0 h-auto ml-2"
                  onClick={() => handleRetry()}
                >
                  Try to reconnect
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Auto-refresh Settings */}
        <Card className="bg-gray-50">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-refresh"
                    checked={autoRefreshEnabled}
                    onCheckedChange={setAutoRefreshEnabled}
                    disabled={isUsingMockData}
                  />
                  <Label htmlFor="auto-refresh" className="text-sm">
                    Auto-refresh inventory
                  </Label>
                </div>
                
                {autoRefreshEnabled && (
                  <Select
                    value={refreshInterval.toString()}
                    onValueChange={(value) => setRefreshInterval(parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60000">1 min</SelectItem>
                      <SelectItem value="300000">5 min</SelectItem>
                      <SelectItem value="600000">10 min</SelectItem>
                      <SelectItem value="1800000">30 min</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                {filteredParts.length} of {parts.length} parts shown
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search parts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="price-asc">Price Low-High</SelectItem>
                  <SelectItem value="price-desc">Price High-Low</SelectItem>
                  <SelectItem value="quantity-desc">Stock High-Low</SelectItem>
                  <SelectItem value="rating-desc">Rating High-Low</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="mt-4 pt-4 border-t space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Price Range */}
                <div className="flex-1">
                  <Label className="text-sm font-medium">Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={1000}
                    step={10}
                    className="mt-2"
                  />
                </div>

                {/* In Stock Only */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="in-stock"
                    checked={inStockOnly}
                    onCheckedChange={setInStockOnly}
                  />
                  <Label htmlFor="in-stock" className="text-sm">In Stock Only</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shopping Cart Summary */}
        {cartItemCount > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">
                    {cartItemCount} item{cartItemCount !== 1 ? 's' : ''} in cart
                  </span>
                  <span className="text-blue-600 font-bold">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
                <Button size="sm">
                  View Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parts Display */}
        <div className="space-y-6">
          {/* Loading State */}
          {isLoading && (
            <LoadingState
              isLoading={true}
              message="Updating inventory data..."
              className="justify-center py-8"
            />
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredParts.map((part) => (
                <Card key={part.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    {/* Part Image */}
                    <div className="relative mb-4">
                      <img
                        src={part.images?.[0] || '/api/placeholder/300/300'}
                        alt={part.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      
                      {/* Status Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {part.featured && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {!part.inStock && (
                          <Badge variant="destructive">
                            Out of Stock
                          </Badge>
                        )}
                        {part.inStock && part.quantity <= (part.reorder_level || 5) && (
                          <Badge variant="outline" className="bg-orange-100 text-orange-800">
                            Low Stock
                          </Badge>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => toggleFavorite(part.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Heart className={`h-4 w-4 ${favorites.includes(part.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedPart(part)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Part Info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                            {part.name}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">
                            SKU: {part.sku}
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-bold text-lg text-green-600">
                            ${part.price.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Category and Brand */}
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-xs">
                          {part.category}
                        </Badge>
                        {part.brand && (
                          <span className="text-gray-500">{part.brand}</span>
                        )}
                      </div>

                      {/* Stock Info */}
                      <div className="flex items-center justify-between text-xs">
                        <span className={`flex items-center gap-1 ${part.inStock ? 'text-green-600' : 'text-red-600'}`}>
                          <Package className="h-3 w-3" />
                          {part.inStock ? `${part.quantity} in stock` : 'Out of stock'}
                        </span>
                        {part.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{part.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {/* Add to Cart */}
                      <div className="flex items-center gap-2 pt-2">
                        {cart[part.id] ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(part.id, cart[part.id] - 1)}
                              className="h-8 w-8 p-0"
                            >
                              -
                            </Button>
                            <span className="text-sm font-medium min-w-[2rem] text-center">
                              {cart[part.id]}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(part.id, cart[part.id] + 1)}
                              className="h-8 w-8 p-0"
                              disabled={!part.inStock || cart[part.id] >= part.quantity}
                            >
                              +
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => addToCart(part.id)}
                            disabled={!part.inStock}
                            className="flex-1"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={part.images?.[0] || '/api/placeholder/300/300'}
                            alt={part.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium">{part.name}</p>
                            <p className="text-sm text-gray-600">SKU: {part.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{part.category}</Badge>
                      </TableCell>
                      <TableCell>{part.brand || 'N/A'}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        ${part.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${part.inStock ? 'text-green-600' : 'text-red-600'}`}>
                          <Package className="h-4 w-4" />
                          {part.inStock ? part.quantity : 'Out of stock'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {part.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{part.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPart(part)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleFavorite(part.id)}
                          >
                            <Heart className={`h-4 w-4 ${favorites.includes(part.id) ? 'fill-red-500 text-red-500' : ''}`} />
                          </Button>
                          {cart[part.id] ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(part.id, cart[part.id] - 1)}
                                className="h-8 w-8 p-0"
                              >
                                -
                              </Button>
                              <span className="text-sm font-medium min-w-[2rem] text-center">
                                {cart[part.id]}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(part.id, cart[part.id] + 1)}
                                className="h-8 w-8 p-0"
                                disabled={!part.inStock || cart[part.id] >= part.quantity}
                              >
                                +
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => addToCart(part.id)}
                              disabled={!part.inStock}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* No Results */}
          {filteredParts.length === 0 && !isLoading && (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No parts found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or filters
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setPriceRange([0, 1000]);
                    setInStockOnly(false);
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Part Detail Modal */}
        {selectedPart && (
          <Dialog open={!!selectedPart} onOpenChange={() => setSelectedPart(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedPart.name}</DialogTitle>
                <DialogDescription>
                  SKU: {selectedPart.sku} | Part Number: {selectedPart.partNumber}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Images */}
                <div>
                  <img
                    src={selectedPart.images?.[0] || '/api/placeholder/400/400'}
                    alt={selectedPart.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Details</h3>
                    <p className="text-gray-600">{selectedPart.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Category:</span>
                      <p>{selectedPart.category}</p>
                    </div>
                    <div>
                      <span className="font-medium">Brand:</span>
                      <p>{selectedPart.brand || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Price:</span>
                      <p className="text-green-600 font-bold">${selectedPart.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Stock:</span>
                      <p className={selectedPart.inStock ? 'text-green-600' : 'text-red-600'}>
                        {selectedPart.inStock ? `${selectedPart.quantity} available` : 'Out of stock'}
                      </p>
                    </div>
                    {selectedPart.weight && (
                      <div>
                        <span className="font-medium">Weight:</span>
                        <p>{selectedPart.weight} lbs</p>
                      </div>
                    )}
                    {selectedPart.dimensions && (
                      <div>
                        <span className="font-medium">Dimensions:</span>
                        <p>{selectedPart.dimensions}</p>
                      </div>
                    )}
                    {selectedPart.warranty && (
                      <div>
                        <span className="font-medium">Warranty:</span>
                        <p>{selectedPart.warranty}</p>
                      </div>
                    )}
                    {selectedPart.location && (
                      <div>
                        <span className="font-medium">Location:</span>
                        <p>{selectedPart.location}</p>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  {selectedPart.features && selectedPart.features.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Features</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPart.features.map((feature, index) => (
                          <Badge key={index} variant="secondary">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compatibility */}
                  {selectedPart.compatibility && selectedPart.compatibility.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Compatibility</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPart.compatibility.map((item, index) => (
                          <Badge key={index} variant="outline">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add to Cart */}
                  <div className="flex items-center gap-4 pt-4 border-t">
                    {cart[selectedPart.id] ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => updateCartQuantity(selectedPart.id, cart[selectedPart.id] - 1)}
                        >
                          -
                        </Button>
                        <span className="font-medium min-w-[3rem] text-center">
                          {cart[selectedPart.id]}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => updateCartQuantity(selectedPart.id, cart[selectedPart.id] + 1)}
                          disabled={!selectedPart.inStock || cart[selectedPart.id] >= selectedPart.quantity}
                        >
                          +
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => addToCart(selectedPart.id)}
                        disabled={!selectedPart.inStock}
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      onClick={() => toggleFavorite(selectedPart.id)}
                    >
                      <Heart className={`h-4 w-4 ${favorites.includes(selectedPart.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Parts;


import React, { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Package, ShoppingCart, Search, Plus, Grid, List, Heart, Eye, RefreshCw, Database, RotateCcw, Clock, CheckCircle, XCircle, AlertTriangle, X, Minus, Trash2, ArrowRight, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import services
import { InventorySyncService } from "@/services/inventory_sync_service";
import { getSyncScheduler } from "@/services/SyncScheduler";
import { getPricingSyncService, PricingSyncService, PricingData } from "@/services/pricing_sync_service";
import { getPricingSyncScheduler, PricingSyncScheduler } from "@/services/pricing_sync_scheduler";

// Import the new ProductPriceCheck component
import ProductPriceCheck from '@/components/product_price_check_component';

// Interface matching your existing inventory table structure
interface InventoryPart {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  price: number;
  cost?: number;
  category?: string;
  supplier?: string;
  reorder_level?: number;
  created_at: string;
  updated_at: string;
  core_charge?: number;
  keystone_vcpn?: string;
  keystone_synced?: boolean;
  keystone_last_sync?: string;
  keystone_sync_status?: string;
  
  // Optional additional columns
  warehouse?: string;
  location?: string;
  brand?: string;
  weight?: number;
  dimensions?: string;
  warranty?: string;
  features?: string[];
  images?: string[];
  rating?: number;
  reviews?: number;
  featured?: boolean;
  availability?: string;
  in_stock?: boolean;
  
  // Enhanced pricing information
  pricing_data?: PricingData;
  pricing_last_updated?: string;
  pricing_stale?: boolean;
  list_price?: number;
  discount_percentage?: number;
}

interface SyncStatus {
  lastFullSync?: any;
  lastIncrementalSync?: any;
  pendingRequests: number;
  nextScheduledSync?: string;
  syncStats?: any;
}

interface PricingSyncStatus {
  lastFullSync?: string;
  lastIncrementalSync?: string;
  totalParts: number;
  syncedParts: number;
  staleParts: number;
  pendingUpdates: number;
  isRunning: boolean;
  nextScheduledSync?: string;
  recentLogs: any[];
  errorRate: number;
  averageSyncTime: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
  category?: string;
  image?: string;
  inStock: boolean;
  maxQuantity: number;
}

// Enhanced pricing display component - NOW WITH PRODUCTPRICECHECK INTEGRATION
const PricingDisplay: React.FC<{
  part: InventoryPart;
  onRefreshPricing: (vcpn: string) => void;
  isRefreshing?: boolean;
}> = ({ part, onRefreshPricing, isRefreshing = false }) => {
  const { toast } = useToast();
  
  // If part has a VCPN, use the ProductPriceCheck component
  if (part.keystone_vcpn) {
    return (
      <ProductPriceCheck
        vcpn={part.keystone_vcpn}
        listPrice={part.list_price || part.price}
        productName={part.name}
        showComparison={true}
        autoCheck={false}
        className="border-0 shadow-none p-0"
      />
    );
  }
  
  // Fallback for parts without VCPN - use original pricing display
  const handleRefreshPricing = () => {
    toast({
      title: "No VCPN",
      description: "This part doesn't have a Keystone VCPN for pricing updates",
      variant: "destructive",
    });
  };

  const isPricingStale = part.pricing_stale || 
    (part.pricing_last_updated && 
     new Date().getTime() - new Date(part.pricing_last_updated).getTime() > 24 * 60 * 60 * 1000);

  const discountPercentage = part.list_price && part.price 
    ? Math.round(((part.list_price - part.price) / part.list_price) * 100)
    : 0;

  return (
    <div className="space-y-2">
      {/* Main price display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-green-600">
            ${part.price?.toFixed(2) || '0.00'}
          </span>
          {part.list_price && part.list_price > part.price && (
            <span className="text-sm text-gray-500 line-through">
              ${part.list_price.toFixed(2)}
            </span>
          )}
          {discountPercentage > 0 && (
            <Badge variant="destructive" className="text-xs">
              -{discountPercentage}%
            </Badge>
          )}
        </div>
        
        {/* Pricing refresh button - disabled for non-VCPN parts */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshPricing}
          disabled={true}
          className="h-8 w-8 p-0 opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Additional pricing info */}
      {(part.core_charge || part.cost) && (
        <div className="flex space-x-4 text-sm text-gray-600">
          {part.core_charge && part.core_charge > 0 && (
            <span>Core: ${part.core_charge.toFixed(2)}</span>
          )}
          {part.cost && (
            <span>Cost: ${part.cost.toFixed(2)}</span>
          )}
        </div>
      )}

      {/* Pricing status indicator */}
      <div className="flex items-center space-x-2 text-xs">
        <AlertTriangle className="h-3 w-3 text-gray-400" />
        <span className="text-gray-500">No live pricing available</span>
      </div>
    </div>
  );
};

// Enhanced sync status component with pricing information
const EnhancedSyncStatus: React.FC<{
  inventoryStatus: SyncStatus;
  pricingStatus: PricingSyncStatus;
  onInventorySync: () => void;
  onPricingSync: () => void;
  isInventorySyncing: boolean;
  isPricingSyncing: boolean;
}> = ({ 
  inventoryStatus, 
  pricingStatus, 
  onInventorySync, 
  onPricingSync, 
  isInventorySyncing, 
  isPricingSyncing 
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Sync Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Total Parts</p>
                      <p className="text-2xl font-bold">{inventoryStatus.syncStats?.total_parts || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Synced</p>
                      <p className="text-2xl font-bold">{inventoryStatus.syncStats?.synced_parts || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">Pending</p>
                      <p className="text-2xl font-bold">{inventoryStatus.pendingRequests || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Last sync: {inventoryStatus.lastFullSync ? 
                  new Date(inventoryStatus.lastFullSync).toLocaleString() : 'Never'}
              </div>
              <Button 
                onClick={onInventorySync}
                disabled={isInventorySyncing}
                size="sm"
              >
                {isInventorySyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Full Sync
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Total Parts</p>
                      <p className="text-2xl font-bold">{pricingStatus.totalParts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Current Pricing</p>
                      <p className="text-2xl font-bold">{pricingStatus.syncedParts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">Stale Pricing</p>
                      <p className="text-2xl font-bold">{pricingStatus.staleParts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Pending Updates</p>
                      <p className="text-2xl font-bold">{pricingStatus.pendingUpdates}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Last pricing sync: {pricingStatus.lastFullSync ? 
                  new Date(pricingStatus.lastFullSync).toLocaleString() : 'Never'}
              </div>
              <Button 
                onClick={onPricingSync}
                disabled={isPricingSyncing}
                size="sm"
              >
                {isPricingSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing Pricing...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Sync Pricing
                  </>
                )}
              </Button>
            </div>
            
            {pricingStatus.errorRate > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Pricing Sync Issues</AlertTitle>
                <AlertDescription>
                  {pricingStatus.errorRate.toFixed(1)}% error rate in recent pricing syncs. 
                  Average sync time: {pricingStatus.averageSyncTime.toFixed(1)}s
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Simple loading wrapper component
const LoadingWrapper: React.FC<{ 
  isLoading: boolean; 
  hasData: boolean; 
  children: React.ReactNode;
  loadingMessage?: string;
}> = ({ isLoading, hasData, children, loadingMessage = "Loading..." }) => {
  if (isLoading && !hasData) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">{loadingMessage}</p>
        </CardContent>
      </Card>
    );
  }
  return <>{children}</>;
};

// Cart Drawer Component - Integrated directly into Parts component
const CartDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  cart: { [key: string]: number };
  parts: InventoryPart[];
  onUpdateQuantity: (partId: string, quantity: number) => void;
  onRemoveItem: (partId: string) => void;
  onClearCart: () => void;
}> = ({ isOpen, onClose, cart, parts, onUpdateQuantity, onRemoveItem, onClearCart }) => {
  const { toast } = useToast();
  
  // Convert cart object to cart items with part details
  const cartItems: CartItem[] = Object.entries(cart).map(([partId, quantity]) => {
    const part = parts.find(p => p.id === partId);
    return {
      id: partId,
      name: part?.name || 'Unknown Part',
      price: part?.price || 0,
      quantity,
      sku: part?.sku || part?.keystone_vcpn,
      category: part?.category,
      inStock: (part?.quantity || 0) > 0,
      maxQuantity: part?.quantity || 0
    };
  }).filter(item => item.quantity > 0);

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax rate - adjust as needed
  const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100
  const total = subtotal + tax + shipping;
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Handle quantity updates
  const handleQuantityChange = (partId: string, newQuantity: number) => {
    const item = cartItems.find(item => item.id === partId);
    if (!item) return;

    if (newQuantity <= 0) {
      onRemoveItem(partId);
      toast({
        title: "Item Removed",
        description: `${item.name} removed from cart`,
        variant: "default",
      });
    } else if (newQuantity > item.maxQuantity) {
      toast({
        title: "Stock Limit",
        description: `Only ${item.maxQuantity} available in stock`,
        variant: "destructive",
      });
    } else {
      onUpdateQuantity(partId, newQuantity);
    }
  };

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="ml-auto relative bg-white w-full max-w-md h-full shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Cart Items */}
          <ScrollArea className="flex-1 p-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">Your cart is empty</p>
                <Button onClick={onClose} variant="outline">
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {/* Placeholder for item image */}
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{item.name}</h3>
                          {item.sku && (
                            <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                          )}
                          {item.category && (
                            <p className="text-xs text-gray-500">{item.category}</p>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-semibold text-green-600">
                              ${item.price.toFixed(2)}
                            </span>
                            
                            {/* Quantity controls */}
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.maxQuantity}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemoveItem(item.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Stock status */}
                          <div className="mt-1">
                            {item.inStock ? (
                              <span className="text-xs text-green-600">
                                {item.maxQuantity} in stock
                              </span>
                            ) : (
                              <span className="text-xs text-red-600">Out of stock</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer with totals and checkout */}
          {cartItems.length > 0 && (
            <div className="border-t p-4 space-y-4">
              {/* Price breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                {shipping === 0 && (
                  <p className="text-xs text-green-600">🎉 Free shipping on orders over $100!</p>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <Button className="w-full" size="lg">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </Button>
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Continue Shopping
                  </Button>
                  <Button variant="ghost" onClick={onClearCart} className="flex-1">
                    Clear Cart
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Parts component with enhanced pricing integration
const PartsPage: React.FC = () => {
  // State management
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [filteredParts, setFilteredParts] = useState<InventoryPart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null);
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // Cart state
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Sync state
  const [inventoryStatus, setInventoryStatus] = useState<SyncStatus>({
    pendingRequests: 0
  });
  const [pricingStatus, setPricingStatus] = useState<PricingSyncStatus>({
    totalParts: 0,
    syncedParts: 0,
    staleParts: 0,
    pendingUpdates: 0,
    isRunning: false,
    recentLogs: [],
    errorRate: 0,
    averageSyncTime: 0
  });
  const [isFullSyncing, setIsFullSyncing] = useState(false);
  const [isPricingSyncing, setIsPricingSyncing] = useState(false);
  const [refreshingPricing, setRefreshingPricing] = useState<Set<string>>(new Set());
  
  // Service instances
  const [inventorySync, setInventorySync] = useState<InventorySyncService | null>(null);
  const [pricingSync, setPricingSync] = useState<PricingSyncService | null>(null);
  const [pricingScheduler, setPricingScheduler] = useState<PricingSyncScheduler | null>(null);
  const [scheduler, setScheduler] = useState<any>(null);
  
  const { toast } = useToast();

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('🔧 Initializing services...');
        
        // Initialize inventory sync service
        const inventorySyncService = new InventorySyncService();
        await inventorySyncService.initialize();
        setInventorySync(inventorySyncService);
        
        // Initialize pricing sync service
        const pricingSyncService = getPricingSyncService();
        await pricingSyncService.initialize();
        setPricingSync(pricingSyncService);
        
        // Initialize pricing scheduler
        const pricingSchedulerService = getPricingSyncScheduler();
        await pricingSchedulerService.initialize();
        await pricingSchedulerService.start();
        setPricingScheduler(pricingSchedulerService);
        
        // Initialize inventory scheduler
        const syncScheduler = getSyncScheduler();
        await syncScheduler.initialize();
        setScheduler(syncScheduler);
        
        console.log('✅ All services initialized successfully');
        
      } catch (error) {
        console.error('❌ Failed to initialize services:', error);
        toast({
          title: "Service Initialization Failed",
          description: "Some features may not work properly. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    initializeServices();
  }, [toast]);

  // Load inventory data with pricing integration
  const loadInventoryData = useCallback(async () => {
    if (!inventorySync || !pricingSync) return;

    try {
      console.log('📊 Loading inventory data...');
      setIsLoading(true);

      // Load inventory from Supabase
      const inventoryData = await inventorySync.getInventoryFromSupabase({
        limit: 1000,
        includeStale: true
      });

      if (inventoryData && inventoryData.length > 0) {
        console.log(`✅ Loaded ${inventoryData.length} parts from database`);
        
        // Enhance parts with pricing data
        const enhancedParts = await enhanceParts(inventoryData);
        setParts(enhancedParts);
        
        // Cache the data
        localStorage.setItem('inventory_cache', JSON.stringify(enhancedParts));
        localStorage.setItem('inventory_cache_timestamp', new Date().toISOString());
      } else {
        // Try to load from cache
        const cachedData = localStorage.getItem('inventory_cache');
        if (cachedData) {
          console.log('📦 Loading from cache...');
          const parsedData = JSON.parse(cachedData);
          const enhancedParts = await enhanceParts(parsedData);
          setParts(enhancedParts);
        }
      }

    } catch (error) {
      console.error('❌ Failed to load inventory data:', error);
      
      // Try to load from cache as fallback
      const cachedData = localStorage.getItem('inventory_cache');
      if (cachedData) {
        console.log('📦 Loading from cache as fallback...');
        const parsedData = JSON.parse(cachedData);
        setParts(parsedData);
      }
      
      toast({
        title: "Data Loading Error",
        description: "Failed to load inventory data. Using cached data if available.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [inventorySync, pricingSync, toast]);

  // Enhance parts with pricing data
  const enhanceParts = async (parts: InventoryPart[]): Promise<InventoryPart[]> => {
    if (!pricingSync) return parts;

    try {
      // Get VCPNs for pricing lookup
      const vcpns = parts
        .filter(part => part.keystone_vcpn)
        .map(part => part.keystone_vcpn!);

      if (vcpns.length === 0) return parts;

      // Get pricing data from Supabase
      const pricingData = await pricingSync.getPricingFromSupabase({
        vcpns,
        includeStale: true
      });

      // Create pricing lookup map
      const pricingMap = new Map<string, PricingData>();
      pricingData.forEach(pricing => {
        pricingMap.set(pricing.keystone_vcpn, pricing);
      });

      // Enhance parts with pricing data
      return parts.map(part => {
        if (!part.keystone_vcpn) return part;

        const pricing = pricingMap.get(part.keystone_vcpn);
        if (!pricing) return part;

        // Check if pricing is stale (older than 24 hours)
        const pricingAge = pricing.keystone_last_sync 
          ? new Date().getTime() - new Date(pricing.keystone_last_sync).getTime()
          : Infinity;
        const isStale = pricingAge > 24 * 60 * 60 * 1000;

        return {
          ...part,
          price: pricing.price || part.price,
          list_price: pricing.list_price || undefined,
          core_charge: pricing.core_charge || part.core_charge,
          cost: pricing.cost || part.cost,
          pricing_data: pricing,
          pricing_last_updated: pricing.keystone_last_sync,
          pricing_stale: isStale,
          discount_percentage: pricing.list_price && pricing.price
            ? Math.round(((pricing.list_price - pricing.price) / pricing.list_price) * 100)
            : undefined
        };
      });

    } catch (error) {
      console.error('❌ Failed to enhance parts with pricing:', error);
      return parts;
    }
  };

  // Load sync status
  const loadSyncStatus = useCallback(async () => {
    try {
      if (inventorySync) {
        const invStatus = await inventorySync.getSyncStatus();
        setInventoryStatus(invStatus);
      }

      if (pricingSync) {
        const pricStatus = await pricingSync.getPricingSyncStatus();
        setPricingStatus(pricStatus);
      }
    } catch (error) {
      console.error('❌ Failed to load sync status:', error);
    }
  }, [inventorySync, pricingSync]);

  // Initial data load
  useEffect(() => {
    if (inventorySync && pricingSync) {
      loadInventoryData();
      loadSyncStatus();
    }
  }, [inventorySync, pricingSync, loadInventoryData, loadSyncStatus]);

  // Refresh sync status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isFullSyncing && !isPricingSyncing) {
        loadSyncStatus();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [loadSyncStatus, isFullSyncing, isPricingSyncing]);

  // Handle full inventory sync
  const handleFullSync = async () => {
    if (!scheduler) {
      toast({
        title: "Service Not Ready",
        description: "Sync service is not initialized yet. Please wait a moment.",
        variant: "destructive",
      });
      return;
    }

    console.log('🔄 Starting full inventory sync...');
    setIsFullSyncing(true);
    
    // Set timeout to prevent endless spinning
    const timeoutId = setTimeout(() => {
      setIsFullSyncing(false);
      toast({
        title: "Sync Timeout",
        description: "The sync operation took too long and was cancelled. Please try again.",
        variant: "destructive",
      });
    }, 60000); // 60 second timeout

    try {
      const result = await scheduler.triggerFullSync();
      console.log('✅ Full sync result:', result);
      
      if (result.success) {
        toast({
          title: "Sync Completed",
          description: result.message,
          variant: "default",
        });
        
        // Reload data after successful sync
        await loadInventoryData();
        await loadSyncStatus();
      } else {
        toast({
          title: "Sync Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Full sync error:', error);
      toast({
        title: "Sync Error",
        description: `Sync failed: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      clearTimeout(timeoutId);
      setIsFullSyncing(false);
    }
  };

  // Handle full pricing sync
  const handlePricingSync = async () => {
    if (!pricingScheduler) {
      toast({
        title: "Service Not Ready",
        description: "Pricing sync service is not initialized yet. Please wait a moment.",
        variant: "destructive",
      });
      return;
    }

    console.log('🔄 Starting full pricing sync...');
    setIsPricingSyncing(true);
    
    // Set timeout to prevent endless spinning
    const timeoutId = setTimeout(() => {
      setIsPricingSyncing(false);
      toast({
        title: "Pricing Sync Timeout",
        description: "The pricing sync took too long and was cancelled. Please try again.",
        variant: "destructive",
      });
    }, 60000); // 60 second timeout

    try {
      const result = await pricingScheduler.triggerFullSync();
      console.log('✅ Pricing sync result:', result);
      
      if (result.success) {
        toast({
          title: "Pricing Sync Completed",
          description: result.message,
          variant: "default",
        });
        
        // Reload data after successful sync
        await loadInventoryData();
        await loadSyncStatus();
      } else {
        toast({
          title: "Pricing Sync Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Pricing sync error:', error);
      toast({
        title: "Pricing Sync Error",
        description: `Pricing sync failed: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      clearTimeout(timeoutId);
      setIsPricingSyncing(false);
    }
  };

  // Handle individual part pricing refresh
  const handleRefreshPricing = async (vcpn: string) => {
    if (!pricingSync) {
      toast({
        title: "Service Not Ready",
        description: "Pricing service is not initialized yet.",
        variant: "destructive",
      });
      return;
    }

    console.log(`🔄 Refreshing pricing for ${vcpn}...`);
    
    // Add to refreshing set
    setRefreshingPricing(prev => new Set(prev).add(vcpn));

    try {
      const result = await pricingSync.updateSinglePartPricing(vcpn);
      
      if (result.success) {
        toast({
          title: "Pricing Updated",
          description: `Pricing refreshed for ${vcpn}`,
          variant: "default",
        });
        
        // Reload data to show updated pricing
        await loadInventoryData();
      } else {
        toast({
          title: "Pricing Update Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`❌ Failed to refresh pricing for ${vcpn}:`, error);
      toast({
        title: "Pricing Update Error",
        description: `Failed to update pricing: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      // Remove from refreshing set
      setRefreshingPricing(prev => {
        const newSet = new Set(prev);
        newSet.delete(vcpn);
        return newSet;
      });
    }
  };

  // Cart functions
  const addToCart = (partId: string, quantity: number = 1) => {
    console.log('🛒 Adding to cart:', partId, 'quantity:', quantity);
    
    setCart(prev => {
      const newCart = {
        ...prev,
        [partId]: (prev[partId] || 0) + quantity
      };
      console.log('🛒 Updated cart state:', newCart);
      return newCart;
    });
    
    const part = parts.find(p => p.id === partId);
    if (part) {
      toast({
        title: "Added to Cart",
        description: `${part.name} added to cart`,
        variant: "default",
      });
    }
  };

  const updateCartQuantity = (partId: string, quantity: number) => {
    setCart(prev => ({
      ...prev,
      [partId]: quantity
    }));
  };

  const removeFromCart = (partId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[partId];
      return newCart;
    });
  };

  const clearCart = () => {
    setCart({});
    toast({
      title: "Cart Cleared",
      description: "All items removed from cart",
      variant: "default",
    });
  };

  // Calculate cart totals
  const cartItemCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  const cartTotalValue = Object.entries(cart).reduce((total, [partId, quantity]) => {
    const part = parts.find(p => p.id === partId);
    return total + (part?.price || 0) * quantity;
  }, 0);

  // Filter and sort parts
  useEffect(() => {
    let filtered = parts.filter(part => {
      const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.keystone_vcpn?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || part.category === selectedCategory;
      const matchesPrice = part.price >= priceRange[0] && part.price <= priceRange[1];
      const matchesStock = !showInStockOnly || part.quantity > 0;
      
      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });

    // Sort parts
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'category':
          aValue = a.category?.toLowerCase() || '';
          bValue = b.category?.toLowerCase() || '';
          break;
        case 'updated':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredParts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [parts, searchTerm, selectedCategory, priceRange, showInStockOnly, sortBy, sortOrder]);

  // Get unique categories
  const categories = Array.from(new Set(parts.map(part => part.category).filter(Boolean)));

  // Pagination
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParts = filteredParts.slice(startIndex, endIndex);

  // Handle part detail view
  const handlePartClick = (part: InventoryPart) => {
    setSelectedPart(part);
    setIsPartDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Parts Inventory</h1>
          <p className="text-gray-600">
            {isLoading ? 'Loading parts inventory...' : 
             `Database • ${filteredParts.length} of ${parts.length} parts`}
          </p>
        </div>
        
        {/* Cart Button */}
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={() => {
              console.log('🛒 Cart clicked. Current cart:', cart);
              console.log('🛒 Total items:', cartItemCount);
              console.log('🛒 Total value:', cartTotalValue);
              setIsCartOpen(true);
            }}
            className="relative"
            size="lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Cart ({cartItemCount})
            {cartItemCount > 0 && (
              <>
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {cartItemCount}
                </Badge>
                <span className="ml-2 text-green-200">
                  ${cartTotalValue.toFixed(2)}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Sync Status */}
      <EnhancedSyncStatus
        inventoryStatus={inventoryStatus}
        pricingStatus={pricingStatus}
        onInventorySync={handleFullSync}
        onPricingSync={handlePricingSync}
        isInventorySyncing={isFullSyncing}
        isPricingSyncing={isPricingSyncing}
      />

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                  <SelectItem key={category} value={category!}>
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
                <SelectItem value="updated-desc">Recently Updated</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center space-x-2">
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

          {/* Price Range */}
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">
              Price Range: ${priceRange[0]} - ${priceRange[1]}
            </Label>
            <Slider
              value={priceRange}
              onValueChange={(value) => setPriceRange(value as [number, number])}
              max={1000}
              min={0}
              step={10}
              className="w-full"
            />
          </div>

          {/* Stock Filter */}
          <div className="flex items-center space-x-2">
            <Switch
              id="in-stock-only"
              checked={showInStockOnly}
              onCheckedChange={setShowInStockOnly}
            />
            <Label htmlFor="in-stock-only">Show in-stock items only</Label>
          </div>
        </CardContent>
      </Card>

      {/* Parts Display */}
      <LoadingWrapper 
        isLoading={isLoading} 
        hasData={parts.length > 0}
        loadingMessage="Loading parts inventory..."
      >
        {filteredParts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No parts found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setPriceRange([0, 1000]);
                  setShowInStockOnly(false);
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Parts Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {currentParts.map((part) => (
                  <Card key={part.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      {/* Part Image Placeholder */}
                      <div className="w-full h-48 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>

                      {/* Part Info */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 
                            className="font-semibold text-sm line-clamp-2 cursor-pointer hover:text-blue-600"
                            onClick={() => handlePartClick(part)}
                          >
                            {part.name}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newFavorites = new Set(favorites);
                              if (newFavorites.has(part.id)) {
                                newFavorites.delete(part.id);
                              } else {
                                newFavorites.add(part.id);
                              }
                              setFavorites(newFavorites);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Heart 
                              className={`h-4 w-4 ${
                                favorites.has(part.id) 
                                  ? 'fill-red-500 text-red-500' 
                                  : 'text-gray-400'
                              }`} 
                            />
                          </Button>
                        </div>

                        {/* SKU and Category */}
                        <div className="flex flex-wrap gap-1">
                          {part.sku && (
                            <Badge variant="outline" className="text-xs">
                              {part.sku}
                            </Badge>
                          )}
                          {part.category && (
                            <Badge variant="secondary" className="text-xs">
                              {part.category}
                            </Badge>
                          )}
                        </div>

                        {/* INTEGRATED PRODUCTPRICECHECK COMPONENT */}
                        <PricingDisplay
                          part={part}
                          onRefreshPricing={handleRefreshPricing}
                          isRefreshing={refreshingPricing.has(part.keystone_vcpn || '')}
                        />

                        {/* Stock Status */}
                        <div className="flex items-center justify-between text-sm">
                          <span className={`font-medium ${
                            part.quantity > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {part.quantity > 0 ? `${part.quantity} in stock` : 'Out of stock'}
                          </span>
                          {part.reorder_level && part.quantity <= part.reorder_level && (
                            <Badge variant="destructive" className="text-xs">
                              Low Stock
                            </Badge>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-2">
                          <Button
                            onClick={() => addToCart(part.id)}
                            disabled={part.quantity === 0}
                            className="flex-1"
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePartClick(part)}
                            className="px-3"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="mb-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Pricing</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentParts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <h3 
                                className="font-medium cursor-pointer hover:text-blue-600"
                                onClick={() => handlePartClick(part)}
                              >
                                {part.name}
                              </h3>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {part.sku && (
                                  <Badge variant="outline" className="text-xs">
                                    {part.sku}
                                  </Badge>
                                )}
                                {part.keystone_vcpn && (
                                  <Badge variant="secondary" className="text-xs">
                                    {part.keystone_vcpn}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {part.category && (
                            <Badge variant="secondary">
                              {part.category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {/* INTEGRATED PRODUCTPRICECHECK COMPONENT */}
                          <PricingDisplay
                            part={part}
                            onRefreshPricing={handleRefreshPricing}
                            isRefreshing={refreshingPricing.has(part.keystone_vcpn || '')}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className={`font-medium ${
                              part.quantity > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {part.quantity > 0 ? `${part.quantity} in stock` : 'Out of stock'}
                            </span>
                            {part.reorder_level && part.quantity <= part.reorder_level && (
                              <Badge variant="destructive" className="text-xs">
                                Low Stock
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => addToCart(part.id)}
                              disabled={part.quantity === 0}
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePartClick(part)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newFavorites = new Set(favorites);
                                if (newFavorites.has(part.id)) {
                                  newFavorites.delete(part.id);
                                } else {
                                  newFavorites.add(part.id);
                                }
                                setFavorites(newFavorites);
                              }}
                            >
                              <Heart 
                                className={`h-4 w-4 ${
                                  favorites.has(part.id) 
                                    ? 'fill-red-500 text-red-500' 
                                    : 'text-gray-400'
                                }`} 
                              />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredParts.length)} of {filteredParts.length} parts
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 py-2 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </LoadingWrapper>

      {/* Part Detail Dialog */}
      <Dialog open={isPartDialogOpen} onOpenChange={setIsPartDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPart?.name}</DialogTitle>
            <DialogDescription>
              Part details and specifications
            </DialogDescription>
          </DialogHeader>
          
          {selectedPart && (
            <div className="space-y-6">
              {/* Part Image */}
              <div className="w-full h-64 bg-gray-200 rounded-md flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-400" />
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">SKU</Label>
                  <p className="text-sm">{selectedPart.sku || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Category</Label>
                  <p className="text-sm">{selectedPart.category || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Supplier</Label>
                  <p className="text-sm">{selectedPart.supplier || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Brand</Label>
                  <p className="text-sm">{selectedPart.brand || 'N/A'}</p>
                </div>
              </div>

              {/* INTEGRATED PRODUCTPRICECHECK COMPONENT IN DIALOG */}
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2 block">Live Pricing Information</Label>
                <PricingDisplay
                  part={selectedPart}
                  onRefreshPricing={handleRefreshPricing}
                  isRefreshing={refreshingPricing.has(selectedPart.keystone_vcpn || '')}
                />
              </div>

              {/* Description */}
              {selectedPart.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="text-sm mt-1">{selectedPart.description}</p>
                </div>
              )}

              {/* Stock Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Current Stock</Label>
                  <p className={`text-sm font-medium ${
                    selectedPart.quantity > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedPart.quantity} units
                  </p>
                </div>
                {selectedPart.reorder_level && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Reorder Level</Label>
                    <p className="text-sm">{selectedPart.reorder_level} units</p>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              {(selectedPart.weight || selectedPart.dimensions || selectedPart.warranty) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedPart.weight && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Weight</Label>
                      <p className="text-sm">{selectedPart.weight} lbs</p>
                    </div>
                  )}
                  {selectedPart.dimensions && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Dimensions</Label>
                      <p className="text-sm">{selectedPart.dimensions}</p>
                    </div>
                  )}
                  {selectedPart.warranty && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Warranty</Label>
                      <p className="text-sm">{selectedPart.warranty}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Sync Information */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-500 mb-2 block">Sync Information</Label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <p>{new Date(selectedPart.updated_at).toLocaleString()}</p>
                  </div>
                  {selectedPart.keystone_last_sync && (
                    <div>
                      <span className="text-gray-500">Last Keystone Sync:</span>
                      <p>{new Date(selectedPart.keystone_last_sync).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedPart.keystone_vcpn && (
                    <div>
                      <span className="text-gray-500">Keystone VCPN:</span>
                      <p>{selectedPart.keystone_vcpn}</p>
                    </div>
                  )}
                  {selectedPart.pricing_last_updated && (
                    <div>
                      <span className="text-gray-500">Pricing Updated:</span>
                      <p>{new Date(selectedPart.pricing_last_updated).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <Button
                  onClick={() => {
                    addToCart(selectedPart.id);
                    setIsPartDialogOpen(false);
                  }}
                  disabled={selectedPart.quantity === 0}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const newFavorites = new Set(favorites);
                    if (newFavorites.has(selectedPart.id)) {
                      newFavorites.delete(selectedPart.id);
                    } else {
                      newFavorites.add(selectedPart.id);
                    }
                    setFavorites(newFavorites);
                  }}
                  className="flex-1"
                >
                  <Heart 
                    className={`h-4 w-4 mr-2 ${
                      favorites.has(selectedPart.id) 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-400'
                    }`} 
                  />
                  {favorites.has(selectedPart.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        parts={parts}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
      />
    </div>
  );
};

export default PartsPage;


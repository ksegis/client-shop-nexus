// Complete Parts.tsx with Integrated Cart Drawer - ALL Existing Functionality Preserved
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Package, ShoppingCart, Search, Plus, Grid, List, Heart, Eye, RefreshCw, Database, RotateCcw, Clock, CheckCircle, XCircle, AlertTriangle, X, Minus, Trash2, ArrowRight } from "lucide-react";
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

// Import services
import InventorySyncService from "@/services/InventorySyncService";
import { getSyncScheduler } from "@/services/SyncScheduler";

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
  compatibility?: string[];
  features?: string[];
  images?: string[];
  rating?: number;
  reviews?: number;
  featured?: boolean;
  availability?: string;
  in_stock?: boolean;
}

interface SyncStatus {
  lastFullSync?: any;
  lastIncrementalSync?: any;
  pendingRequests: number;
  nextScheduledSync?: string;
  syncStats?: any;
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

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    console.log('🛒 Proceeding to checkout with items:', cartItems);
    toast({
      title: "Checkout",
      description: "Proceeding to checkout...",
      variant: "default",
    });
    
    // Add your checkout logic here
    // Example: router.push('/checkout');
  };

  // Backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
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

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Cart Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            {totalItems > 0 && (
              <Badge variant="secondary">{totalItems} items</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Cart Content */}
        <div className="flex flex-col h-full">
          {cartItems.length === 0 ? (
            /* Empty Cart State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Add some parts to get started</p>
              <Button onClick={onClose} variant="outline">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                      {/* Item Image Placeholder */}
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-gray-400" />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                        {item.sku && (
                          <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                        )}
                        {item.category && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {item.category}
                          </Badge>
                        )}
                        
                        {/* Price and Stock Status */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-semibold text-green-600">
                            ${item.price.toFixed(2)}
                          </span>
                          <span className={`text-xs ${item.inStock ? 'text-green-600' : 'text-red-600'}`}>
                            {item.inStock ? `${item.maxQuantity} in stock` : 'Out of stock'}
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
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
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Item Total */}
                        <div className="text-right mt-2">
                          <span className="text-sm font-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Cart Summary */}
              <div className="border-t p-4 space-y-4">
                {/* Clear Cart Button */}
                {cartItems.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearCart}
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                )}

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  {shipping === 0 && subtotal >= 100 && (
                    <p className="text-xs text-green-600">
                      Free shipping on orders over $100
                    </p>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  className="w-full"
                  size="lg"
                  disabled={cartItems.length === 0}
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                {/* Continue Shopping */}
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// Enhanced Parts component with integrated cart drawer
const Parts: React.FC = () => {
  // State management
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [filteredParts, setFilteredParts] = useState<InventoryPart[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Cart drawer state
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Loading and sync states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFullSyncing, setIsFullSyncing] = useState(false);
  const [lastDataUpdate, setLastDataUpdate] = useState<Date | null>(null);
  const [totalPartsCount, setTotalPartsCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ pendingRequests: 0 });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Services
  const [syncService, setSyncService] = useState<InventorySyncService | null>(null);
  const [scheduler, setScheduler] = useState<any>(null);

  const { toast } = useToast();

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('🔧 Initializing inventory services...');
        
        // Initialize sync service
        const inventorySync = new InventorySyncService();
        await inventorySync.initialize();
        setSyncService(inventorySync);

        // Initialize scheduler
        const syncScheduler = getSyncScheduler({
          enableDailySync: true,
          dailySyncTime: '02:00',
          enableIncrementalSync: false,
          maxConcurrentUpdates: 5
        });
        await syncScheduler.initialize();
        setScheduler(syncScheduler);

        console.log('✅ Services initialized successfully');
        
        // Load initial data from Supabase
        await loadInventoryFromSupabase(inventorySync);
        
        // Get sync status
        await updateSyncStatus(inventorySync);

      } catch (error) {
        console.error('❌ Failed to initialize services:', error);
        toast({
          title: "Initialization Error",
          description: "Failed to initialize inventory system. Loading cached data if available.",
          variant: "destructive",
        });
        
        // Try to load any cached data
        await loadCachedData();
      }
    };

    initializeServices();
  }, []);

  // Load cached data as fallback
  const loadCachedData = async () => {
    try {
      const cached = localStorage.getItem('inventory_cache');
      if (cached) {
        const cachedParts = JSON.parse(cached);
        setParts(cachedParts);
        setTotalPartsCount(cachedParts.length);
        setLastDataUpdate(new Date(localStorage.getItem('inventory_cache_time') || Date.now()));
        
        toast({
          title: "Loaded Cached Data",
          description: `Showing ${cachedParts.length} parts from cache`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('❌ Failed to load cached data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load inventory data from Supabase
  const loadInventoryFromSupabase = async (service?: InventorySyncService, page: number = 1) => {
    const serviceToUse = service || syncService;
    if (!serviceToUse) {
      await loadCachedData();
      return;
    }

    try {
      setIsLoading(page === 1);
      console.log(`📊 Loading inventory from Supabase (page ${page})...`);

      const filters = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        inStockOnly,
        search: searchTerm || undefined,
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage
      };

      const result = await serviceToUse.getInventoryFromSupabase(filters);

      if (result.error) {
        throw new Error(result.error);
      }

      if (page === 1) {
        setParts(result.data);
        setTotalPartsCount(result.count);
        
        // Cache the data
        localStorage.setItem('inventory_cache', JSON.stringify(result.data));
        localStorage.setItem('inventory_cache_time', new Date().toISOString());
      } else {
        setParts(prev => [...prev, ...result.data]);
      }

      setHasMoreData(result.data.length === itemsPerPage);
      setLastDataUpdate(new Date());
      
      console.log(`✅ Loaded ${result.data.length} parts from Supabase (total: ${result.count})`);

    } catch (error: any) {
      console.error('❌ Error loading inventory from Supabase:', error);
      
      toast({
        title: "Data Loading Error",
        description: "Failed to load from database. Showing cached data if available.",
        variant: "destructive",
      });
      
      // Fallback to cached data
      if (page === 1) {
        await loadCachedData();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update sync status
  const updateSyncStatus = async (service?: InventorySyncService) => {
    const serviceToUse = service || syncService;
    if (!serviceToUse) return;

    try {
      console.log('📈 Loading sync status...');
      const status = await serviceToUse.getSyncStatus();
      setSyncStatus(status);
      console.log('✅ Sync status loaded:', status);
    } catch (error) {
      console.error('❌ Error loading sync status:', error);
    }
  };

  // Trigger manual full sync with timeout and proper error handling
  const handleFullSync = async () => {
    if (!scheduler) {
      toast({
        title: "Service Not Available",
        description: "Sync service is not initialized. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    console.log('🔄 Starting full sync...');
    setIsFullSyncing(true);
    
    // Set a timeout to prevent endless spinning
    const timeoutId = setTimeout(() => {
      console.log('⏰ Full sync timeout reached');
      setIsFullSyncing(false);
      toast({
        title: "Sync Timeout",
        description: "Sync operation timed out after 60 seconds. Please try again.",
        variant: "destructive",
      });
    }, 60000); // 60 second timeout

    try {
      toast({
        title: "Starting Full Sync",
        description: "Syncing all inventory data from Keystone API...",
        variant: "default",
      });

      console.log('📡 Calling scheduler.triggerFullSync()...');
      const result = await scheduler.triggerFullSync();
      
      clearTimeout(timeoutId);
      console.log('✅ Full sync result:', result);
      
      if (result.success) {
        toast({
          title: "Sync Completed",
          description: result.message,
          variant: "default",
        });
        
        // Reload data from Supabase
        await loadInventoryFromSupabase();
        await updateSyncStatus();
      } else {
        toast({
          title: "Sync Failed",
          description: result.message,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('❌ Full sync error:', error);
      toast({
        title: "Sync Error",
        description: `Failed to sync inventory: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      console.log('🏁 Full sync completed, resetting state...');
      setIsFullSyncing(false);
    }
  };

  // Request individual part update
  const handlePartUpdate = async (keystoneVcpn: string, immediate: boolean = false) => {
    if (!scheduler || !keystoneVcpn) {
      toast({
        title: "Update Not Available",
        description: "Sync service is not available or part has no Keystone VCPN.",
        variant: "destructive",
      });
      return;
    }

    try {
      let result;
      
      if (immediate) {
        toast({
          title: "Updating Part",
          description: `Fetching latest data for ${keystoneVcpn}...`,
          variant: "default",
        });
        
        result = await scheduler.updatePartNow(keystoneVcpn);
      } else {
        result = await scheduler.requestPartUpdate(keystoneVcpn, 1);
      }

      if (result.success) {
        toast({
          title: immediate ? "Part Updated" : "Update Requested",
          description: result.message,
          variant: "default",
        });
        
        if (immediate) {
          await loadInventoryFromSupabase();
        }
      } else {
        toast({
          title: "Update Failed",
          description: result.message,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('❌ Part update error:', error);
      toast({
        title: "Update Error",
        description: `Failed to update part: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      setCurrentPage(1);
      await loadInventoryFromSupabase();
      await updateSyncStatus();
      toast({
        title: "Data Refreshed",
        description: "Inventory data has been refreshed",
        variant: "default",
      });
    } catch (error) {
      console.error('❌ Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [syncService]);

  // Load more data
  const loadMoreData = useCallback(async () => {
    if (!hasMoreData || isLoading) return;
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await loadInventoryFromSupabase(syncService, nextPage);
  }, [currentPage, hasMoreData, isLoading, syncService]);

  // Filter and search logic
  useEffect(() => {
    let filtered = [...parts];

    if (searchTerm) {
      filtered = filtered.filter(part =>
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (part.sku && part.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (part.keystone_vcpn && part.keystone_vcpn.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (part.description && part.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (part.category && part.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(part => part.category === selectedCategory);
    }

    filtered = filtered.filter(part => 
      (part.price || 0) >= priceRange[0] && (part.price || 0) <= priceRange[1]
    );

    if (inStockOnly) {
      filtered = filtered.filter(part => part.quantity > 0);
    }

    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof InventoryPart];
      let bValue: any = b[sortBy as keyof InventoryPart];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredParts(filtered);
  }, [parts, searchTerm, selectedCategory, priceRange, inStockOnly, sortBy, sortOrder]);

  // Reload data when filters change
  useEffect(() => {
    const delayedReload = setTimeout(() => {
      setCurrentPage(1);
      loadInventoryFromSupabase();
    }, 500);

    return () => clearTimeout(delayedReload);
  }, [selectedCategory, inStockOnly, searchTerm]);

  // Get unique categories
  const categories = Array.from(new Set(parts.map(part => part.category).filter(Boolean)));

  // Cart management functions
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
    toast({
      title: "Added to Cart",
      description: `${part?.name} (${quantity}) added to cart.`,
      variant: "default",
    });
  };

  // Update cart quantity
  const updateCartQuantity = (partId: string, quantity: number) => {
    console.log('🛒 Updating cart quantity:', partId, 'to:', quantity);
    
    setCart(prev => {
      const newCart = { ...prev };
      if (quantity <= 0) {
        delete newCart[partId];
      } else {
        newCart[partId] = quantity;
      }
      console.log('🛒 Updated cart state:', newCart);
      return newCart;
    });
  };

  // Remove item from cart
  const removeFromCart = (partId: string) => {
    console.log('🛒 Removing from cart:', partId);
    
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[partId];
      console.log('🛒 Updated cart state:', newCart);
      return newCart;
    });
    
    const part = parts.find(p => p.id === partId);
    toast({
      title: "Item Removed",
      description: `${part?.name} removed from cart`,
      variant: "default",
    });
  };

  // Clear entire cart
  const clearCart = () => {
    console.log('🛒 Clearing entire cart');
    setCart({});
    toast({
      title: "Cart Cleared",
      description: "All items removed from cart",
      variant: "default",
    });
  };

  // Favorites management
  const toggleFavorite = (partId: string) => {
    setFavorites(prev => 
      prev.includes(partId) 
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    );
  };

  const cartItemCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  const cartTotalValue = Object.entries(cart).reduce((total, [partId, quantity]) => {
    const part = parts.find(p => p.id === partId);
    return total + (part?.price || 0) * quantity;
  }, 0);

  // Format last update time
  const formatLastUpdate = (dateString?: string) => {
    if (!dateString) return 'Never synced';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just updated';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Get sync status badge
  const getSyncStatusBadge = (part: InventoryPart) => {
    if (!part.keystone_synced) {
      return <Badge variant="secondary">Not Synced</Badge>;
    }
    
    switch (part.keystone_sync_status) {
      case 'synced':
        return <Badge variant="default">Synced</Badge>;
      case 'failed':
        return <Badge variant="destructive">Sync Failed</Badge>;
      case 'not_found':
        return <Badge variant="outline">Not Found</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">{part.keystone_sync_status}</Badge>;
    }
  };

  // Render part card
  const renderPartCard = (part: InventoryPart) => (
    <Card key={part.id} className="group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{part.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-600">
                {part.sku || part.keystone_vcpn || 'No SKU'}
              </p>
              {part.category && (
                <Badge variant="outline" className="text-xs">
                  {part.category}
                </Badge>
              )}
              {getSyncStatusBadge(part)}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(part.id)}
              className={favorites.includes(part.id) ? 'text-red-500' : 'text-gray-400'}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPart(part)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {part.keystone_vcpn && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePartUpdate(part.keystone_vcpn!, true)}
                title="Update this part from Keystone"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {part.description && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-3">{part.description}</p>
        )}
        
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-2xl font-bold text-green-600">
              ${(part.price || 0).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">
              Stock: {part.quantity} {part.warehouse && `(${part.warehouse})`}
            </p>
          </div>
          <div className="text-right">
            <Badge variant={part.quantity > 0 ? "default" : "secondary"}>
              {part.quantity > 0 ? "In Stock" : "Out of Stock"}
            </Badge>
            <p className="text-xs text-gray-400 mt-1">
              {formatLastUpdate(part.keystone_last_sync)}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => addToCart(part.id)}
            disabled={part.quantity <= 0}
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
          {cart[part.id] && (
            <Badge variant="outline" className="px-2 py-1">
              {cart[part.id]}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Parts Inventory</h1>
          <div className="flex items-center gap-2 mt-1">
            <Database className="h-4 w-4 text-blue-500" />
            <p className="text-gray-600">
              Database • {totalPartsCount.toLocaleString()} parts
            </p>
            {lastDataUpdate && (
              <p className="text-sm text-gray-400">
                • Updated {lastDataUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleFullSync}
            disabled={isFullSyncing}
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isFullSyncing ? 'animate-spin' : ''}`} />
            {isFullSyncing ? 'Syncing...' : 'Full Sync'}
          </Button>
          
          {/* Enhanced Cart Button */}
          <Button 
            variant="outline" 
            className="relative"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart ({cartItemCount})
            {cartItemCount > 0 && (
              <>
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {cartItemCount}
                </Badge>
                <span className="ml-2 text-sm text-green-600">
                  ${cartTotalValue.toFixed(2)}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sync Status Information */}
      {syncStatus && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium">Last Full Sync</p>
                <p className="text-gray-600">
                  {syncStatus.lastFullSync 
                    ? new Date(syncStatus.lastFullSync.started_at).toLocaleString()
                    : 'Never'
                  }
                </p>
              </div>
              <div>
                <p className="font-medium">Next Scheduled Sync</p>
                <p className="text-gray-600">
                  {syncStatus.nextScheduledSync 
                    ? new Date(syncStatus.nextScheduledSync).toLocaleString()
                    : 'Not scheduled'
                  }
                </p>
              </div>
              <div>
                <p className="font-medium">Pending Updates</p>
                <p className="text-gray-600">
                  {syncStatus.pendingRequests} parts queued
                </p>
              </div>
              <div>
                <p className="font-medium">Sync Statistics</p>
                <p className="text-gray-600">
                  {syncStatus.syncStats ? 
                    `${syncStatus.syncStats.synced_parts}/${syncStatus.syncStats.total_parts} synced` :
                    'Loading...'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Parts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, SKU, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
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
            </div>
            
            <div>
              <Label htmlFor="sort">Sort By</Label>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="price-asc">Price Low-High</SelectItem>
                  <SelectItem value="price-desc">Price High-Low</SelectItem>
                  <SelectItem value="quantity-desc">Stock High-Low</SelectItem>
                  <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="in-stock"
                checked={inStockOnly}
                onCheckedChange={setInStockOnly}
              />
              <Label htmlFor="in-stock">In Stock Only</Label>
            </div>
          </div>
          
          <div className="mt-4">
            <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={1000}
              step={10}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {filteredParts.length} of {totalPartsCount.toLocaleString()} parts
        </p>
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

      {/* Parts Display */}
      <LoadingWrapper
        isLoading={isLoading}
        hasData={parts.length > 0}
        loadingMessage="Loading inventory from database..."
      >
        {filteredParts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Parts Found</h3>
              <p className="text-gray-500">
                {parts.length === 0 
                  ? "No inventory data available. Try running a full sync to load data from Keystone."
                  : "No parts match your current filters. Try adjusting your search criteria."
                }
              </p>
              {parts.length === 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleFullSync}
                  className="mt-4"
                  disabled={isFullSyncing}
                >
                  <RotateCcw className={`h-4 w-4 mr-2 ${isFullSyncing ? 'animate-spin' : ''}`} />
                  {isFullSyncing ? 'Syncing...' : 'Sync Inventory'}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredParts.map(renderPartCard)}
            </div>
            
            {/* Load More Button */}
            {hasMoreData && (
              <div className="text-center mt-6">
                <Button 
                  variant="outline" 
                  onClick={loadMoreData}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Load More Parts
                </Button>
              </div>
            )}
          </>
        )}
      </LoadingWrapper>

      {/* Part Details Dialog */}
      <Dialog open={!!selectedPart} onOpenChange={() => setSelectedPart(null)}>
        <DialogContent className="max-w-2xl">
          {selectedPart && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPart.name}</DialogTitle>
                <DialogDescription>
                  SKU: {selectedPart.sku || selectedPart.keystone_vcpn || 'No SKU'}
                  {selectedPart.category && ` • ${selectedPart.category}`}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedPart.description || 'No description available'}
                  </p>
                  
                  <h4 className="font-semibold mb-2">Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span>{selectedPart.category || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-semibold">${(selectedPart.price || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stock:</span>
                      <span>{selectedPart.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Warehouse:</span>
                      <span>{selectedPart.warehouse || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Keystone VCPN:</span>
                      <span>{selectedPart.keystone_vcpn || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Synced:</span>
                      <span>{formatLastUpdate(selectedPart.keystone_last_sync)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sync Status:</span>
                      <span>{getSyncStatusBadge(selectedPart)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Actions</h4>
                  <div className="space-y-2">
                    <Button
                      onClick={() => addToCart(selectedPart.id)}
                      disabled={selectedPart.quantity <= 0}
                      className="w-full"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => toggleFavorite(selectedPart.id)}
                      className="w-full"
                    >
                      <Heart className={`h-4 w-4 mr-2 ${favorites.includes(selectedPart.id) ? 'fill-current text-red-500' : ''}`} />
                      {favorites.includes(selectedPart.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                    </Button>
                    {selectedPart.keystone_vcpn && (
                      <Button
                        variant="outline"
                        onClick={() => handlePartUpdate(selectedPart.keystone_vcpn!, true)}
                        className="w-full"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Update from Keystone
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
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

export default Parts;


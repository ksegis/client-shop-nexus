// Simplified Parts Page - No external component dependencies
// Works with existing inventory table structure
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Package, ShoppingCart, Search, Plus, Grid, List, Heart, Eye, RefreshCw, Database, Sync, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
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

// Enhanced Parts component using your existing inventory table
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
  
  // Loading and sync states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
        console.log('Initializing inventory services...');
        
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

        console.log('Services initialized successfully');
        
        // Load initial data from Supabase
        await loadInventoryFromSupabase(inventorySync);
        
        // Get sync status
        await updateSyncStatus(inventorySync);

      } catch (error) {
        console.error('Failed to initialize services:', error);
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
      console.error('Failed to load cached data:', error);
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
      console.log(`Loading inventory from Supabase (page ${page})...`);

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
      
      console.log(`Loaded ${result.data.length} parts from Supabase (total: ${result.count})`);

    } catch (error: any) {
      console.error('Error loading inventory from Supabase:', error);
      
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
      const status = await serviceToUse.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error getting sync status:', error);
    }
  };

  // Trigger manual full sync
  const handleFullSync = async () => {
    if (!scheduler) {
      toast({
        title: "Service Not Available",
        description: "Sync service is not initialized. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRefreshing(true);
      
      toast({
        title: "Starting Full Sync",
        description: "Syncing all inventory data from Keystone API...",
        variant: "default",
      });

      const result = await scheduler.triggerFullSync();
      
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
      console.error('Full sync error:', error);
      toast({
        title: "Sync Error",
        description: `Failed to sync inventory: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
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
      console.error('Part update error:', error);
      toast({
        title: "Update Error",
        description: `Failed to update part: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setCurrentPage(1);
    await loadInventoryFromSupabase();
    await updateSyncStatus();
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

  // Cart management
  const addToCart = (partId: string, quantity: number = 1) => {
    setCart(prev => ({
      ...prev,
      [partId]: (prev[partId] || 0) + quantity
    }));
    
    const part = parts.find(p => p.id === partId);
    toast({
      title: "Added to Cart",
      description: `${part?.name} (${quantity}) added to cart.`,
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
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleFullSync}
            disabled={isRefreshing}
          >
            <Sync className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Full Sync
          </Button>
          <Button variant="outline" className="relative">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart ({cartItemCount})
            {cartItemCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {cartItemCount}
              </Badge>
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
                  disabled={isRefreshing}
                >
                  <Sync className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Sync Inventory
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
    </div>
  );
};

export default Parts;


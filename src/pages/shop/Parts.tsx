import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Package, ShoppingCart, Search, Plus, Grid, List, Heart, Eye, RefreshCw, X, Minus, Trash2, ArrowRight, DollarSign, TrendingUp, TrendingDown, Truck, MapPin, Clock, Shield, Edit, CheckCircle, Timer } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

// Import the ProductPriceCheck component
import ProductPriceCheck from '@/components/product_price_check_component';

// Import minimal cart system
import { useCart } from '@/lib/minimal_cart_context';
import { AddToCartButton, CartWidget } from '@/components/minimal_cart_components';

// Simplified interface for inventory parts
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
  
  // Optional additional columns
  warehouse?: string;
  location?: string;
  brand?: string;
  weight?: number;
  dimensions?: string;
  warranty?: string;
  list_price?: number;
  discount_percentage?: number;
}

// Loading wrapper component
const LoadingWrapper = ({ isLoading, children, message = "Loading..." }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">{message}</span>
        </div>
      </div>
    );
  }
  return children;
};

// Pricing display component with ProductPriceCheck integration
const PricingDisplay = ({ part, className = "" }) => {
  const [showPriceCheck, setShowPriceCheck] = useState(false);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-green-600">${part.price}</span>
        {part.keystone_vcpn && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPriceCheck(!showPriceCheck)}
            className="h-6 px-2 text-xs"
          >
            <DollarSign className="h-3 w-3 mr-1" />
            Check Price
          </Button>
        )}
      </div>
      
      {part.cost && (
        <div className="text-xs text-muted-foreground">
          Cost: ${part.cost} | Margin: {((part.price - part.cost) / part.cost * 100).toFixed(1)}%
        </div>
      )}
      
      {part.list_price && part.list_price > part.price && (
        <div className="text-xs text-muted-foreground line-through">
          List: ${part.list_price}
        </div>
      )}

      {showPriceCheck && part.keystone_vcpn && (
        <div className="mt-2 p-2 border rounded-lg bg-gray-50">
          <ProductPriceCheck vcpn={part.keystone_vcpn} />
        </div>
      )}
    </div>
  );
};

// Main Parts component
const Parts = () => {
  // State management
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [filteredParts, setFilteredParts] = useState<InventoryPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const { itemCount, total } = useCart(); // Use minimal cart system

  // Cache management
  const CACHE_KEY = 'parts_inventory_cache';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Load cached data
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        if (now - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
    return null;
  }, []);

  // Save to cache
  const saveToCache = useCallback((data: InventoryPart[]) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, []);

  // Load favorites from localStorage
  const loadFavorites = useCallback(() => {
    try {
      const saved = localStorage.getItem('parts_favorites');
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = useCallback((newFavorites: Set<string>) => {
    try {
      localStorage.setItem('parts_favorites', JSON.stringify([...newFavorites]));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }, []);

  // Mock data for development
  const getMockData = useCallback((): InventoryPart[] => {
    return [
      {
        id: '1',
        name: 'LED Light Bar 20"',
        description: 'High-performance LED light bar with flood and spot beam pattern',
        sku: 'KS-82015',
        quantity: 15,
        price: 149.95,
        cost: 89.97,
        category: 'Lighting',
        supplier: 'Keystone Automotive',
        reorder_level: 5,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T14:30:00Z',
        keystone_vcpn: 'KS-82015',
        keystone_synced: true,
        keystone_last_sync: '2024-01-20T14:30:00Z',
        warehouse: 'Main',
        location: 'A1-B2',
        brand: 'ProLight',
        weight: 3.2,
        dimensions: '20" x 3" x 4"',
        warranty: '2 years',
        list_price: 199.95,
        discount_percentage: 25
      },
      {
        id: '2',
        name: 'Black Led Bull Bar Toyota',
        description: 'Heavy-duty black LED bull bar designed for Toyota trucks',
        sku: 'B-74060',
        quantity: 8,
        price: 299.95,
        cost: 179.97,
        category: 'Protection',
        supplier: 'Keystone Automotive',
        reorder_level: 3,
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-18T16:45:00Z',
        keystone_vcpn: 'B-74060',
        keystone_synced: true,
        keystone_last_sync: '2024-01-18T16:45:00Z',
        warehouse: 'Main',
        location: 'C3-D4',
        brand: 'BullGuard',
        weight: 45.0,
        dimensions: '72" x 8" x 6"',
        warranty: '3 years',
        list_price: 399.95,
        discount_percentage: 25
      },
      {
        id: '3',
        name: 'Dual Battery Tray Kit',
        description: 'Complete dual battery tray system with mounting hardware',
        sku: 'KS-89567',
        quantity: 12,
        price: 89.95,
        cost: 53.97,
        category: 'Electrical',
        supplier: 'Keystone Automotive',
        reorder_level: 4,
        created_at: '2024-01-12T11:30:00Z',
        updated_at: '2024-01-19T13:15:00Z',
        keystone_vcpn: 'KS-89567',
        keystone_synced: true,
        keystone_last_sync: '2024-01-19T13:15:00Z',
        warehouse: 'Main',
        location: 'E5-F6',
        brand: 'PowerMax',
        weight: 8.5,
        dimensions: '14" x 10" x 4"',
        warranty: '1 year',
        list_price: 119.95,
        discount_percentage: 25
      },
      {
        id: '4',
        name: 'Grill Guard Mid-Size',
        description: 'Mid-size grill guard with integrated light mounting points',
        sku: 'KS-88923',
        quantity: 6,
        price: 199.95,
        cost: 119.97,
        category: 'Protection',
        supplier: 'Keystone Automotive',
        reorder_level: 2,
        created_at: '2024-01-08T14:20:00Z',
        updated_at: '2024-01-17T10:30:00Z',
        keystone_vcpn: 'KS-88923',
        keystone_synced: true,
        keystone_last_sync: '2024-01-17T10:30:00Z',
        warehouse: 'Main',
        location: 'G7-H8',
        brand: 'GuardPro',
        weight: 28.0,
        dimensions: '48" x 6" x 4"',
        warranty: '2 years',
        list_price: 249.95,
        discount_percentage: 20
      },
      {
        id: '5',
        name: 'Truck Bed Liner',
        description: 'Drop-in truck bed liner for full-size pickups',
        sku: 'E7623',
        quantity: 4,
        price: 190.00,
        cost: 250.00, // Negative margin example
        category: 'Protection',
        supplier: 'Keystone Automotive',
        reorder_level: 2,
        created_at: '2024-01-05T12:00:00Z',
        updated_at: '2024-01-16T09:20:00Z',
        keystone_vcpn: 'E7623',
        keystone_synced: true,
        keystone_last_sync: '2024-01-16T09:20:00Z',
        warehouse: 'Main',
        location: 'I9-J10',
        brand: 'BedGuard',
        weight: 35.0,
        dimensions: '96" x 60" x 20"',
        warranty: '5 years',
        list_price: 299.95,
        discount_percentage: 37
      }
    ];
  }, []);

  // Fetch parts data
  const fetchParts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to load from cache first
      const cachedData = loadFromCache();
      if (cachedData) {
        setParts(cachedData);
        setLoading(false);
        return;
      }

      // For now, use mock data
      // In production, replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      const mockData = getMockData();
      setParts(mockData);
      saveToCache(mockData);
      
    } catch (err) {
      console.error('Error fetching parts:', err);
      setError('Failed to load parts inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, getMockData, saveToCache]);

  // Initialize data
  useEffect(() => {
    fetchParts();
    loadFavorites();
  }, [fetchParts, loadFavorites]);

  // Filter and sort parts
  const processedParts = useMemo(() => {
    let filtered = parts.filter(part => {
      // Search filter
      const searchMatch = !searchTerm || 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.keystone_vcpn?.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const categoryMatch = selectedCategory === 'all' || part.category === selectedCategory;

      // Price range filter
      const priceMatch = part.price >= priceRange[0] && part.price <= priceRange[1];

      // Stock filter
      const stockMatch = !showInStockOnly || part.quantity > 0;

      return searchMatch && categoryMatch && priceMatch && stockMatch;
    });

    // Sort
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

    return filtered;
  }, [parts, searchTerm, selectedCategory, priceRange, showInStockOnly, sortBy, sortOrder]);

  // Update filtered parts when processed parts change
  useEffect(() => {
    setFilteredParts(processedParts);
    setCurrentPage(1); // Reset to first page when filters change
  }, [processedParts]);

  // Pagination
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParts = filteredParts.slice(startIndex, endIndex);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(parts.map(part => part.category).filter(Boolean))];
    return cats.sort();
  }, [parts]);

  // Toggle favorite
  const toggleFavorite = useCallback((partId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(partId)) {
        newFavorites.delete(partId);
      } else {
        newFavorites.add(partId);
      }
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, [saveFavorites]);

  // Handle part detail view
  const viewPartDetails = useCallback((part: InventoryPart) => {
    setSelectedPart(part);
    setIsDetailDialogOpen(true);
  }, []);

  // Render part card for grid view
  const renderPartCard = useCallback((part: InventoryPart) => {
    const isInStock = part.quantity > 0;
    const isFavorite = favorites.has(part.id);
    const isLowStock = part.quantity <= (part.reorder_level || 0);

    return (
      <Card key={part.id} className="group hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
                {part.name}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {part.sku} • {part.category}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(part.id)}
              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Part Image Placeholder */}
          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>

          {/* Description */}
          {part.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {part.description}
            </p>
          )}

          {/* Pricing */}
          <PricingDisplay part={part} />

          {/* Stock Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={isInStock ? "default" : "destructive"}>
                {isInStock ? `${part.quantity} in stock` : 'Out of stock'}
              </Badge>
              {isLowStock && isInStock && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Low Stock
                </Badge>
              )}
            </div>
          </div>

          {/* Keystone Sync Status */}
          {part.keystone_vcpn && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Keystone Synced</span>
              {part.keystone_last_sync && (
                <span>• {new Date(part.keystone_last_sync).toLocaleDateString()}</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <AddToCartButton
              vcpn={part.keystone_vcpn || part.sku || ''}
              name={part.name}
              price={part.price}
              sku={part.sku}
              category={part.category}
              inStock={isInStock}
              maxQuantity={part.quantity}
              weight={part.weight}
              className="flex-1"
              onSuccess={() => {
                toast({
                  title: "Added to Cart",
                  description: `${part.name} has been added to your cart.`,
                });
              }}
              onError={(error) => {
                toast({
                  title: "Error",
                  description: error,
                  variant: "destructive",
                });
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewPartDetails(part)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }, [favorites, toggleFavorite, viewPartDetails, toast]);

  // Render part row for list view
  const renderPartRow = useCallback((part: InventoryPart) => {
    const isInStock = part.quantity > 0;
    const isFavorite = favorites.has(part.id);

    return (
      <TableRow key={part.id} className="group">
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
              <Package className="h-5 w-5 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium group-hover:text-blue-600 transition-colors">
                {part.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {part.sku} {part.keystone_vcpn && `• ${part.keystone_vcpn}`}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{part.category}</Badge>
        </TableCell>
        <TableCell>
          <PricingDisplay part={part} />
        </TableCell>
        <TableCell>
          <Badge variant={isInStock ? "default" : "destructive"}>
            {part.quantity}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <AddToCartButton
              vcpn={part.keystone_vcpn || part.sku || ''}
              name={part.name}
              price={part.price}
              sku={part.sku}
              category={part.category}
              inStock={isInStock}
              maxQuantity={part.quantity}
              weight={part.weight}
              size="sm"
              onSuccess={() => {
                toast({
                  title: "Added to Cart",
                  description: `${part.name} has been added to your cart.`,
                });
              }}
              onError={(error) => {
                toast({
                  title: "Error",
                  description: error,
                  variant: "destructive",
                });
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(part.id)}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => viewPartDetails(part)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }, [favorites, toggleFavorite, viewPartDetails, toast]);

  // Pagination component
  const Pagination = () => {
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        const end = Math.min(totalPages, start + maxVisible - 1);
        
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredParts.length)} of {filteredParts.length} parts
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {getPageNumbers().map(page => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className="w-8"
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Cart Widget */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Parts & Inventory</h1>
          <p className="text-muted-foreground">
            Database • {parts.length} of {parts.length} parts
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Cart Status */}
          {itemCount > 0 && (
            <Badge variant="secondary" className="text-sm">
              <ShoppingCart className="h-3 w-3 mr-1" />
              {itemCount} items • ${total.toFixed(2)}
            </Badge>
          )}
          
          {/* Cart Widget */}
          <CartWidget />
          
          <Button onClick={fetchParts} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search parts by name, SKU, VCPN, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
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

            {/* Sort */}
            <div className="space-y-2">
              <Label htmlFor="sort">Sort By</Label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="quantity">Quantity</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="updated">Updated</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-3"
                >
                  {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* View Mode */}
            <div className="space-y-2">
              <Label>View</Label>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="flex-1"
                >
                  <Grid className="h-4 w-4 mr-1" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex-1"
                >
                  <List className="h-4 w-4 mr-1" />
                  List
                </Button>
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2 mb-4">
            <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={1000}
              step={10}
              className="w-full"
            />
          </div>

          {/* Additional Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="in-stock"
                checked={showInStockOnly}
                onCheckedChange={setShowInStockOnly}
              />
              <Label htmlFor="in-stock">Show in-stock items only</Label>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="items-per-page" className="text-sm">Items per page:</Label>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="48">48</SelectItem>
                  <SelectItem value="96">96</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parts Display */}
      <LoadingWrapper isLoading={loading}>
        {filteredParts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No parts found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentParts.map(renderPartCard)}
              </div>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentParts.map(renderPartRow)}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Card>
                <CardContent className="p-4">
                  <Pagination />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </LoadingWrapper>

      {/* Part Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPart?.name}</DialogTitle>
            <DialogDescription>
              Part details and specifications
            </DialogDescription>
          </DialogHeader>
          
          {selectedPart && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedPart.description || 'No description available'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">SKU</Label>
                      <p className="text-sm mt-1">{selectedPart.sku}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <p className="text-sm mt-1">{selectedPart.category}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Supplier</Label>
                      <p className="text-sm mt-1">{selectedPart.supplier}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Brand</Label>
                      <p className="text-sm mt-1">{selectedPart.brand || 'N/A'}</p>
                    </div>
                  </div>

                  {selectedPart.keystone_vcpn && (
                    <div>
                      <Label className="text-sm font-medium">Keystone VCPN</Label>
                      <p className="text-sm mt-1">{selectedPart.keystone_vcpn}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <PricingDisplay part={selectedPart} />
                  
                  <div>
                    <Label className="text-sm font-medium">Stock Information</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Stock:</span>
                        <Badge variant={selectedPart.quantity > 0 ? "default" : "destructive"}>
                          {selectedPart.quantity}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Reorder Level:</span>
                        <span>{selectedPart.reorder_level || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Location:</span>
                        <span>{selectedPart.location || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {selectedPart.dimensions && (
                    <div>
                      <Label className="text-sm font-medium">Specifications</Label>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Dimensions:</span>
                          <span>{selectedPart.dimensions}</span>
                        </div>
                        {selectedPart.weight && (
                          <div className="flex justify-between">
                            <span>Weight:</span>
                            <span>{selectedPart.weight} lbs</span>
                          </div>
                        )}
                        {selectedPart.warranty && (
                          <div className="flex justify-between">
                            <span>Warranty:</span>
                            <span>{selectedPart.warranty}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Check Integration */}
              {selectedPart.keystone_vcpn && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium mb-2 block">Real-Time Price Check</Label>
                  <ProductPriceCheck vcpn={selectedPart.keystone_vcpn} />
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t">
                <AddToCartButton
                  vcpn={selectedPart.keystone_vcpn || selectedPart.sku || ''}
                  name={selectedPart.name}
                  price={selectedPart.price}
                  sku={selectedPart.sku}
                  category={selectedPart.category}
                  inStock={selectedPart.quantity > 0}
                  maxQuantity={selectedPart.quantity}
                  weight={selectedPart.weight}
                  className="flex-1"
                  onSuccess={() => {
                    toast({
                      title: "Added to Cart",
                      description: `${selectedPart.name} has been added to your cart.`,
                    });
                  }}
                  onError={(error) => {
                    toast({
                      title: "Error",
                      description: error,
                      variant: "destructive",
                    });
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => toggleFavorite(selectedPart.id)}
                >
                  <Heart className={`h-4 w-4 ${favorites.has(selectedPart.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Parts;


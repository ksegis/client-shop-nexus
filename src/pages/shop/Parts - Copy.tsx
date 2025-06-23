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

// Import enhanced cart system with shipping
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
  const { itemCount, total } = useCart(); // Use enhanced cart system

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

  // Render part card for grid viewing
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
          {/* Product Image Placeholder */}
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400" />
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <Badge variant={isInStock ? (isLowStock ? "destructive" : "secondary") : "outline"}>
              {isInStock ? `${part.quantity} in stock` : 'Out of stock'}
            </Badge>
            {isLowStock && isInStock && (
              <Badge variant="outline" className="text-orange-600">
                Low Stock
              </Badge>
            )}
          </div>

          {/* Pricing */}
          <PricingDisplay part={part} />

          {/* Description */}
          {part.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {part.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <AddToCartButton
              vcpn={part.keystone_vcpn || part.sku || part.id}
              name={part.name}
              price={part.price}
              sku={part.sku}
              category={part.category}
              inStock={isInStock}
              maxQuantity={part.quantity}
              weight={part.weight}
              className="flex-1"
              size="sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewPartDetails(part)}
              className="px-3"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }, [favorites, toggleFavorite, viewPartDetails]);

  // Render part row for list view
  const renderPartRow = useCallback((part: InventoryPart) => {
    const isInStock = part.quantity > 0;
    const isFavorite = favorites.has(part.id);
    const isLowStock = part.quantity <= (part.reorder_level || 0);

    return (
      <TableRow key={part.id} className="group hover:bg-muted/50">
        <TableCell className="w-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleFavorite(part.id)}
            className="h-8 w-8 p-0"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </TableCell>
        
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
              <Package className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <div className="font-medium">{part.name}</div>
              <div className="text-sm text-muted-foreground">{part.sku}</div>
            </div>
          </div>
        </TableCell>
        
        <TableCell>{part.category}</TableCell>
        
        <TableCell>
          <PricingDisplay part={part} />
        </TableCell>
        
        <TableCell>
          <div className="flex items-center gap-2">
            <Badge variant={isInStock ? (isLowStock ? "destructive" : "secondary") : "outline"}>
              {part.quantity}
            </Badge>
            {isLowStock && isInStock && (
              <Badge variant="outline" className="text-orange-600 text-xs">
                Low
              </Badge>
            )}
          </div>
        </TableCell>
        
        <TableCell>
          <div className="flex items-center gap-2">
            <AddToCartButton
              vcpn={part.keystone_vcpn || part.sku || part.id}
              name={part.name}
              price={part.price}
              sku={part.sku}
              category={part.category}
              inStock={isInStock}
              maxQuantity={part.quantity}
              weight={part.weight}
              size="sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewPartDetails(part)}
              className="px-3"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }, [favorites, toggleFavorite, viewPartDetails]);

  // Render pagination
  const renderPagination = useCallback(() => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(i)}
          className="w-10"
        >
          {i}
        </Button>
      );
    }

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
          
          {startPage > 1 && (
            <>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} className="w-10">
                1
              </Button>
              {startPage > 2 && <span className="text-muted-foreground">...</span>}
            </>
          )}
          
          {pages}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-muted-foreground">...</span>}
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} className="w-10">
                {totalPages}
              </Button>
            </>
          )}
          
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
  }, [currentPage, totalPages, startIndex, endIndex, filteredParts.length]);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchParts} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header with Cart Widget */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Parts & Inventory</h1>
          <p className="text-muted-foreground">
            Database • {parts.length} of {parts.length} parts
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Cart Widget with Shipping */}
          <CartWidget />
          
          <Button onClick={fetchParts} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <Card className="mb-6">
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

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <Label>Category</Label>
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
            <div>
              <Label>Sort By</Label>
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
                  <SelectItem value="quantity-asc">Stock Low-High</SelectItem>
                  <SelectItem value="updated-desc">Recently Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode */}
            <div>
              <Label>View</Label>
              <div className="flex gap-1 mt-1">
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

            {/* Items per page */}
            <div>
              <Label>Items per page</Label>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger>
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

          {/* Price Range */}
          <div>
            <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={1000}
              step={10}
              className="mt-2"
            />
          </div>

          {/* Stock Filter */}
          <div className="flex items-center space-x-2">
            <Switch
              id="stock-filter"
              checked={showInStockOnly}
              onCheckedChange={setShowInStockOnly}
            />
            <Label htmlFor="stock-filter">Show in-stock items only</Label>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <LoadingWrapper isLoading={loading} message="Loading parts inventory...">
        {filteredParts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No parts found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                {currentParts.map(renderPartCard)}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <Card className="mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
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
            {renderPagination()}
          </>
        )}
      </LoadingWrapper>

      {/* Part Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPart?.name}</DialogTitle>
            <DialogDescription>
              {selectedPart?.sku} • {selectedPart?.category}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPart && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Product Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">SKU:</span> {selectedPart.sku}</div>
                    <div><span className="font-medium">VCPN:</span> {selectedPart.keystone_vcpn}</div>
                    <div><span className="font-medium">Brand:</span> {selectedPart.brand}</div>
                    <div><span className="font-medium">Category:</span> {selectedPart.category}</div>
                    <div><span className="font-medium">Supplier:</span> {selectedPart.supplier}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Inventory</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Quantity:</span> {selectedPart.quantity}</div>
                    <div><span className="font-medium">Reorder Level:</span> {selectedPart.reorder_level}</div>
                    <div><span className="font-medium">Location:</span> {selectedPart.location}</div>
                    <div><span className="font-medium">Warehouse:</span> {selectedPart.warehouse}</div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="font-semibold mb-2">Pricing</h4>
                <PricingDisplay part={selectedPart} />
              </div>

              {/* Description */}
              {selectedPart.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedPart.description}</p>
                </div>
              )}

              {/* Specifications */}
              <div>
                <h4 className="font-semibold mb-2">Specifications</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedPart.weight && (
                    <div><span className="font-medium">Weight:</span> {selectedPart.weight} lbs</div>
                  )}
                  {selectedPart.dimensions && (
                    <div><span className="font-medium">Dimensions:</span> {selectedPart.dimensions}</div>
                  )}
                  {selectedPart.warranty && (
                    <div><span className="font-medium">Warranty:</span> {selectedPart.warranty}</div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <AddToCartButton
                  vcpn={selectedPart.keystone_vcpn || selectedPart.sku || selectedPart.id}
                  name={selectedPart.name}
                  price={selectedPart.price}
                  sku={selectedPart.sku}
                  category={selectedPart.category}
                  inStock={selectedPart.quantity > 0}
                  maxQuantity={selectedPart.quantity}
                  weight={selectedPart.weight}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => toggleFavorite(selectedPart.id)}
                >
                  <Heart className={`h-4 w-4 mr-2 ${favorites.has(selectedPart.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  {favorites.has(selectedPart.id) ? 'Remove from Favorites' : 'Add to Favorites'}
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


import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Package, ShoppingCart, Search, Plus, Grid, List, Heart, Eye, RefreshCw, X, Minus, Trash2, ArrowRight, DollarSign, TrendingUp, TrendingDown, Truck, MapPin, Clock, Shield, Edit, CheckCircle, Timer, User, CreditCard, FileText, Star, Zap, UserSearch, UserPlus, Box } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import the ProductPriceCheck component
import ProductPriceCheck from '@/components/product_price_check_component';

// Import enhanced cart system with shipping
import { useCart } from '@/lib/minimal_cart_context';
import { AddToCartButton, CartWidget } from '@/components/minimal_cart_components';

// Import existing services - FIXED: Import singleton instances instead of classes
import { shippingQuoteService } from '@/services/shipping_quote_service';
import { DropshipOrderService } from '@/services/dropship_order_service';

// Import customer search service
import { CustomerSearchService } from '@/services/customer_search_service';

// Import kit components
import { 
  KitBadge, 
  KitComponentsDisplay, 
  CompactKitDisplay, 
  useKitCheck 
} from '@/components/kit_components_display';

// ✅ NEW: Import Supabase for real data
import { getSupabaseClient } from "@/lib/supabase";
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Customer search result interface
interface CustomerSearchResult {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  display_name: string;
}

// Customer record interface
interface CustomerRecord {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: 'customer' | 'staff' | 'admin';
  created_at: string;
  updated_at: string;
}

// ✅ UPDATED: Enhanced interface for real inventory parts
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
  
  // Kit support
  is_kit?: boolean;
  kit_component_count?: number;

  // ✅ NEW: Map real inventory fields to expected interface
  quantity_on_hand?: number; // Maps to quantity
}

// Customer interface for special orders
interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
}

// Shipping address interface
interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Shipping option interface
interface ShippingOption {
  id: string;
  carrier: string;
  service: string;
  cost: number;
  estimatedDays: number;
  deliveryDate: string;
}

// Grouped shipping options interface
interface GroupedShippingOptions {
  bestValue: ShippingOption | null;
  fastest: ShippingOption | null;
  others: ShippingOption[];
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

// Customer Search Component
const CustomerSearchComponent = ({ 
  onCustomerSelect, 
  selectedCustomer 
}: {
  onCustomerSelect: (customer: CustomerSearchResult | null) => void;
  selectedCustomer: CustomerSearchResult | null;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  // Debounced search function
  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await CustomerSearchService.searchCustomers(query);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Customer search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search customers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCustomers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchCustomers]);

  const handleCustomerSelect = (customer: CustomerSearchResult) => {
    onCustomerSelect(customer);
    setSearchQuery(customer.display_name);
    setShowResults(false);
    setSearchResults([]); // Clear search results after selection
  };

  const clearSelection = () => {
    onCustomerSelect(null);
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <UserSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {selectedCustomer && (
          <Button variant="outline" onClick={clearSelection}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {searchResults.map((customer) => (
            <div
              key={customer.id}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              onClick={() => handleCustomerSelect(customer)}
            >
              <div className="font-medium">{customer.display_name}</div>
              <div className="text-sm text-muted-foreground">{customer.email}</div>
              {customer.phone && (
                <div className="text-sm text-muted-foreground">{customer.phone}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selected Customer Display */}
      {selectedCustomer && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium text-blue-900">{selectedCustomer.display_name}</div>
              <div className="text-sm text-blue-700">{selectedCustomer.email}</div>
              {selectedCustomer.phone && (
                <div className="text-sm text-blue-700">{selectedCustomer.phone}</div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Price display component with cost margin calculation
const PriceDisplay = ({ part }: { part: InventoryPart }) => {
  const [showPriceCheck, setShowPriceCheck] = useState(false);
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-green-600">
          ${part.price.toFixed(2)}
        </span>
        {part.keystone_vcpn && (
          <Button
            variant="outline"
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

// Enhanced Shipping Options Component with Amazon-style grouping
const ShippingOptionsDisplay = ({ 
  shippingOptions, 
  selectedShipping, 
  onShippingSelect 
}: {
  shippingOptions: ShippingOption[];
  selectedShipping: string;
  onShippingSelect: (optionId: string) => void;
}) => {
  // State for collapsible "Other Options" section
  const [showOtherOptions, setShowOtherOptions] = useState(false);

  // Group shipping options by best value and fastest delivery
  const groupedOptions = useMemo((): GroupedShippingOptions => {
    if (shippingOptions.length === 0) {
      return { bestValue: null, fastest: null, others: [] };
    }

    // Find best value (lowest cost)
    const bestValue = shippingOptions.reduce((prev, current) => 
      prev.cost < current.cost ? prev : current
    );

    // Find fastest delivery (lowest estimated days)
    const fastest = shippingOptions.reduce((prev, current) => 
      prev.estimatedDays < current.estimatedDays ? prev : current
    );

    // Get remaining options (excluding best value and fastest if they're different)
    const others = shippingOptions.filter(option => 
      option.id !== bestValue.id && option.id !== fastest.id
    );

    return { bestValue, fastest, others };
  }, [shippingOptions]);

  const ShippingOptionCard = ({ 
    option, 
    isRecommended = false, 
    recommendationType = '',
    icon = null 
  }: {
    option: ShippingOption;
    isRecommended?: boolean;
    recommendationType?: string;
    icon?: React.ReactNode;
  }) => (
    <div className={`border rounded-lg p-4 transition-all hover:shadow-md ${
      selectedShipping === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
    } ${isRecommended ? 'border-green-500' : ''}`}>
      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="radio"
          name="shipping"
          value={option.id}
          checked={selectedShipping === option.id}
          onChange={(e) => onShippingSelect(e.target.value)}
          className="text-blue-600"
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {isRecommended && (
                <div className="flex items-center gap-1 mb-1">
                  {icon}
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    {recommendationType}
                  </Badge>
                </div>
              )}
              <div className="font-medium">{option.carrier} {option.service}</div>
              <div className="text-sm text-muted-foreground">
                Estimated delivery: {option.deliveryDate} ({option.estimatedDays} business days)
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">${option.cost.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </label>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Best Value Option */}
      {groupedOptions.bestValue && (
        <ShippingOptionCard
          option={groupedOptions.bestValue}
          isRecommended={true}
          recommendationType="Best Value"
          icon={<DollarSign className="h-3 w-3 text-green-600" />}
        />
      )}

      {/* Fastest Option (if different from best value) */}
      {groupedOptions.fastest && groupedOptions.fastest.id !== groupedOptions.bestValue?.id && (
        <ShippingOptionCard
          option={groupedOptions.fastest}
          isRecommended={true}
          recommendationType="Fastest"
          icon={<Zap className="h-3 w-3 text-green-600" />}
        />
      )}

      {/* Other Options (Collapsible) */}
      {groupedOptions.others.length > 0 && (
        <div>
          <Button
            variant="ghost"
            onClick={() => setShowOtherOptions(!showOtherOptions)}
            className="w-full justify-between p-2 h-auto"
          >
            <span className="text-sm font-medium">
              Other shipping options ({groupedOptions.others.length})
            </span>
            <ArrowRight className={`h-4 w-4 transition-transform ${showOtherOptions ? 'rotate-90' : ''}`} />
          </Button>
          
          {showOtherOptions && (
            <div className="space-y-2 mt-2">
              {groupedOptions.others.map(option => (
                <ShippingOptionCard key={option.id} option={option} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ✅ NEW: Real inventory data hook
const useInventoryData = () => {
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseClient();

  const loadInventoryData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading real inventory data from database...');
      
      const { data, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .order('name');

      if (fetchError) {
        console.error('❌ Error loading inventory:', fetchError);
        throw fetchError;
      }

      console.log(`✅ Loaded ${data?.length || 0} real inventory items`);
      
      // ✅ Map real inventory data to expected interface
      const mappedParts: InventoryPart[] = (data || []).map(item => ({
        id: item.id,
        name: item.name || 'Unnamed Part',
        description: item.description || '',
        sku: item.sku || '',
        quantity: item.quantity_on_hand || 0,
        price: item.list_price || item.cost || 0,
        cost: item.cost || 0,
        category: item.category || 'Uncategorized',
        supplier: item.supplier || '',
        reorder_level: item.reorder_level || 5,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
        core_charge: item.core_charge || 0,
        keystone_vcpn: item.keystone_vcpn || '',
        keystone_synced: item.keystone_synced || false,
        keystone_last_sync: item.keystone_last_sync || '',
        warehouse: item.warehouse || item.location || 'Main',
        location: item.location || '',
        brand: item.brand || item.manufacturer || '',
        weight: item.weight || 0,
        dimensions: item.dimensions || '',
        warranty: item.warranty || '',
        list_price: item.list_price || item.cost || 0,
        discount_percentage: item.discount_percentage || 0,
        is_kit: item.is_kit || false,
        kit_component_count: item.kit_component_count || 0,
        quantity_on_hand: item.quantity_on_hand || 0
      }));

      setParts(mappedParts);
      
    } catch (err) {
      console.error('❌ Failed to load inventory data:', err);
      setError('Failed to load inventory data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadInventoryData();
  }, [loadInventoryData]);

  return { parts, isLoading, error, refreshData: loadInventoryData };
};

// Main Parts component
export default function Parts() {
  const { toast } = useToast();
  
  // ✅ UPDATED: Use real inventory data instead of mock data
  const { parts: inventoryParts, isLoading: isLoadingParts, error: partsError, refreshData } = useInventoryData();
  
  // State management
  const [currentTab, setCurrentTab] = useState('parts');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Special orders state
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [specialOrderItems, setSpecialOrderItems] = useState<InventoryPart[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState('');
  const [isGettingShippingQuotes, setIsGettingShippingQuotes] = useState(false);

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location);
    url.searchParams.set('tab', currentTab);
    window.history.replaceState({}, '', url);
  }, [currentTab]);

  // ✅ UPDATED: Use real inventory data instead of mock data
  const mockParts = inventoryParts; // Use real data

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(mockParts.map(part => part.category).filter(Boolean)));
    return ['all', ...cats.sort()];
  }, [mockParts]);

  // Filter and sort parts
  const filteredParts = useMemo(() => {
    let filtered = mockParts.filter(part => {
      // Search filter
      const searchMatch = !searchTerm || 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.brand?.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const categoryMatch = selectedCategory === 'all' || part.category === selectedCategory;

      // Price filter
      const priceMatch = part.price >= priceRange[0] && part.price <= priceRange[1];

      // Favorites filter
      const favoritesMatch = !showFavoritesOnly || favorites.has(part.id);

      return searchMatch && categoryMatch && priceMatch && favoritesMatch;
    });

    // Sort parts
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
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
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        case 'updated':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return filtered;
  }, [mockParts, searchTerm, selectedCategory, priceRange, sortBy, sortOrder, favorites, showFavoritesOnly]);

  // Pagination
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const paginatedParts = filteredParts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, priceRange, sortBy, sortOrder, showFavoritesOnly]);

  // Toggle favorite
  const toggleFavorite = (partId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(partId)) {
        newFavorites.delete(partId);
      } else {
        newFavorites.add(partId);
      }
      return newFavorites;
    });
  };

  // ✅ UPDATED: Refresh data function now uses real data
  const refreshDataHandler = async () => {
    setIsLoading(true);
    try {
      await refreshData(); // Use real data refresh
      toast({
        title: "Data Refreshed",
        description: "Parts inventory has been updated from database."
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh inventory data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced Part card component with kit support
  const PartCard = ({ part }: { part: InventoryPart }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-gray-300">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-600 transition-colors">
              {part.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {part.description}
            </p>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {part.category}
              </Badge>
              {part.is_kit && <KitBadge />}
              {part.keystone_synced && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                  Synced
                </Badge>
              )}
              {part.quantity <= (part.reorder_level || 5) && (
                <Badge variant="destructive" className="text-xs">
                  Low Stock
                </Badge>
              )}
            </div>
            {/* Kit component count */}
            {part.is_kit && part.kit_component_count && (
              <CompactKitDisplay 
                kitVcpn={part.keystone_vcpn || part.id} 
                componentCount={part.kit_component_count}
                className="mb-2"
              />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleFavorite(part.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className={`h-4 w-4 ${favorites.has(part.id) ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">SKU:</span>
            <span className="font-mono">{part.sku}</span>
          </div>
          {part.keystone_vcpn && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">VCPN:</span>
              <span className="font-mono">{part.keystone_vcpn}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Stock:</span>
            <span className={`font-medium ${part.quantity <= (part.reorder_level || 5) ? 'text-red-600' : 'text-green-600'}`}>
              {part.quantity} units
            </span>
          </div>
          {part.location && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Location:</span>
              <span>{part.location}</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <PriceDisplay part={part} />
        </div>

        <div className="flex gap-2">
          <AddToCartButton 
            product={{
              id: part.id,
              name: part.name,
              price: part.price,
              sku: part.sku || '',
              image: '',
              category: part.category || '',
              inStock: part.quantity > 0,
              maxQuantity: part.quantity
            }}
            className="flex-1"
            disabled={part.quantity === 0}
          />
          <Button variant="outline" size="sm" className="px-3">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // List view component
  const PartListItem = ({ part }: { part: InventoryPart }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{part.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(part.id)}
                className="p-1"
              >
                <Heart className={`h-4 w-4 ${favorites.has(part.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{part.description}</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>SKU: {part.sku}</span>
              {part.keystone_vcpn && <span>VCPN: {part.keystone_vcpn}</span>}
              <span>Category: {part.category}</span>
              {part.location && <span>Location: {part.location}</span>}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {part.category}
              </Badge>
              {part.is_kit && <KitBadge />}
              {part.keystone_synced && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                  Synced
                </Badge>
              )}
              {part.quantity <= (part.reorder_level || 5) && (
                <Badge variant="destructive" className="text-xs">
                  Low Stock
                </Badge>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <PriceDisplay part={part} />
          </div>
          
          <div className="text-center">
            <div className={`text-lg font-bold ${part.quantity <= (part.reorder_level || 5) ? 'text-red-600' : 'text-green-600'}`}>
              {part.quantity}
            </div>
            <div className="text-sm text-muted-foreground">units</div>
          </div>
          
          <div className="flex gap-2">
            <AddToCartButton 
              product={{
                id: part.id,
                name: part.name,
                price: part.price,
                sku: part.sku || '',
                image: '',
                category: part.category || '',
                inStock: part.quantity > 0,
                maxQuantity: part.quantity
              }}
              disabled={part.quantity === 0}
            />
            <Button variant="outline" size="sm" className="px-3">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Add item to special order
  const addToSpecialOrder = (part: InventoryPart) => {
    setSpecialOrderItems(prev => {
      const existing = prev.find(item => item.id === part.id);
      if (existing) {
        return prev; // Don't add duplicates
      }
      return [...prev, part];
    });
    toast({
      title: "Added to Special Order",
      description: `${part.name} has been added to your special order.`
    });
  };

  // Remove item from special order
  const removeFromSpecialOrder = (partId: string) => {
    setSpecialOrderItems(prev => prev.filter(item => item.id !== partId));
  };

  // Get shipping quotes
  const getShippingQuotes = async () => {
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      toast({
        title: "Incomplete Address",
        description: "Please fill in all shipping address fields.",
        variant: "destructive"
      });
      return;
    }

    if (specialOrderItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add items to your special order first.",
        variant: "destructive"
      });
      return;
    }

    setIsGettingShippingQuotes(true);
    try {
      // Calculate total weight and value
      const totalWeight = specialOrderItems.reduce((sum, item) => sum + (item.weight || 1), 0);
      const totalValue = specialOrderItems.reduce((sum, item) => sum + item.price, 0);

      const quotes = await shippingQuoteService.getShippingQuotes({
        origin: {
          street: '123 Warehouse St',
          city: 'Distribution City',
          state: 'CA',
          zipCode: '90210',
          country: 'US'
        },
        destination: shippingAddress,
        packages: [{
          weight: Math.max(totalWeight, 1),
          dimensions: { length: 12, width: 12, height: 6 },
          value: totalValue
        }]
      });

      setShippingOptions(quotes);
      if (quotes.length > 0) {
        setSelectedShipping(quotes[0].id); // Select first option by default
      }

      toast({
        title: "Shipping Quotes Retrieved",
        description: `Found ${quotes.length} shipping options.`
      });
    } catch (error) {
      console.error('Shipping quote error:', error);
      toast({
        title: "Shipping Quote Error",
        description: "Failed to get shipping quotes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGettingShippingQuotes(false);
    }
  };

  // Submit special order
  const submitSpecialOrder = async () => {
    if (!selectedCustomer) {
      toast({
        title: "No Customer Selected",
        description: "Please select a customer for this special order.",
        variant: "destructive"
      });
      return;
    }

    if (specialOrderItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add items to your special order.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedShipping) {
      toast({
        title: "No Shipping Selected",
        description: "Please select a shipping option.",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedShippingOption = shippingOptions.find(opt => opt.id === selectedShipping);
      const totalValue = specialOrderItems.reduce((sum, item) => sum + item.price, 0);
      const shippingCost = selectedShippingOption?.cost || 0;

      const orderData = {
        customerId: selectedCustomer.id,
        customerEmail: selectedCustomer.email,
        items: specialOrderItems.map(item => ({
          partId: item.id,
          name: item.name,
          sku: item.sku,
          price: item.price,
          quantity: 1 // Default quantity for special orders
        })),
        shippingAddress,
        shippingOption: selectedShippingOption,
        notes: orderNotes,
        subtotal: totalValue,
        shippingCost,
        total: totalValue + shippingCost
      };

      await DropshipOrderService.createOrder(orderData);

      toast({
        title: "Special Order Submitted",
        description: "Your special order has been submitted successfully."
      });

      // Reset form
      setSpecialOrderItems([]);
      setOrderNotes('');
      setShippingOptions([]);
      setSelectedShipping('');
      setSelectedCustomer(null);
      setShippingAddress({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
      });

    } catch (error) {
      console.error('Special order submission error:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit special order. Please try again.",
        variant: "destructive"
      });
    }
  };

  // ✅ Show loading state for real data
  if (isLoadingParts) {
    return (
      <div className="container mx-auto p-6">
        <LoadingWrapper isLoading={true} message="Loading inventory from database..." />
      </div>
    );
  }

  // ✅ Show error state for real data
  if (partsError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Inventory</AlertTitle>
          <AlertDescription>
            {partsError}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshDataHandler}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Parts & Special Orders</h1>
          <p className="text-muted-foreground">
            Browse parts inventory and place special orders
          </p>
        </div>
        <div className="flex items-center gap-4">
          <CartWidget />
          <Button variant="outline" onClick={refreshDataHandler} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ✅ Show real data count */}
      {inventoryParts.length > 0 && (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertTitle>Real Inventory Data Loaded</AlertTitle>
          <AlertDescription>
            Showing {inventoryParts.length} parts from your inventory database instead of mock data.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="parts" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Parts Catalog
          </TabsTrigger>
          <TabsTrigger value="special-orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Special Orders
          </TabsTrigger>
        </TabsList>

        {/* Parts Catalog Tab */}
        <TabsContent value="parts" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and basic filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search parts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="quantity">Stock</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="updated">Last Updated</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant={sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortOrder('asc')}
                    className="flex-1"
                  >
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortOrder('desc')}
                    className="flex-1"
                  >
                    <TrendingDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Advanced filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={1000}
                    step={10}
                    className="w-full"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="favorites-only"
                      checked={showFavoritesOnly}
                      onCheckedChange={setShowFavoritesOnly}
                    />
                    <Label htmlFor="favorites-only">Favorites only</Label>
                  </div>
                  
                  <div className="flex gap-2">
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
              </div>
            </CardContent>
          </Card>

          {/* Results summary */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredParts.length} of {mockParts.length} parts
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Parts display */}
          <LoadingWrapper isLoading={isLoading}>
            {filteredParts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No parts found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setPriceRange([0, 1000]);
                      setShowFavoritesOnly(false);
                    }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
              }>
                {paginatedParts.map(part => 
                  viewMode === 'grid' 
                    ? <PartCard key={part.id} part={part} />
                    : <PartListItem key={part.id} part={part} />
                )}
              </div>
            )}
          </LoadingWrapper>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                First
              </Button>
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                Last
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Special Orders Tab */}
        <TabsContent value="special-orders" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerSearchComponent
                  onCustomerSelect={setSelectedCustomer}
                  selectedCustomer={selectedCustomer}
                />
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {specialOrderItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No items added to special order yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {specialOrderItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">${item.price.toFixed(2)}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromSpecialOrder(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Subtotal:</span>
                      <span>${specialOrderItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Parts Selection for Special Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Add Parts to Special Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search for parts */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search parts to add to special order..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Parts grid for special orders */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {filteredParts.slice(0, 12).map(part => (
                    <Card key={part.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <h4 className="font-medium mb-1">{part.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{part.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-green-600">${part.price.toFixed(2)}</span>
                          <Button
                            size="sm"
                            onClick={() => addToSpecialOrder(part)}
                            disabled={specialOrderItems.some(item => item.id === part.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          {specialOrderItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Shipping Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Anytown"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="CA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="12345"
                    />
                  </div>
                </div>

                <Button
                  onClick={getShippingQuotes}
                  disabled={isGettingShippingQuotes}
                  className="w-full"
                >
                  {isGettingShippingQuotes ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Getting Quotes...
                    </>
                  ) : (
                    <>
                      <Truck className="h-4 w-4 mr-2" />
                      Get Shipping Quotes
                    </>
                  )}
                </Button>

                {/* Shipping Options */}
                {shippingOptions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Shipping Options</h4>
                    <ShippingOptionsDisplay
                      shippingOptions={shippingOptions}
                      selectedShipping={selectedShipping}
                      onShippingSelect={setSelectedShipping}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Notes */}
          {specialOrderItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add any special instructions or notes for this order..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>
          )}

          {/* Submit Order */}
          {specialOrderItems.length > 0 && selectedCustomer && (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Ready to Submit Order</h3>
                    <p className="text-sm text-muted-foreground">
                      Order for {selectedCustomer.display_name} with {specialOrderItems.length} items
                    </p>
                  </div>
                  <Button onClick={submitSpecialOrder} size="lg">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Special Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


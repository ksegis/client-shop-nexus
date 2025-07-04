import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Package, ShoppingCart, Search, Plus, Grid, List, Heart, Eye, RefreshCw, X, Minus, Trash2, Clock, Shield, Star, Zap, UserPlus, Box, Truck, Wrench, Lightbulb, Car, Settings, Filter } from "lucide-react";
import { ArrowRight, DollarSign, TrendingUp, TrendingDown, MapPin, User, CreditCard, Edit, CheckCircle, Timer, User2, CreditCard2 } from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Import the ProductPriceCheck component
import ProductPriceCheck from '@/components/product_price_check_component';

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

// Import Supabase for real data
import { getSupabaseClient } from "@/lib/supabase";
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Import Fuse.js for fuzzy search
import Fuse from 'fuse.js';

// Customer search result interface
interface CustomerSearchResult {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  display_name: string;
}

// Enhanced interfaces for redesigned catalog
interface InventoryPart {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost?: number;
  quantity: number;
  description?: string;
  brand?: string;
  manufacturer_part_no?: string;
  compatibility?: string;
  region?: string;
  margin?: number;
  location?: string;
  status?: 'active' | 'inactive';
  is_kit?: boolean;
  kit_components?: any[];
  // New fields for enhanced display
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  regional_availability?: string[];
}

interface CartItem extends InventoryPart {
  quantity: number;
}

// Truck-specific category system with hierarchical structure
const TRUCK_CATEGORIES = {
  'exterior': {
    name: 'Exterior',
    icon: Truck,
    color: 'bg-blue-500',
    subcategories: {
      'bumpers': 'Bumpers & Guards',
      'running_boards': 'Running Boards & Steps',
      'bed_accessories': 'Bed Accessories',
      'lighting': 'Lighting & LED',
      'grilles': 'Grilles & Mesh',
      'fender_flares': 'Fender Flares',
      'tonneau_covers': 'Tonneau Covers',
      'side_steps': 'Side Steps',
      'nerf_bars': 'Nerf Bars'
    }
  },
  'performance': {
    name: 'Performance',
    icon: Zap,
    color: 'bg-red-500',
    subcategories: {
      'air_intake': 'Air Filters & Intake',
      'exhaust': 'Exhaust Systems',
      'suspension': 'Suspension & Lift Kits',
      'brakes': 'Brakes & Rotors',
      'engine': 'Engine Components',
      'turbo': 'Turbo & Supercharger',
      'cooling': 'Cooling Systems'
    }
  },
  'interior': {
    name: 'Interior',
    icon: Car,
    color: 'bg-green-500',
    subcategories: {
      'seat_covers': 'Seat Covers & Upholstery',
      'floor_mats': 'Floor Mats & Liners',
      'dashboard': 'Dashboard Accessories',
      'storage': 'Storage Solutions',
      'console': 'Center Console',
      'trim': 'Interior Trim'
    }
  },
  'electrical': {
    name: 'Electrical',
    icon: Lightbulb,
    color: 'bg-yellow-500',
    subcategories: {
      'wiring': 'Wiring Harnesses',
      'switches': 'Switches & Controls',
      'batteries': 'Batteries & Charging',
      'audio': 'Audio & Electronics',
      'navigation': 'GPS & Navigation',
      'security': 'Security Systems'
    }
  },
  'hardware': {
    name: 'Hardware & Tools',
    icon: Wrench,
    color: 'bg-gray-500',
    subcategories: {
      'fasteners': 'Fasteners & Hardware',
      'tools': 'Tools & Equipment',
      'maintenance': 'Maintenance Items',
      'fluids': 'Fluids & Chemicals',
      'gaskets': 'Gaskets & Seals'
    }
  }
};

// Enhanced category inference function with subcategory support
const inferCategory = (name: string, description: string = ''): { category: string; subcategory?: string } => {
  const text = `${name} ${description}`.toLowerCase();
  
  // Exterior - Bumpers & Guards
  if (text.match(/bumper|guard|bull bar|push bar|grille guard/)) {
    return { category: 'exterior', subcategory: 'bumpers' };
  }
  
  // Exterior - Running Boards & Steps
  if (text.match(/running board|step|side step|nerf bar|rock slider/)) {
    return { category: 'exterior', subcategory: 'running_boards' };
  }
  
  // Exterior - Bed Accessories
  if (text.match(/bed|tonneau|cover|liner|rail|tailgate|bedliner/)) {
    return { category: 'exterior', subcategory: 'bed_accessories' };
  }
  
  // Exterior - Lighting
  if (text.match(/light|led|headlight|taillight|fog|work light|light bar/)) {
    return { category: 'exterior', subcategory: 'lighting' };
  }
  
  // Exterior - Grilles
  if (text.match(/grille|grill|mesh|honeycomb/)) {
    return { category: 'exterior', subcategory: 'grilles' };
  }
  
  // Exterior - Fender Flares
  if (text.match(/fender|flare|wheel well|arch/)) {
    return { category: 'exterior', subcategory: 'fender_flares' };
  }
  
  // Performance - Air Intake
  if (text.match(/filter|air|intake|cold air|performance filter/)) {
    return { category: 'performance', subcategory: 'air_intake' };
  }
  
  // Performance - Exhaust
  if (text.match(/exhaust|muffler|pipe|cat back|header|downpipe/)) {
    return { category: 'performance', subcategory: 'exhaust' };
  }
  
  // Performance - Suspension
  if (text.match(/suspension|lift|shock|strut|spring|coilover|leveling/)) {
    return { category: 'performance', subcategory: 'suspension' };
  }
  
  // Performance - Brakes
  if (text.match(/brake|rotor|pad|caliper|disc/)) {
    return { category: 'performance', subcategory: 'brakes' };
  }
  
  // Performance - Engine
  if (text.match(/engine|turbo|supercharger|intercooler|manifold/)) {
    return { category: 'performance', subcategory: 'engine' };
  }
  
  // Interior - Seat Covers
  if (text.match(/seat|cover|upholstery|leather|fabric/)) {
    return { category: 'interior', subcategory: 'seat_covers' };
  }
  
  // Interior - Floor Mats
  if (text.match(/mat|floor|liner|carpet|rubber mat|all weather/)) {
    return { category: 'interior', subcategory: 'floor_mats' };
  }
  
  // Interior - Dashboard
  if (text.match(/dashboard|dash|gauge|instrument|cluster/)) {
    return { category: 'interior', subcategory: 'dashboard' };
  }
  
  // Interior - Storage
  if (text.match(/storage|console|organizer|box|compartment/)) {
    return { category: 'interior', subcategory: 'storage' };
  }
  
  // Electrical - Wiring
  if (text.match(/wire|wiring|harness|connector|cable/)) {
    return { category: 'electrical', subcategory: 'wiring' };
  }
  
  // Electrical - Switches
  if (text.match(/switch|button|control|rocker|toggle/)) {
    return { category: 'electrical', subcategory: 'switches' };
  }
  
  // Electrical - Batteries
  if (text.match(/battery|charger|alternator|starter/)) {
    return { category: 'electrical', subcategory: 'batteries' };
  }
  
  // Electrical - Audio
  if (text.match(/audio|radio|speaker|amplifier|subwoofer|stereo/)) {
    return { category: 'electrical', subcategory: 'audio' };
  }
  
  // Hardware - Fasteners
  if (text.match(/bolt|screw|nut|washer|fastener|hardware/)) {
    return { category: 'hardware', subcategory: 'fasteners' };
  }
  
  // Hardware - Tools
  if (text.match(/tool|wrench|socket|ratchet|screwdriver/)) {
    return { category: 'hardware', subcategory: 'tools' };
  }
  
  // Hardware - Maintenance
  if (text.match(/oil|fluid|coolant|brake fluid|transmission|maintenance/)) {
    return { category: 'hardware', subcategory: 'maintenance' };
  }
  
  // Default fallback
  return { category: 'uncategorized' };
};

// Stock status determination
const getStockStatus = (quantity: number): 'in_stock' | 'low_stock' | 'out_of_stock' => {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= 5) return 'low_stock';
  return 'in_stock';
};

// Stock status badge configuration
const getStockBadge = (status: string) => {
  switch (status) {
    case 'in_stock':
      return { variant: 'default' as const, text: 'In Stock', color: 'bg-green-500' };
    case 'low_stock':
      return { variant: 'secondary' as const, text: 'Low Stock', color: 'bg-yellow-500' };
    case 'out_of_stock':
      return { variant: 'destructive' as const, text: 'Out of Stock', color: 'bg-red-500' };
    default:
      return { variant: 'outline' as const, text: 'Unknown', color: 'bg-gray-500' };
  }
};

// Fuzzy search configuration
const fuseOptions = {
  keys: [
    { name: 'name', weight: 0.3 },
    { name: 'sku', weight: 0.2 },
    { name: 'description', weight: 0.2 },
    { name: 'manufacturer_part_no', weight: 0.15 },
    { name: 'compatibility', weight: 0.1 },
    { name: 'brand', weight: 0.05 }
  ],
  threshold: 0.4,
  includeScore: true,
  includeMatches: true
};

// Enhanced hook to load real inventory data with categorization
const useInventoryData = () => {
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .order('name');

        if (error) throw error;

        // Map database fields to expected interface with enhanced categorization
        const mappedParts: InventoryPart[] = (data || []).map(item => {
          const categoryInfo = inferCategory(item.name || '', item.description || '');
          const stockStatus = getStockStatus(item.quantity_on_hand || 0);
          
          return {
            id: item.id,
            name: item.name || 'Unknown Part',
            sku: item.sku || 'N/A',
            category: categoryInfo.category,
            price: item.list_price || 0,
            cost: item.cost || 0,
            quantity: item.quantity_on_hand || 0,
            description: item.description || '',
            brand: item.brand || 'Unknown',
            manufacturer_part_no: item.manufacturer_part_no || '',
            compatibility: item.compatibility || '',
            region: item.region || 'All',
            margin: item.list_price && item.cost ? 
              ((item.list_price - item.cost) / item.list_price * 100) : 0,
            location: item.location || 'Unknown',
            status: 'active',
            is_kit: item.is_kit || false,
            kit_components: item.kit_components || [],
            stock_status: stockStatus,
            regional_availability: ['east', 'midwest', 'west'] // Default for now
          };
        });

        setParts(mappedParts);
      } catch (err) {
        console.error('Error loading inventory:', err);
        setError(err instanceof Error ? err.message : 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  return { parts, loading, error, refetch: () => window.location.reload() };
};

// Enhanced Part Card Component
const EnhancedPartCard = ({ part, onAddToCart, onViewDetail }: {
  part: InventoryPart;
  onAddToCart: (part: InventoryPart) => void;
  onViewDetail: (part: InventoryPart) => void;
}) => {
  const stockBadge = getStockBadge(part.stock_status || 'out_of_stock');
  const categoryInfo = TRUCK_CATEGORIES[part.category as keyof typeof TRUCK_CATEGORIES];
  const CategoryIcon = categoryInfo?.icon || Package;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                {categoryInfo?.name || part.category}
              </Badge>
            </div>
            <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {part.name}
            </CardTitle>
            <CardDescription className="text-sm space-y-1">
              <div className="font-mono text-xs">SKU: {part.sku}</div>
              {part.brand && part.brand !== 'Unknown' && (
                <div className="text-xs">Brand: {part.brand}</div>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1">
            <Badge {...stockBadge} className="text-xs">
              {stockBadge.text}
            </Badge>
            {part.is_kit && (
              <Badge variant="secondary" className="text-xs">
                <Box className="h-3 w-3 mr-1" />
                Kit
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Price and Margin Display */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-green-600">
              ${part.price.toFixed(2)}
            </div>
            <div className="text-right text-sm">
              <div className="font-medium">{part.quantity} units</div>
              <div className="text-xs text-muted-foreground">{part.location}</div>
            </div>
          </div>
          
          {part.cost && part.cost > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Cost: ${part.cost.toFixed(2)}</span>
              <span className="font-medium text-blue-600">
                {part.margin?.toFixed(1)}% margin
              </span>
            </div>
          )}
        </div>

        {/* Regional Availability */}
        {part.regional_availability && part.regional_availability.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {part.regional_availability.map(region => (
              <Badge key={region} variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {region}
              </Badge>
            ))}
          </div>
        )}

        {/* Description Preview */}
        {part.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {part.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={() => onAddToCart(part)}
            disabled={part.stock_status === 'out_of_stock'}
            className="flex-1"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="px-3"
            onClick={() => onViewDetail(part)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-3"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Parts() {
  // State management
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCartDialog, setShowCartDialog] = useState(false);
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // Enhanced search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  const { toast } = useToast();
  const { parts, loading, error } = useInventoryData();

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(parts, fuseOptions);
  }, [parts]);

  // Event handlers
  const handleAddToCart = (part: InventoryPart) => {
    console.log('🛒 Add to cart clicked for:', part.name);
    
    if (part.stock_status === 'out_of_stock') {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock.",
        variant: "destructive"
      });
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.id === part.id);
      if (existing) {
        return prev.map(item =>
          item.id === part.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...part, quantity: 1 }];
      }
    });

    toast({
      title: "Added to Cart",
      description: `${part.name} has been added to your cart.`,
    });
  };

  const handleViewDetail = (part: InventoryPart) => {
    console.log('👁️ View detail clicked for:', part.name);
    setSelectedPart(part);
    setShowDetailDialog(true);
  };

  const removeFromCart = (partId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== partId));
    toast({
      title: "Removed from Cart",
      description: "Item has been removed from your cart.",
    });
  };

  const updateCartQuantity = (partId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(partId);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === partId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Enhanced filtering and sorting with fuzzy search
  const filteredAndSortedParts = useMemo(() => {
    let filtered: InventoryPart[] = [];

    // Apply fuzzy search if search term exists
    if (searchTerm.trim()) {
      const searchResults = fuse.search(searchTerm);
      filtered = searchResults.map(result => result.item);
    } else {
      filtered = [...parts];
    }

    // Apply additional filters
    filtered = filtered.filter(part => {
      // Only show items with prices
      const hasPrice = part.price && part.price > 0;
      
      const categoryMatch = selectedCategory === 'all' || part.category === selectedCategory;
      const brandMatch = selectedBrand === 'all' || part.brand === selectedBrand;
      const stockMatch = selectedStockStatus === 'all' || part.stock_status === selectedStockStatus;
      const regionMatch = selectedRegion === 'all' || 
        (part.regional_availability && part.regional_availability.includes(selectedRegion));
      const priceMatch = part.price >= priceRange[0] && part.price <= priceRange[1];
      const favoritesMatch = !showFavoritesOnly; // Simplified for now

      return hasPrice && categoryMatch && brandMatch && stockMatch && regionMatch && priceMatch && favoritesMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'brand':
          return (a.brand || '').localeCompare(b.brand || '');
        case 'stock':
          return b.quantity - a.quantity;
        case 'margin':
          return (b.margin || 0) - (a.margin || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [parts, fuse, searchTerm, selectedCategory, selectedBrand, selectedStockStatus, selectedRegion, priceRange, showFavoritesOnly, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedParts.length / itemsPerPage);
  const paginatedParts = filteredAndSortedParts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique values for filters
  const categories = useMemo(() => Object.keys(TRUCK_CATEGORIES), []);
  const brands = useMemo(() => {
    const brandSet = new Set(parts.map(part => part.brand).filter(brand => brand && brand !== 'Unknown'));
    return Array.from(brandSet);
  }, [parts]);
  const regions = useMemo(() => ['east', 'midwest', 'west'], []);

  // Cart totals
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedBrand, selectedStockStatus, selectedRegion, priceRange, showFavoritesOnly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading parts catalog...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Parts</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parts & Special Orders</h1>
          <p className="text-muted-foreground">Browse truck customization parts and place special orders</p>
        </div>
        
        {/* Cart Widget */}
        <Button 
          variant="outline" 
          onClick={() => setShowCartDialog(true)}
          className="relative"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart
          {cartItemCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {cartItemCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Category Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(TRUCK_CATEGORIES).map(([key, category]) => {
          const Icon = category.icon;
          const categoryCount = parts.filter(part => part.category === key && part.price > 0).length;
          
          return (
            <Card 
              key={key} 
              className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
                selectedCategory === key ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedCategory(selectedCategory === key ? 'all' : key)}
            >
              <CardContent className="p-4 text-center space-y-2">
                <div className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center mx-auto`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold">{category.name}</div>
                  <div className="text-sm text-muted-foreground">{categoryCount} parts</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="catalog">
            <Package className="h-4 w-4 mr-2" />
            Parts Catalog
          </TabsTrigger>
          <TabsTrigger value="special-orders">
            <Plus className="h-4 w-4 mr-2" />
            Special Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          {/* Enhanced Search and Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Search & Filter Parts</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Fuzzy search: name, SKU, description, part number, compatibility..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="price">Price Low-High</SelectItem>
                    <SelectItem value="price_desc">Price High-Low</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="brand">Brand</SelectItem>
                    <SelectItem value="stock">Stock Level</SelectItem>
                    <SelectItem value="margin">Margin %</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Collapsible Filters */}
              <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                <CollapsibleContent className="space-y-4">
                  {/* Filter Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {TRUCK_CATEGORIES[category as keyof typeof TRUCK_CATEGORIES]?.name || category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                      <SelectTrigger>
                        <SelectValue placeholder="Brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Brands</SelectItem>
                        {brands.map(brand => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedStockStatus} onValueChange={setSelectedStockStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Stock Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stock</SelectItem>
                        <SelectItem value="in_stock">In Stock</SelectItem>
                        <SelectItem value="low_stock">Low Stock</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        {regions.map(region => (
                          <SelectItem key={region} value={region}>
                            {region.charAt(0).toUpperCase() + region.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="favorites"
                        checked={showFavoritesOnly}
                        onCheckedChange={setShowFavoritesOnly}
                      />
                      <Label htmlFor="favorites" className="text-sm">Favorites</Label>
                    </div>
                  </div>

                  {/* Price Range */}
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

                  {/* Clear Filters */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                        setSelectedBrand('all');
                        setSelectedStockStatus('all');
                        setSelectedRegion('all');
                        setPriceRange([0, 1000]);
                        setShowFavoritesOnly(false);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear All Filters
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Results summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Showing {paginatedParts.length} of {filteredAndSortedParts.length} parts
              </Badge>
              <Badge variant="outline" className="text-green-600">
                ✅ Only showing items with prices set
              </Badge>
              {searchTerm && (
                <Badge variant="outline" className="text-blue-600">
                  🔍 Fuzzy search active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Parts Display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedParts.map(part => (
                <EnhancedPartCard
                  key={part.id}
                  part={part}
                  onAddToCart={handleAddToCart}
                  onViewDetail={handleViewDetail}
                />
              ))}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedParts.map(part => {
                    const stockBadge = getStockBadge(part.stock_status || 'out_of_stock');
                    return (
                      <TableRow key={part.id}>
                        <TableCell className="font-medium">{part.name}</TableCell>
                        <TableCell className="font-mono text-sm">{part.sku}</TableCell>
                        <TableCell>{part.brand}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {TRUCK_CATEGORIES[part.category as keyof typeof TRUCK_CATEGORIES]?.name || part.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          ${part.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {part.cost ? `$${part.cost.toFixed(2)}` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {part.margin ? `${part.margin.toFixed(1)}%` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge {...stockBadge} className="text-xs">
                            {part.quantity} units
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => handleAddToCart(part)}
                              disabled={part.stock_status === 'out_of_stock'}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetail(part)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Empty State */}
          {filteredAndSortedParts.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No parts found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedBrand('all');
                    setSelectedStockStatus('all');
                    setSelectedRegion('all');
                    setPriceRange([0, 1000]);
                    setShowFavoritesOnly(false);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="special-orders">
          <Card>
            <CardHeader>
              <CardTitle>Special Orders</CardTitle>
              <CardDescription>
                Request parts that are not in our current inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Special orders functionality coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cart Dialog */}
      <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Shopping Cart ({cartItemCount} items)</DialogTitle>
            <DialogDescription>
              Total: ${cartTotal.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {cartItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Your cart is empty</p>
            ) : (
              <>
                <ScrollArea className="max-h-60">
                  <div className="space-y-2">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            ${item.price.toFixed(2)} each
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="h-6 w-6 p-0 text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <Separator />
                
                <div className="flex justify-between items-center font-semibold">
                  <span>Total: ${cartTotal.toFixed(2)}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCartItems([])}>
                      Clear
                    </Button>
                    <Button size="sm">
                      Checkout
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPart?.name}
              {selectedPart?.is_kit && (
                <Badge variant="secondary">
                  <Box className="h-3 w-3 mr-1" />
                  Kit
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>Part Details & Specifications</DialogDescription>
          </DialogHeader>
          
          {selectedPart && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label>SKU</Label>
                  <p className="font-mono">{selectedPart.sku}</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="flex items-center gap-2">
                    {TRUCK_CATEGORIES[selectedPart.category as keyof typeof TRUCK_CATEGORIES] && (
                      <div className={`w-4 h-4 rounded ${TRUCK_CATEGORIES[selectedPart.category as keyof typeof TRUCK_CATEGORIES].color}`} />
                    )}
                    <span>{TRUCK_CATEGORIES[selectedPart.category as keyof typeof TRUCK_CATEGORIES]?.name || selectedPart.category}</span>
                  </div>
                </div>
                <div>
                  <Label>Brand</Label>
                  <p>{selectedPart.brand}</p>
                </div>
                <div>
                  <Label>Price</Label>
                  <p className="text-2xl font-bold text-green-600">${selectedPart.price.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Stock Status</Label>
                  <Badge {...getStockBadge(selectedPart.stock_status || 'out_of_stock')}>
                    {selectedPart.quantity} units
                  </Badge>
                </div>
                <div>
                  <Label>Location</Label>
                  <p>{selectedPart.location}</p>
                </div>
              </div>

              {selectedPart.cost && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label>Cost</Label>
                    <p className="font-semibold">${selectedPart.cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Margin</Label>
                    <p className="font-semibold text-blue-600">{selectedPart.margin?.toFixed(1)}%</p>
                  </div>
                </div>
              )}

              {selectedPart.regional_availability && selectedPart.regional_availability.length > 0 && (
                <div>
                  <Label>Regional Availability</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedPart.regional_availability.map(region => (
                      <Badge key={region} variant="outline">
                        <MapPin className="h-3 w-3 mr-1" />
                        {region.charAt(0).toUpperCase() + region.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedPart.description && (
                <div>
                  <Label>Description</Label>
                  <p className="mt-2">{selectedPart.description}</p>
                </div>
              )}

              {selectedPart.manufacturer_part_no && (
                <div>
                  <Label>Manufacturer Part Number</Label>
                  <p className="font-mono">{selectedPart.manufacturer_part_no}</p>
                </div>
              )}

              {selectedPart.compatibility && (
                <div>
                  <Label>Compatibility</Label>
                  <p>{selectedPart.compatibility}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => {
                    handleAddToCart(selectedPart);
                    setShowDetailDialog(false);
                  }}
                  disabled={selectedPart.stock_status === 'out_of_stock'}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


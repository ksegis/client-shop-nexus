import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Plus, 
  Minus, 
  Eye, 
  ShoppingCart, 
  Star, 
  Package, 
  Truck, 
  Wrench, 
  Zap, 
  Home, 
  Settings,
  ChevronRight,
  ChevronDown,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  Percent,
  Calculator
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

// ===== INTERFACES =====
interface InventoryPart {
  id: string;
  name: string;
  sku?: string;
  keystone_vcpn?: string;
  cost: number;
  list_price: number;
  quantity_on_hand: number;
  location?: string;
  description?: string;
  LongDescription?: string;
  manufacturer_part_no?: string;
  compatibility?: string;
  category?: string;
  brand?: string;
  isKit?: boolean;
  margin?: number;
  stockStatus?: 'In Stock' | 'Low Stock' | 'Out of Stock';
  regionalAvailability?: string[];
  vehicleCategory?: string;
  partCategory?: string;
}

interface CartItem {
  part: InventoryPart;
  quantity: number;
}

interface TruckCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  subcategories: string[];
  color: string;
}

// ===== CATEGORIZATION LOGIC FROM JSON =====
const VEHICLE_KEYWORDS = [
  "FORD", "F150", "F250", "F350", "DODGE", "RAM", "CHEVY", "CHEVROLET", "SILVERADO",
  "GMC", "TOYOTA", "TUNDRA", "TACOMA", "JEEP", "WRANGLER", "GLADIATOR", "NISSAN",
  "FRONTIER", "TITAN", "HONDA", "RIDGELINE"
];

const PART_CATEGORY_MAP = {
  "Brakes": ["BRAKE", "DISC", "PAD", "CALIPER", "ROTOR"],
  "Suspension": ["SHOCK", "STRUT", "SPRING", "LIFT", "LEVELING", "CONTROL ARM"],
  "Lighting": ["LIGHT", "HEADLIGHT", "FOG", "LED", "BULB", "TAILLIGHT"],
  "Interior Accessories": ["FLOORLINER", "MAT", "SEAT", "COVER", "CONSOLE"],
  "Exterior Accessories": ["GRILLE", "FENDER", "MIRROR", "STEP", "BULLBAR", "ROOF", "RACK"],
  "Drivetrain": ["AXLE", "DIFFERENTIAL", "U-JOINT"],
  "Engine Components": ["OIL", "FILTER", "PUMP", "AIR", "INTAKE", "FUEL"],
  "Performance Upgrades": ["EXHAUST", "TUNER", "CHIP", "BOOST"],
  "Electrical": ["BATTERY", "ALTERNATOR", "WIRING", "SWITCH"],
  "Kits & Bundles": ["KIT", "SET", "BUNDLE"]
};

const categorizeVehicle = (longDescription: string): string => {
  if (!longDescription) return "Universal/Other";
  
  const upperDesc = longDescription.toUpperCase();
  for (const keyword of VEHICLE_KEYWORDS) {
    if (upperDesc.includes(keyword)) {
      return keyword;
    }
  }
  return "Universal/Other";
};

const categorizePart = (longDescription: string): string => {
  if (!longDescription) return "Uncategorized";
  
  const upperDesc = longDescription.toUpperCase();
  const tokens = upperDesc.split(/\s+/);
  
  for (const [categoryName, keywords] of Object.entries(PART_CATEGORY_MAP)) {
    for (const keyword of keywords) {
      if (tokens.some(token => token.includes(keyword))) {
        return categoryName;
      }
    }
  }
  return "Uncategorized";
};

// ===== TRUCK-SPECIFIC CATEGORIES =====
const TRUCK_CATEGORIES: TruckCategory[] = [
  {
    id: 'exterior',
    name: 'Exterior',
    icon: Truck,
    description: 'Bumpers, running boards, bed accessories, lighting, grilles',
    subcategories: ['Bumpers', 'Running Boards', 'Bed Accessories', 'Lighting', 'Grilles', 'Fender Flares', 'Side Steps', 'Tonneau Covers'],
    color: 'bg-blue-500'
  },
  {
    id: 'performance',
    name: 'Performance',
    icon: Zap,
    description: 'Air intake, exhaust, suspension, brakes, engine components',
    subcategories: ['Air Intake', 'Exhaust', 'Suspension', 'Brakes', 'Engine Components', 'Turbo', 'Intercooler', 'Performance Chips'],
    color: 'bg-red-500'
  },
  {
    id: 'interior',
    name: 'Interior',
    icon: Home,
    description: 'Seat covers, floor mats, dashboard, storage solutions',
    subcategories: ['Seat Covers', 'Floor Mats', 'Dashboard', 'Storage Solutions', 'Organizers', 'Console', 'Trim Kits'],
    color: 'bg-green-500'
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: Zap,
    description: 'Wiring, switches, batteries, audio & electronics',
    subcategories: ['Wiring', 'Switches', 'Batteries', 'Audio & Electronics', 'LED Lights', 'Inverters', 'Chargers'],
    color: 'bg-yellow-500'
  },
  {
    id: 'hardware',
    name: 'Hardware',
    icon: Settings,
    description: 'Fasteners, tools, maintenance items',
    subcategories: ['Fasteners', 'Tools', 'Maintenance Items', 'Fluids', 'Filters', 'Belts', 'Gaskets'],
    color: 'bg-purple-500'
  }
];

// ===== UTILITY FUNCTIONS =====
const checkIfKit = (partId: string): boolean => {
  return partId?.includes('kit') || partId?.includes('set') || false;
};

const inferCategory = (part: InventoryPart): string => {
  const name = part.name?.toLowerCase() || '';
  const description = part.description?.toLowerCase() || '';
  const text = `${name} ${description}`;

  if (text.match(/bumper|grille|fender|running board|side step|bed|tonneau|lighting|led|headlight|taillight/)) {
    return 'exterior';
  }
  
  if (text.match(/exhaust|intake|suspension|brake|turbo|intercooler|performance|engine|chip/)) {
    return 'performance';
  }
  
  if (text.match(/seat|floor mat|dashboard|console|trim|organizer|storage/)) {
    return 'interior';
  }
  
  if (text.match(/wiring|switch|battery|audio|electronic|inverter|charger|electrical/)) {
    return 'electrical';
  }
  
  if (text.match(/fastener|tool|maintenance|fluid|filter|belt|gasket|hardware/)) {
    return 'hardware';
  }

  return 'other';
};

const getStockStatus = (quantity: number): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
  if (quantity === 0) return 'Out of Stock';
  if (quantity <= 5) return 'Low Stock';
  return 'In Stock';
};

const getRegionalAvailability = (): string[] => {
  const regions = ['East', 'Midwest', 'West'];
  return regions.filter(() => Math.random() > 0.3);
};

const calculateMargin = (cost: number, listPrice: number): number => {
  if (!cost || !listPrice || listPrice === 0) return 0;
  return ((listPrice - cost) / listPrice) * 100;
};

// ===== CUSTOM HOOKS =====
const useInventoryData = () => {
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching ALL inventory data from Supabase...');
      
      const supabase = getSupabaseClient();
      
      // Fetch ALL records without pagination limits
      let allParts: any[] = [];
      let from = 0;
      const batchSize = 1000; // Process in batches to avoid memory issues
      
      while (true) {
        const { data, error: fetchError } = await supabase
          .from('inventory')
          .select('*')
          .range(from, from + batchSize - 1)
          .order('name');

        if (fetchError) {
          console.error('❌ Error fetching inventory:', fetchError);
          setError(fetchError.message);
          return;
        }

        if (!data || data.length === 0) {
          break; // No more data
        }

        allParts = [...allParts, ...data];
        from += batchSize;
        
        console.log(`📦 Loaded ${allParts.length} parts so far...`);
        
        // Break if we got less than batch size (last batch)
        if (data.length < batchSize) {
          break;
        }
      }

      console.log(`✅ Total inventory data fetched: ${allParts.length} items`);

      // Map database fields to component interface with categorization
      const mappedParts: InventoryPart[] = allParts.map(item => {
        const longDesc = item.LongDescription || item.description || '';
        
        return {
          id: item.id,
          name: item.name || 'Unnamed Part',
          sku: item.sku,
          keystone_vcpn: item.keystone_vcpn,
          cost: Number(item.cost) || 0,
          list_price: Number(item.list_price) || 0,
          quantity_on_hand: Number(item.quantity_on_hand) || 0,
          location: item.location,
          description: item.description,
          LongDescription: longDesc,
          manufacturer_part_no: item.manufacturer_part_no,
          compatibility: item.compatibility,
          brand: item.brand || 'Unknown',
          category: item.category || inferCategory(item),
          isKit: checkIfKit(item.id),
          margin: calculateMargin(Number(item.cost) || 0, Number(item.list_price) || 0),
          stockStatus: getStockStatus(Number(item.quantity_on_hand) || 0),
          regionalAvailability: getRegionalAvailability(),
          // NEW CATEGORIZATION FIELDS FROM JSON
          vehicleCategory: categorizeVehicle(longDesc),
          partCategory: categorizePart(longDesc)
        };
      });

      setParts(mappedParts);
    } catch (err) {
      console.error('❌ Error in fetchData:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { parts, loading, error, refetch: fetchData };
};

// ===== NATIVE FUZZY SEARCH =====
const fuzzySearch = (searchTerm: string, parts: InventoryPart[]): InventoryPart[] => {
  if (!searchTerm.trim()) return parts;

  const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.length > 0);
  
  const scorePart = (part: InventoryPart): number => {
    let score = 0;
    const fields = {
      name: { value: part.name?.toLowerCase() || '', weight: 30 },
      sku: { value: part.sku?.toLowerCase() || '', weight: 20 },
      description: { value: part.description?.toLowerCase() || '', weight: 20 },
      LongDescription: { value: part.LongDescription?.toLowerCase() || '', weight: 25 },
      manufacturer_part_no: { value: part.manufacturer_part_no?.toLowerCase() || '', weight: 15 },
      compatibility: { value: part.compatibility?.toLowerCase() || '', weight: 10 },
      brand: { value: part.brand?.toLowerCase() || '', weight: 5 },
      vehicleCategory: { value: part.vehicleCategory?.toLowerCase() || '', weight: 15 },
      partCategory: { value: part.partCategory?.toLowerCase() || '', weight: 10 }
    };

    searchWords.forEach(word => {
      Object.entries(fields).forEach(([fieldName, field]) => {
        if (field.value.includes(word)) {
          if (field.value.startsWith(word)) {
            score += field.weight * 2;
          } else {
            score += field.weight;
          }
        }
      });
    });

    return score;
  };

  return parts
    .map(part => ({ part, score: scorePart(part) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ part }) => part);
};

// ===== MAIN COMPONENT =====
const Parts: React.FC = () => {
  // ===== ALL HOOKS DECLARED AT TOP LEVEL =====
  const { toast } = useToast();
  const { parts, loading: partsLoading, error: partsError, refetch } = useInventoryData();
  
  // State hooks
  const [filteredParts, setFilteredParts] = useState<InventoryPart[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState<string>('all');
  const [selectedPartCategory, setSelectedPartCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'category' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCartDialog, setShowCartDialog] = useState(false);
  
  // Dialog state
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // Category view state
  const [showCategoryView, setShowCategoryView] = useState(true);

  // ===== MEMOIZED VALUES =====
  const availableBrands = useMemo(() => {
    const brands = [...new Set(parts.map(part => part.brand).filter(Boolean))];
    return brands.sort();
  }, [parts]);

  const availableVehicleCategories = useMemo(() => {
    const categories = [...new Set(parts.map(part => part.vehicleCategory).filter(Boolean))];
    return categories.sort();
  }, [parts]);

  const availablePartCategories = useMemo(() => {
    const categories = [...new Set(parts.map(part => part.partCategory).filter(Boolean))];
    return categories.sort();
  }, [parts]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    TRUCK_CATEGORIES.forEach(cat => {
      stats[cat.id] = parts.filter(part => part.category === cat.id).length;
    });
    stats.other = parts.filter(part => !TRUCK_CATEGORIES.some(cat => cat.id === part.category)).length;
    return stats;
  }, [parts]);

  // ===== SEARCH AND FILTERING =====
  const searchAndFilterParts = useMemo(() => {
    let result = parts;

    // Apply search
    if (searchTerm.trim()) {
      result = fuzzySearch(searchTerm, result);
    }

    // Apply filters
    if (selectedCategory !== 'all') {
      result = result.filter(part => part.category === selectedCategory);
    }

    if (selectedBrand !== 'all') {
      result = result.filter(part => part.brand === selectedBrand);
    }

    if (selectedStockStatus !== 'all') {
      result = result.filter(part => part.stockStatus === selectedStockStatus);
    }

    if (selectedRegion !== 'all') {
      result = result.filter(part => part.regionalAvailability?.includes(selectedRegion));
    }

    if (selectedVehicleCategory !== 'all') {
      result = result.filter(part => part.vehicleCategory === selectedVehicleCategory);
    }

    if (selectedPartCategory !== 'all') {
      result = result.filter(part => part.partCategory === selectedPartCategory);
    }

    // Apply price range
    result = result.filter(part => 
      part.list_price >= priceRange[0] && part.list_price <= priceRange[1]
    );

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.list_price - b.list_price;
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        case 'stock':
          comparison = a.quantity_on_hand - b.quantity_on_hand;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [parts, searchTerm, selectedCategory, selectedBrand, selectedStockStatus, selectedRegion, selectedVehicleCategory, selectedPartCategory, priceRange, sortBy, sortOrder]);

  // ===== PAGINATION =====
  const paginatedParts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return searchAndFilterParts.slice(startIndex, startIndex + itemsPerPage);
  }, [searchAndFilterParts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(searchAndFilterParts.length / itemsPerPage);

  // ===== CART FUNCTIONS =====
  const handleAddToCart = useCallback((part: InventoryPart) => {
    console.log('🛒 Add to cart clicked for:', part.name);
    
    if (part.stockStatus === 'Out of Stock') {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock.",
        variant: "destructive"
      });
      return;
    }

    setCartItems(prev => {
      const existingItem = prev.find(item => item.part.id === part.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        if (newQuantity > part.quantity_on_hand) {
          toast({
            title: "Stock Limit Reached",
            description: `Only ${part.quantity_on_hand} units available.`,
            variant: "destructive"
          });
          return prev;
        }
        toast({
          title: "Quantity Updated",
          description: `${part.name} quantity increased to ${newQuantity}.`
        });
        return prev.map(item =>
          item.part.id === part.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        toast({
          title: "Added to Cart",
          description: `${part.name} has been added to your cart.`
        });
        return [...prev, { part, quantity: 1 }];
      }
    });
  }, [toast]);

  const handleViewDetail = useCallback((part: InventoryPart) => {
    console.log('👁️ View detail clicked for:', part.name);
    setSelectedPart(part);
    setShowDetailDialog(true);
  }, []);

  const updateCartQuantity = useCallback((partId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(prev => prev.filter(item => item.part.id !== partId));
      return;
    }

    setCartItems(prev => prev.map(item => {
      if (item.part.id === partId) {
        const maxQuantity = item.part.quantity_on_hand;
        const quantity = Math.min(newQuantity, maxQuantity);
        return { ...item, quantity };
      }
      return item;
    }));
  }, []);

  const removeFromCart = useCallback((partId: string) => {
    setCartItems(prev => prev.filter(item => item.part.id !== partId));
    toast({
      title: "Removed from Cart",
      description: "Item has been removed from your cart."
    });
  }, [toast]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart."
    });
  }, [toast]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + (item.part.list_price * item.quantity), 0);
  }, [cartItems]);

  const cartItemCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  // ===== CATEGORY FUNCTIONS =====
  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowCategoryView(false);
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedStockStatus('all');
    setSelectedRegion('all');
    setSelectedVehicleCategory('all');
    setSelectedPartCategory('all');
    setPriceRange([0, 1000]);
    setCurrentPage(1);
  }, []);

  // ===== EFFECTS =====
  useEffect(() => {
    setFilteredParts(searchAndFilterParts);
  }, [searchAndFilterParts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedBrand, selectedStockStatus, selectedRegion, selectedVehicleCategory, selectedPartCategory, priceRange]);

  // ===== EARLY RETURNS AFTER ALL HOOKS =====
  if (partsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-lg">Loading inventory...</p>
            <p className="text-sm text-muted-foreground">This may take a moment for 120k+ parts</p>
          </div>
        </div>
      </div>
    );
  }

  if (partsError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading inventory: {partsError}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ===== RENDER FUNCTIONS =====
  const renderCategoryOverview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Truck Parts Catalog</h1>
        <p className="text-muted-foreground">
          Browse our comprehensive selection of {parts.length.toLocaleString()} truck customization parts organized by category
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TRUCK_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const count = categoryStats[category.id] || 0;
          
          return (
            <Card 
              key={category.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCategorySelect(category.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${category.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{count.toLocaleString()} parts</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {category.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {category.subcategories.slice(0, 3).map((sub) => (
                    <Badge key={sub} variant="secondary" className="text-xs">
                      {sub}
                    </Badge>
                  ))}
                  {category.subcategories.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{category.subcategories.length - 3} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {categoryStats.other > 0 && (
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleCategorySelect('other')}
        >
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-gray-500 text-white">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">Other Parts</CardTitle>
                <p className="text-sm text-muted-foreground">{categoryStats.other.toLocaleString()} parts</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Miscellaneous parts and accessories not categorized above
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderFilters = () => (
    <Card className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Filter */}
        <div>
          <Label className="text-sm font-medium">Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {TRUCK_CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name} ({(categoryStats[cat.id] || 0).toLocaleString()})
                </SelectItem>
              ))}
              {categoryStats.other > 0 && (
                <SelectItem value="other">Other ({categoryStats.other.toLocaleString()})</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Vehicle Category Filter */}
        <div>
          <Label className="text-sm font-medium">Vehicle</Label>
          <Select value={selectedVehicleCategory} onValueChange={setSelectedVehicleCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Vehicles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {availableVehicleCategories.map((vehicle) => (
                <SelectItem key={vehicle} value={vehicle}>
                  {vehicle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Part Category Filter */}
        <div>
          <Label className="text-sm font-medium">Part Type</Label>
          <Select value={selectedPartCategory} onValueChange={setSelectedPartCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Part Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Part Types</SelectItem>
              {availablePartCategories.map((partCat) => (
                <SelectItem key={partCat} value={partCat}>
                  {partCat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Brand Filter */}
        <div>
          <Label className="text-sm font-medium">Brand</Label>
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger>
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {availableBrands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stock Status Filter */}
        <div>
          <Label className="text-sm font-medium">Stock Status</Label>
          <Select value={selectedStockStatus} onValueChange={setSelectedStockStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All Stock Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock Levels</SelectItem>
              <SelectItem value="In Stock">In Stock</SelectItem>
              <SelectItem value="Low Stock">Low Stock</SelectItem>
              <SelectItem value="Out of Stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Regional Availability Filter */}
        <div>
          <Label className="text-sm font-medium">Region</Label>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger>
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="East">East</SelectItem>
              <SelectItem value="Midwest">Midwest</SelectItem>
              <SelectItem value="West">West</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Range Filter */}
        <div>
          <Label className="text-sm font-medium">
            Price Range: ${priceRange[0]} - ${priceRange[1]}
          </Label>
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={1000}
            min={0}
            step={10}
            className="mt-2"
          />
        </div>
      </CardContent>
    </Card>
  );

  const getStockBadgeColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-800';
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderPartCard = (part: InventoryPart) => {
    const isKit = part.isKit || false;
    
    return (
      <Card key={part.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-sm leading-tight mb-1">{part.name}</h3>
              <div className="flex flex-wrap gap-1 mb-2">
                {part.sku && (
                  <Badge variant="outline" className="text-xs">
                    SKU: {part.sku}
                  </Badge>
                )}
                {part.keystone_vcpn && (
                  <Badge variant="outline" className="text-xs">
                    VCPN: {part.keystone_vcpn}
                  </Badge>
                )}
                {part.vehicleCategory && part.vehicleCategory !== 'Universal/Other' && (
                  <Badge variant="secondary" className="text-xs">
                    {part.vehicleCategory}
                  </Badge>
                )}
                {part.partCategory && part.partCategory !== 'Uncategorized' && (
                  <Badge variant="outline" className="text-xs">
                    {part.partCategory}
                  </Badge>
                )}
              </div>
            </div>
            {isKit && (
              <Badge className="bg-purple-100 text-purple-800 text-xs">
                Kit
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Brand:</span>
              <span className="text-sm font-medium">{part.brand}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price:</span>
              <span className="text-lg font-bold text-green-600">
                ${part.list_price.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cost:</span>
              <span className="text-sm">${part.cost.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Margin:</span>
              <span className="text-sm font-medium text-blue-600">
                {part.margin?.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Stock:</span>
              <Badge className={getStockBadgeColor(part.stockStatus || 'Out of Stock')}>
                {part.stockStatus} ({part.quantity_on_hand})
              </Badge>
            </div>
            
            {part.location && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Location:</span>
                <span className="text-sm">{part.location}</span>
              </div>
            )}
            
            {part.regionalAvailability && part.regionalAvailability.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {part.regionalAvailability.map((region) => (
                  <Badge key={region} variant="secondary" className="text-xs">
                    {region}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-auto space-y-2">
            <div className="flex gap-2">
              <Button 
                onClick={() => handleAddToCart(part)}
                disabled={part.stockStatus === 'Out of Stock'}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="px-3"
                onClick={() => handleViewDetail(part)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderListView = () => (
    <div className="space-y-2">
      {paginatedParts.map((part) => {
        const isKit = part.isKit || false;
        
        return (
          <Card key={part.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                <div>
                  <h3 className="font-semibold">{part.name}</h3>
                  <div className="flex gap-2 mt-1">
                    {part.sku && (
                      <Badge variant="outline" className="text-xs">
                        {part.sku}
                      </Badge>
                    )}
                    {isKit && (
                      <Badge className="bg-purple-100 text-purple-800 text-xs">
                        Kit
                      </Badge>
                    )}
                    {part.vehicleCategory && part.vehicleCategory !== 'Universal/Other' && (
                      <Badge variant="secondary" className="text-xs">
                        {part.vehicleCategory}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="font-medium">{part.brand}</div>
                  <div className="text-muted-foreground">
                    {part.keystone_vcpn && `VCPN: ${part.keystone_vcpn}`}
                  </div>
                  <div className="text-muted-foreground">
                    {part.partCategory && part.partCategory !== 'Uncategorized' && part.partCategory}
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="font-bold text-green-600">
                    ${part.list_price.toFixed(2)}
                  </div>
                  <div className="text-muted-foreground">
                    Cost: ${part.cost.toFixed(2)}
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="font-medium text-blue-600">
                    {part.margin?.toFixed(1)}% margin
                  </div>
                  <div className="text-muted-foreground">
                    {part.location}
                  </div>
                </div>
                
                <div>
                  <Badge className={getStockBadgeColor(part.stockStatus || 'Out of Stock')}>
                    {part.stockStatus}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {part.quantity_on_hand} units
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleAddToCart(part)}
                    disabled={part.stockStatus === 'Out of Stock'}
                    className="bg-blue-700 hover:bg-blue-800 text-white"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetail(part)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const renderPagination = () => (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, searchAndFilterParts.length)} of {searchAndFilterParts.length.toLocaleString()} parts
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            );
          })}
        </div>
        
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

  // ===== MAIN RENDER =====
  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {!showCategoryView && (
            <Button
              variant="outline"
              onClick={() => setShowCategoryView(true)}
            >
              <ChevronRight className="h-4 w-4 mr-2" />
              Back to Categories
            </Button>
          )}
          
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">
              {showCategoryView ? 'Parts Catalog' : 
               selectedCategory === 'all' ? 'All Parts' :
               TRUCK_CATEGORIES.find(cat => cat.id === selectedCategory)?.name || 'Parts'}
            </h1>
            {!showCategoryView && (
              <Badge variant="secondary">
                {searchAndFilterParts.length.toLocaleString()} parts
              </Badge>
            )}
          </div>
        </div>

        {/* Cart Widget */}
        <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="relative">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Shopping Cart ({cartItemCount} items)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {cartItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Your cart is empty
                </p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.part.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.part.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${item.part.list_price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartQuantity(item.part.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartQuantity(item.part.id, item.quantity + 1)}
                        disabled={item.quantity >= item.part.quantity_on_hand}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeFromCart(item.part.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">
                    Total: ${cartTotal.toFixed(2)}
                  </span>
                  <Button variant="outline" onClick={clearCart}>
                    Clear Cart
                  </Button>
                </div>
                <Button className="w-full">
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Overview or Parts List */}
      {showCategoryView ? (
        renderCategoryOverview()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            {renderFilters()}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search parts by name, SKU, description, vehicle, part type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
                
                <div className="flex border rounded">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results */}
            {searchAndFilterParts.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No parts found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </Card>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedParts.map(renderPartCard)}
                  </div>
                ) : (
                  renderListView()
                )}
                
                {totalPages > 1 && (
                  <div className="mt-6">
                    {renderPagination()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Part Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPart?.name}</DialogTitle>
          </DialogHeader>
          {selectedPart && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">SKU</Label>
                  <p className="text-sm">{selectedPart.sku || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">VCPN</Label>
                  <p className="text-sm">{selectedPart.keystone_vcpn || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Brand</Label>
                  <p className="text-sm">{selectedPart.brand}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm">{selectedPart.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Vehicle</Label>
                  <p className="text-sm">{selectedPart.vehicleCategory || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Part Type</Label>
                  <p className="text-sm">{selectedPart.partCategory || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Price</Label>
                  <p className="text-lg font-bold text-green-600">
                    ${selectedPart.list_price.toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Stock</Label>
                  <Badge className={getStockBadgeColor(selectedPart.stockStatus || 'Out of Stock')}>
                    {selectedPart.stockStatus} ({selectedPart.quantity_on_hand})
                  </Badge>
                </div>
              </div>
              
              {selectedPart.LongDescription && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm mt-1">{selectedPart.LongDescription}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => handleAddToCart(selectedPart)}
                  disabled={selectedPart.stockStatus === 'Out of Stock'}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white"
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
};

export default Parts;


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
  Calculator,
  Car,
  Loader2,
  Trash2
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
  modelYear?: string;
  vehicleModel?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  maxQuantity: number;
  sku?: string;
  vcpn?: string;
}

interface VehicleCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
  keywords: string[];
  models: string[];
}

// ===== UTILITY FUNCTION FOR SAFE STRING CONVERSION =====
const safeString = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'boolean') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.join(' ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

// ===== CATEGORIZATION LOGIC FROM JSON =====
const VEHICLE_KEYWORDS = [
  "FORD", "F150", "F250", "F350", "DODGE", "RAM", "CHEVY", "CHEVROLET", "SILVERADO",
  "GMC", "TOYOTA", "TUNDRA", "TACOMA", "JEEP", "WRANGLER", "GLADIATOR", "NISSAN",
  "FRONTIER", "TITAN", "HONDA", "RIDGELINE"
];

const MODEL_KEYWORDS = [
  "F150", "F250", "F350", "SILVERADO", "SIERRA", "RAM", "TUNDRA", "TACOMA", 
  "WRANGLER", "GLADIATOR", "FRONTIER", "TITAN", "RIDGELINE", "COLORADO", "CANYON"
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

// ===== VEHICLE-BASED CATEGORIES WITH BRAND-SPECIFIC MODELS =====
const VEHICLE_CATEGORIES: VehicleCategory[] = [
  {
    id: 'ford',
    name: 'Ford',
    icon: Car,
    description: 'F-150, F-250, F-350, and other Ford truck parts',
    color: 'bg-blue-600',
    keywords: ['FORD', 'F150', 'F250', 'F350'],
    models: ['F150', 'F250', 'F350']
  },
  {
    id: 'chevy',
    name: 'Chevrolet',
    icon: Car,
    description: 'Silverado, Colorado, and other Chevy truck parts',
    color: 'bg-yellow-600',
    keywords: ['CHEVY', 'CHEVROLET', 'SILVERADO'],
    models: ['SILVERADO', 'COLORADO']
  },
  {
    id: 'ram',
    name: 'RAM',
    icon: Car,
    description: 'RAM 1500, 2500, 3500, and Dodge truck parts',
    color: 'bg-red-600',
    keywords: ['RAM', 'DODGE'],
    models: ['RAM']
  },
  {
    id: 'gmc',
    name: 'GMC',
    icon: Car,
    description: 'Sierra, Canyon, and other GMC truck parts',
    color: 'bg-gray-600',
    keywords: ['GMC'],
    models: ['SIERRA', 'CANYON']
  },
  {
    id: 'toyota',
    name: 'Toyota',
    icon: Car,
    description: 'Tundra, Tacoma, and other Toyota truck parts',
    color: 'bg-red-500',
    keywords: ['TOYOTA', 'TUNDRA', 'TACOMA'],
    models: ['TUNDRA', 'TACOMA']
  },
  {
    id: 'jeep',
    name: 'Jeep',
    icon: Car,
    description: 'Wrangler, Gladiator, and other Jeep parts',
    color: 'bg-green-600',
    keywords: ['JEEP', 'WRANGLER', 'GLADIATOR'],
    models: ['WRANGLER', 'GLADIATOR']
  },
  {
    id: 'nissan',
    name: 'Nissan',
    icon: Car,
    description: 'Frontier, Titan, and other Nissan truck parts',
    color: 'bg-slate-600',
    keywords: ['NISSAN', 'FRONTIER', 'TITAN'],
    models: ['FRONTIER', 'TITAN']
  },
  {
    id: 'honda',
    name: 'Honda',
    icon: Car,
    description: 'Ridgeline and other Honda truck parts',
    color: 'bg-purple-600',
    keywords: ['HONDA', 'RIDGELINE'],
    models: ['RIDGELINE']
  }
];

const categorizeVehicle = (longDescription: string): string => {
  const desc = safeString(longDescription);
  if (!desc) return "Universal/Other";
  
  const upperDesc = desc.toUpperCase();
  for (const keyword of VEHICLE_KEYWORDS) {
    if (upperDesc.includes(keyword)) {
      return keyword;
    }
  }
  return "Universal/Other";
};

const categorizePart = (longDescription: string): string => {
  const desc = safeString(longDescription);
  if (!desc) return "Uncategorized";
  
  const upperDesc = desc.toUpperCase();
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

const extractModelYear = (longDescription: string): string => {
  const desc = safeString(longDescription);
  if (!desc) return "";
  
  // Look for realistic vehicle model years (1990-2024)
  // Vehicle model years typically don't exceed current calendar year
  const currentYear = new Date().getFullYear();
  const maxYear = Math.min(currentYear, 2024); // Cap at 2024 for vehicle parts
  
  const yearMatch = desc.match(/\b(19[9]\d|20[0-2]\d)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    // Only return years that make sense for vehicle parts (1990-2024)
    if (year >= 1990 && year <= maxYear) {
      return yearMatch[1];
    }
  }
  return "";
};

const extractVehicleModel = (longDescription: string): string => {
  const desc = safeString(longDescription);
  if (!desc) return "";
  
  const upperDesc = desc.toUpperCase();
  for (const model of MODEL_KEYWORDS) {
    if (upperDesc.includes(model)) {
      return model;
    }
  }
  return "";
};

const getVehicleCategoryId = (vehicleCategory: string): string => {
  const category = safeString(vehicleCategory);
  const upperVehicle = category.toUpperCase();
  
  for (const cat of VEHICLE_CATEGORIES) {
    if (cat.keywords.some(keyword => upperVehicle.includes(keyword))) {
      return cat.id;
    }
  }
  return 'universal';
};

// ===== UTILITY FUNCTIONS =====
const checkIfKit = (partId: string): boolean => {
  const id = safeString(partId);
  return id.toLowerCase().includes('kit') || id.toLowerCase().includes('set') || false;
};

const getStockStatus = (quantity: number): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
  const qty = Number(quantity) || 0;
  if (qty === 0) return 'Out of Stock';
  if (qty <= 5) return 'Low Stock';
  return 'In Stock';
};

const getRegionalAvailability = (): string[] => {
  const regions = ['East', 'Midwest', 'West'];
  return regions.filter(() => Math.random() > 0.3);
};

const calculateMargin = (cost: number, listPrice: number): number => {
  const costNum = Number(cost) || 0;
  const priceNum = Number(listPrice) || 0;
  if (!costNum || !priceNum || priceNum === 0) return 0;
  return ((priceNum - costNum) / priceNum) * 100;
};

// ===== SIMPLE CART HOOK =====
const useSimpleCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('simple-cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('simple-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback(async (part: InventoryPart) => {
    setIsLoading(true);
    
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (part.stockStatus === 'Out of Stock') {
        toast({
          title: "Out of Stock",
          description: "This item is currently out of stock.",
          variant: "destructive"
        });
        return;
      }

      const cartItem: CartItem = {
        id: safeString(part.keystone_vcpn || part.sku || part.id),
        name: safeString(part.name),
        price: Number(part.list_price) || 0,
        quantity: 1,
        maxQuantity: Number(part.quantity_on_hand) || 0,
        sku: safeString(part.sku),
        vcpn: safeString(part.keystone_vcpn)
      };

      setCartItems(prev => {
        const existingIndex = prev.findIndex(item => item.id === cartItem.id);
        
        if (existingIndex >= 0) {
          const existing = prev[existingIndex];
          const newQuantity = existing.quantity + 1;
          
          if (newQuantity > existing.maxQuantity) {
            toast({
              title: "Stock Limit Reached",
              description: `Only ${existing.maxQuantity} units available.`,
              variant: "destructive"
            });
            return prev;
          }
          
          const updated = [...prev];
          updated[existingIndex] = { ...existing, quantity: newQuantity };
          
          toast({
            title: "Quantity Updated",
            description: `${part.name} quantity increased to ${newQuantity}.`
          });
          
          return updated;
        } else {
          toast({
            title: "Added to Cart",
            description: `${part.name} has been added to your cart.`
          });
          
          return [...prev, cartItem];
        }
      });
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const removeFromCart = useCallback((id: string) => {
    setCartItems(prev => {
      const item = prev.find(item => item.id === id);
      const updated = prev.filter(item => item.id !== id);
      
      if (item) {
        toast({
          title: "Removed from Cart",
          description: `${item.name} removed from cart.`
        });
      }
      
      return updated;
    });
  }, [toast]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        if (quantity > item.maxQuantity) {
          toast({
            title: "Stock Limit",
            description: `Maximum quantity for this item is ${item.maxQuantity}`,
            variant: "destructive"
          });
          return item;
        }
        return { ...item, quantity };
      }
      return item;
    }));
  }, [removeFromCart, toast]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    toast({
      title: "Cart Cleared",
      description: "All items removed from cart."
    });
  }, [toast]);

  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  const itemCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total,
    itemCount,
    isLoading
  };
};

// ===== PROGRESSIVE LOADING HOOK =====
const useProgressiveInventoryData = () => {
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Starting progressive inventory loading...');
      
      const supabase = getSupabaseClient();
      
      // First, get total count
      const { count } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true });
      
      setTotalCount(count || 0);
      console.log(`📊 Total parts in database: ${count?.toLocaleString()}`);
      
      // Load first batch immediately for UI rendering
      const firstBatchSize = 500;
      const { data: firstBatch, error: firstError } = await supabase
        .from('inventory')
        .select('*')
        .range(0, firstBatchSize - 1)
        .order('name');

      if (firstError) {
        console.error('❌ Error fetching first batch:', firstError);
        setError(firstError.message);
        setLoading(false);
        return;
      }

      // Process and set first batch
      const processedFirstBatch = processPartsBatch(firstBatch || []);
      setParts(processedFirstBatch);
      setLoadedCount(processedFirstBatch.length);
      setLoading(false); // UI can render now!
      
      console.log(`✅ First batch loaded: ${processedFirstBatch.length} parts - UI ready!`);
      
      // Continue loading in background
      if ((count || 0) > firstBatchSize) {
        setBackgroundLoading(true);
        loadRemainingBatches(firstBatchSize, count || 0);
      } else {
        setIsComplete(true);
      }
      
    } catch (err) {
      console.error('❌ Error in fetchData:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setLoading(false);
    }
  }, []);

  const processPartsBatch = (batch: any[]): InventoryPart[] => {
    return batch.map(item => {
      const longDesc = safeString(item.LongDescription || item.description || '');
      
      return {
        id: safeString(item.id),
        name: safeString(item.name || 'Unnamed Part'),
        sku: safeString(item.sku),
        keystone_vcpn: safeString(item.keystone_vcpn),
        cost: Number(item.cost) || 0,
        list_price: Number(item.list_price) || 0,
        quantity_on_hand: Number(item.quantity_on_hand) || 0,
        location: safeString(item.location),
        description: safeString(item.description),
        LongDescription: longDesc,
        manufacturer_part_no: safeString(item.manufacturer_part_no),
        compatibility: safeString(item.compatibility),
        brand: safeString(item.brand || 'Unknown'),
        category: safeString(item.category),
        isKit: checkIfKit(item.id),
        margin: calculateMargin(Number(item.cost) || 0, Number(item.list_price) || 0),
        stockStatus: getStockStatus(Number(item.quantity_on_hand) || 0),
        regionalAvailability: getRegionalAvailability(),
        vehicleCategory: categorizeVehicle(longDesc),
        partCategory: categorizePart(longDesc),
        modelYear: extractModelYear(longDesc),
        vehicleModel: extractVehicleModel(longDesc)
      };
    });
  };

  const loadRemainingBatches = async (startFrom: number, total: number) => {
    const supabase = getSupabaseClient();
    const batchSize = 1000;
    let currentOffset = startFrom;
    
    while (currentOffset < total) {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .range(currentOffset, currentOffset + batchSize - 1)
          .order('name');

        if (error) {
          console.error('❌ Error loading batch:', error);
          break;
        }

        if (!data || data.length === 0) {
          break;
        }

        const processedBatch = processPartsBatch(data);
        
        setParts(prev => [...prev, ...processedBatch]);
        setLoadedCount(prev => prev + processedBatch.length);
        
        console.log(`📦 Background loaded: ${currentOffset + data.length}/${total} parts`);
        
        currentOffset += batchSize;
        
        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error('❌ Error in background loading:', err);
        break;
      }
    }
    
    setBackgroundLoading(false);
    setIsComplete(true);
    console.log('🎉 All parts loaded successfully!');
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    parts, 
    loading, 
    backgroundLoading,
    error, 
    loadedCount,
    totalCount,
    isComplete,
    refetch: fetchData 
  };
};

// ===== COMPLETELY FIXED FUZZY SEARCH WITH SAFE STRING HANDLING =====
const fuzzySearch = (searchTerm: string, parts: InventoryPart[]): InventoryPart[] => {
  const term = safeString(searchTerm);
  if (!term || !term.trim()) {
    console.log('🔍 Empty search term, returning all parts');
    return parts;
  }

  const searchWords = term.toLowerCase().split(' ').filter(word => word.length > 0);
  console.log('🔍 Search words:', searchWords);
  
  if (searchWords.length === 0) {
    console.log('🔍 No valid search words, returning all parts');
    return parts;
  }
  
  const scorePart = (part: InventoryPart): number => {
    let score = 0;
    
    // All fields are now safely converted to strings
    const fields = {
      name: { value: safeString(part.name).toLowerCase(), weight: 30 },
      sku: { value: safeString(part.sku).toLowerCase(), weight: 20 },
      description: { value: safeString(part.description).toLowerCase(), weight: 20 },
      LongDescription: { value: safeString(part.LongDescription).toLowerCase(), weight: 25 },
      manufacturer_part_no: { value: safeString(part.manufacturer_part_no).toLowerCase(), weight: 15 },
      compatibility: { value: safeString(part.compatibility).toLowerCase(), weight: 10 },
      brand: { value: safeString(part.brand).toLowerCase(), weight: 5 },
      vehicleCategory: { value: safeString(part.vehicleCategory).toLowerCase(), weight: 15 },
      partCategory: { value: safeString(part.partCategory).toLowerCase(), weight: 10 },
      modelYear: { value: safeString(part.modelYear).toLowerCase(), weight: 12 },
      vehicleModel: { value: safeString(part.vehicleModel).toLowerCase(), weight: 18 },
      keystone_vcpn: { value: safeString(part.keystone_vcpn).toLowerCase(), weight: 20 },
      category: { value: safeString(part.category).toLowerCase(), weight: 8 },
      location: { value: safeString(part.location).toLowerCase(), weight: 5 }
    };

    searchWords.forEach(word => {
      Object.entries(fields).forEach(([fieldName, field]) => {
        if (field.value && field.value.includes(word)) {
          if (field.value.startsWith(word)) {
            score += field.weight * 2; // Boost for exact start matches
          } else {
            score += field.weight;
          }
        }
      });
    });

    return score;
  };

  try {
    const results = parts
      .map(part => ({ part, score: scorePart(part) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ part }) => part);

    console.log(`🔍 Search for "${term}" returned ${results.length} results from ${parts.length} total parts`);
    
    return results;
  } catch (error) {
    console.error('❌ Error in fuzzy search:', error);
    return parts; // Return all parts if search fails
  }
};

// ===== MAIN COMPONENT =====
const Parts: React.FC = () => {
  // ===== ALL HOOKS DECLARED AT TOP LEVEL =====
  const { toast } = useToast();
  const { 
    cartItems, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    total, 
    itemCount, 
    isLoading: cartLoading 
  } = useSimpleCart();
  
  const { 
    parts, 
    loading: partsLoading, 
    backgroundLoading,
    error: partsError, 
    loadedCount,
    totalCount,
    isComplete,
    refetch 
  } = useProgressiveInventoryData();
  
  // State hooks
  const [filteredParts, setFilteredParts] = useState<InventoryPart[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState(''); // For category overview search
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState<string>('all');
  const [selectedPartCategory, setSelectedPartCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedModelYear, setSelectedModelYear] = useState<string>('all');
  const [selectedVehicleModel, setSelectedVehicleModel] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'category' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Dialog state
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCartDialog, setShowCartDialog] = useState(false);
  
  // Category view state
  const [showCategoryView, setShowCategoryView] = useState(true);

  // ===== MEMOIZED VALUES =====
  const availableBrands = useMemo(() => {
    const brands = [...new Set(parts.map(part => safeString(part.brand)).filter(Boolean))];
    return brands.sort();
  }, [parts]);

  const availablePartCategories = useMemo(() => {
    const categories = [...new Set(parts.map(part => safeString(part.partCategory)).filter(Boolean))];
    return categories.sort();
  }, [parts]);

  // Realistic model years only (1990-2024)
  const availableModelYears = useMemo(() => {
    const years = [...new Set(parts.map(part => safeString(part.modelYear)).filter(year => {
      if (!year) return false;
      const yearNum = parseInt(year);
      // Only include realistic vehicle model years
      return yearNum >= 1990 && yearNum <= 2024;
    }))];
    return years.sort((a, b) => parseInt(b) - parseInt(a)); // Newest first
  }, [parts]);

  // Brand-specific vehicle models
  const availableVehicleModels = useMemo(() => {
    if (selectedVehicleCategory === 'all') {
      const models = [...new Set(parts.map(part => safeString(part.vehicleModel)).filter(Boolean))];
      return models.sort();
    }
    
    // Get models specific to selected brand
    const selectedCategory = VEHICLE_CATEGORIES.find(cat => cat.id === selectedVehicleCategory);
    if (selectedCategory) {
      // Filter parts by selected vehicle category and extract models
      const categoryParts = parts.filter(part => {
        const vehicleCatId = getVehicleCategoryId(safeString(part.vehicleCategory));
        return vehicleCatId === selectedVehicleCategory;
      });
      
      const models = [...new Set(categoryParts.map(part => safeString(part.vehicleModel)).filter(Boolean))];
      return models.sort();
    }
    
    return [];
  }, [parts, selectedVehicleCategory]);

  const vehicleCategoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    
    VEHICLE_CATEGORIES.forEach(cat => {
      stats[cat.id] = parts.filter(part => {
        const vehicleCatId = getVehicleCategoryId(safeString(part.vehicleCategory));
        return vehicleCatId === cat.id;
      }).length;
    });
    
    // Universal/Other category
    stats.universal = parts.filter(part => {
      const vehicleCatId = getVehicleCategoryId(safeString(part.vehicleCategory));
      return vehicleCatId === 'universal';
    }).length;
    
    return stats;
  }, [parts]);

  // ===== FIXED SEARCH AND FILTERING =====
  const searchAndFilterParts = useMemo(() => {
    console.log('🔍 Starting search and filter process...');
    console.log('🔍 Total parts available:', parts.length);
    console.log('🔍 Search term:', searchTerm);
    console.log('🔍 Selected vehicle category:', selectedVehicleCategory);
    
    let result = [...parts]; // Create a copy to avoid mutations

    // Apply search FIRST - this is the critical fix
    if (searchTerm && searchTerm.trim()) {
      console.log('🔍 Applying search...');
      try {
        result = fuzzySearch(searchTerm.trim(), result);
        console.log('🔍 After search:', result.length, 'parts');
      } catch (error) {
        console.error('❌ Search error:', error);
        // If search fails, continue with all parts
      }
    }

    // Apply vehicle category filter
    if (selectedVehicleCategory !== 'all') {
      console.log('🔍 Applying vehicle category filter...');
      if (selectedVehicleCategory === 'universal') {
        result = result.filter(part => {
          const vehicleCatId = getVehicleCategoryId(safeString(part.vehicleCategory));
          return vehicleCatId === 'universal';
        });
      } else {
        result = result.filter(part => {
          const vehicleCatId = getVehicleCategoryId(safeString(part.vehicleCategory));
          return vehicleCatId === selectedVehicleCategory;
        });
      }
      console.log('🔍 After vehicle category filter:', result.length, 'parts');
    }

    // Apply other filters with safe string handling
    if (selectedPartCategory !== 'all') {
      result = result.filter(part => safeString(part.partCategory) === selectedPartCategory);
      console.log('🔍 After part category filter:', result.length, 'parts');
    }

    if (selectedBrand !== 'all') {
      result = result.filter(part => safeString(part.brand) === selectedBrand);
      console.log('🔍 After brand filter:', result.length, 'parts');
    }

    if (selectedStockStatus !== 'all') {
      result = result.filter(part => safeString(part.stockStatus) === selectedStockStatus);
      console.log('🔍 After stock status filter:', result.length, 'parts');
    }

    if (selectedRegion !== 'all') {
      result = result.filter(part => {
        const availability = part.regionalAvailability || [];
        return availability.includes(selectedRegion);
      });
      console.log('🔍 After region filter:', result.length, 'parts');
    }

    if (selectedModelYear !== 'all') {
      result = result.filter(part => safeString(part.modelYear) === selectedModelYear);
      console.log('🔍 After model year filter:', result.length, 'parts');
    }

    if (selectedVehicleModel !== 'all') {
      result = result.filter(part => safeString(part.vehicleModel) === selectedVehicleModel);
      console.log('🔍 After vehicle model filter:', result.length, 'parts');
    }

    // Apply price range
    result = result.filter(part => {
      const price = Number(part.list_price) || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });
    console.log('🔍 After price range filter:', result.length, 'parts');

    // Apply sorting with safe string handling
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = safeString(a.name).localeCompare(safeString(b.name));
          break;
        case 'price':
          comparison = (Number(a.list_price) || 0) - (Number(b.list_price) || 0);
          break;
        case 'category':
          comparison = safeString(a.partCategory).localeCompare(safeString(b.partCategory));
          break;
        case 'stock':
          comparison = (Number(a.quantity_on_hand) || 0) - (Number(b.quantity_on_hand) || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    console.log('🔍 Final filtered result:', result.length, 'parts');
    return result;
  }, [parts, searchTerm, selectedVehicleCategory, selectedPartCategory, selectedBrand, selectedStockStatus, selectedRegion, selectedModelYear, selectedVehicleModel, priceRange, sortBy, sortOrder]);

  // ===== GLOBAL SEARCH FOR CATEGORY VIEW =====
  const globalSearchResults = useMemo(() => {
    const term = safeString(globalSearchTerm);
    if (!term || !term.trim()) {
      return [];
    }
    
    console.log('🌍 Global search for:', term);
    try {
      const results = fuzzySearch(term.trim(), parts);
      console.log('🌍 Global search results:', results.length);
      return results;
    } catch (error) {
      console.error('❌ Global search error:', error);
      return [];
    }
  }, [globalSearchTerm, parts]);

  // ===== PAGINATION =====
  const paginatedParts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return searchAndFilterParts.slice(startIndex, startIndex + itemsPerPage);
  }, [searchAndFilterParts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(searchAndFilterParts.length / itemsPerPage);

  // ===== CART FUNCTIONS =====
  const handleAddToCart = useCallback(async (part: InventoryPart) => {
    console.log('🛒 Add to cart clicked for:', part.name);
    await addToCart(part);
  }, [addToCart]);

  const handleViewDetail = useCallback((part: InventoryPart) => {
    console.log('👁️ View detail clicked for:', part.name);
    setSelectedPart(part);
    setShowDetailDialog(true);
  }, []);

  // ===== CATEGORY FUNCTIONS =====
  const handleVehicleCategorySelect = useCallback((categoryId: string) => {
    setSelectedVehicleCategory(categoryId);
    setSelectedVehicleModel('all'); // Reset model when brand changes
    setShowCategoryView(false);
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setGlobalSearchTerm('');
    setSelectedVehicleCategory('all');
    setSelectedPartCategory('all');
    setSelectedBrand('all');
    setSelectedStockStatus('all');
    setSelectedRegion('all');
    setSelectedModelYear('all');
    setSelectedVehicleModel('all');
    setPriceRange([0, 1000]);
    setCurrentPage(1);
  }, []);

  // ===== GLOBAL SEARCH FUNCTIONS =====
  const handleGlobalSearch = useCallback((searchValue: string) => {
    const value = safeString(searchValue);
    console.log('🌍 Global search triggered:', value);
    setGlobalSearchTerm(value);
    
    if (value.trim()) {
      // Switch to parts view and set search term
      setSearchTerm(value);
      setShowCategoryView(false);
      setCurrentPage(1);
    }
  }, []);

  const handleGlobalSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearchTerm.trim()) {
      handleGlobalSearch(globalSearchTerm);
    }
  }, [globalSearchTerm, handleGlobalSearch]);

  // Reset filters when navigating back to category view
  useEffect(() => {
    if (showCategoryView) {
      resetFilters();
    }
  }, [showCategoryView, resetFilters]);

  // Reset vehicle model when vehicle category changes
  useEffect(() => {
    setSelectedVehicleModel('all');
  }, [selectedVehicleCategory]);

  // ===== EFFECTS =====
  useEffect(() => {
    setFilteredParts(searchAndFilterParts);
  }, [searchAndFilterParts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedVehicleCategory, selectedPartCategory, selectedBrand, selectedStockStatus, selectedRegion, selectedModelYear, selectedVehicleModel, priceRange]);

  // ===== EARLY RETURNS AFTER ALL HOOKS =====
  if (partsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-lg">Loading initial inventory...</p>
            <p className="text-sm text-muted-foreground">Preparing first batch of parts</p>
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
  const renderLoadingProgress = () => {
    if (!backgroundLoading && isComplete) return null;
    
    return (
      <div className="mb-4">
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            {backgroundLoading ? (
              <>Loading parts in background: {loadedCount.toLocaleString()} of {totalCount.toLocaleString()} loaded</>
            ) : (
              <>Loading complete: {loadedCount.toLocaleString()} parts available</>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  const renderVehicleCategoryOverview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Vehicle Parts Catalog</h1>
        <p className="text-muted-foreground">
          Browse our comprehensive selection of {loadedCount.toLocaleString()} truck parts organized by vehicle brand
          {backgroundLoading && <span className="ml-2">(Loading more in background...)</span>}
        </p>
      </div>

      {renderLoadingProgress()}

      {/* Global Search Bar */}
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleGlobalSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search all parts by name, SKU, description, vehicle, model, year..."
            value={globalSearchTerm}
            onChange={(e) => setGlobalSearchTerm(safeString(e.target.value))}
            className="pl-10 pr-4 py-3 text-lg"
          />
          {globalSearchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={() => setGlobalSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </form>
        
        {/* Global Search Results Preview */}
        {globalSearchTerm && globalSearchResults.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Search Results ({globalSearchResults.length.toLocaleString()} found)
                </CardTitle>
                <Button 
                  onClick={() => handleGlobalSearch(globalSearchTerm)}
                  size="sm"
                >
                  View All Results
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {globalSearchResults.slice(0, 5).map((part) => (
                  <div 
                    key={part.id} 
                    className="flex items-center justify-between p-2 border rounded hover:bg-muted cursor-pointer"
                    onClick={() => handleGlobalSearch(globalSearchTerm)}
                  >
                    <div>
                      <h4 className="font-medium text-sm">{safeString(part.name)}</h4>
                      <p className="text-xs text-muted-foreground">
                        {part.sku && `SKU: ${safeString(part.sku)} • `}
                        {safeString(part.brand)} • ${(Number(part.list_price) || 0).toFixed(2)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {safeString(part.vehicleCategory)}
                    </Badge>
                  </div>
                ))}
                {globalSearchResults.length > 5 && (
                  <div className="text-center pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleGlobalSearch(globalSearchTerm)}
                    >
                      View {(globalSearchResults.length - 5).toLocaleString()} more results
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {globalSearchTerm && globalSearchResults.length === 0 && (
          <Card className="mt-4">
            <CardContent className="text-center py-6">
              <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No parts found for "{globalSearchTerm}"</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {VEHICLE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const count = vehicleCategoryStats[category.id] || 0;
          
          return (
            <Card 
              key={category.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleVehicleCategorySelect(category.id)}
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
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </CardContent>
            </Card>
          );
        })}

        {/* Universal/Other Category */}
        {vehicleCategoryStats.universal > 0 && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleVehicleCategorySelect('universal')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-lg bg-gray-500 text-white">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Universal/Other</CardTitle>
                  <p className="text-sm text-muted-foreground">{vehicleCategoryStats.universal.toLocaleString()} parts</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Universal parts and accessories that fit multiple vehicles
              </p>
            </CardContent>
          </Card>
        )}
      </div>
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
        {/* Vehicle Category Filter */}
        <div>
          <Label className="text-sm font-medium">Vehicle Brand</Label>
          <Select value={selectedVehicleCategory} onValueChange={setSelectedVehicleCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Vehicles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {VEHICLE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name} ({(vehicleCategoryStats[cat.id] || 0).toLocaleString()})
                </SelectItem>
              ))}
              {vehicleCategoryStats.universal > 0 && (
                <SelectItem value="universal">Universal/Other ({vehicleCategoryStats.universal.toLocaleString()})</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Vehicle Model Filter - Brand Specific */}
        <div>
          <Label className="text-sm font-medium">Vehicle Model</Label>
          <Select value={selectedVehicleModel} onValueChange={setSelectedVehicleModel}>
            <SelectTrigger>
              <SelectValue placeholder="All Models" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              {availableVehicleModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Year Filter - Realistic Years Only */}
        <div>
          <Label className="text-sm font-medium">Model Year</Label>
          <Select value={selectedModelYear} onValueChange={setSelectedModelYear}>
            <SelectTrigger>
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableModelYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
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
              <h3 className="font-semibold text-sm leading-tight mb-1">{safeString(part.name)}</h3>
              <div className="flex flex-wrap gap-1 mb-2">
                {part.sku && (
                  <Badge variant="outline" className="text-xs">
                    SKU: {safeString(part.sku)}
                  </Badge>
                )}
                {part.keystone_vcpn && (
                  <Badge variant="outline" className="text-xs">
                    VCPN: {safeString(part.keystone_vcpn)}
                  </Badge>
                )}
                {part.vehicleCategory && part.vehicleCategory !== 'Universal/Other' && (
                  <Badge variant="secondary" className="text-xs">
                    {safeString(part.vehicleCategory)}
                  </Badge>
                )}
                {part.partCategory && part.partCategory !== 'Uncategorized' && (
                  <Badge variant="outline" className="text-xs">
                    {safeString(part.partCategory)}
                  </Badge>
                )}
                {part.modelYear && (
                  <Badge variant="outline" className="text-xs">
                    {safeString(part.modelYear)}
                  </Badge>
                )}
                {part.vehicleModel && (
                  <Badge variant="secondary" className="text-xs">
                    {safeString(part.vehicleModel)}
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
              <span className="text-sm font-medium">{safeString(part.brand)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price:</span>
              <span className="text-lg font-bold text-green-600">
                ${(Number(part.list_price) || 0).toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cost:</span>
              <span className="text-sm">${(Number(part.cost) || 0).toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Margin:</span>
              <span className="text-sm font-medium text-blue-600">
                {(Number(part.margin) || 0).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Stock:</span>
              <Badge className={getStockBadgeColor(safeString(part.stockStatus))}>
                {safeString(part.stockStatus)} ({Number(part.quantity_on_hand) || 0})
              </Badge>
            </div>
            
            {part.location && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Location:</span>
                <span className="text-sm">{safeString(part.location)}</span>
              </div>
            )}
            
            {part.regionalAvailability && part.regionalAvailability.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {part.regionalAvailability.map((region) => (
                  <Badge key={region} variant="secondary" className="text-xs">
                    {safeString(region)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-auto space-y-2">
            <div className="flex gap-2">
              <Button 
                onClick={() => handleAddToCart(part)}
                disabled={part.stockStatus === 'Out of Stock' || cartLoading}
                className="flex-1 bg-[#6B7FE8] hover:bg-[#5A6FD7] text-white"
                size="sm"
              >
                {cartLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
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
                  <h3 className="font-semibold">{safeString(part.name)}</h3>
                  <div className="flex gap-2 mt-1">
                    {part.sku && (
                      <Badge variant="outline" className="text-xs">
                        {safeString(part.sku)}
                      </Badge>
                    )}
                    {isKit && (
                      <Badge className="bg-purple-100 text-purple-800 text-xs">
                        Kit
                      </Badge>
                    )}
                    {part.vehicleCategory && part.vehicleCategory !== 'Universal/Other' && (
                      <Badge variant="secondary" className="text-xs">
                        {safeString(part.vehicleCategory)}
                      </Badge>
                    )}
                    {part.modelYear && (
                      <Badge variant="outline" className="text-xs">
                        {safeString(part.modelYear)}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="font-medium">{safeString(part.brand)}</div>
                  <div className="text-muted-foreground">
                    {part.keystone_vcpn && `VCPN: ${safeString(part.keystone_vcpn)}`}
                  </div>
                  <div className="text-muted-foreground">
                    {part.partCategory && part.partCategory !== 'Uncategorized' && safeString(part.partCategory)}
                  </div>
                  {part.vehicleModel && (
                    <div className="text-muted-foreground">
                      {safeString(part.vehicleModel)}
                    </div>
                  )}
                </div>
                
                <div className="text-sm">
                  <div className="font-bold text-green-600">
                    ${(Number(part.list_price) || 0).toFixed(2)}
                  </div>
                  <div className="text-muted-foreground">
                    Cost: ${(Number(part.cost) || 0).toFixed(2)}
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="font-medium text-blue-600">
                    {(Number(part.margin) || 0).toFixed(1)}% margin
                  </div>
                  <div className="text-muted-foreground">
                    {safeString(part.location)}
                  </div>
                </div>
                
                <div>
                  <Badge className={getStockBadgeColor(safeString(part.stockStatus))}>
                    {safeString(part.stockStatus)}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Number(part.quantity_on_hand) || 0} units
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleAddToCart(part)}
                    disabled={part.stockStatus === 'Out of Stock' || cartLoading}
                    className="bg-[#6B7FE8] hover:bg-[#5A6FD7] text-white"
                    size="sm"
                  >
                    {cartLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
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
        {backgroundLoading && <span className="ml-2">(Loading more...)</span>}
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
              Back to Vehicle Categories
            </Button>
          )}
          
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">
              {showCategoryView ? 'Vehicle Parts Catalog' : 
               selectedVehicleCategory === 'all' ? 'All Parts' :
               selectedVehicleCategory === 'universal' ? 'Universal/Other Parts' :
               VEHICLE_CATEGORIES.find(cat => cat.id === selectedVehicleCategory)?.name + ' Parts' || 'Parts'}
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
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Shopping Cart ({itemCount} items)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {cartItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Your cart is empty
                </p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <h4 className="font-medium">{safeString(item.name)}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${(Number(item.price) || 0).toFixed(2)} each
                      </p>
                      {item.sku && (
                        <p className="text-xs text-muted-foreground">
                          SKU: {safeString(item.sku)}
                        </p>
                      )}
                      {item.vcpn && (
                        <p className="text-xs text-muted-foreground">
                          VCPN: {safeString(item.vcpn)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.maxQuantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
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
                    Total: ${total.toFixed(2)}
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
        renderVehicleCategoryOverview()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            {renderFilters()}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {renderLoadingProgress()}

            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search parts by name, SKU, description, vehicle, model, year..."
                  value={searchTerm}
                  onChange={(e) => {
                    const value = safeString(e.target.value);
                    console.log('🔍 Search input changed:', value);
                    setSearchTerm(value);
                  }}
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
            <DialogTitle>{safeString(selectedPart?.name)}</DialogTitle>
          </DialogHeader>
          {selectedPart && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">SKU</Label>
                  <p className="text-sm">{safeString(selectedPart.sku) || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">VCPN</Label>
                  <p className="text-sm">{safeString(selectedPart.keystone_vcpn) || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Brand</Label>
                  <p className="text-sm">{safeString(selectedPart.brand)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm">{safeString(selectedPart.category)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Vehicle</Label>
                  <p className="text-sm">{safeString(selectedPart.vehicleCategory) || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Part Type</Label>
                  <p className="text-sm">{safeString(selectedPart.partCategory) || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Model</Label>
                  <p className="text-sm">{safeString(selectedPart.vehicleModel) || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Year</Label>
                  <p className="text-sm">{safeString(selectedPart.modelYear) || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Price</Label>
                  <p className="text-lg font-bold text-green-600">
                    ${(Number(selectedPart.list_price) || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Stock</Label>
                  <Badge className={getStockBadgeColor(safeString(selectedPart.stockStatus))}>
                    {safeString(selectedPart.stockStatus)} ({Number(selectedPart.quantity_on_hand) || 0})
                  </Badge>
                </div>
              </div>
              
              {selectedPart.LongDescription && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm mt-1">{safeString(selectedPart.LongDescription)}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => handleAddToCart(selectedPart)}
                  disabled={selectedPart.stockStatus === 'Out of Stock' || cartLoading}
                  className="flex-1 bg-[#6B7FE8] hover:bg-[#5A6FD7] text-white"
                >
                  {cartLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
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


import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Plus,
  Minus,
  Eye, 
  ShoppingCart,
  Trash2,
  ArrowRight,
  Package, 
  ChevronRight,
  X,
  RefreshCw,
  AlertTriangle,
  Car,
  Loader2
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

// ===== CATEGORIZATION LOGIC =====
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
  
  const currentYear = new Date().getFullYear();
  const maxYear = Math.min(currentYear, 2024);
  
  const yearMatch = desc.match(/\b(19[9]\d|20[0-2]\d)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
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

// ===== FUZZY SEARCH =====
const fuzzySearch = (searchTerm: string, parts: InventoryPart[]): InventoryPart[] => {
  const term = safeString(searchTerm);
  if (!term || !term.trim()) {
    return parts;
  }

  const searchWords = term.toLowerCase().split(' ').filter(word => word.length > 0);
  
  if (searchWords.length === 0) {
    return parts;
  }
  
  const scorePart = (part: InventoryPart): number => {
    let score = 0;
    
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
            score += field.weight * 2;
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

    return results;
  } catch (error) {
    console.error('❌ Error in fuzzy search:', error);
    return parts;
  }
};

// ===== MAIN COMPONENT =====
const Parts: React.FC = () => {
  console.log('🚀 Parts component rendering...');

  // ===== DATA LOADING =====
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

  // ===== SIMPLE CART STATE - NO COMPLEX HOOKS =====
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [cartMessage, setCartMessage] = useState<string>('');

  console.log('🛒 Cart state:', cart);
  console.log('🛒 Cart message:', cartMessage);

  // Load cart from localStorage on mount
  useEffect(() => {
    console.log('🔄 Loading cart from localStorage...');
    const savedCart = localStorage.getItem('parts-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('✅ Cart loaded from localStorage:', parsedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('❌ Error loading cart from localStorage:', error);
      }
    } else {
      console.log('ℹ️ No saved cart found in localStorage');
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    console.log('💾 Saving cart to localStorage:', cart);
    localStorage.setItem('parts-cart', JSON.stringify(cart));
  }, [cart]);

  // ===== DEBUGGING FUNCTIONS =====
  const debugButtonClick = (part: InventoryPart, event: React.MouseEvent) => {
    console.log('🔍 DEBUG: Button click event triggered!');
    console.log('🔍 DEBUG: Event object:', event);
    console.log('🔍 DEBUG: Part object:', part);
    console.log('🔍 DEBUG: Part ID:', part.id);
    console.log('🔍 DEBUG: Part name:', part.name);
    console.log('🔍 DEBUG: Stock status:', part.stockStatus);
    console.log('🔍 DEBUG: Quantity on hand:', part.quantity_on_hand);
    
    // Check if event is being prevented
    if (event.defaultPrevented) {
      console.log('⚠️ DEBUG: Event default was prevented!');
    }
    
    // Check if event propagation was stopped
    if (event.isPropagationStopped && event.isPropagationStopped()) {
      console.log('⚠️ DEBUG: Event propagation was stopped!');
    }
    
    // Prevent any potential event issues
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🔍 DEBUG: About to call addToCart...');
    addToCart(part);
  };

  const debugButtonMouseEnter = (part: InventoryPart) => {
    console.log('🖱️ DEBUG: Mouse entered button for part:', part.name);
  };

  const debugButtonMouseLeave = (part: InventoryPart) => {
    console.log('🖱️ DEBUG: Mouse left button for part:', part.name);
  };

  // ===== SIMPLE ADD TO CART FUNCTION - NO HOOKS, NO COMPLEXITY =====
  const addToCart = (part: InventoryPart) => {
    console.log('🛒 ===== ADD TO CART FUNCTION CALLED =====');
    console.log('🛒 Part:', part.name);
    console.log('🛒 Part ID:', part.id);
    console.log('🛒 Current cart state:', cart);
    
    const partId = part.id;
    const maxQuantity = Number(part.quantity_on_hand) || 0;
    const currentQuantity = cart[partId] || 0;
    const newQuantity = currentQuantity + 1;

    console.log('🛒 Part ID:', partId);
    console.log('🛒 Max quantity:', maxQuantity);
    console.log('🛒 Current quantity in cart:', currentQuantity);
    console.log('🛒 New quantity would be:', newQuantity);

    if (part.stockStatus === 'Out of Stock' || maxQuantity === 0) {
      const message = `❌ ${part.name} is out of stock`;
      console.log('🛒 Stock check failed:', message);
      setCartMessage(message);
      setTimeout(() => setCartMessage(''), 3000);
      return;
    }

    if (newQuantity > maxQuantity) {
      const message = `❌ Only ${maxQuantity} available in stock`;
      console.log('🛒 Quantity check failed:', message);
      setCartMessage(message);
      setTimeout(() => setCartMessage(''), 3000);
      return;
    }

    console.log('🛒 All checks passed, updating cart...');

    // Update cart state
    const newCart = {
      ...cart,
      [partId]: newQuantity
    };
    
    console.log('🛒 New cart state will be:', newCart);
    setCart(newCart);

    const successMessage = `✅ ${part.name} added to cart!`;
    console.log('🛒 Success:', successMessage);
    setCartMessage(successMessage);
    setTimeout(() => setCartMessage(''), 3000);
    
    console.log('🛒 ===== ADD TO CART FUNCTION COMPLETED =====');
  };

  // ===== OTHER STATE =====
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
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
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
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

  const availableModelYears = useMemo(() => {
    const years = [...new Set(parts.map(part => safeString(part.modelYear)).filter(year => {
      if (!year) return false;
      const yearNum = parseInt(year);
      return yearNum >= 1990 && yearNum <= 2024;
    }))];
    return years.sort((a, b) => parseInt(b) - parseInt(a));
  }, [parts]);

  const availableVehicleModels = useMemo(() => {
    if (selectedVehicleCategory === 'all') {
      const models = [...new Set(parts.map(part => safeString(part.vehicleModel)).filter(Boolean))];
      return models.sort();
    }
    
    const selectedCategory = VEHICLE_CATEGORIES.find(cat => cat.id === selectedVehicleCategory);
    if (selectedCategory) {
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
    
    stats.universal = parts.filter(part => {
      const vehicleCatId = getVehicleCategoryId(safeString(part.vehicleCategory));
      return vehicleCatId === 'universal';
    }).length;
    
    return stats;
  }, [parts]);

  // ===== SEARCH AND FILTERING =====
  const searchAndFilterParts = useMemo(() => {
    let result = [...parts];

    if (searchTerm && searchTerm.trim()) {
      try {
        result = fuzzySearch(searchTerm.trim(), result);
      } catch (error) {
        console.error('❌ Search error:', error);
      }
    }

    if (selectedVehicleCategory !== 'all') {
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
    }

    if (selectedPartCategory !== 'all') {
      result = result.filter(part => safeString(part.partCategory) === selectedPartCategory);
    }

    if (selectedBrand !== 'all') {
      result = result.filter(part => safeString(part.brand) === selectedBrand);
    }

    if (selectedStockStatus !== 'all') {
      result = result.filter(part => safeString(part.stockStatus) === selectedStockStatus);
    }

    if (selectedRegion !== 'all') {
      result = result.filter(part => {
        const availability = part.regionalAvailability || [];
        return availability.includes(selectedRegion);
      });
    }

    if (selectedModelYear !== 'all') {
      result = result.filter(part => safeString(part.modelYear) === selectedModelYear);
    }

    if (selectedVehicleModel !== 'all') {
      result = result.filter(part => safeString(part.vehicleModel) === selectedVehicleModel);
    }

    result = result.filter(part => {
      const price = Number(part.list_price) || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

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

    return result;
  }, [parts, searchTerm, selectedVehicleCategory, selectedPartCategory, selectedBrand, selectedStockStatus, selectedRegion, selectedModelYear, selectedVehicleModel, priceRange, sortBy, sortOrder]);

  const globalSearchResults = useMemo(() => {
    const term = safeString(globalSearchTerm);
    if (!term || !term.trim()) {
      return [];
    }
    
    try {
      const results = fuzzySearch(term.trim(), parts);
      return results;
    } catch (error) {
      console.error('❌ Global search error:', error);
      return [];
    }
  }, [globalSearchTerm, parts]);

  const paginatedParts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return searchAndFilterParts.slice(startIndex, startIndex + itemsPerPage);
  }, [searchAndFilterParts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(searchAndFilterParts.length / itemsPerPage);

  // ===== CART FUNCTIONS =====
  const getTotalItems = () => {
    const total = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
    console.log('🛒 Total items in cart:', total);
    return total;
  };

  const getTotalValue = () => {
    const total = Object.entries(cart).reduce((total, [partId, quantity]) => {
      const part = parts.find(p => p.id === partId);
      return total + (Number(part?.list_price) || 0) * quantity;
    }, 0);
    console.log('🛒 Total cart value:', total);
    return total;
  };

  const updateCartQuantity = (partId: string, quantity: number) => {
    console.log('🛒 Updating cart quantity:', partId, quantity);
    if (quantity <= 0) {
      setCart(prev => {
        const newCart = { ...prev };
        delete newCart[partId];
        return newCart;
      });
    } else {
      setCart(prev => ({
        ...prev,
        [partId]: quantity
      }));
    }
  };

  const removeFromCart = (partId: string) => {
    console.log('🛒 Removing from cart:', partId);
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[partId];
      return newCart;
    });
  };

  const clearCart = () => {
    console.log('🛒 Clearing cart');
    setCart({});
    setCartMessage('🗑️ Cart cleared');
    setTimeout(() => setCartMessage(''), 3000);
  };

  // ===== OTHER FUNCTIONS =====
  const handleVehicleCategorySelect = (categoryId: string) => {
    setSelectedVehicleCategory(categoryId);
    setSelectedVehicleModel('all');
    setShowCategoryView(false);
    setCurrentPage(1);
  };

  const resetFilters = () => {
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
  };

  const handleGlobalSearch = (searchValue: string) => {
    const value = safeString(searchValue);
    setGlobalSearchTerm(value);
    
    if (value.trim()) {
      setSearchTerm(value);
      setShowCategoryView(false);
      setCurrentPage(1);
    }
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearchTerm.trim()) {
      handleGlobalSearch(globalSearchTerm);
    }
  };

  // ===== EFFECTS =====
  useEffect(() => {
    if (showCategoryView) {
      resetFilters();
    }
  }, [showCategoryView]);

  useEffect(() => {
    setSelectedVehicleModel('all');
  }, [selectedVehicleCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedVehicleCategory, selectedPartCategory, selectedBrand, selectedStockStatus, selectedRegion, selectedModelYear, selectedVehicleModel, priceRange]);

  // ===== EARLY RETURNS =====
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

  const getStockBadgeColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-800';
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderPartCard = (part: InventoryPart) => {
    console.log('🎨 Rendering part card for:', part.name);
    const isKit = part.isKit || false;
    const isDisabled = part.stockStatus === 'Out of Stock';
    
    console.log('🎨 Part card - isDisabled:', isDisabled, 'stockStatus:', part.stockStatus);
    
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
              {/* DEBUG BUTTON WITH EXTENSIVE LOGGING */}
              <Button 
                onClick={(e) => {
                  console.log('🔥 BUTTON CLICKED! Event:', e);
                  console.log('🔥 BUTTON CLICKED! Part:', part.name);
                  debugButtonClick(part, e);
                }}
                onMouseEnter={() => debugButtonMouseEnter(part)}
                onMouseLeave={() => debugButtonMouseLeave(part)}
                disabled={isDisabled}
                className={`flex-1 text-white ${isDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#6B7FE8] hover:bg-[#5A6FD7] cursor-pointer'}`}
                size="sm"
                style={{
                  pointerEvents: isDisabled ? 'none' : 'auto',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isDisabled ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="px-3"
                onClick={() => {
                  console.log('👁️ View details clicked for:', part.name);
                  setSelectedPart(part);
                  setShowDetailDialog(true);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  console.log('🎨 About to render main component...');

  // ===== MAIN RENDER =====
  return (
    <div className="container mx-auto p-6">
      {/* Debug Info */}
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-bold text-sm mb-2">🔍 DEBUG INFO:</h3>
        <p className="text-xs">Parts loaded: {parts.length}</p>
        <p className="text-xs">Cart items: {getTotalItems()}</p>
        <p className="text-xs">Cart state: {JSON.stringify(cart)}</p>
        <p className="text-xs">Cart message: {cartMessage}</p>
        <p className="text-xs">Show category view: {showCategoryView.toString()}</p>
      </div>

      {/* Cart Message */}
      {cartMessage && (
        <div className="fixed top-4 right-4 z-50 bg-white border rounded-lg shadow-lg p-4 max-w-sm">
          <p className="text-sm">{cartMessage}</p>
        </div>
      )}

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

        {/* Simple Cart Button */}
        <Button 
          variant="outline" 
          className="relative"
          onClick={() => {
            console.log('🛒 Cart button clicked');
            setShowCartDrawer(true);
          }}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart ({getTotalItems()})
          {getTotalItems() > 0 && (
            <>
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {getTotalItems()}
              </Badge>
              <span className="ml-2 text-sm text-green-600">
                ${getTotalValue().toFixed(2)}
              </span>
            </>
          )}
        </Button>
      </div>

      {/* Category Overview or Parts List */}
      {showCategoryView ? (
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedParts.map(renderPartCard)}
                </div>
                
                {totalPages > 1 && (
                  <div className="mt-6">
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
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Simple Cart Drawer */}
      {showCartDrawer && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowCartDrawer(false)}
          />

          {/* Cart Drawer */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Shopping Cart</h2>
                {getTotalItems() > 0 && (
                  <Badge variant="secondary">{getTotalItems()} items</Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowCartDrawer(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Cart Content */}
            <div className="flex flex-col h-full">
              {getTotalItems() === 0 ? (
                /* Empty Cart State */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 mb-6">Add some parts to get started</p>
                  <Button onClick={() => setShowCartDrawer(false)} variant="outline">
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {Object.entries(cart).map(([partId, quantity]) => {
                        const part = parts.find(p => p.id === partId);
                        if (!part) return null;
                        
                        return (
                          <div key={partId} className="flex gap-3 p-3 border rounded-lg">
                            {/* Item Image Placeholder */}
                            <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                              <ShoppingCart className="h-6 w-6 text-gray-400" />
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm line-clamp-2">{safeString(part.name)}</h4>
                              {part.sku && (
                                <p className="text-xs text-gray-500">SKU: {safeString(part.sku)}</p>
                              )}
                              
                              {/* Price and Stock Status */}
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-semibold text-green-600">
                                  ${(Number(part.list_price) || 0).toFixed(2)}
                                </span>
                                <span className="text-xs text-green-600">
                                  {Number(part.quantity_on_hand) || 0} in stock
                                </span>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateCartQuantity(partId, quantity - 1)}
                                    disabled={quantity <= 1}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center text-sm font-medium">
                                    {quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateCartQuantity(partId, quantity + 1)}
                                    disabled={quantity >= (Number(part.quantity_on_hand) || 0)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>

                                {/* Remove Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromCart(partId)}
                                  className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Item Total */}
                              <div className="text-right mt-2">
                                <span className="text-sm font-semibold">
                                  ${((Number(part.list_price) || 0) * quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  {/* Cart Summary */}
                  <div className="border-t p-4 space-y-4">
                    {/* Clear Cart Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCart}
                      className="w-full text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Cart
                    </Button>

                    <Separator />

                    {/* Price Breakdown */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal ({getTotalItems()} items)</span>
                        <span>${getTotalValue().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>${(getTotalValue() * 0.08).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>{getTotalValue() > 100 ? 'Free' : '$15.00'}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>${(getTotalValue() + (getTotalValue() * 0.08) + (getTotalValue() > 100 ? 0 : 15)).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Checkout Button */}
                    <Button
                      onClick={() => {
                        console.log('🛒 Proceeding to checkout with cart:', cart);
                        setCartMessage('🛒 Proceeding to checkout...');
                        setTimeout(() => setCartMessage(''), 3000);
                      }}
                      className="w-full"
                      size="lg"
                    >
                      Proceed to Checkout
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>

                    {/* Continue Shopping */}
                    <Button
                      variant="outline"
                      onClick={() => setShowCartDrawer(false)}
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
                  onClick={(e) => {
                    console.log('🔥 DIALOG BUTTON CLICKED!');
                    debugButtonClick(selectedPart, e);
                  }}
                  disabled={selectedPart.stockStatus === 'Out of Stock'}
                  className="flex-1 bg-[#6B7FE8] hover:bg-[#5A6FD7] text-white"
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


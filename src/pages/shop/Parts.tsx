import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, Grid, List, Plus, Eye, X, ChevronDown, ShoppingCart, Minus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration - using YOUR environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;

console.log('🔧 Supabase Config:', {
  url: supabaseUrl,
  keyLength: supabaseKey?.length || 0,
  keyPreview: supabaseKey?.substring(0, 20) + '...',
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey
});

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Expected: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_TOKEN');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Enhanced categorization logic with word boundary matching
const MAKE_KEYWORDS = [
  "ford", "chevy", "gmc", "jeep", "ram", "toyota", "dodge", 
  "nissan", "honda", "hyundai", "kia", "subaru", "mazda"
];

const CATEGORY_KEYWORDS = {
  "Bumper": ["bumper", "bull bar", "brush guard"],
  "Grille": ["grille", "grill"],
  "Lift Kit": ["lift kit", "suspension lift"],
  "Leveling Kit": ["leveling kit"],
  "Fender": ["fender", "flare"],
  "Bed Cover": ["bed cover", "tonneau"],
  "Running Board": ["running board", "nerf bar", "step bar"],
  "Lighting": ["light bar", "headlight", "tail light", "fog light", "led light"],
  "Exhaust": ["exhaust", "muffler", "cat-back"],
  "Intake": ["intake", "cold air intake"],
  "Winch": ["winch"],
  "Tow Equipment": ["tow hook", "tow strap", "recovery hook"],
  "Mud Flap": ["mud flap", "splash guard"],
  "Roof Rack": ["roof rack", "cargo rack"],
  "Interior": ["floor mat", "seat cover", "console", "dash mat"],
  "Exterior Trim": ["mirror", "spoiler", "hood", "diffuser"]
};

// Enhanced interfaces
interface InventoryPart {
  id: string;
  name: string;
  sku: string;
  description?: string;
  long_description?: string;
  keystone_vcpn?: string;
  manufacturer_part_no?: string;
  compatibility?: string;
  brand?: string;
  category?: string;
  location?: string;
  in_stock: boolean;
  quantity_on_hand: number;
  cost: number;
  list_price: number;
  stockStatus: 'In Stock' | 'Out of Stock';
  vehicleMake: string;
  partCategory: string;
  pricingSource?: string;
}

interface CategorySummary {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
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

// Text normalization function
const normalizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Keep punctuation that separates words, but normalize it
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Enhanced word boundary matching for vehicle makes
const categorizeVehicleMake = (part: any): string => {
  // Field priority: name, description, long_description, category
  const searchFields = [
    part.name || '',
    part.description || '',
    part.long_description || '',
    part.category || ''
  ];

  // Search each field in priority order
  for (const field of searchFields) {
    if (!field) continue;
    
    const normalizedField = normalizeText(field);
    
    // Check each make keyword with word boundary matching
    for (const make of MAKE_KEYWORDS) {
      // Create regex with word boundaries: \bmake\b
      const regex = new RegExp(`\\b${make}\\b`, 'i');
      
      if (regex.test(normalizedField)) {
        console.log(`🎯 Found make "${make}" in field: "${field.substring(0, 50)}..."`);
        return make;
      }
    }
  }
  
  return 'unknown';
};

// Enhanced word boundary matching for part categories
const categorizePartCategory = (part: any): string => {
  // Field priority: name, description, long_description, category
  const searchFields = [
    part.name || '',
    part.description || '',
    part.long_description || '',
    part.category || ''
  ];

  // Search each field in priority order
  for (const field of searchFields) {
    if (!field) continue;
    
    const normalizedField = normalizeText(field);
    
    // Check each category and its keywords
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        // Handle multi-word keywords
        if (keyword.includes(' ')) {
          // For multi-word keywords, check if the phrase exists
          if (normalizedField.includes(keyword.toLowerCase())) {
            console.log(`🎯 Found category "${category}" with keyword "${keyword}" in field: "${field.substring(0, 50)}..."`);
            return category;
          }
        } else {
          // For single words, use word boundary matching
          const regex = new RegExp(`\\b${keyword}\\b`, 'i');
          if (regex.test(normalizedField)) {
            console.log(`🎯 Found category "${category}" with keyword "${keyword}" in field: "${field.substring(0, 50)}..."`);
            return category;
          }
        }
      }
    }
  }
  
  return 'uncategorized';
};

// Vehicle make categories with updated fallback
const VEHICLE_MAKES = [
  {
    id: 'ford',
    name: 'Ford',
    description: 'Ford truck parts and accessories',
    icon: '🚛',
    color: 'bg-blue-500',
    count: 0
  },
  {
    id: 'chevy',
    name: 'Chevrolet',
    description: 'Chevrolet truck parts and accessories',
    icon: '🚚',
    color: 'bg-yellow-500',
    count: 0
  },
  {
    id: 'gmc',
    name: 'GMC',
    description: 'GMC truck parts and accessories',
    icon: '🚐',
    color: 'bg-red-500',
    count: 0
  },
  {
    id: 'ram',
    name: 'RAM',
    description: 'RAM truck parts and accessories',
    icon: '🛻',
    color: 'bg-gray-600',
    count: 0
  },
  {
    id: 'jeep',
    name: 'Jeep',
    description: 'Jeep parts and accessories',
    icon: '🚙',
    color: 'bg-green-600',
    count: 0
  },
  {
    id: 'toyota',
    name: 'Toyota',
    description: 'Toyota truck parts and accessories',
    icon: '🚗',
    color: 'bg-red-600',
    count: 0
  },
  {
    id: 'dodge',
    name: 'Dodge',
    description: 'Dodge truck parts and accessories',
    icon: '🚐',
    color: 'bg-orange-500',
    count: 0
  },
  {
    id: 'unknown',
    name: 'Unknown/Universal',
    description: 'Parts that don\'t match specific vehicle makes',
    icon: '🔧',
    color: 'bg-purple-500',
    count: 0
  }
];

// Simple cart hook
const useSimpleCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('simple-cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('simple-cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }, [cart]);

  const addToCart = useCallback(async (part: InventoryPart) => {
    setIsLoading(true);
    
    try {
      const cartItem: CartItem = {
        id: part.keystone_vcpn || part.sku || part.id,
        name: part.name,
        price: part.list_price || 0,
        quantity: 1,
        sku: part.sku,
        category: part.partCategory,
        inStock: part.in_stock,
        maxQuantity: part.quantity_on_hand || 999
      };

      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.id === cartItem.id);
        
        if (existingItem) {
          return prevCart.map(item =>
            item.id === cartItem.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          return [...prevCart, cartItem];
        }
      });

      // Show success toast
      showToast(`Added ${part.name} to cart`, 'success');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Failed to add item to cart', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
    showToast('Item removed from cart', 'success');
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    showToast('Cart cleared', 'success');
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    cart,
    totalItems,
    totalPrice,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };
};

// Toast notification system
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white font-medium ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Remove after 3 seconds
  setTimeout(() => {
    document.body.removeChild(toast);
  }, 3000);
};

// Safe string conversion for search
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

// Enhanced fuzzy search with safe string handling
const fuzzySearch = (searchTerm: string, parts: InventoryPart[]): InventoryPart[] => {
  if (!searchTerm || !searchTerm.trim()) {
    return parts;
  }

  const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.length > 0);
  
  if (searchWords.length === 0) {
    return parts;
  }

  const scoredParts = parts.map(part => {
    const fields = {
      name: { value: safeString(part.name).toLowerCase(), weight: 30 },
      sku: { value: safeString(part.sku).toLowerCase(), weight: 20 },
      description: { value: safeString(part.description).toLowerCase(), weight: 20 },
      long_description: { value: safeString(part.long_description).toLowerCase(), weight: 25 },
      manufacturer_part_no: { value: safeString(part.manufacturer_part_no).toLowerCase(), weight: 15 },
      compatibility: { value: safeString(part.compatibility).toLowerCase(), weight: 10 },
      brand: { value: safeString(part.brand).toLowerCase(), weight: 5 },
      vehicleMake: { value: safeString(part.vehicleMake).toLowerCase(), weight: 15 },
      partCategory: { value: safeString(part.partCategory).toLowerCase(), weight: 10 },
      keystone_vcpn: { value: safeString(part.keystone_vcpn).toLowerCase(), weight: 20 },
      category: { value: safeString(part.category).toLowerCase(), weight: 8 },
      location: { value: safeString(part.location).toLowerCase(), weight: 5 }
    };

    let totalScore = 0;

    for (const searchWord of searchWords) {
      for (const [fieldName, fieldData] of Object.entries(fields)) {
        if (fieldData.value.includes(searchWord)) {
          totalScore += fieldData.weight;
        }
      }
    }

    return { part, score: totalScore };
  });

  return scoredParts
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.part);
};

// Main Parts component
const Parts: React.FC = () => {
  // State management
  const [currentView, setCurrentView] = useState<'categories' | 'parts'>('categories');
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [filteredParts, setFilteredParts] = useState<InventoryPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<InventoryPart[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [vehicleMakes, setVehicleMakes] = useState<CategorySummary[]>(VEHICLE_MAKES);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 50,
    totalItems: 0,
    totalPages: 0
  });

  // Filter states
  const [filters, setFilters] = useState({
    partCategory: '',
    brand: '',
    stockStatus: '',
    priceRange: [0, 1000] as [number, number]
  });

  // Cart functionality
  const { cart, totalItems, totalPrice, isLoading: cartLoading, addToCart, removeFromCart, updateQuantity, clearCart } = useSimpleCart();

  // Error logging function
  const logError = (context: string, error: any) => {
    console.error(`❌ ${context}:`);
    console.error('Error message:', error?.message || 'No message');
    console.error('Error details:', error?.details || 'No details');
    console.error('Error hint:', error?.hint || 'No hint');
    console.error('Error code:', error?.code || 'No code');
    console.error('Full error object:', error);
    
    try {
      console.error('Error JSON:', JSON.stringify(error, null, 2));
    } catch (e) {
      console.error('Could not stringify error:', e);
    }
  };

  // Load category statistics with enhanced word boundary matching
  const loadCategoryStatistics = useCallback(async () => {
    console.log('📊 Loading category statistics with enhanced matching...');
    
    try {
      // Test database connection first
      console.log('🔍 Testing database connection...');
      const { data: testData, error: testError } = await supabase
        .from('inventory')
        .select('id')
        .limit(1);

      if (testError) {
        logError('Database connection test failed', testError);
        return;
      }

      console.log('✅ Database connection successful');

      // Get total count
      const { count: totalCount, error: totalError } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        logError('Error getting total count', totalError);
        return;
      }

      console.log(`📊 Total inventory count: ${totalCount}`);

      // Get counts for each vehicle make using enhanced word boundary matching
      const updatedMakes = await Promise.all(
        VEHICLE_MAKES.map(async (make) => {
          try {
            if (make.id === 'unknown') {
              // For unknown, we'll estimate based on sample data
              const { data: sampleData, error: sampleError } = await supabase
                .from('inventory')
                .select('name, description, long_description, category')
                .limit(1000);
              
              if (!sampleError && sampleData) {
                let unknownCount = 0;
                sampleData.forEach(item => {
                  const vehicleMake = categorizeVehicleMake(item);
                  if (vehicleMake === 'unknown') {
                    unknownCount++;
                  }
                });
                
                // Estimate total unknown parts based on sample
                const estimatedUnknown = Math.floor((unknownCount / 1000) * (totalCount || 0));
                console.log(`📊 ${make.name}: ${estimatedUnknown} parts (estimated)`);
                return { ...make, count: estimatedUnknown };
              }
              
              return { ...make, count: 0 };
            } else {
              // For specific makes, use word boundary SQL matching
              const { count, error } = await supabase
                .from('inventory')
                .select('*', { count: 'exact', head: true })
                .or(`name.ilike.%${make.id}%,description.ilike.%${make.id}%,long_description.ilike.%${make.id}%,category.ilike.%${make.id}%`);
              
              if (error) {
                console.warn(`Warning: Could not get count for ${make.name}:`, error.message);
                return { ...make, count: 0 };
              }
              
              console.log(`📊 ${make.name}: ${count} parts`);
              return { ...make, count: count || 0 };
            }
          } catch (error) {
            console.warn(`Warning: Error counting ${make.name} parts:`, error);
            return { ...make, count: 0 };
          }
        })
      );

      setVehicleMakes(updatedMakes);
      console.log('✅ Category statistics loaded successfully with enhanced matching');

    } catch (error) {
      logError('Error loading category statistics', error);
      // Use default categories with zero counts
      setVehicleMakes(VEHICLE_MAKES);
    }
  }, []);

  // Load parts for selected make with enhanced categorization
  const loadPartsForMake = useCallback(async (makeId: string, page: number = 1) => {
    console.log(`🔄 Loading parts for make: ${makeId}, page: ${page}`);
    setLoading(true);
    setError('');

    try {
      const startIndex = (page - 1) * pagination.itemsPerPage;
      const endIndex = startIndex + pagination.itemsPerPage - 1;

      console.log(`📄 Applying pagination: ${startIndex} to ${endIndex}`);

      let query = supabase
        .from('inventory')
        .select('*', { count: 'exact' });

      // Apply make filter using enhanced word boundary logic
      if (makeId && makeId !== 'all') {
        if (makeId === 'unknown') {
          // For unknown, we'll filter client-side after loading
          console.log(`🔍 Loading all parts for unknown filtering`);
        } else {
          // For specific makes, search across multiple fields
          console.log(`🔍 Filtering by make keyword: ${makeId}`);
          query = query.or(`name.ilike.%${makeId}%,description.ilike.%${makeId}%,long_description.ilike.%${makeId}%,category.ilike.%${makeId}%`);
        }
      }

      // Apply pagination
      query = query.range(startIndex, endIndex);

      const { data, count, error } = await query;

      if (error) {
        logError('Error loading parts', error);
        setError('Failed to load parts. Please try again.');
        return;
      }

      console.log(`✅ Loaded ${data?.length || 0} parts for page ${page}`);
      console.log(`📊 Total count: ${count}`);

      // Process parts with enhanced categorization logic
      const processedParts: InventoryPart[] = (data || []).map(item => {
        // Apply enhanced categorization logic with word boundaries
        const vehicleMake = categorizeVehicleMake(item);
        const partCategory = categorizePartCategory(item);
        
        return {
          id: item.id,
          name: item.name || 'Unknown Part',
          sku: item.sku || '',
          description: item.description || '',
          long_description: item.long_description || '',
          keystone_vcpn: item.keystone_vcpn || '',
          manufacturer_part_no: item.manufacturer_part_no || '',
          compatibility: item.compatibility || '',
          brand: item.brand || '',
          category: item.category || '',
          location: item.location || '',
          in_stock: item.quantity_on_hand > 0,
          quantity_on_hand: item.quantity_on_hand || 0,
          cost: Number(item.cost) || 0,
          list_price: Number(item.list_price) || 0,
          stockStatus: item.quantity_on_hand > 0 ? 'In Stock' : 'Out of Stock',
          vehicleMake: vehicleMake,
          partCategory: partCategory,
          pricingSource: 'inventory_table'
        };
      });

      // Filter for specific make if needed (client-side filtering for unknown)
      let finalParts = processedParts;
      if (makeId === 'unknown') {
        finalParts = processedParts.filter(part => part.vehicleMake === 'unknown');
        console.log(`🔍 Filtered to ${finalParts.length} unknown parts`);
      } else if (makeId !== 'all') {
        // Additional client-side filtering for precise word boundary matching
        finalParts = processedParts.filter(part => part.vehicleMake === makeId);
        console.log(`🔍 Filtered to ${finalParts.length} ${makeId} parts with word boundary matching`);
      }

      setParts(finalParts);
      setFilteredParts(finalParts);
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalItems: finalParts.length,
        totalPages: Math.ceil(finalParts.length / prev.itemsPerPage)
      }));

    } catch (error) {
      logError('Error loading parts', error);
      setError('Database connection failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [pagination.itemsPerPage]);

  // Global search functionality with enhanced matching
  const handleGlobalSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setGlobalSearchResults([]);
      return;
    }

    console.log(`🔍 Global search for: "${searchTerm}"`);
    setLoading(true);

    try {
      // Search across multiple fields
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,long_description.ilike.%${searchTerm}%,keystone_vcpn.ilike.%${searchTerm}%`)
        .limit(100);

      if (error) {
        logError('Error in global search', error);
        return;
      }

      // Process search results with enhanced categorization
      const processedResults: InventoryPart[] = (data || []).map(item => {
        const vehicleMake = categorizeVehicleMake(item);
        const partCategory = categorizePartCategory(item);
        
        return {
          id: item.id,
          name: item.name || 'Unknown Part',
          sku: item.sku || '',
          description: item.description || '',
          long_description: item.long_description || '',
          keystone_vcpn: item.keystone_vcpn || '',
          manufacturer_part_no: item.manufacturer_part_no || '',
          compatibility: item.compatibility || '',
          brand: item.brand || '',
          category: item.category || '',
          location: item.location || '',
          in_stock: item.quantity_on_hand > 0,
          quantity_on_hand: item.quantity_on_hand || 0,
          cost: Number(item.cost) || 0,
          list_price: Number(item.list_price) || 0,
          stockStatus: item.quantity_on_hand > 0 ? 'In Stock' : 'Out of Stock',
          vehicleMake: vehicleMake,
          partCategory: partCategory,
          pricingSource: 'inventory_table'
        };
      });

      setGlobalSearchResults(processedResults);
      console.log(`✅ Global search found ${processedResults.length} results`);

    } catch (error) {
      logError('Error in global search', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Navigate to parts view for selected make
  const handleMakeSelect = useCallback((makeId: string) => {
    console.log(`🎯 Selected make: ${makeId}`);
    setSelectedMake(makeId);
    setCurrentView('parts');
    setSearchTerm('');
    setGlobalSearchTerm('');
    setGlobalSearchResults([]);
    
    // Reset filters
    setFilters({
      partCategory: '',
      brand: '',
      stockStatus: '',
      priceRange: [0, 1000]
    });
    
    // Reset pagination
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
    
    // Load parts for selected make
    loadPartsForMake(makeId, 1);
  }, [loadPartsForMake]);

  // Navigate back to categories
  const handleBackToCategories = useCallback(() => {
    setCurrentView('categories');
    setSelectedMake('');
    setParts([]);
    setFilteredParts([]);
    setSearchTerm('');
    setGlobalSearchTerm('');
    setGlobalSearchResults([]);
    
    // Reset filters
    setFilters({
      partCategory: '',
      brand: '',
      stockStatus: '',
      priceRange: [0, 1000]
    });
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadPartsForMake(selectedMake, page);
    }
  }, [selectedMake, pagination.totalPages, loadPartsForMake]);

  // Apply filters and search
  useEffect(() => {
    if (parts.length === 0) return;

    let filtered = [...parts];

    // Apply search
    if (searchTerm.trim()) {
      filtered = fuzzySearch(searchTerm, filtered);
    }

    // Apply filters
    if (filters.partCategory) {
      filtered = filtered.filter(part => part.partCategory === filters.partCategory);
    }

    if (filters.brand) {
      filtered = filtered.filter(part => 
        safeString(part.brand).toLowerCase().includes(filters.brand.toLowerCase())
      );
    }

    if (filters.stockStatus) {
      filtered = filtered.filter(part => part.stockStatus === filters.stockStatus);
    }

    // Apply price range filter
    filtered = filtered.filter(part => 
      part.list_price >= filters.priceRange[0] && part.list_price <= filters.priceRange[1]
    );

    setFilteredParts(filtered);
  }, [parts, searchTerm, filters]);

  // Global search effect
  useEffect(() => {
    if (globalSearchTerm.trim()) {
      const timeoutId = setTimeout(() => {
        handleGlobalSearch(globalSearchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setGlobalSearchResults([]);
    }
  }, [globalSearchTerm, handleGlobalSearch]);

  // Load category statistics on mount
  useEffect(() => {
    loadCategoryStatistics();
  }, [loadCategoryStatistics]);

  // Get unique values for filters
  const uniquePartCategories = useMemo(() => {
    const categories = new Set(parts.map(part => part.partCategory).filter(Boolean));
    return Array.from(categories).sort();
  }, [parts]);

  const uniqueBrands = useMemo(() => {
    const brands = new Set(parts.map(part => part.brand).filter(Boolean));
    return Array.from(brands).sort();
  }, [parts]);

  // Handle global search from category view
  const handleGlobalSearchSubmit = useCallback(() => {
    if (globalSearchTerm.trim()) {
      setCurrentView('parts');
      setSelectedMake('all');
      setSearchTerm(globalSearchTerm);
      
      // Use global search results as parts
      setParts(globalSearchResults);
      setFilteredParts(globalSearchResults);
      
      // Reset pagination for search results
      setPagination(prev => ({
        ...prev,
        currentPage: 1,
        totalItems: globalSearchResults.length,
        totalPages: Math.ceil(globalSearchResults.length / prev.itemsPerPage)
      }));
    }
  }, [globalSearchTerm, globalSearchResults]);

  // Render category overview
  const renderCategoryOverview = () => (
    <div className="space-y-6">
      {/* Global Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Search All Parts</h2>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by part name, SKU, description, or VCPN..."
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGlobalSearchSubmit()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleGlobalSearchSubmit}
            disabled={!globalSearchTerm.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Search
          </button>
        </div>
        
        {/* Search Preview */}
        {globalSearchTerm && globalSearchResults.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Search Results ({globalSearchResults.length.toLocaleString()} found)</h3>
              <button
                onClick={handleGlobalSearchSubmit}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Results →
              </button>
            </div>
            <div className="space-y-2">
              {globalSearchResults.slice(0, 5).map((part) => (
                <div key={part.id} className="flex justify-between items-center py-1">
                  <div>
                    <span className="font-medium">{part.name}</span>
                    <span className="text-gray-500 ml-2">({part.sku})</span>
                    <span className="text-blue-600 ml-2 text-xs">{part.vehicleMake}</span>
                    <span className="text-purple-600 ml-2 text-xs">{part.partCategory}</span>
                  </div>
                  <span className="text-green-600 font-medium">${part.list_price.toFixed(2)}</span>
                </div>
              ))}
              {globalSearchResults.length > 5 && (
                <div className="text-center pt-2">
                  <button
                    onClick={handleGlobalSearchSubmit}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View {(globalSearchResults.length - 5).toLocaleString()} more results
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Vehicle Make Categories */}
      <div>
        <h1 className="text-2xl font-bold mb-6">Vehicle Parts by Make</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicleMakes.map((make) => (
            <div
              key={make.id}
              onClick={() => handleMakeSelect(make.id)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${make.color} rounded-lg flex items-center justify-center text-white text-2xl`}>
                  {make.icon}
                </div>
                <span className="text-2xl font-bold text-gray-600">
                  {make.count.toLocaleString()}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{make.name}</h3>
              <p className="text-gray-600 text-sm">{make.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render parts view
  const renderPartsView = () => {
    const selectedMakeInfo = vehicleMakes.find(make => make.id === selectedMake);
    const displayParts = filteredParts.slice(
      (pagination.currentPage - 1) * pagination.itemsPerPage,
      pagination.currentPage * pagination.itemsPerPage
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToCategories}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Vehicle Categories
            </button>
            <div>
              <h1 className="text-2xl font-bold">
                {selectedMakeInfo ? selectedMakeInfo.name : 'All'} Parts
              </h1>
              <p className="text-gray-600">
                {filteredParts.length.toLocaleString()} parts found
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Part Category</label>
                <select
                  value={filters.partCategory}
                  onChange={(e) => setFilters(prev => ({ ...prev, partCategory: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {uniquePartCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select
                  value={filters.brand}
                  onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Brands</option>
                  {uniqueBrands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                <select
                  value={filters.stockStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, stockStatus: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Stock</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={filters.priceRange[1]}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    priceRange: [prev.priceRange[0], parseInt(e.target.value)] 
                  }))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading parts...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => loadPartsForMake(selectedMake, pagination.currentPage)}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Parts Grid/List */}
        {!loading && !error && (
          <>
            {displayParts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No parts found matching your criteria.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
              }>
                {displayParts.map((part) => (
                  <div
                    key={part.id}
                    className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow ${
                      viewMode === 'list' ? 'p-4' : 'p-6'
                    }`}
                  >
                    {viewMode === 'grid' ? (
                      // Grid View
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{part.name}</h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><span className="font-medium">SKU:</span> {part.sku}</p>
                            {part.keystone_vcpn && (
                              <p><span className="font-medium">VCPN:</span> {part.keystone_vcpn}</p>
                            )}
                            <p><span className="font-medium">Brand:</span> {part.brand || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            part.stockStatus === 'In Stock' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {part.stockStatus}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {part.vehicleMake}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            {part.partCategory}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-lg font-bold text-green-600">${part.list_price.toFixed(2)}</p>
                            {part.cost > 0 && (
                              <p className="text-sm text-gray-500">Cost: ${part.cost.toFixed(2)}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedPart(part)}
                              className="p-2 text-gray-600 hover:text-blue-600 border border-gray-300 rounded-md hover:border-blue-300"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => addToCart(part)}
                              disabled={cartLoading}
                              className="px-3 py-2 bg-[#6B7FE8] hover:bg-[#5A6FD7] text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {cartLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // List View
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{part.name}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span><span className="font-medium">SKU:</span> {part.sku}</span>
                            {part.keystone_vcpn && (
                              <span><span className="font-medium">VCPN:</span> {part.keystone_vcpn}</span>
                            )}
                            <span><span className="font-medium">Brand:</span> {part.brand || 'N/A'}</span>
                            <span><span className="font-medium">Stock:</span> {part.quantity_on_hand}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              part.stockStatus === 'In Stock' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {part.stockStatus}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {part.vehicleMake}
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              {part.partCategory}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">${part.list_price.toFixed(2)}</p>
                            {part.cost > 0 && (
                              <p className="text-sm text-gray-500">Cost: ${part.cost.toFixed(2)}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedPart(part)}
                              className="p-2 text-gray-600 hover:text-blue-600 border border-gray-300 rounded-md hover:border-blue-300"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => addToCart(part)}
                              disabled={cartLoading}
                              className="px-3 py-2 bg-[#6B7FE8] hover:bg-[#5A6FD7] text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {cartLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-4">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredParts.length)} of{' '}
                  {filteredParts.length.toLocaleString()} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                    if (pageNum > pagination.totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 border rounded-md ${
                          pageNum === pagination.currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Render part detail dialog
  const renderPartDetailDialog = () => {
    if (!selectedPart) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{selectedPart.name}</h2>
              <button
                onClick={() => setSelectedPart(null)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Part Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">SKU:</span> {selectedPart.sku}</p>
                    {selectedPart.keystone_vcpn && (
                      <p><span className="font-medium">VCPN:</span> {selectedPart.keystone_vcpn}</p>
                    )}
                    {selectedPart.manufacturer_part_no && (
                      <p><span className="font-medium">Manufacturer Part #:</span> {selectedPart.manufacturer_part_no}</p>
                    )}
                    <p><span className="font-medium">Brand:</span> {selectedPart.brand || 'N/A'}</p>
                    <p><span className="font-medium">Category:</span> {selectedPart.category || 'N/A'}</p>
                    <p><span className="font-medium">Location:</span> {selectedPart.location || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Enhanced Categorization</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Make: {selectedPart.vehicleMake}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      Category: {selectedPart.partCategory}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Pricing & Stock</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">List Price:</span> <span className="text-green-600 font-bold">${selectedPart.list_price.toFixed(2)}</span></p>
                    {selectedPart.cost > 0 && (
                      <p><span className="font-medium">Cost:</span> ${selectedPart.cost.toFixed(2)}</p>
                    )}
                    <p><span className="font-medium">Stock Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        selectedPart.stockStatus === 'In Stock' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedPart.stockStatus}
                      </span>
                    </p>
                    <p><span className="font-medium">Quantity on Hand:</span> {selectedPart.quantity_on_hand}</p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      addToCart(selectedPart);
                      setSelectedPart(null);
                    }}
                    disabled={cartLoading}
                    className="w-full px-4 py-2 bg-[#6B7FE8] hover:bg-[#5A6FD7] text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {cartLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>

            {selectedPart.description && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-gray-600">{selectedPart.description}</p>
              </div>
            )}

            {selectedPart.long_description && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Detailed Description</h3>
                <p className="text-sm text-gray-600">{selectedPart.long_description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render cart drawer
  const renderCartDrawer = () => {
    if (!showCartDrawer) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
        <div className="bg-white h-full w-full max-w-md overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Shopping Cart</h2>
              <button
                onClick={() => setShowCartDrawer(false)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-md">
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                        <p className="text-sm font-medium text-green-600">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 hover:bg-gray-100 rounded text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Checkout
                    </button>
                    <button
                      onClick={clearCart}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Parts Catalog</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCartDrawer(true)}
                className="relative p-2 text-gray-600 hover:text-blue-600"
              >
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'categories' ? renderCategoryOverview() : renderPartsView()}
      </main>

      {/* Dialogs */}
      {renderPartDetailDialog()}
      {renderCartDrawer()}
    </div>
  );
};

export default Parts;


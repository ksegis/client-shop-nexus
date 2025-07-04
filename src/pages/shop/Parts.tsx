import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Package, ShoppingCart, Search, Plus, Grid, List, Heart, Eye, RefreshCw, X, Minus, Trash2, ArrowRight, DollarSign, TrendingUp, TrendingDown, MapPin, Clock, Shield, Edit, CheckCircle, Timer, User, CreditCard, FileText, Star, Zap, UserSearch, UserPlus, Box } from "lucide-react";
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

// ✅ FIXED: Import Supabase for real data connection
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

// ✅ FIXED: Define the InventoryPart interface to match real database structure
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
  manufacturer_part_no?: string;
  compatibility?: string;
  category?: string;
  brand?: string;
  weight?: number;
  dimensions?: string;
  notes?: string;
  image_url?: string;
  regional_availability?: string[];
  dropship_available?: boolean;
  keystone_part_number?: string;
  core_charge?: number;
  hazmat?: boolean;
  freight_required?: boolean;
  special_order?: boolean;
  discontinued?: boolean;
  superseded_by?: string | null;
  supersedes?: string | null;
  created_at?: string;
  updated_at?: string;
  // Computed fields for compatibility
  price: number;
  quantity: number;
  margin: number;
}

// Cart item interface
interface CartItem extends InventoryPart {
  cartQuantity: number;
}

// Shipping quote interface
interface ShippingQuote {
  carrier: string;
  service: string;
  cost: number;
  transit_days: number;
  delivery_date: string;
}

// Special order interface
interface SpecialOrder {
  id: string;
  customer_id: string;
  part_description: string;
  manufacturer: string;
  part_number: string;
  quantity: number;
  estimated_cost: number;
  notes: string;
  status: 'pending' | 'quoted' | 'ordered' | 'received' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// ✅ FIXED: Custom hook to fetch real inventory data from Supabase
const useInventoryData = () => {
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventoryData = async () => {
      console.log('🔍 Fetching inventory data from Supabase...');
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabaseClient();
        const { data, error: fetchError } = await supabase
          .from('inventory')
          .select('*')
          .order('name');

        if (fetchError) {
          console.error('❌ Error fetching inventory:', fetchError);
          setError(fetchError.message);
          return;
        }

        console.log('✅ Inventory data fetched:', data?.length || 0, 'items');

        // ✅ FIXED: Map database fields to expected interface
        const mappedParts: InventoryPart[] = (data || []).map(item => ({
          id: item.id,
          name: item.name || 'Unknown Part',
          sku: item.sku || '',
          keystone_vcpn: item.keystone_vcpn || '',
          cost: Number(item.cost) || 0,
          list_price: Number(item.list_price) || 0,
          quantity_on_hand: Number(item.quantity_on_hand) || 0,
          location: item.location || '',
          description: item.description || '',
          manufacturer_part_no: item.manufacturer_part_no || '',
          compatibility: item.compatibility || '',
          category: item.category || 'Uncategorized',
          brand: item.brand || 'Unknown',
          weight: Number(item.weight) || 0,
          dimensions: item.dimensions || '',
          notes: item.notes || '',
          image_url: item.image_url || '/api/placeholder/300/200',
          regional_availability: item.regional_availability || ['East', 'Midwest', 'West'],
          dropship_available: Boolean(item.dropship_available),
          keystone_part_number: item.keystone_part_number || '',
          core_charge: Number(item.core_charge) || 0,
          hazmat: Boolean(item.hazmat),
          freight_required: Boolean(item.freight_required),
          special_order: Boolean(item.special_order),
          discontinued: Boolean(item.discontinued),
          superseded_by: item.superseded_by,
          supersedes: item.supersedes,
          created_at: item.created_at,
          updated_at: item.updated_at,
          // Computed fields for compatibility
          price: Number(item.list_price) || 0,
          quantity: Number(item.quantity_on_hand) || 0,
          margin: item.cost && item.list_price ? 
            ((Number(item.list_price) - Number(item.cost)) / Number(item.list_price)) * 100 : 0
        }));

        setParts(mappedParts);
      } catch (err) {
        console.error('❌ Error in fetchInventoryData:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, []);

  return { parts, loading, error, refetch: () => window.location.reload() };
};

export default function Parts() {
  const { toast } = useToast();
  
  // ✅ FIXED: Use real inventory data instead of mock data
  const { parts, loading: partsLoading, error: partsError } = useInventoryData();
  
  // State management
  const [filteredParts, setFilteredParts] = useState<InventoryPart[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 3000]);
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  // Customer search state
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  
  // Special order state
  const [showSpecialOrderDialog, setShowSpecialOrderDialog] = useState(false);
  const [specialOrderForm, setSpecialOrderForm] = useState({
    part_description: "",
    manufacturer: "",
    part_number: "",
    quantity: 1,
    notes: ""
  });
  
  // Shipping state
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [selectedShippingAddress, setSelectedShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "US"
  });
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  
  // Dropship order state
  const [showDropshipDialog, setShowDropshipDialog] = useState(false);
  const [selectedDropshipPart, setSelectedDropshipPart] = useState<InventoryPart | null>(null);
  const [dropshipQuantity, setDropshipQuantity] = useState(1);
  const [isProcessingDropship, setIsProcessingDropship] = useState(false);

  // Product price check state
  const [showPriceCheckDialog, setShowPriceCheckDialog] = useState(false);
  const [selectedPriceCheckPart, setSelectedPriceCheckPart] = useState<InventoryPart | null>(null);

  // ✅ ULTRA-SIMPLE: State for dialogs
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(parts.map(part => part.category || 'Uncategorized'))];
    return uniqueCategories.sort();
  }, [parts]);

  // Filter and sort parts
  useEffect(() => {
    let filtered = parts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(part =>
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (part.sku && part.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (part.description && part.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (part.manufacturer_part_no && part.manufacturer_part_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (part.compatibility && part.compatibility.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(part => part.category === selectedCategory);
    }

    // Price range filter
    filtered = filtered.filter(part => 
      part.price >= priceRange[0] && part.price <= priceRange[1]
    );

    // Favorites filter
    if (showFavorites) {
      filtered = filtered.filter(part => favorites.includes(part.id));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "quantity":
          return b.quantity - a.quantity;
        case "margin":
          return b.margin - a.margin;
        default:
          return 0;
      }
    });

    setFilteredParts(filtered);
    setCurrentPage(1);
  }, [parts, searchTerm, selectedCategory, priceRange, sortBy, showFavorites, favorites]);

  // Pagination
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParts = filteredParts.slice(startIndex, endIndex);

  // Cart functions
  const addToCart = useCallback((part: InventoryPart, quantity: number = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === part.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === part.id
            ? { ...item, cartQuantity: Math.min(item.cartQuantity + quantity, item.quantity) }
            : item
        );
      } else {
        return [...prev, { ...part, cartQuantity: Math.min(quantity, part.quantity) }];
      }
    });
    
    toast({
      title: "Added to cart",
      description: `${part.name} has been added to your cart.`,
    });
  }, [toast]);

  const removeFromCart = useCallback((partId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== partId));
  }, []);

  const updateCartQuantity = useCallback((partId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(partId);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.id === partId
          ? { ...item, cartQuantity: Math.min(newQuantity, item.quantity) }
          : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.cartQuantity), 0);
  }, [cartItems]);

  const cartItemCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.cartQuantity, 0);
  }, [cartItems]);

  // Favorites functions
  const toggleFavorite = useCallback((partId: string) => {
    setFavorites(prev => 
      prev.includes(partId) 
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    );
  }, []);

  // Customer search functions
  const searchCustomers = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCustomerSearchResults([]);
      return;
    }

    setIsSearchingCustomers(true);
    try {
      const results = await CustomerSearchService.searchCustomers(searchTerm);
      setCustomerSearchResults(results);
    } catch (error) {
      console.error('Error searching customers:', error);
      toast({
        title: "Search Error",
        description: "Failed to search customers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingCustomers(false);
    }
  }, [toast]);

  // Debounced customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCustomers(customerSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearchTerm, searchCustomers]);

  // Special order functions
  const submitSpecialOrder = useCallback(async () => {
    if (!selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for this special order.",
        variant: "destructive",
      });
      return;
    }

    if (!specialOrderForm.part_description.trim()) {
      toast({
        title: "Description Required",
        description: "Please provide a part description.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Here you would typically make an API call to create the special order
      console.log('Creating special order:', {
        customer_id: selectedCustomer.id,
        ...specialOrderForm
      });

      toast({
        title: "Special Order Created",
        description: "Your special order has been submitted successfully.",
      });

      // Reset form
      setSpecialOrderForm({
        part_description: "",
        manufacturer: "",
        part_number: "",
        quantity: 1,
        notes: ""
      });
      setShowSpecialOrderDialog(false);
    } catch (error) {
      console.error('Error creating special order:', error);
      toast({
        title: "Order Error",
        description: "Failed to create special order. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedCustomer, specialOrderForm, toast]);

  // Shipping functions
  const getShippingQuotes = useCallback(async () => {
    if (!selectedShippingAddress.street || !selectedShippingAddress.city || 
        !selectedShippingAddress.state || !selectedShippingAddress.zip) {
      toast({
        title: "Address Required",
        description: "Please provide a complete shipping address.",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Please add items to your cart before getting shipping quotes.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingShipping(true);
    try {
      const quotes = await shippingQuoteService.getQuotes({
        items: cartItems.map(item => ({
          weight: item.weight || 1,
          dimensions: item.dimensions || '12x8x4',
          quantity: item.cartQuantity,
          value: item.price
        })),
        destination: selectedShippingAddress
      });
      
      setShippingQuotes(quotes);
    } catch (error) {
      console.error('Error getting shipping quotes:', error);
      toast({
        title: "Shipping Error",
        description: "Failed to get shipping quotes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingShipping(false);
    }
  }, [selectedShippingAddress, cartItems, toast]);

  // Dropship functions
  const processDropshipOrder = useCallback(async () => {
    if (!selectedDropshipPart || !selectedCustomer) {
      toast({
        title: "Missing Information",
        description: "Please select both a part and customer for dropship order.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingDropship(true);
    try {
      const dropshipService = new DropshipOrderService();
      await dropshipService.createOrder({
        part_id: selectedDropshipPart.id,
        customer_id: selectedCustomer.id,
        quantity: dropshipQuantity,
        shipping_address: selectedShippingAddress
      });

      toast({
        title: "Dropship Order Created",
        description: "Your dropship order has been submitted successfully.",
      });

      setShowDropshipDialog(false);
      setSelectedDropshipPart(null);
      setDropshipQuantity(1);
    } catch (error) {
      console.error('Error creating dropship order:', error);
      toast({
        title: "Dropship Error",
        description: "Failed to create dropship order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingDropship(false);
    }
  }, [selectedDropshipPart, selectedCustomer, dropshipQuantity, selectedShippingAddress, toast]);

  // Stock status helper
  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: "out-of-stock", color: "destructive", label: "Out of Stock" };
    if (quantity <= 5) return { status: "low-stock", color: "warning", label: "Low Stock" };
    return { status: "in-stock", color: "success", label: "In Stock" };
  };

  // Regional availability helper
  const getRegionalBadgeColor = (region: string) => {
    const colors = {
      "East": "bg-blue-500",
      "Midwest": "bg-green-500", 
      "West": "bg-purple-500"
    };
    return colors[region as keyof typeof colors] || "bg-gray-500";
  };

  // ✅ ULTRA-SIMPLE: Cart functions that WILL work
  const handleAddToCart = (part: InventoryPart) => {
    console.log('🛒 Add to cart clicked for:', part.name);
    
    // Simple cart logic
    setCartItems(prev => {
      const existing = prev.find(item => item.id === part.id);
      if (existing) {
        return prev.map(item => 
          item.id === part.id 
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...part, cartQuantity: 1 }];
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

  // ✅ FIXED: Show loading and error states
  if (partsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading inventory data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (partsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Connection Error</AlertTitle>
          <AlertDescription>
            Failed to load inventory data: {partsError}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Parts & Special Orders</h1>
          <p className="text-muted-foreground">Browse parts inventory and place special orders</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Customer Search */}
          <Button
            variant="outline"
            onClick={() => setShowCustomerSearch(true)}
            className="flex items-center gap-2"
          >
            <UserSearch className="h-4 w-4" />
            {selectedCustomer ? selectedCustomer.display_name : "Select Customer"}
          </Button>
          
          {/* Cart */}
          <Button
            variant="outline"
            onClick={() => setShowCart(true)}
            className="flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart ({cartItemCount})
          </Button>
        </div>
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="catalog">Parts Catalog</TabsTrigger>
          <TabsTrigger value="special-orders">Special Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search parts by name, SKU, description, part number, or compatibility..."
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
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="quantity">Stock Level</SelectItem>
                    <SelectItem value="margin">Margin %</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap gap-4 items-center">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="favorites"
                    checked={showFavorites}
                    onCheckedChange={setShowFavorites}
                  />
                  <Label htmlFor="favorites">Favorites only</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={3000}
                  step={50}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredParts.length)} of {filteredParts.length} parts
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Parts Display */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentParts.map((part) => {
                const stockStatus = getStockStatus(part.quantity);
                const isKit = useKitCheck(part.id);
                
                return (
                  <Card key={part.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {part.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            SKU: {part.sku || 'N/A'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(part.id)}
                          className={favorites.includes(part.id) ? "text-red-500" : ""}
                        >
                          <Heart className={`h-4 w-4 ${favorites.includes(part.id) ? "fill-current" : ""}`} />
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="secondary">{part.category}</Badge>
                        <Badge variant={stockStatus.color as any}>{stockStatus.label}</Badge>
                        {isKit && <KitBadge />}
                        {part.regional_availability?.map(region => (
                          <Badge 
                            key={region} 
                            variant="outline" 
                            className={`${getRegionalBadgeColor(region)} text-white border-0`}
                          >
                            {region}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Price Information */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-2xl font-bold text-green-600">
                              ${part.price.toFixed(2)}
                            </span>
                            <div className="text-right text-sm">
                              <div className="text-muted-foreground">Cost: ${part.cost.toFixed(2)}</div>
                              <div className="text-blue-600 font-semibold">{part.margin.toFixed(1)}% margin</div>
                            </div>
                          </div>
                        </div>

                        {/* Part Details */}
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Brand:</span>
                            <span>{part.brand || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Stock:</span>
                            <span className={stockStatus.status === 'out-of-stock' ? 'text-red-600' : ''}>{part.quantity} units</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Location:</span>
                            <span>{part.location || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Kit Components Display */}
                        {isKit && (
                          <div className="mt-2">
                            <CompactKitDisplay partId={part.id} />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            onClick={() => handleAddToCart(part)}
                            disabled={part.quantity === 0}
                            className="flex-1"
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-3"
                            onClick={() => {
                              setSelectedPriceCheckPart(part);
                              setShowPriceCheckDialog(true);
                            }}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          {part.dropship_available && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-3"
                              onClick={() => {
                                setSelectedDropshipPart(part);
                                setShowDropshipDialog(true);
                              }}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* List View */
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentParts.map((part) => {
                    const stockStatus = getStockStatus(part.quantity);
                    const isKit = useKitCheck(part.id);
                    
                    return (
                      <TableRow key={part.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium">{part.name}</div>
                              <div className="text-sm text-muted-foreground">{part.brand || 'Unknown'}</div>
                              {isKit && <KitBadge />}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{part.sku || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{part.category}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ${part.price.toFixed(2)}
                        </TableCell>
                        <TableCell>${part.cost.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-blue-600">
                            {part.margin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={stockStatus.color as any}>{stockStatus.label}</Badge>
                            <span className="text-sm">{part.quantity}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFavorite(part.id)}
                              className={favorites.includes(part.id) ? "text-red-500" : ""}
                            >
                              <Heart className={`h-4 w-4 ${favorites.includes(part.id) ? "fill-current" : ""}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddToCart(part)}
                              disabled={part.quantity === 0}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetail(part)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPriceCheckPart(part);
                                setShowPriceCheckDialog(true);
                              }}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                            {part.dropship_available && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedDropshipPart(part);
                                  setShowDropshipDialog(true);
                                }}
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="special-orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Special Order</CardTitle>
              <CardDescription>
                Request parts that are not currently in our inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowSpecialOrderDialog(true)}
                className="w-full"
                disabled={!selectedCustomer}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Special Order
              </Button>
              {!selectedCustomer && (
                <p className="text-sm text-muted-foreground mt-2">
                  Please select a customer first to create special orders.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Customer Search Dialog */}
      <Dialog open={showCustomerSearch} onOpenChange={setShowCustomerSearch}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
            <DialogDescription>
              Search and select a customer for orders and quotes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {isSearchingCustomers && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            
            <ScrollArea className="max-h-60">
              <div className="space-y-2">
                {customerSearchResults.map(customer => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowCustomerSearch(false);
                      setCustomerSearchTerm("");
                      setCustomerSearchResults([]);
                    }}
                  >
                    <div>
                      <div className="font-medium">{customer.display_name}</div>
                      <div className="text-sm text-muted-foreground">{customer.email}</div>
                      {customer.phone && (
                        <div className="text-sm text-muted-foreground">{customer.phone}</div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {customerSearchTerm && !isSearchingCustomers && customerSearchResults.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No customers found. Try a different search term.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Special Order Dialog */}
      <Dialog open={showSpecialOrderDialog} onOpenChange={setShowSpecialOrderDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Special Order</DialogTitle>
            <DialogDescription>
              Request a part that's not currently in inventory
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedCustomer && (
              <Alert>
                <User className="h-4 w-4" />
                <AlertDescription>
                  Order for: {selectedCustomer.display_name} ({selectedCustomer.email})
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="part_description">Part Description *</Label>
                <Textarea
                  id="part_description"
                  placeholder="Describe the part you need..."
                  value={specialOrderForm.part_description}
                  onChange={(e) => setSpecialOrderForm(prev => ({
                    ...prev,
                    part_description: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  placeholder="e.g., Ford, Chevrolet, etc."
                  value={specialOrderForm.manufacturer}
                  onChange={(e) => setSpecialOrderForm(prev => ({
                    ...prev,
                    manufacturer: e.target.value
                  }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="part_number">Part Number</Label>
                <Input
                  id="part_number"
                  placeholder="Manufacturer part number"
                  value={specialOrderForm.part_number}
                  onChange={(e) => setSpecialOrderForm(prev => ({
                    ...prev,
                    part_number: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={specialOrderForm.quantity}
                  onChange={(e) => setSpecialOrderForm(prev => ({
                    ...prev,
                    quantity: parseInt(e.target.value) || 1
                  }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information or requirements..."
                value={specialOrderForm.notes}
                onChange={(e) => setSpecialOrderForm(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSpecialOrderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={submitSpecialOrder}>
                Submit Special Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shipping Dialog */}
      <Dialog open={showShippingDialog} onOpenChange={setShowShippingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Get Shipping Quotes</DialogTitle>
            <DialogDescription>
              Enter shipping address to get quotes for your cart items
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  placeholder="123 Main St"
                  value={selectedShippingAddress.street}
                  onChange={(e) => setSelectedShippingAddress(prev => ({
                    ...prev,
                    street: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={selectedShippingAddress.city}
                  onChange={(e) => setSelectedShippingAddress(prev => ({
                    ...prev,
                    city: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="State"
                  value={selectedShippingAddress.state}
                  onChange={(e) => setSelectedShippingAddress(prev => ({
                    ...prev,
                    state: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  placeholder="12345"
                  value={selectedShippingAddress.zip}
                  onChange={(e) => setSelectedShippingAddress(prev => ({
                    ...prev,
                    zip: e.target.value
                  }))}
                />
              </div>
            </div>
            
            <Button 
              onClick={getShippingQuotes} 
              disabled={isLoadingShipping}
              className="w-full"
            >
              {isLoadingShipping ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting Quotes...
                </>
              ) : (
                "Get Shipping Quotes"
              )}
            </Button>
            
            {shippingQuotes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Available Shipping Options:</h4>
                {shippingQuotes.map((quote, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{quote.carrier} - {quote.service}</div>
                      <div className="text-sm text-muted-foreground">
                        {quote.transit_days} business days • Delivery by {quote.delivery_date}
                      </div>
                    </div>
                    <div className="text-lg font-semibold">
                      ${quote.cost.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dropship Order Dialog */}
      <Dialog open={showDropshipDialog} onOpenChange={setShowDropshipDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Dropship Order</DialogTitle>
            <DialogDescription>
              Order this part to be shipped directly to the customer
            </DialogDescription>
          </DialogHeader>
          
          {selectedDropshipPart && (
            <div className="space-y-4">
              <Alert>
                <Package className="h-4 w-4" />
                <AlertDescription>
                  {selectedDropshipPart.name} - ${selectedDropshipPart.price.toFixed(2)}
                </AlertDescription>
              </Alert>
              
              {selectedCustomer && (
                <Alert>
                  <User className="h-4 w-4" />
                  <AlertDescription>
                    Customer: {selectedCustomer.display_name} ({selectedCustomer.email})
                  </AlertDescription>
                </Alert>
              )}
              
              <div>
                <Label htmlFor="dropship_quantity">Quantity</Label>
                <Input
                  id="dropship_quantity"
                  type="number"
                  min="1"
                  max={selectedDropshipPart.quantity}
                  value={dropshipQuantity}
                  onChange={(e) => setDropshipQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="dropship_street">Shipping Address</Label>
                  <Input
                    id="dropship_street"
                    placeholder="123 Main St"
                    value={selectedShippingAddress.street}
                    onChange={(e) => setSelectedShippingAddress(prev => ({
                      ...prev,
                      street: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="dropship_city">City</Label>
                  <Input
                    id="dropship_city"
                    placeholder="City"
                    value={selectedShippingAddress.city}
                    onChange={(e) => setSelectedShippingAddress(prev => ({
                      ...prev,
                      city: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="dropship_state">State</Label>
                  <Input
                    id="dropship_state"
                    placeholder="State"
                    value={selectedShippingAddress.state}
                    onChange={(e) => setSelectedShippingAddress(prev => ({
                      ...prev,
                      state: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="dropship_zip">ZIP Code</Label>
                  <Input
                    id="dropship_zip"
                    placeholder="12345"
                    value={selectedShippingAddress.zip}
                    onChange={(e) => setSelectedShippingAddress(prev => ({
                      ...prev,
                      zip: e.target.value
                    }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDropshipDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={processDropshipOrder}
                  disabled={isProcessingDropship || !selectedCustomer}
                >
                  {isProcessingDropship ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Create Dropship Order"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Price Check Dialog */}
      <Dialog open={showPriceCheckDialog} onOpenChange={setShowPriceCheckDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Price Check</DialogTitle>
            <DialogDescription>
              Check pricing and availability from multiple sources
            </DialogDescription>
          </DialogHeader>
          
          {selectedPriceCheckPart && (
            <ProductPriceCheck 
              part={selectedPriceCheckPart}
              onClose={() => setShowPriceCheckDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ ULTRA-SIMPLE: Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shopping Cart ({cartItemCount} items)</DialogTitle>
            <DialogDescription>Review your selected parts</DialogDescription>
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
                            onClick={() => updateCartQuantity(item.id, item.cartQuantity - 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-8 text-center">{item.cartQuantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartQuantity(item.id, item.cartQuantity + 1)}
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

      {/* ✅ ULTRA-SIMPLE: Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPart?.name}</DialogTitle>
            <DialogDescription>Part Details</DialogDescription>
          </DialogHeader>
          
          {selectedPart && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SKU</Label>
                  <p className="font-mono">{selectedPart.sku || 'N/A'}</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <p>{selectedPart.category}</p>
                </div>
                <div>
                  <Label>Price</Label>
                  <p className="text-2xl font-bold text-green-600">${selectedPart.price.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Stock</Label>
                  <p className={selectedPart.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                    {selectedPart.quantity} units
                  </p>
                </div>
              </div>
              
              {selectedPart.description && (
                <div>
                  <Label>Description</Label>
                  <p>{selectedPart.description}</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    handleAddToCart(selectedPart);
                    setShowDetailDialog(false);
                  }}
                  disabled={selectedPart.quantity === 0}
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


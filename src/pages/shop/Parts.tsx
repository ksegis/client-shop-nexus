import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Package, ShoppingCart, Search, Plus, Filter, Grid, List, Star, Heart, Eye, Truck, Wrench, Settings, BarChart3, TrendingUp, Package2, Clock, CheckCircle, XCircle, AlertTriangle, FileText, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePartsCart } from "@/contexts/parts/PartsCartContext";
import { useToast } from "@/hooks/use-toast";

// Enhanced mock data for a comprehensive parts catalog
const mockParts = [
  {
    id: "1",
    sku: "ENG-001",
    name: "Heavy Duty Engine Oil Filter",
    description: "Premium high-performance oil filter designed for diesel engines. Features advanced filtration technology with 99.5% efficiency rating. Compatible with Caterpillar, Cummins, and Detroit Diesel engines.",
    category: "Engine",
    subcategory: "Filters",
    price: 24.99,
    cost: 15.00,
    quantity: 50,
    reorder_level: 10,
    supplier: "ACME Parts",
    location: "A1-B2",
    weight: 2.5,
    dimensions: "6x4x4 inches",
    warranty: "12 months",
    brand: "FilterPro",
    compatibility: ["CAT 3406", "Cummins ISX", "Detroit DD15"],
    features: ["99.5% Efficiency", "Heavy Duty", "OEM Quality"],
    images: ["/api/placeholder/300/300"],
    rating: 4.8,
    reviews: 127,
    inStock: true,
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2", 
    sku: "BRK-002",
    name: "Commercial Brake Pad Set - Heavy Duty",
    description: "Professional grade brake pads engineered for commercial vehicles and heavy-duty applications. Superior stopping power with extended wear life.",
    category: "Brakes",
    subcategory: "Brake Pads",
    price: 89.99,
    cost: 55.00,
    quantity: 25,
    reorder_level: 5,
    supplier: "Brake Pro",
    location: "B3-C1",
    weight: 8.2,
    dimensions: "12x8x2 inches",
    warranty: "24 months",
    brand: "StopMax",
    compatibility: ["Freightliner Cascadia", "Peterbilt 579", "Kenworth T680"],
    features: ["Extended Wear", "Low Noise", "Heat Resistant"],
    images: ["/api/placeholder/300/300"],
    rating: 4.6,
    reviews: 89,
    inStock: true,
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    sku: "TIR-003", 
    name: "Commercial Truck Tire 295/75R22.5",
    description: "Premium commercial grade truck tire with advanced tread design for maximum traction and fuel efficiency. DOT approved for highway use.",
    category: "Tires",
    subcategory: "Drive Tires",
    price: 299.99,
    cost: 200.00,
    quantity: 12,
    reorder_level: 3,
    supplier: "Tire World",
    location: "C1-D2",
    weight: 110.0,
    dimensions: "42x12x42 inches",
    warranty: "60 months",
    brand: "RoadMaster",
    compatibility: ["All Commercial Trucks"],
    features: ["Fuel Efficient", "Long Lasting", "All Weather"],
    images: ["/api/placeholder/300/300"],
    rating: 4.9,
    reviews: 203,
    inStock: true,
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    sku: "ELE-004",
    name: "LED Headlight Assembly - Driver Side",
    description: "High-intensity LED headlight assembly with adaptive beam technology. Energy efficient with superior visibility and long lifespan.",
    category: "Electrical",
    subcategory: "Lighting",
    price: 189.99,
    cost: 120.00,
    quantity: 8,
    reorder_level: 2,
    supplier: "Bright Lights Co",
    location: "D2-E1",
    weight: 3.8,
    dimensions: "14x10x8 inches",
    warranty: "36 months",
    brand: "LumaTech",
    compatibility: ["Freightliner Cascadia 2018+", "Peterbilt 579 2017+"],
    features: ["LED Technology", "Adaptive Beam", "Energy Efficient"],
    images: ["/api/placeholder/300/300"],
    rating: 4.7,
    reviews: 156,
    inStock: true,
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    sku: "SUS-005",
    name: "Air Suspension Bag - Rear Axle",
    description: "Heavy-duty air suspension bag designed for rear axle applications. Provides superior ride quality and load handling capabilities.",
    category: "Suspension",
    subcategory: "Air Bags",
    price: 145.50,
    cost: 95.00,
    quantity: 15,
    reorder_level: 4,
    supplier: "SuspensionMax",
    location: "E1-F2",
    weight: 12.5,
    dimensions: "16x8x8 inches",
    warranty: "18 months",
    brand: "AirRide Pro",
    compatibility: ["Volvo VNL", "Mack Anthem", "International LT"],
    features: ["Heavy Duty", "Superior Ride", "Long Lasting"],
    images: ["/api/placeholder/300/300"],
    rating: 4.5,
    reviews: 78,
    inStock: true,
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "6",
    sku: "HYD-006",
    name: "Hydraulic Pump Assembly",
    description: "High-pressure hydraulic pump assembly for dump truck and trailer applications. Precision engineered for reliable performance.",
    category: "Hydraulics",
    subcategory: "Pumps",
    price: 425.00,
    cost: 280.00,
    quantity: 6,
    reorder_level: 2,
    supplier: "HydroPower Inc",
    location: "F2-G1",
    weight: 28.0,
    dimensions: "18x12x10 inches",
    warranty: "24 months",
    brand: "FlowMax",
    compatibility: ["Dump Trucks", "Hydraulic Trailers"],
    features: ["High Pressure", "Precision Built", "Reliable"],
    images: ["/api/placeholder/300/300"],
    rating: 4.8,
    reviews: 45,
    inStock: true,
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const categories = [
  { name: "Engine", icon: Settings, count: 1, subcategories: ["Filters", "Gaskets", "Belts", "Pumps"] },
  { name: "Brakes", icon: Package, count: 1, subcategories: ["Brake Pads", "Rotors", "Calipers", "Lines"] },
  { name: "Tires", icon: Package2, count: 1, subcategories: ["Drive Tires", "Steer Tires", "Trailer Tires"] },
  { name: "Electrical", icon: AlertTriangle, count: 1, subcategories: ["Lighting", "Wiring", "Batteries", "Alternators"] },
  { name: "Suspension", icon: Wrench, count: 1, subcategories: ["Air Bags", "Shocks", "Springs", "Bushings"] },
  { name: "Hydraulics", icon: TrendingUp, count: 1, subcategories: ["Pumps", "Cylinders", "Hoses", "Fittings"] }
];

// Mock special orders data
const mockSpecialOrders = [
  {
    id: "SO-001",
    customerName: "ABC Trucking",
    partDescription: "Custom exhaust manifold for Peterbilt 389",
    requestDate: "2024-01-15",
    expectedDate: "2024-02-01",
    status: "In Progress",
    estimatedCost: 850.00,
    supplier: "Custom Parts Co"
  },
  {
    id: "SO-002", 
    customerName: "XYZ Transport",
    partDescription: "Specialized transmission cooler",
    requestDate: "2024-01-10",
    expectedDate: "2024-01-25",
    status: "Ordered",
    estimatedCost: 425.00,
    supplier: "Trans Solutions"
  }
];

const ShopParts = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [parts, setParts] = useState(mockParts);
  const [filteredParts, setFilteredParts] = useState(mockParts);
  const [wishlist, setWishlist] = useState([]);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [specialOrders, setSpecialOrders] = useState(mockSpecialOrders);
  const [showSpecialOrderDialog, setShowSpecialOrderDialog] = useState(false);
  const [newSpecialOrder, setNewSpecialOrder] = useState({
    customerName: "",
    partDescription: "",
    estimatedCost: "",
    notes: ""
  });
  
  // Safely use the cart context with error handling
  let cart, addToCart, getCartItemCount, isInCart, getCartTotal, clearCart;
  try {
    const cartContext = usePartsCart();
    cart = cartContext.cart;
    addToCart = cartContext.addToCart;
    getCartItemCount = cartContext.getCartItemCount;
    isInCart = cartContext.isInCart;
    getCartTotal = cartContext.getCartTotal;
    clearCart = cartContext.clearCart;
  } catch (err) {
    console.warn("PartsCart context not available:", err);
    // Provide fallback functions
    cart = [];
    addToCart = () => console.log("Cart not available");
    getCartItemCount = () => 0;
    isInCart = () => false;
    getCartTotal = () => 0;
    clearCart = () => console.log("Cart not available");
  }

  const { toast } = useToast();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Advanced filtering logic
  useEffect(() => {
    let filtered = parts;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(part => 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.compatibility.some(comp => comp.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(part => 
        part.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    // Subcategory filter
    if (selectedSubcategory !== "all") {
      filtered = filtered.filter(part => 
        part.subcategory.toLowerCase() === selectedSubcategory.toLowerCase()
      );
    }
    
    // Price range filter
    filtered = filtered.filter(part => 
      part.price >= priceRange[0] && part.price <= priceRange[1]
    );
    
    // In stock filter
    if (showInStockOnly) {
      filtered = filtered.filter(part => part.inStock && part.quantity > 0);
    }
    
    // Featured filter
    if (showFeaturedOnly) {
      filtered = filtered.filter(part => part.featured);
    }
    
    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
    
    setFilteredParts(filtered);
  }, [searchTerm, selectedCategory, selectedSubcategory, priceRange, sortBy, parts, showInStockOnly, showFeaturedOnly]);

  const handleAddToCart = (part: any) => {
    try {
      if (addToCart) {
        addToCart(part, 1);
      } else {
        toast({
          title: "Added to cart",
          description: `${part.name} would be added to cart`,
        });
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast({
        title: "Error",
        description: "Could not add item to cart",
        variant: "destructive"
      });
    }
  };

  const toggleWishlist = (partId: string) => {
    setWishlist(prev => 
      prev.includes(partId) 
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    );
  };

  const getSubcategories = () => {
    if (selectedCategory === "all") return [];
    const category = categories.find(cat => cat.name.toLowerCase() === selectedCategory.toLowerCase());
    return category ? category.subcategories : [];
  };

  const getStockStatus = (part: any) => {
    if (part.quantity === 0) return { status: "Out of Stock", color: "destructive", icon: XCircle };
    if (part.quantity <= part.reorder_level) return { status: "Low Stock", color: "warning", icon: AlertTriangle };
    return { status: "In Stock", color: "default", icon: CheckCircle };
  };

  const handleCategoryFilter = (categoryName: string) => {
    setSelectedCategory(categoryName.toLowerCase());
    setSelectedSubcategory("all");
    setActiveTab("catalog");
  };

  const handleCreateSpecialOrder = () => {
    if (!newSpecialOrder.customerName || !newSpecialOrder.partDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in customer name and part description",
        variant: "destructive"
      });
      return;
    }

    const order = {
      id: `SO-${String(specialOrders.length + 1).padStart(3, '0')}`,
      customerName: newSpecialOrder.customerName,
      partDescription: newSpecialOrder.partDescription,
      requestDate: new Date().toISOString().split('T')[0],
      expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "Pending",
      estimatedCost: parseFloat(newSpecialOrder.estimatedCost) || 0,
      supplier: "TBD",
      notes: newSpecialOrder.notes
    };

    setSpecialOrders(prev => [...prev, order]);
    setNewSpecialOrder({ customerName: "", partDescription: "", estimatedCost: "", notes: "" });
    setShowSpecialOrderDialog(false);
    
    toast({
      title: "Special Order Created",
      description: `Order ${order.id} has been created successfully`,
    });
  };

  const handleSaveQuote = () => {
    if (!cart || cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to cart before saving quote",
        variant: "destructive"
      });
      return;
    }

    const quoteId = `Q-${Date.now()}`;
    toast({
      title: "Quote Saved",
      description: `Quote ${quoteId} has been saved successfully`,
    });
  };

  const handleProceedToCheckout = () => {
    if (!cart || cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to cart before checkout",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Proceeding to Checkout",
      description: "Redirecting to checkout process...",
    });
    
    // Here you would typically redirect to checkout page
    // For demo purposes, we'll just show a success message
    setTimeout(() => {
      toast({
        title: "Order Placed",
        description: `Order for ${cart.length} items has been placed successfully`,
      });
      if (clearCart) clearCart();
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-medium">Loading Parts Catalog...</p>
          <p className="text-muted-foreground">Preparing your comprehensive parts database</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Parts</AlertTitle>
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4"
            onClick={() => {
              setError(null);
              setIsLoading(true);
            }}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Parts & Accessories</h1>
              <p className="text-lg text-gray-600 mt-2">Professional truck parts and accessories catalog</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
                <ShoppingCart className="h-4 w-4" />
                Cart: {getCartItemCount ? getCartItemCount() : 0}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2 px-4 py-2">
                <Package className="h-4 w-4" />
                {filteredParts.length} Parts Available
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Catalog
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Special Orders
            </TabsTrigger>
            <TabsTrigger value="cart" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart ({getCartItemCount ? getCartItemCount() : 0})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-6">
            {/* Advanced Search and Filter Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Advanced Search & Filters
                  </CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    {showFilters ? "Hide Filters" : "Show Filters"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main Search Bar */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by part name, SKU, brand, or compatibility..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-12 text-lg"
                    />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48 h-12">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className="h-12 w-12"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className="h-12 w-12"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category.name} value={category.name.toLowerCase()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Subcategory</label>
                      <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Subcategories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Subcategories</SelectItem>
                          {getSubcategories().map(sub => (
                            <SelectItem key={sub} value={sub.toLowerCase()}>
                              {sub}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Price Range: ${priceRange[0]} - ${priceRange[1]}
                      </label>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={500}
                        step={10}
                        className="mt-2"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="in-stock"
                          checked={showInStockOnly}
                          onCheckedChange={setShowInStockOnly}
                        />
                        <label htmlFor="in-stock" className="text-sm font-medium">
                          In Stock Only
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="featured"
                          checked={showFeaturedOnly}
                          onCheckedChange={setShowFeaturedOnly}
                        />
                        <label htmlFor="featured" className="text-sm font-medium">
                          Featured Only
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Quick Links - Now Functional */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {categories.map((category) => {
                const IconComponent = category.icon;
                const isActive = selectedCategory === category.name.toLowerCase();
                return (
                  <Card 
                    key={category.name}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => handleCategoryFilter(category.name)}
                  >
                    <CardContent className="p-4 text-center">
                      <IconComponent className={`h-8 w-8 mx-auto mb-2 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                      <h3 className={`font-medium ${isActive ? 'text-blue-600' : ''}`}>{category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {parts.filter(p => p.category === category.name).length} items
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Parts Display */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredParts.map((part) => {
                  const stockStatus = getStockStatus(part);
                  const StockIcon = stockStatus.icon;
                  
                  return (
                    <Card key={part.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <div className="relative">
                        <div className="aspect-square bg-gray-100 flex items-center justify-center">
                          <Package className="h-16 w-16 text-gray-400" />
                        </div>
                        {part.featured && (
                          <Badge className="absolute top-2 left-2 bg-orange-500">
                            Featured
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => toggleWishlist(part.id)}
                        >
                          <Heart className={`h-4 w-4 ${wishlist.includes(part.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg line-clamp-2">{part.name}</h3>
                            <p className="text-sm text-muted-foreground">SKU: {part.sku}</p>
                            <p className="text-sm text-blue-600 font-medium">{part.brand}</p>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2">{part.description}</p>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(part.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">({part.reviews})</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-green-600">${part.price}</p>
                              <Badge variant={stockStatus.color} className="flex items-center gap-1">
                                <StockIcon className="h-3 w-3" />
                                {stockStatus.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="flex-1">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>{part.name}</DialogTitle>
                                  <DialogDescription>
                                    Complete part specifications and details
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Specifications</h4>
                                    <div className="space-y-1 text-sm">
                                      <p><strong>SKU:</strong> {part.sku}</p>
                                      <p><strong>Brand:</strong> {part.brand}</p>
                                      <p><strong>Weight:</strong> {part.weight} lbs</p>
                                      <p><strong>Dimensions:</strong> {part.dimensions}</p>
                                      <p><strong>Warranty:</strong> {part.warranty}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Compatibility</h4>
                                    <div className="space-y-1">
                                      {part.compatibility.map((comp, idx) => (
                                        <Badge key={idx} variant="outline" className="mr-1 mb-1">
                                          {comp}
                                        </Badge>
                                      ))}
                                    </div>
                                    <h4 className="font-semibold mb-2 mt-4">Features</h4>
                                    <div className="space-y-1">
                                      {part.features.map((feature, idx) => (
                                        <Badge key={idx} variant="secondary" className="mr-1 mb-1">
                                          {feature}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              onClick={() => handleAddToCart(part)}
                              disabled={part.quantity === 0 || (isInCart && isInCart(part.id))}
                              className="flex-1"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              {isInCart && isInCart(part.id) ? "In Cart" : "Add to Cart"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {filteredParts.map((part) => {
                  const stockStatus = getStockStatus(part);
                  const StockIcon = stockStatus.icon;
                  
                  return (
                    <Card key={part.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-xl font-semibold">{part.name}</h3>
                                <p className="text-muted-foreground">SKU: {part.sku} | Brand: {part.brand}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-green-600">${part.price}</p>
                                <Badge variant={stockStatus.color} className="flex items-center gap-1">
                                  <StockIcon className="h-3 w-3" />
                                  {stockStatus.status}
                                </Badge>
                              </div>
                            </div>
                            
                            <p className="text-gray-600">{part.description}</p>
                            
                            <div className="flex items-center gap-4">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < Math.floor(part.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="ml-2 text-sm text-muted-foreground">({part.reviews} reviews)</span>
                              </div>
                              
                              <div className="flex gap-2">
                                {part.features.slice(0, 3).map((feature, idx) => (
                                  <Badge key={idx} variant="secondary">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              <Button 
                                onClick={() => handleAddToCart(part)}
                                disabled={part.quantity === 0 || (isInCart && isInCart(part.id))}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                {isInCart && isInCart(part.id) ? "In Cart" : "Add to Cart"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleWishlist(part.id)}
                              >
                                <Heart className={`h-4 w-4 ${wishlist.includes(part.id) ? 'fill-red-500 text-red-500' : ''}`} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {filteredParts.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No parts found</h3>
                  <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria</p>
                  <Button onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setSelectedSubcategory("all");
                    setPriceRange([0, 500]);
                    setShowInStockOnly(false);
                    setShowFeaturedOnly(false);
                  }}>
                    Clear All Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Enhanced Inventory Tab with Data Rows */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <p className="text-3xl font-bold">{parts.length}</p>
                  <p className="text-muted-foreground">Total Parts</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                  <p className="text-3xl font-bold">
                    {parts.filter(p => p.quantity <= p.reorder_level).length}
                  </p>
                  <p className="text-muted-foreground">Low Stock Items</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <p className="text-3xl font-bold">
                    ${parts.reduce((total, part) => total + (part.price * part.quantity), 0).toLocaleString()}
                  </p>
                  <p className="text-muted-foreground">Total Inventory Value</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <p className="text-3xl font-bold">
                    {parts.filter(p => p.quantity > p.reorder_level).length}
                  </p>
                  <p className="text-muted-foreground">Well Stocked</p>
                </CardContent>
              </Card>
            </div>

            {/* Inventory Data Table */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Details</CardTitle>
                <CardDescription>Complete inventory listing with stock levels and locations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Part Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parts.map((part) => {
                      const stockStatus = getStockStatus(part);
                      const StockIcon = stockStatus.icon;
                      return (
                        <TableRow key={part.id}>
                          <TableCell className="font-medium">{part.sku}</TableCell>
                          <TableCell>{part.name}</TableCell>
                          <TableCell>{part.category}</TableCell>
                          <TableCell>{part.location}</TableCell>
                          <TableCell>{part.quantity}</TableCell>
                          <TableCell>{part.reorder_level}</TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.color} className="flex items-center gap-1 w-fit">
                              <StockIcon className="h-3 w-3" />
                              {stockStatus.status}
                            </Badge>
                          </TableCell>
                          <TableCell>${(part.price * part.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Special Orders Tab with Working Button */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Special Orders Management
                    </CardTitle>
                    <CardDescription>
                      Create and track custom part orders for items not in regular inventory
                    </CardDescription>
                  </div>
                  <Dialog open={showSpecialOrderDialog} onOpenChange={setShowSpecialOrderDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Special Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create Special Order</DialogTitle>
                        <DialogDescription>
                          Create a custom order for parts not in regular inventory
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="customerName">Customer Name</Label>
                          <Input
                            id="customerName"
                            value={newSpecialOrder.customerName}
                            onChange={(e) => setNewSpecialOrder(prev => ({...prev, customerName: e.target.value}))}
                            placeholder="Enter customer name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="partDescription">Part Description</Label>
                          <Textarea
                            id="partDescription"
                            value={newSpecialOrder.partDescription}
                            onChange={(e) => setNewSpecialOrder(prev => ({...prev, partDescription: e.target.value}))}
                            placeholder="Describe the part needed"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="estimatedCost">Estimated Cost</Label>
                          <Input
                            id="estimatedCost"
                            type="number"
                            value={newSpecialOrder.estimatedCost}
                            onChange={(e) => setNewSpecialOrder(prev => ({...prev, estimatedCost: e.target.value}))}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            value={newSpecialOrder.notes}
                            onChange={(e) => setNewSpecialOrder(prev => ({...prev, notes: e.target.value}))}
                            placeholder="Additional notes or requirements"
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleCreateSpecialOrder} className="flex-1">
                            Create Order
                          </Button>
                          <Button variant="outline" onClick={() => setShowSpecialOrderDialog(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {specialOrders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Part Description</TableHead>
                        <TableHead>Request Date</TableHead>
                        <TableHead>Expected Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Estimated Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {specialOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{order.partDescription}</TableCell>
                          <TableCell>{order.requestDate}</TableCell>
                          <TableCell>{order.expectedDate}</TableCell>
                          <TableCell>
                            <Badge variant={order.status === "Pending" ? "secondary" : "default"}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>${order.estimatedCost.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Truck className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No special orders</h3>
                    <p className="text-muted-foreground mb-6">Special orders will appear here when created</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Cart Tab with Working Buttons */}
          <TabsContent value="cart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Shopping Cart
                </CardTitle>
                <CardDescription>
                  Review and manage items before checkout
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cart && cart.length > 0 ? (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.part.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.part.name}</h4>
                            <p className="text-sm text-muted-foreground">SKU: {item.part.sku}</p>
                            <p className="text-sm text-blue-600">{item.part.brand}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Quantity</p>
                            <p className="font-semibold">{item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${(item.part.price * item.quantity).toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">${item.part.price} each</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-lg">
                          <span>Subtotal:</span>
                          <span>${getCartTotal ? getCartTotal().toFixed(2) : '0.00'}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Tax (estimated):</span>
                          <span>${(getCartTotal ? getCartTotal() * 0.08 : 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold border-t pt-2">
                          <span>Total:</span>
                          <span>${(getCartTotal ? getCartTotal() * 1.08 : 0).toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 mt-6">
                        <Button variant="outline" className="flex-1" onClick={handleSaveQuote}>
                          <FileText className="h-4 w-4 mr-2" />
                          Save Quote
                        </Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleProceedToCheckout}>
                          <Truck className="h-4 w-4 mr-2" />
                          Proceed to Checkout
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                    <p className="text-muted-foreground mb-6">Add parts from the catalog to get started</p>
                    <Button onClick={() => setActiveTab("catalog")}>
                      Browse Catalog
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categories.slice(0, 4).map((category, idx) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full bg-blue-${(idx + 1) * 100}`}></div>
                          <span>{category.name}</span>
                        </div>
                        <span className="font-semibold">{Math.floor(Math.random() * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {parts.filter(p => p.quantity <= p.reorder_level).map((part) => (
                      <div key={part.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <div className="flex-1">
                          <p className="font-medium">{part.name}</p>
                          <p className="text-sm text-muted-foreground">Only {part.quantity} left</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ShopParts;


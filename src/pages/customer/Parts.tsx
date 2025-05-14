import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Search, Filter, ShoppingCart, Clock, ArrowRight, Plus, Minus, ChevronRight } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { PartsCatalogGrid } from '@/components/shared/parts/PartsCatalogGrid';
import { usePartsPage } from '@/hooks/parts/usePartsPage';

// Fake data for parts catalog
const PARTS_CATEGORIES = [
  'All Parts',
  'Brake System',
  'Engine Components',
  'Suspension',
  'Electrical',
  'Filters',
  'Transmission',
  'Exhaust'
];

const SAMPLE_PARTS = [
  {
    id: '1',
    name: 'Brake Pads - Premium',
    category: 'Brake System',
    price: 89.99,
    image: 'https://placehold.co/300x200',
    description: 'High-performance ceramic brake pads designed for increased stopping power and reduced noise.',
    stock: 12,
    compatibility: ['Ford F-150 (2018-2023)', 'Ford F-250 (2017-2022)'],
    partNumber: 'BP-10045',
    brand: 'StopRight'
  },
  {
    id: '2',
    name: 'Oil Filter - Standard',
    category: 'Filters',
    price: 12.99,
    image: 'https://placehold.co/300x200',
    description: 'Standard replacement oil filter for most common truck applications.',
    stock: 24,
    compatibility: ['Ford F-150 (2010-2023)', 'Chevy Silverado (2014-2022)'],
    partNumber: 'OF-22098',
    brand: 'FilterPro'
  },
  {
    id: '3',
    name: 'Alternator - Heavy Duty',
    category: 'Electrical',
    price: 189.99,
    image: 'https://placehold.co/300x200',
    description: 'Heavy-duty alternator with increased amperage output for commercial applications.',
    stock: 6,
    compatibility: ['Ford F-250 (2015-2022)', 'Ford F-350 (2015-2022)'],
    partNumber: 'ALT-HD5500',
    brand: 'PowerMax'
  },
  {
    id: '4',
    name: 'Shock Absorber - Off Road',
    category: 'Suspension',
    price: 129.99,
    image: 'https://placehold.co/300x200',
    description: 'Heavy-duty shock absorbers designed for off-road performance and durability.',
    stock: 8,
    compatibility: ['Ford F-150 Raptor (2018-2023)', 'Ford F-250 (2018-2022)'],
    partNumber: 'SA-OR8700',
    brand: 'RideTech'
  },
  {
    id: '5',
    name: 'Spark Plugs - High Performance',
    category: 'Engine Components',
    price: 8.99,
    image: 'https://placehold.co/300x200',
    description: 'Iridium-tipped spark plugs for improved fuel efficiency and performance.',
    stock: 40,
    compatibility: ['Most Ford Models (2010-2023)', 'Most Chevy Models (2010-2023)'],
    partNumber: 'SP-IR9078',
    brand: 'SparkMaster'
  },
  {
    id: '6',
    name: 'Air Filter - Performance',
    category: 'Filters',
    price: 34.99,
    image: 'https://placehold.co/300x200',
    description: 'Washable performance air filter for increased airflow and engine response.',
    stock: 15,
    compatibility: ['Ford F-150 (2015-2023)', 'Ford F-250 (2017-2022)'],
    partNumber: 'AF-P4567',
    brand: 'FlowMax'
  },
  {
    id: '7',
    name: 'Exhaust Tip - Chrome',
    category: 'Exhaust',
    price: 49.99,
    image: 'https://placehold.co/300x200',
    description: 'Polished chrome exhaust tip for improved appearance and sound.',
    stock: 20,
    compatibility: ['Universal Fit (3-inch exhaust)'],
    partNumber: 'ET-CH300',
    brand: 'ExhaustPro'
  },
  {
    id: '8',
    name: 'Transmission Fluid - Synthetic',
    category: 'Transmission',
    price: 14.99,
    image: 'https://placehold.co/300x200',
    description: 'Full synthetic transmission fluid for smooth shifting and extended transmission life.',
    stock: 30,
    compatibility: ['Most Ford Automatic Transmissions'],
    partNumber: 'TF-SYN1',
    brand: 'SmoothShift'
  }
];

// Sample data for orders
const SAMPLE_ORDERS = [
  {
    id: 'ORD-1234',
    date: '2023-05-15',
    status: 'Shipped',
    total: 102.98,
    items: [
      { name: 'Brake Pads - Premium', quantity: 1, price: 89.99 },
      { name: 'Oil Filter - Standard', quantity: 1, price: 12.99 }
    ],
    trackingNumber: '1Z999AA10123456784'
  },
  {
    id: 'ORD-1210',
    date: '2023-04-28',
    status: 'Delivered',
    total: 189.99,
    items: [
      { name: 'Alternator - Heavy Duty', quantity: 1, price: 189.99 }
    ]
  }
];

const CustomerParts = () => {
  const { toast } = useToast();
  const { vehicles } = useVehicles();
  const [activeCategory, setActiveCategory] = useState('All Parts');
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Use the hooks/parts/usePartsPage hook
  const partsPageHook = usePartsPage();
  
  // Log that we're loading the page
  useEffect(() => {
    console.log('CustomerParts component mounted');
    toast({
      title: "Loading Parts Catalog",
      description: "Fetching parts from inventory...",
    });
  }, []);
  
  // Handle filtering parts based on search, category and vehicle
  useEffect(() => {
    if (partsPageHook.parts.length > 0) {
      console.log('Parts loaded from hook:', partsPageHook.parts.length);
    }
    
    // Update search filters in the hook
    partsPageHook.setSearchFilters({
      ...partsPageHook.searchFilters,
      query: searchQuery,
      category: activeCategory !== 'All Parts' ? activeCategory : undefined
    });
    
  }, [searchQuery, activeCategory, selectedVehicle]);
  
  // Open detail dialog for a part
  const openDetailDialog = (partId: string) => {
    const part = partsPageHook.parts.find(p => p.id === partId);
    if (part) {
      setSelectedPart(part);
      setIsDetailDialogOpen(true);
    }
  };
  
  // Add item to cart
  const addToCart = (part: any, quantity = 1) => {
    const existingItemIndex = cartItems.findIndex(item => item.id === part.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity
      };
      setCartItems(updatedItems);
    } else {
      // Add new item
      setCartItems([...cartItems, { ...part, quantity }]);
    }
    
    toast({
      title: "Added to cart",
      description: `${part.name} added to your cart.`
    });
    
    setIsDetailDialogOpen(false);
  };
  
  // Remove item from cart
  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };
  
  // Update item quantity in cart
  const updateCartQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    const updatedItems = cartItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity };
      }
      return item;
    });
    
    setCartItems(updatedItems);
  };
  
  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Create a list of part categories from the available parts
  const PARTS_CATEGORIES = [
    'All Parts',
    ...Array.from(new Set(partsPageHook.parts.map(part => part.category || 'Uncategorized')))
  ];
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Parts Desk</h1>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="relative"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="ml-2">Cart</span>
            {cartItems.length > 0 && (
              <Badge className="absolute -top-2 -right-2 px-1 min-w-[20px] h-5 rounded-full">
                {cartItems.length}
              </Badge>
            )}
          </Button>
          <Button 
            variant="outline"
            asChild
          >
            <a href="/customer/parts/orders">
              <Clock className="h-5 w-5 mr-2" />
              Orders
            </a>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
        {/* Sidebar with filters */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-10" 
                  placeholder="Search parts..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Filter By Vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedVehicle || ''} onValueChange={setSelectedVehicle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Vehicles</SelectItem>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVehicle && (
                <Button variant="link" className="p-0 h-auto mt-2" onClick={() => setSelectedVehicle(null)}>
                  Clear selection
                </Button>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <div className="space-y-1">
                {PARTS_CATEGORIES.map(category => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content - Parts grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {activeCategory}
              <span className="text-gray-500 text-sm ml-2">
                ({partsPageHook.parts.length} items)
              </span>
            </h2>
            
            <div className="flex items-center gap-2">
              <Select defaultValue="relevance">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name-asc">Name: A-Z</SelectItem>
                </SelectContent>
              </Select>
              
              <Button size="icon" variant="outline">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Use the PartsCatalogGrid component */}
          <PartsCatalogGrid
            parts={partsPageHook.parts}
            isLoading={partsPageHook.isLoading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onAddToCart={addToCart}
            onViewDetails={openDetailDialog}
            showInventory={true}
          />
        </div>
      </div>
      
      {/* Part Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          {selectedPart && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPart.name}</DialogTitle>
                <DialogDescription>
                  Part #: {selectedPart.partNumber} | Brand: {selectedPart.brand}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img 
                    src={selectedPart.image} 
                    alt={selectedPart.name}
                    className="w-full rounded-md"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Price</h4>
                    <p className="text-2xl font-bold">${selectedPart.price.toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Availability</h4>
                    <p className={`font-medium ${selectedPart.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedPart.stock > 0 ? `${selectedPart.stock} in stock` : 'Out of stock'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="text-sm">{selectedPart.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Compatible With</h4>
                    <ul className="text-sm list-disc list-inside">
                      {selectedPart.compatibility.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  className="w-full md:w-auto" 
                  onClick={() => addToCart(selectedPart)}
                  disabled={selectedPart.stock <= 0}
                >
                  Add to Cart
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Shopping Cart Sidebar */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="sm:max-w-[450px] sm:h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Your Cart</DialogTitle>
            <DialogDescription>
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-grow overflow-auto p-6 pt-2">
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-lg mb-1">Your cart is empty</h3>
                <p className="text-gray-500 mb-4">
                  Browse our parts catalog and add items to your cart.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCartOpen(false)}
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-3 border-b pb-4">
                    <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">Part #: {item.partNumber}</p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-7 w-7"
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-7 w-7"
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                          <button 
                            className="text-xs text-red-600 hover:underline"
                            onClick={() => removeFromCart(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {cartItems.length > 0 && (
            <div className="border-t p-6">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span className="font-medium">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span>Estimated Tax</span>
                <span className="font-medium">${(cartTotal * 0.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mb-6">
                <span>Total</span>
                <span>${(cartTotal * 1.08).toFixed(2)}</span>
              </div>
              <Button className="w-full">
                Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                className="w-full mt-2"
                onClick={() => setIsCartOpen(false)}
              >
                Continue Shopping
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Orders Tab - For demonstration purposes, this would be its own page */}
      <div className="hidden">
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Orders</TabsTrigger>
            <TabsTrigger value="past">Past Orders</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            {SAMPLE_ORDERS.map(order => (
              <Card key={order.id} className="mb-4">
                <CardHeader>
                  <div className="flex justify-between">
                    <div>
                      <CardTitle className="text-base">Order #{order.id}</CardTitle>
                      <CardDescription>Placed on {order.date}</CardDescription>
                    </div>
                    <Badge variant={order.status === 'Delivered' ? 'outline' : 'default'}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  {order.trackingNumber && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
                      <p className="font-medium">Tracking Number:</p>
                      <p className="font-mono">{order.trackingNumber}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div>
                    <span className="font-semibold">Total: </span>
                    <span className="font-bold">${order.total.toFixed(2)}</span>
                  </div>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    View Details <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="past">
            <div className="text-center py-12">
              <p className="text-gray-500">You don't have any past orders yet.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerParts;

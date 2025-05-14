import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogHeader,
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Search, ShoppingCart, Box, Filter, Grid3X3, List, Plus, Check } from 'lucide-react';

const CustomerParts = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  
  // Mock vehicles for the selector
  const vehicles = [
    { id: 'v1', name: '2023 Ford F-150' },
    { id: 'v2', name: '2022 Chevrolet Silverado' },
  ];
  
  // Mock parts data
  const parts = [
    {
      id: 'p1',
      name: 'Premium Brake Pads',
      price: 79.99,
      category: 'Brakes',
      manufacturer: 'TerraStop',
      compatibility: ['v1', 'v2'],
      stock: 12,
      description: 'High-performance ceramic brake pads designed for durability and stopping power. Compatible with most truck models.',
      image: 'https://placehold.co/300x200/e2e8f0/1e293b?text=Brake+Pads'
    },
    {
      id: 'p2',
      name: 'Heavy-Duty Shock Absorber',
      price: 129.99,
      category: 'Suspension',
      manufacturer: 'RideControl',
      compatibility: ['v1'],
      stock: 8,
      description: 'Rugged shock absorbers built for off-road performance and smooth highway driving.',
      image: 'https://placehold.co/300x200/e2e8f0/1e293b?text=Shock+Absorber'
    },
    {
      id: 'p3',
      name: 'Long-Life Oil Filter',
      price: 24.99,
      category: 'Engine',
      manufacturer: 'FilterMax',
      compatibility: ['v1', 'v2'],
      stock: 30,
      description: 'Advanced filtration technology that removes more contaminants for extended engine life.',
      image: 'https://placehold.co/300x200/e2e8f0/1e293b?text=Oil+Filter'
    },
    {
      id: 'p4',
      name: 'All-Terrain Tire',
      price: 195.99,
      category: 'Tires',
      manufacturer: 'RoadGrip',
      compatibility: ['v1', 'v2'],
      stock: 16,
      description: 'Rugged all-terrain tires with enhanced grip for both highway and off-road conditions.',
      image: 'https://placehold.co/300x200/e2e8f0/1e293b?text=Truck+Tire'
    },
    {
      id: 'p5',
      name: 'LED Headlight Kit',
      price: 149.99,
      category: 'Lighting',
      manufacturer: 'BrightView',
      compatibility: ['v1'],
      stock: 7,
      description: 'Ultra-bright LED headlight conversion kit for improved visibility and modern appearance.',
      image: 'https://placehold.co/300x200/e2e8f0/1e293b?text=LED+Headlights'
    },
    {
      id: 'p6',
      name: 'Premium Air Filter',
      price: 34.99,
      category: 'Engine',
      manufacturer: 'FilterMax',
      compatibility: ['v1', 'v2'],
      stock: 22,
      description: 'High-flow air filter that improves engine performance while blocking more contaminants.',
      image: 'https://placehold.co/300x200/e2e8f0/1e293b?text=Air+Filter'
    }
  ];
  
  const filteredParts = parts.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          part.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          part.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
                          
    const matchesVehicle = !selectedVehicle || part.compatibility.includes(selectedVehicle);
    
    return matchesSearch && matchesVehicle;
  });
  
  const openPartDetails = (part: any) => {
    setSelectedPart(part);
    setDetailsOpen(true);
  };
  
  const addToCart = (part: any, quantity: number = 1) => {
    // Check if item is already in cart
    const existingItemIndex = cartItems.findIndex(item => item.part.id === part.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedCart = [...cartItems];
      updatedCart[existingItemIndex].quantity += quantity;
      setCartItems(updatedCart);
    } else {
      // Add new item
      setCartItems([...cartItems, { part, quantity }]);
    }
    
    toast({
      title: "Added to Cart",
      description: `${part.name} has been added to your cart`,
      duration: 2000,
    });
    
    setDetailsOpen(false);
  };
  
  const removeFromCart = (partId: string) => {
    setCartItems(cartItems.filter(item => item.part.id !== partId));
  };
  
  const updateCartQuantity = (partId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(partId);
      return;
    }
    
    setCartItems(
      cartItems.map(item => 
        item.part.id === partId ? { ...item, quantity } : item
      )
    );
  };
  
  const calculateCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.part.price * item.quantity), 0);
  };
  
  const handleCheckout = () => {
    toast({
      title: "Order Submitted",
      description: "Your parts order has been submitted for processing",
      duration: 3000,
    });
    
    setCartItems([]);
    setCartOpen(false);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parts Catalog</h1>
          <p className="text-gray-500">Browse and order parts for your vehicles</p>
        </div>
        
        <Button variant="outline" onClick={() => setCartOpen(true)} className="relative">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Cart
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-shop-primary text-xs text-white flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="vehicle-select">Your Vehicle</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger id="vehicle-select">
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Vehicles</SelectItem>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Shows parts compatible with the selected vehicle
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search-parts">Search Parts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  id="search-parts"
                  placeholder="Search by name, category..." 
                  className="pl-9" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="pt-4 border-t space-y-4">
              <div>
                <Label className="text-sm font-medium pb-2 block">View Mode</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={viewMode === 'grid' ? "default" : "outline"} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4 mr-1" />
                    Grid
                  </Button>
                  <Button 
                    variant={viewMode === 'list' ? "default" : "outline"} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4 mr-1" />
                    List
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Parts Catalog */}
        <div className="lg:col-span-3 space-y-6">
          {/* Category Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full flex overflow-x-auto hide-scrollbar">
              <TabsTrigger value="all" className="flex-1">All Parts</TabsTrigger>
              <TabsTrigger value="brakes" className="flex-1">Brakes</TabsTrigger>
              <TabsTrigger value="engine" className="flex-1">Engine</TabsTrigger>
              <TabsTrigger value="suspension" className="flex-1">Suspension</TabsTrigger>
              <TabsTrigger value="lighting" className="flex-1">Lighting</TabsTrigger>
              <TabsTrigger value="tires" className="flex-1">Tires</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredParts.map(part => (
                    <Card key={part.id} className="overflow-hidden hover:shadow-md transition-shadow border cursor-pointer" onClick={() => openPartDetails(part)}>
                      <AspectRatio ratio={16/9}>
                        <img 
                          src={part.image} 
                          alt={part.name}
                          className="object-cover w-full h-full"
                        />
                      </AspectRatio>
                      
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="font-medium line-clamp-1">{part.name}</h3>
                            <div className="flex items-center text-sm">
                              <Badge variant="outline" className="mr-2">{part.category}</Badge>
                              <span className="text-gray-500 text-xs">{part.manufacturer}</span>
                            </div>
                          </div>
                          <span className="font-bold text-lg">${part.price.toFixed(2)}</span>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t flex justify-between">
                          <span className={`text-xs ${part.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {part.stock > 0 ? `In Stock (${part.stock})` : 'Out of Stock'}
                          </span>
                          
                          <Button size="sm" variant="outline" onClick={(e) => {
                            e.stopPropagation();
                            addToCart(part);
                          }}>
                            <Plus className="h-3 w-3 mr-1" />
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredParts.map(part => (
                    <div 
                      key={part.id} 
                      className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50 cursor-pointer"
                      onClick={() => openPartDetails(part)}
                    >
                      <div className="w-full md:w-20 h-20">
                        <img 
                          src={part.image} 
                          alt={part.name}
                          className="object-cover w-full h-full rounded-md"
                        />
                      </div>
                      
                      <div className="flex-grow">
                        <h3 className="font-medium">{part.name}</h3>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="mr-2">{part.category}</Badge>
                          <span className="text-gray-500 text-xs">{part.manufacturer}</span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                          {part.description}
                        </p>
                      </div>
                      
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mt-2 md:mt-0">
                        <span className="font-bold text-lg whitespace-nowrap">${part.price.toFixed(2)}</span>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          addToCart(part);
                        }}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {filteredParts.length === 0 && (
                <div className="text-center py-12 border rounded-lg">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Box className="h-6 w-6 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium">No Parts Found</h3>
                  <p className="text-muted-foreground mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </TabsContent>
            
            {/* Other tabs would follow the same pattern */}
            <TabsContent value="brakes" className="mt-6">
              {/* Brakes category content */}
              <div className="text-center py-12 border rounded-lg">
                <p>Brake parts would be shown here</p>
              </div>
            </TabsContent>
            
            {/* More tabs... */}
          </Tabs>
        </div>
      </div>
      
      {/* Part Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        {selectedPart && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedPart.name}</DialogTitle>
              <DialogDescription>
                {selectedPart.manufacturer} | {selectedPart.category}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <AspectRatio ratio={16/9}>
                <img 
                  src={selectedPart.image} 
                  alt={selectedPart.name}
                  className="object-cover w-full h-full rounded-md"
                />
              </AspectRatio>
              
              <div className="flex justify-between items-center">
                <span className="font-bold text-xl">${selectedPart.price.toFixed(2)}</span>
                <span className={`text-sm ${selectedPart.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedPart.stock > 0 ? `In Stock (${selectedPart.stock})` : 'Out of Stock'}
                </span>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Description</h4>
                <p className="text-sm text-gray-600">{selectedPart.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Compatible with</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPart.compatibility.map((vId: string) => {
                    const vehicle = vehicles.find(v => v.id === vId);
                    return vehicle && (
                      <Badge key={vId} variant="outline">{vehicle.name}</Badge>
                    );
                  })}
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="w-24">
                    <Label htmlFor="quantity" className="text-sm">Quantity</Label>
                    <Input 
                      id="quantity" 
                      type="number" 
                      min="1" 
                      max={selectedPart.stock}
                      defaultValue="1"
                      className="mt-1"
                    />
                  </div>
                  
                  <Button className="flex-1" onClick={() => addToCart(selectedPart)}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
      
      {/* Shopping Cart Dialog */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Shopping Cart
            </DialogTitle>
            <DialogDescription>
              {cartItems.length === 0 ? 
                'Your cart is empty' : 
                `${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'} in your cart`
              }
            </DialogDescription>
          </DialogHeader>
          
          {cartItems.length > 0 ? (
            <div className="space-y-4">
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
                {cartItems.map(item => (
                  <div key={item.part.id} className="flex gap-3 border-b pb-3">
                    <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={item.part.image}
                        alt={item.part.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    
                    <div className="flex-grow">
                      <h4 className="font-medium text-sm">{item.part.name}</h4>
                      <p className="text-sm text-gray-500">${item.part.price.toFixed(2)} each</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6 rounded-full"
                            onClick={() => updateCartQuantity(item.part.id, item.quantity - 1)}
                          >
                            <span className="sr-only">Decrease</span>
                            <span>-</span>
                          </Button>
                          
                          <span className="w-8 text-center">{item.quantity}</span>
                          
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6 rounded-full"
                            onClick={() => updateCartQuantity(item.part.id, item.quantity + 1)}
                            disabled={item.quantity >= item.part.stock}
                          >
                            <span className="sr-only">Increase</span>
                            <span>+</span>
                          </Button>
                        </div>
                        
                        <span className="font-medium">${(item.part.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-gray-400 hover:text-red-500"
                      onClick={() => removeFromCart(item.part.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center font-medium">
                  <span>Total</span>
                  <span>${calculateCartTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCartOpen(false)}
                  className="flex-1 sm:flex-none"
                >
                  Continue Shopping
                </Button>
                <Button 
                  onClick={handleCheckout}
                  className="flex-1 sm:flex-none"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Checkout
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <ShoppingCart className="h-6 w-6 text-gray-500" />
              </div>
              <p className="mb-4">Your shopping cart is empty</p>
              <Button onClick={() => setCartOpen(false)}>
                Continue Shopping
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerParts;

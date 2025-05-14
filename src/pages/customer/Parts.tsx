
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, ShoppingCart, Plus, Minus, ArrowRight } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { PartsCatalogGrid } from '@/components/shared/parts/PartsCatalogGrid';
import { usePartsCatalog } from '@/hooks/parts/usePartsCatalog';
import { Part } from '@/types/parts';

const CustomerParts = () => {
  const { toast } = useToast();
  const { vehicles } = useVehicles();
  const [activeCategory, setActiveCategory] = useState<string>('All Parts');
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [cartItems, setCartItems] = useState<(Part & { quantity: number })[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [categories, setCategories] = useState<string[]>(['All Parts']);
  
  // Use the catalog hook for data fetching
  const { 
    parts, 
    isLoading, 
    searchFilters, 
    setSearchFilters, 
    getCategories, 
    refreshCatalog 
  } = usePartsCatalog();
  
  // Initialize and load categories
  useEffect(() => {
    const loadCategories = async () => {
      toast({
        title: "Loading Parts Catalog",
        description: "Fetching parts and categories...",
      });
      
      refreshCatalog();
      const fetchedCategories = await getCategories();
      if (fetchedCategories && fetchedCategories.length > 0) {
        setCategories(['All Parts', ...fetchedCategories]);
      }
    };
    
    loadCategories();
  }, []);
  
  // Update search filters when inputs change
  useEffect(() => {
    setSearchFilters({
      query: searchQuery,
      category: activeCategory !== 'All Parts' ? activeCategory : undefined
    });
  }, [searchQuery, activeCategory, setSearchFilters]);
  
  // Open detail dialog for a part
  const openDetailDialog = (partId: string) => {
    const part = parts.find(p => p.id === partId);
    if (part) {
      setSelectedPart(part);
      setIsDetailDialogOpen(true);
    }
  };
  
  // Add item to cart
  const addToCart = (part: Part, quantity = 1) => {
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
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Parts Catalog</h1>
        
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
                {categories.map(category => (
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
                ({parts.length} items)
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
            parts={parts}
            isLoading={isLoading}
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
                  Part #: {selectedPart.sku} | Brand: {selectedPart.supplier || 'Unknown'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="bg-gray-100 rounded-md h-48 w-full flex items-center justify-center">
                    {selectedPart.images && selectedPart.images.length > 0 ? (
                      <img 
                        src={selectedPart.images[0]} 
                        alt={selectedPart.name}
                        className="w-full h-full object-contain rounded-md"
                      />
                    ) : (
                      <div className="text-gray-400">No image available</div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Price</h4>
                    <p className="text-2xl font-bold">${selectedPart.price.toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Availability</h4>
                    <p className={`font-medium ${selectedPart.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedPart.quantity > 0 ? `${selectedPart.quantity} in stock` : 'Out of stock'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="text-sm">{selectedPart.description || 'No description available'}</p>
                  </div>
                  
                  {selectedPart.compatibility && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Compatible With</h4>
                      <ul className="text-sm list-disc list-inside">
                        {Array.isArray(selectedPart.compatibility) ? 
                          selectedPart.compatibility.map((item: string, index: number) => (
                            <li key={index}>{item}</li>
                          )) : 
                          <li>{selectedPart.compatibility}</li>
                        }
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  className="w-full md:w-auto" 
                  onClick={() => addToCart(selectedPart)}
                  disabled={selectedPart.quantity <= 0}
                >
                  Add to Cart
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Shopping Cart Dialog */}
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
                    <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                      {item.images && item.images.length > 0 ? (
                        <img 
                          src={item.images[0]} 
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-gray-400 text-xs">No image</div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">Part #: {item.sku}</p>
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
    </div>
  );
};

export default CustomerParts;

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Package, ShoppingCart, Search, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePartsCart } from "@/contexts/parts/PartsCartContext";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const mockParts = [
  {
    id: "1",
    sku: "ENG-001",
    name: "Engine Oil Filter",
    description: "High-performance oil filter for diesel engines",
    category: "Engine",
    price: 24.99,
    cost: 15.00,
    quantity: 50,
    reorder_level: 10,
    supplier: "ACME Parts",
    location: "A1-B2",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2", 
    sku: "BRK-002",
    name: "Brake Pad Set",
    description: "Heavy-duty brake pads for commercial vehicles",
    category: "Brakes",
    price: 89.99,
    cost: 55.00,
    quantity: 25,
    reorder_level: 5,
    supplier: "Brake Pro",
    location: "B3-C1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    sku: "TIR-003", 
    name: "Truck Tire 295/75R22.5",
    description: "Commercial grade truck tire",
    category: "Tires",
    price: 299.99,
    cost: 200.00,
    quantity: 12,
    reorder_level: 3,
    supplier: "Tire World",
    location: "C1-D2",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const ShopParts = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [parts, setParts] = useState(mockParts);
  const [filteredParts, setFilteredParts] = useState(mockParts);
  
  // Safely use the cart context with error handling
  let cart, addToCart, getCartItemCount, isInCart;
  try {
    const cartContext = usePartsCart();
    cart = cartContext.cart;
    addToCart = cartContext.addToCart;
    getCartItemCount = cartContext.getCartItemCount;
    isInCart = cartContext.isInCart;
  } catch (err) {
    console.warn("PartsCart context not available:", err);
    // Provide fallback functions
    cart = [];
    addToCart = () => console.log("Cart not available");
    getCartItemCount = () => 0;
    isInCart = () => false;
  }

  const { toast } = useToast();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter parts based on search and category
  useEffect(() => {
    let filtered = parts;
    
    if (searchTerm) {
      filtered = filtered.filter(part => 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(part => 
        part.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    setFilteredParts(filtered);
  }, [searchTerm, selectedCategory, parts]);

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

  const categories = ["all", ...Array.from(new Set(parts.map(part => part.category)))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Parts Management...</p>
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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Parts Management</h1>
            <p className="text-muted-foreground">Manage your parts inventory, catalog, and orders</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart: {getCartItemCount ? getCartItemCount() : 0}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="catalog">Parts Catalog</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="orders">Special Orders</TabsTrigger>
          <TabsTrigger value="cart">Shopping Cart</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          {/* Search and Filter Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search parts by name, SKU, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  className="px-3 py-2 border rounded-md"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Parts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredParts.map((part) => (
              <Card key={part.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{part.name}</CardTitle>
                      <CardDescription>SKU: {part.sku}</CardDescription>
                    </div>
                    <Badge variant={part.quantity > part.reorder_level ? "default" : "destructive"}>
                      {part.quantity} in stock
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{part.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold">${part.price}</p>
                      <p className="text-sm text-muted-foreground">Category: {part.category}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleAddToCart(part)}
                      disabled={part.quantity === 0 || (isInCart && isInCart(part.id))}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isInCart && isInCart(part.id) ? "In Cart" : "Add to Cart"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredParts.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">No parts found</p>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Summary</CardTitle>
              <CardDescription>Overview of current inventory levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{parts.length}</p>
                  <p className="text-sm text-muted-foreground">Total Parts</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">
                    {parts.filter(p => p.quantity <= p.reorder_level).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">
                    ${parts.reduce((total, part) => total + (part.price * part.quantity), 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Special Orders</CardTitle>
              <CardDescription>Track custom part orders and requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">No special orders</p>
                <p className="text-muted-foreground">Special orders will appear here when created</p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Special Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cart" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopping Cart
              </CardTitle>
              <CardDescription>Review items before checkout</CardDescription>
            </CardHeader>
            <CardContent>
              {cart && cart.length > 0 ? (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.part.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{item.part.name}</h4>
                        <p className="text-sm text-muted-foreground">SKU: {item.part.sku}</p>
                        <p className="text-sm">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(item.part.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">Total:</span>
                      <span className="text-lg font-bold">
                        ${cart.reduce((total, item) => total + (item.part.price * item.quantity), 0).toFixed(2)}
                      </span>
                    </div>
                    <Button className="w-full mt-4">Proceed to Checkout</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Your cart is empty</p>
                  <p className="text-muted-foreground">Add parts from the catalog to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShopParts;


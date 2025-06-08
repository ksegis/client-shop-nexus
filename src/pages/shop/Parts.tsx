import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ShopParts = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading and check for any initialization errors
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading Parts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6 p-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Parts Management</h1>
        <p className="text-muted-foreground">Manage your parts inventory, catalog, and orders</p>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Parts System</AlertTitle>
        <AlertDescription>
          The parts management system is now loading. This simplified version ensures the page renders correctly.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="catalog" className="space-y-6">
        <TabsList>
          <TabsTrigger value="catalog">Parts Catalog</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="catalog" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">Search & Filter</h3>
              <p className="text-sm text-muted-foreground">Find parts by category, supplier, or part number</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">Parts Catalog</h3>
              <p className="text-sm text-muted-foreground">Browse available parts and inventory</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">Shopping Cart</h3>
              <p className="text-sm text-muted-foreground">Add parts to cart for checkout</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="inventory">
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Inventory Management</h3>
            <p className="text-muted-foreground">Track stock levels and manage inventory</p>
          </div>
        </TabsContent>
        
        <TabsContent value="orders">
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Order Management</h3>
            <p className="text-muted-foreground">Track special orders and order history</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ShopParts;



import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, Plus, Database } from 'lucide-react';
import { PartsSearchFilters } from '@/components/shared/parts/PartsSearchFilters';
import { PartsCatalogGrid } from '@/components/shared/parts/PartsCatalogGrid';
import { PartDetailDialog } from '@/components/shared/parts/PartDetailDialog';
import { PartsCart } from '@/components/shared/parts/PartsCart';
import { usePartsCatalog } from '@/hooks/parts/usePartsCatalog';
import { usePartsCart } from '@/contexts/parts/PartsCartContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Part } from '@/types/parts';

const ShopParts = () => {
  const { toast } = useToast();
  const { 
    parts, 
    isLoading, 
    searchFilters, 
    setSearchFilters,
    getCategories,
    getSuppliers,
    refreshCatalog,
    addSamplePart,
    testDirectFetch
  } = usePartsCatalog();
  
  const { 
    addToCart, 
    getCartItemCount,
    cart
  } = usePartsCart();
  
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  
  useEffect(() => {
    const loadFilterOptions = async () => {
      const categoriesList = await getCategories();
      const suppliersList = await getSuppliers();
      
      setCategories(categoriesList as string[]);
      setSuppliers(suppliersList as string[]);
    };
    
    loadFilterOptions();
    
    // Log some debug information
    console.log('ShopParts component mounted', {
      searchFilters,
      isLoading,
      partsCount: parts.length
    });
  }, []);
  
  const handleViewDetails = (partId: string) => {
    setSelectedPartId(partId);
  };
  
  const handleCloseDetails = () => {
    setSelectedPartId(null);
  };
  
  // Modified to match the expected signature in PartDetailDialog
  const handleAddToCartFromDialog = (part: Part, quantity: number) => {
    addToCart(part, quantity);
  };
  
  // Simple adapter function to handle single-parameter calls from PartCard
  const handleAddToCart = (part: Part) => {
    addToCart(part, 1);  // Default to quantity of 1
  };
  
  const handleProcessTransaction = () => {
    // For Phase 1, show a success toast
    toast({
      title: "Transaction processed",
      description: `Processed sale for ${getCartItemCount()} items.`,
    });
    
    // Clear the cart
    // In future phases, this would actually update inventory and create transaction records
    setTimeout(() => {
      // Give the user a moment to see the success message
      setCartOpen(false);
    }, 1500);
    
    // Refresh catalog to reflect inventory changes (simulated for now)
    setTimeout(() => {
      refreshCatalog();
    }, 2000);
  };
  
  // Calculate low stock items for dashboard
  const lowStockCount = parts.filter(part => 
    part.quantity > 0 && part.quantity <= (part.reorder_level || 10)
  ).length;
  
  // Calculate out of stock items for dashboard
  const outOfStockCount = parts.filter(part => part.quantity <= 0).length;

  // Handle adding a sample part for testing
  const handleAddSamplePart = async () => {
    await addSamplePart();
  };
  
  // Handle direct inventory check
  const handleCheckInventory = async () => {
    await testDirectFetch();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parts Desk</h1>
          <p className="text-muted-foreground">
            Manage inventory and process customer parts orders
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleCheckInventory}
            className="sm:self-end"
          >
            <Database className="mr-2 h-4 w-4" />
            Check Inventory
          </Button>

          <Button 
            variant="outline"
            onClick={handleAddSamplePart}
            className="sm:self-end"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Sample Part
          </Button>

          <Button 
            onClick={() => setCartOpen(true)} 
            variant={getCartItemCount() > 0 ? "default" : "outline"}
            className="sm:self-end"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Sale Cart
            {getCartItemCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getCartItemCount()}
              </Badge>
            )}
          </Button>
        </div>
      </div>
      
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Parts</CardTitle>
            <CardDescription>Currently in inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{parts.length}</p>
          </CardContent>
        </Card>
        
        <Card className={lowStockCount > 0 ? "border-yellow-300" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Low Stock</CardTitle>
            <CardDescription>Items that need reordering</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${lowStockCount > 0 ? "text-yellow-600" : ""}`}>
              {lowStockCount}
            </p>
          </CardContent>
        </Card>
        
        <Card className={outOfStockCount > 0 ? "border-red-300" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Out of Stock</CardTitle>
            <CardDescription>Items with zero inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${outOfStockCount > 0 ? "text-red-600" : ""}`}>
              {outOfStockCount}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <PartsSearchFilters
        searchFilters={searchFilters}
        setSearchFilters={setSearchFilters}
        categories={categories}
        suppliers={suppliers}
      />
      
      <PartsCatalogGrid
        parts={parts}
        isLoading={isLoading}
        onAddToCart={handleAddToCart}
        onViewDetails={handleViewDetails}
        showInventory={true}  // Show stock levels for shop staff
      />
      
      <PartDetailDialog
        partId={selectedPartId}
        onClose={handleCloseDetails}
        onAddToCart={handleAddToCartFromDialog}
      />
      
      <PartsCart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleProcessTransaction}
      />
    </div>
  );
};

export default ShopParts;

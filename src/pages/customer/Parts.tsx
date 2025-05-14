
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package } from 'lucide-react';
import { PartsSearchFilters } from '@/components/shared/parts/PartsSearchFilters';
import { PartsCatalogGrid } from '@/components/shared/parts/PartsCatalogGrid';
import { PartDetailDialog } from '@/components/shared/parts/PartDetailDialog';
import { PartsCart } from '@/components/shared/parts/PartsCart';
import { usePartsCatalog } from '@/hooks/parts/usePartsCatalog';
import { usePartsCart } from '@/contexts/parts/PartsCartContext';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Part } from '@/types/parts';

const CustomerParts = () => {
  const navigate = useNavigate();
  const { 
    parts, 
    isLoading, 
    searchFilters, 
    setSearchFilters,
    getCategories,
    getSuppliers
  } = usePartsCatalog();
  
  const { 
    addToCart, 
    getCartItemCount 
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
  
  const handleCheckout = () => {
    // For Phase 1, navigate to a placeholder page
    navigate('/customer/checkout');
    // In future phases, this would be properly implemented
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parts Catalog</h1>
          <p className="text-muted-foreground">
            Browse our inventory of truck and automotive parts
          </p>
        </div>
        
        <Button 
          onClick={() => setCartOpen(true)} 
          variant="outline"
          className="sm:self-end"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Cart
          {getCartItemCount() > 0 && (
            <Badge variant="secondary" className="ml-2">
              {getCartItemCount()}
            </Badge>
          )}
        </Button>
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
        showInventory={false}  // Don't show stock levels for customers
      />
      
      <PartDetailDialog
        partId={selectedPartId}
        onClose={handleCloseDetails}
        onAddToCart={handleAddToCartFromDialog}
      />
      
      <PartsCart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckout}
      />
    </div>
  );
};

export default CustomerParts;

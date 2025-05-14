
import { useState } from 'react';
import { PartsSearchFilters } from '@/components/shared/parts/PartsSearchFilters';
import { PartsCatalogGrid } from '@/components/shared/parts/PartsCatalogGrid';
import { PartDetailDialog } from '@/components/shared/parts/PartDetailDialog';
import { PartsCart } from '@/components/shared/parts/PartsCart';
import { usePartsCatalog } from '@/hooks/parts/usePartsCatalog';
import { usePartsCart } from '@/contexts/parts/PartsCartContext';
import { useToast } from '@/hooks/use-toast';
import { Part } from '@/types/parts';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CustomerParts = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Parts catalog state
  const {
    parts,
    isLoading,
    searchFilters,
    setSearchFilters,
    getCategories,
    getSuppliers
  } = usePartsCatalog();
  
  // Parts cart state
  const {
    addToCart,
    getCartItemCount
  } = usePartsCart();
  
  // Local component state
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  
  // Load category and supplier filters
  useState(() => {
    const loadFilters = async () => {
      const categoriesList = await getCategories();
      const suppliersList = await getSuppliers();
      
      setCategories(categoriesList as string[]);
      setSuppliers(suppliersList as string[]);
    };
    
    loadFilters();
  });
  
  const handleViewDetails = (partId: string) => {
    setSelectedPartId(partId);
  };
  
  const handleCloseDetails = () => {
    setSelectedPartId(null);
  };
  
  const handleAddToCart = (part: Part) => {
    addToCart(part, 1); // Default to quantity of 1
    toast({
      title: "Added to cart",
      description: `${part.name} has been added to your cart.`,
    });
  };
  
  const handleAddToCartFromDialog = (part: Part, quantity: number) => {
    addToCart(part, quantity);
    toast({
      title: "Added to cart",
      description: `${part.name} has been added to your cart.`,
    });
  };
  
  const handleProceedToCheckout = () => {
    navigate('/customer/checkout');
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parts Catalog</h1>
          <p className="text-muted-foreground">
            Browse and order parts for your vehicle
          </p>
        </div>
        
        {getCartItemCount() > 0 && (
          <Button 
            variant="outline" 
            className="relative self-end sm:self-auto"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Cart
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {getCartItemCount()}
            </span>
          </Button>
        )}
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
        showInventory={false} // Don't show stock levels for customers
      />
      
      <PartDetailDialog
        partId={selectedPartId}
        onClose={handleCloseDetails}
        onAddToCart={handleAddToCartFromDialog}
      />
      
      <PartsCart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleProceedToCheckout}
      />
    </div>
  );
};

export default CustomerParts;


import { useState, useEffect } from 'react';
import { usePartsCatalog } from '@/hooks/parts/usePartsCatalog';
import { usePartsCart } from '@/contexts/parts/PartsCartContext';
import { useToast } from '@/hooks/use-toast';
import { Part } from '@/types/parts';

export const usePartsPage = () => {
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

  // Handle adding a sample part for testing
  const handleAddSamplePart = async () => {
    await addSamplePart();
  };
  
  // Handle direct inventory check
  const handleCheckInventory = async () => {
    await testDirectFetch();
  };

  return {
    parts,
    isLoading,
    searchFilters,
    setSearchFilters,
    categories,
    suppliers,
    selectedPartId,
    cartOpen,
    setCartOpen,
    getCartItemCount,
    handleViewDetails,
    handleCloseDetails,
    handleAddToCart,
    handleAddToCartFromDialog,
    handleProcessTransaction,
    handleAddSamplePart,
    handleCheckInventory
  };
};

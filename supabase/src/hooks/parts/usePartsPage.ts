
import { useEffect } from 'react';
import { useCatalogViewer } from '@/hooks/parts/useCatalogViewer';
import { useCartOperations } from '@/hooks/parts/useCartOperations';
import { useQuotationHandler } from '@/hooks/parts/useQuotationHandler';
import { useCoreReturnHandler } from '@/hooks/parts/useCoreReturnHandler';
import { useSpecialOrderHandler } from '@/hooks/parts/useSpecialOrderHandler';
import { useToast } from '@/hooks/use-toast';

export const usePartsPage = () => {
  const { toast } = useToast();
  
  // Use our more focused hooks
  const catalog = useCatalogViewer();
  const cart = useCartOperations();
  const quotation = useQuotationHandler();
  const coreReturn = useCoreReturnHandler();
  const specialOrder = useSpecialOrderHandler();
  
  useEffect(() => {
    // Load filter options and special orders when component mounts
    catalog.loadFilterOptions();
    specialOrder.fetchSpecialOrders();
    
    // Force initial catalog refresh
    catalog.refreshCatalog();
    
    // Log some debug information
    console.log('usePartsPage hook initialized', {
      searchFilters: catalog.searchFilters,
      isLoading: catalog.isLoading,
      partsCount: catalog.parts.length
    });
    
    toast({
      title: "Parts Catalog",
      description: "Loading available parts and inventory...",
    });
  }, []);
  
  return {
    // Catalog functionality
    parts: catalog.parts,
    isLoading: catalog.isLoading,
    searchFilters: catalog.searchFilters,
    setSearchFilters: catalog.setSearchFilters,
    categories: catalog.categories,
    suppliers: catalog.suppliers,
    selectedPartId: catalog.selectedPartId,
    handleViewDetails: catalog.handleViewDetails,
    handleCloseDetails: catalog.handleCloseDetails,
    handleQuickPartSelect: catalog.handleQuickPartSelect,
    handleAddSamplePart: catalog.handleAddSamplePart,
    handleCheckInventory: catalog.handleCheckInventory,
    refreshCatalog: catalog.refreshCatalog,
    
    // Cart functionality
    cartOpen: cart.cartOpen,
    setCartOpen: cart.setCartOpen,
    getCartItemCount: cart.getCartItemCount,
    handleAddToCart: cart.handleAddToCart,
    handleAddToCartFromDialog: cart.handleAddToCartFromDialog,
    handleProcessTransaction: cart.handleProcessTransaction,
    
    // Quotation functionality
    quotationItems: quotation.quotationItems,
    isQuotationDialogOpen: quotation.isQuotationDialogOpen,
    setQuotationDialogOpen: quotation.setQuotationDialogOpen,
    handleAddToQuotation: quotation.handleAddToQuotation,
    handleAddToQuotationFromDialog: quotation.handleAddToQuotationFromDialog,
    removeFromQuotation: quotation.removeFromQuotation,
    getQuotationItemCount: quotation.getQuotationItemCount,
    getQuotationTotal: quotation.getQuotationTotal,
    
    // Core returns functionality
    selectedPartForCoreReturn: coreReturn.selectedPartForCoreReturn,
    isCoreReturnDialogOpen: coreReturn.isCoreReturnDialogOpen,
    setCoreReturnDialogOpen: coreReturn.setCoreReturnDialogOpen,
    handleOpenCoreReturnDialog: coreReturn.handleOpenCoreReturnDialog,
    handleProcessCoreReturn: coreReturn.handleProcessCoreReturn,
    
    // Special orders functionality
    specialOrders: specialOrder.specialOrders
  };
};

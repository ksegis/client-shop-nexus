
import { PartsSearchFilters } from '@/components/shared/parts/PartsSearchFilters';
import { PartsCatalogGrid } from '@/components/shared/parts/PartsCatalogGrid';
import { PartDetailDialog } from '@/components/shared/parts/PartDetailDialog';
import { PartsCart } from '@/components/shared/parts/PartsCart';
import { PartsHeader } from '@/components/shop/parts/PartsHeader';
import { PartsInventorySummary } from '@/components/shop/parts/PartsInventorySummary';
import { SpecialOrdersTracker } from '@/components/shop/parts/SpecialOrdersTracker';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Part } from '@/types/parts';
import { useCatalogViewer } from '@/hooks/parts/useCatalogViewer';
import { useCartOperations } from '@/hooks/parts/useCartOperations';
import { useQuotationHandler } from '@/hooks/parts/useQuotationHandler';
import { useCoreReturnHandler } from '@/hooks/parts/useCoreReturnHandler';
import { useSpecialOrderHandler } from '@/hooks/parts/useSpecialOrderHandler';

const ShopParts = () => {
  // Use our focused hooks directly instead of going through usePartsPage
  const catalog = useCatalogViewer();
  const cart = useCartOperations();
  const quotation = useQuotationHandler();
  const coreReturn = useCoreReturnHandler();
  const specialOrder = useSpecialOrderHandler();
  
  const [showDemo, setShowDemo] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Check if we have any parts, if not, show the demo alert after a delay
  useEffect(() => {
    if (!catalog.isLoading && catalog.parts.length === 0) {
      const timer = setTimeout(() => setShowDemo(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [catalog.isLoading, catalog.parts]);
  
  // Load filter options and special orders when component mounts
  useEffect(() => {
    catalog.loadFilterOptions();
    specialOrder.fetchSpecialOrders();
    
    // Log some debug information
    console.log('ShopParts component mounted', {
      searchFilters: catalog.searchFilters,
      isLoading: catalog.isLoading,
      partsCount: catalog.parts.length
    });
  }, []);
  
  // Create a wrapper function to handle the type mismatch
  // This converts from the boolean parameter to the Part parameter
  const handleCoreReturnOpenChange = (open: boolean) => {
    if (open && coreReturn.selectedPartForCoreReturn) {
      // If opening the dialog, we use the currently selected part
      coreReturn.handleOpenCoreReturnDialog(coreReturn.selectedPartForCoreReturn);
    } else if (!open) {
      // If closing, we just update the dialog state
      coreReturn.setCoreReturnDialogOpen(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <PartsHeader 
        getCartItemCount={cart.getCartItemCount}
        getQuotationItemCount={quotation.getQuotationItemCount}
        setCartOpen={cart.setCartOpen}
        quotationItems={quotation.quotationItems}
        onRemoveQuotationItem={quotation.removeFromQuotation}
        setQuotationOpen={quotation.setQuotationDialogOpen}
        onCheckInventory={catalog.handleCheckInventory}
        onAddSamplePart={catalog.handleAddSamplePart}
        onSelectPart={catalog.handleQuickPartSelect}
        selectedPartForCoreReturn={coreReturn.selectedPartForCoreReturn}
        isCoreReturnOpen={coreReturn.isCoreReturnDialogOpen}
        setCoreReturnOpen={handleCoreReturnOpenChange}
        onProcessCoreReturn={coreReturn.handleProcessCoreReturn}
      />
      
      {showDemo && catalog.parts.length === 0 && !catalog.isLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Demo Mode</AlertTitle>
          <AlertDescription>
            No parts found in your inventory. Click "Add Sample Part" to add some demo data and see how the Parts Desk works.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="catalog" className="space-y-6">
        <TabsList>
          <TabsTrigger value="catalog">Parts Catalog</TabsTrigger>
          <TabsTrigger value="special-orders">Special Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="catalog" className="space-y-6">
          {catalog.parts.length > 0 && <PartsInventorySummary parts={catalog.parts} />}
          
          <PartsSearchFilters
            searchFilters={catalog.searchFilters}
            setSearchFilters={catalog.setSearchFilters}
            categories={catalog.categories}
            suppliers={catalog.suppliers}
          />
          
          <PartsCatalogGrid
            parts={catalog.parts}
            isLoading={catalog.isLoading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onAddToCart={cart.handleAddToCart}
            onAddToQuotation={quotation.handleAddToQuotation}
            onViewDetails={catalog.handleViewDetails}
            onOpenCoreReturn={coreReturn.handleOpenCoreReturnDialog}
            showInventory={true}  // Show stock levels for shop staff
          />
        </TabsContent>
        
        <TabsContent value="special-orders">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Special Orders</h2>
              <p className="text-muted-foreground">
                Track parts that are not in regular inventory and have been specially ordered.
              </p>
            </div>
            
            <SpecialOrdersTracker />
          </div>
        </TabsContent>
      </Tabs>
      
      <PartDetailDialog
        partId={catalog.selectedPartId}
        onClose={catalog.handleCloseDetails}
        onAddToCart={cart.handleAddToCartFromDialog}
        onAddToQuotation={quotation.handleAddToQuotationFromDialog}
      />
      
      <PartsCart
        isOpen={cart.cartOpen}
        onClose={() => cart.setCartOpen(false)}
        onCheckout={cart.handleProcessTransaction}
      />
    </div>
  );
}

export default ShopParts;

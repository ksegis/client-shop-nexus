import { PartsSearchFilters } from '@/components/shared/parts/PartsSearchFilters';
import { PartsCatalogGrid } from '@/components/shared/parts/PartsCatalogGrid';
import { PartDetailDialog } from '@/components/shared/parts/PartDetailDialog';
import { PartsCart } from '@/components/shared/parts/PartsCart';
import { PartsHeader } from '@/components/shop/parts/PartsHeader';
import { PartsInventorySummary } from '@/components/shop/parts/PartsInventorySummary';
import { SpecialOrdersTracker } from '@/components/shop/parts/SpecialOrdersTracker';
import { usePartsPage } from '@/hooks/parts/usePartsPage';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Part } from '@/types/parts';

const ShopParts = () => {
  const {
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
    handleCheckInventory,
    handleQuickPartSelect,
    
    // Quotation functionality
    quotationItems,
    isQuotationDialogOpen,
    setQuotationDialogOpen,
    handleAddToQuotation,
    removeFromQuotation,
    getQuotationItemCount,
    
    // Core returns functionality
    selectedPartForCoreReturn,
    isCoreReturnDialogOpen,
    setCoreReturnDialogOpen,
    handleOpenCoreReturnDialog,
    handleProcessCoreReturn
  } = usePartsPage();
  
  const [showDemo, setShowDemo] = useState(false);

  // Check if we have any parts, if not, show the demo alert after a delay
  useEffect(() => {
    if (!isLoading && parts.length === 0) {
      const timer = setTimeout(() => setShowDemo(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, parts]);
  
  return (
    <div className="space-y-6">
      <PartsHeader 
        getCartItemCount={getCartItemCount}
        getQuotationItemCount={getQuotationItemCount}
        setCartOpen={setCartOpen}
        quotationItems={quotationItems}
        onRemoveQuotationItem={removeFromQuotation}
        setQuotationOpen={setQuotationDialogOpen}
        onCheckInventory={handleCheckInventory}
        onAddSamplePart={handleAddSamplePart}
        onSelectPart={handleQuickPartSelect}
        selectedPartForCoreReturn={selectedPartForCoreReturn}
        isCoreReturnOpen={isCoreReturnDialogOpen}
        setCoreReturnOpen={(part: Part) => {
          // Properly handle the part parameter by calling the correct function
          handleOpenCoreReturnDialog(part);
        }}
        onProcessCoreReturn={handleProcessCoreReturn}
      />
      
      {showDemo && parts.length === 0 && !isLoading && (
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
          {parts.length > 0 && <PartsInventorySummary parts={parts} />}
          
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
            onAddToQuotation={handleAddToQuotation}
            onViewDetails={handleViewDetails}
            onOpenCoreReturn={handleOpenCoreReturnDialog}
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
        partId={selectedPartId}
        onClose={handleCloseDetails}
        onAddToCart={handleAddToCartFromDialog}
        onAddToQuotation={handleAddToQuotation}
      />
      
      <PartsCart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleProcessTransaction}
      />
    </div>
  );
}

export default ShopParts;

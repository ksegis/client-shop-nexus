import { PartsSearchFilters } from '@/components/shared/parts/PartsSearchFilters';
import { PartsCatalogGrid } from '@/components/shared/parts/PartsCatalogGrid';
import { PartDetailDialog } from '@/components/shared/parts/detail';
import { PartsCart } from '@/components/shared/parts/PartsCart';
import { PartsHeader } from '@/components/shop/parts/PartsHeader';
import { PartsInventorySummary } from '@/components/shop/parts/PartsInventorySummary';
import { SpecialOrdersTracker } from '@/components/shop/parts/SpecialOrdersTracker';
import { QuantityDialog } from '@/components/shared/parts/QuantityDialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Part } from '@/types/parts';

// Import hooks at the top level
import { useCatalogViewer } from '@/hooks/parts/useCatalogViewer';
import { useCartOperations } from '@/hooks/parts/useCartOperations';
import { useQuotationHandler } from '@/hooks/parts/useQuotationHandler';
import { useCoreReturnHandler } from '@/hooks/parts/useCoreReturnHandler';
import { useSpecialOrderHandler } from '@/hooks/parts/useSpecialOrderHandler';

const ShopParts = () => {
  // Initialize all hooks at the top level (React requirement)
  const catalog = useCatalogViewer();
  const cart = useCartOperations();
  const quotation = useQuotationHandler();
  const coreReturn = useCoreReturnHandler();
  const specialOrder = useSpecialOrderHandler();

  // Component state
  const [showDemo, setShowDemo] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [componentError, setComponentError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize data loading
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('Initializing Parts component...');
        
        // Load filter options and special orders
        if (catalog?.loadFilterOptions) {
          await catalog.loadFilterOptions();
        }
        
        if (specialOrder?.fetchSpecialOrders) {
          await specialOrder.fetchSpecialOrders();
        }
        
        console.log('Parts component initialized successfully');
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing Parts component:', error);
        setComponentError(`Failed to initialize: ${error?.message || 'Unknown error'}`);
        setIsInitialized(true); // Still set to true to show the error state
      }
    };

    initializeData();
  }, []);

  // Show demo alert if no parts after loading
  useEffect(() => {
    if (!isInitialized || !catalog) return;
    
    if (!catalog.isLoading && catalog.parts?.length === 0) {
      const timer = setTimeout(() => setShowDemo(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowDemo(false);
    }
  }, [catalog?.isLoading, catalog?.parts, isInitialized]);

  // Loading state
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Initializing Parts System...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (componentError) {
    return (
      <div className="space-y-6 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Parts System Error</AlertTitle>
          <AlertDescription>{componentError}</AlertDescription>
        </Alert>
        <div className="text-center">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="space-y-6">
      {/* Header */}
      <PartsHeader 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={() => {
          console.log('Refreshing catalog...');
          catalog?.refreshCatalog?.();
        }}
      />

      {/* Demo Alert */}
      {showDemo && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Demo Mode</AlertTitle>
          <AlertDescription>
            No parts found in catalog. This appears to be a demo environment. 
            You can add sample parts to test the functionality.
            <button 
              onClick={() => catalog?.addSamplePart?.()}
              className="ml-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded"
            >
              Add Sample Part
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Search & Filters */}
        <div className="lg:col-span-1">
          <PartsSearchFilters
            filters={catalog?.searchFilters || {}}
            onFiltersChange={(filters) => {
              console.log('Filters changed:', filters);
              catalog?.setSearchFilters?.(filters);
            }}
            categories={catalog?.getCategories?.() || []}
            suppliers={catalog?.getSuppliers?.() || []}
            isLoading={catalog?.isLoading || false}
          />
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inventory Summary */}
          <PartsInventorySummary />

          {/* Parts Catalog */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Parts Catalog</h3>
              <div className="text-sm text-muted-foreground">
                {catalog?.parts?.length || 0} parts found
              </div>
            </div>
            
            <PartsCatalogGrid
              parts={catalog?.parts || []}
              isLoading={catalog?.isLoading || false}
              viewMode={viewMode}
              onPartSelect={(part) => {
                console.log('Part selected:', part);
                // Part detail dialog will handle this
              }}
              onAddToCart={(part, quantity = 1) => {
                console.log('Adding to cart:', part, quantity);
                cart?.addToCart?.(part, quantity);
              }}
            />
          </div>

          {/* Special Orders Tracker */}
          <SpecialOrdersTracker
            orders={specialOrder?.orders || []}
            isLoading={specialOrder?.isLoading || false}
            onCreateOrder={(orderData) => {
              console.log('Creating special order:', orderData);
              specialOrder?.createOrder?.(orderData);
            }}
            onUpdateOrder={(orderId, updates) => {
              console.log('Updating special order:', orderId, updates);
              specialOrder?.updateOrder?.(orderId, updates);
            }}
          />
        </div>

        {/* Right Sidebar - Cart */}
        <div className="lg:col-span-1">
          <PartsCart
            items={cart?.items || []}
            onUpdateQuantity={(itemId, quantity) => {
              console.log('Updating cart quantity:', itemId, quantity);
              cart?.updateQuantity?.(itemId, quantity);
            }}
            onRemoveItem={(itemId) => {
              console.log('Removing cart item:', itemId);
              cart?.removeItem?.(itemId);
            }}
            onClearCart={() => {
              console.log('Clearing cart');
              cart?.clearCart?.();
            }}
            onCheckout={() => {
              console.log('Proceeding to checkout');
              cart?.checkout?.();
            }}
            onCreateQuote={() => {
              console.log('Creating quote from cart');
              quotation?.createQuote?.(cart?.items || []);
            }}
            isLoading={cart?.isLoading || false}
          />
        </div>
      </div>

      {/* Dialogs */}
      <PartDetailDialog />
      <QuantityDialog />
    </div>
  );
};

export default ShopParts;


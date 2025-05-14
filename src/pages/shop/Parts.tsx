
import { PartsSearchFilters } from '@/components/shared/parts/PartsSearchFilters';
import { PartsCatalogGrid } from '@/components/shared/parts/PartsCatalogGrid';
import { PartDetailDialog } from '@/components/shared/parts/PartDetailDialog';
import { PartsCart } from '@/components/shared/parts/PartsCart';
import { PartsHeader } from '@/components/shop/parts/PartsHeader';
import { InventoryStatsCards } from '@/components/shop/parts/InventoryStatsCards';
import { usePartsPage } from '@/hooks/parts/usePartsPage';

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
    handleCheckInventory
  } = usePartsPage();
  
  return (
    <div className="space-y-6">
      <PartsHeader 
        getCartItemCount={getCartItemCount}
        setCartOpen={setCartOpen}
        onCheckInventory={handleCheckInventory}
        onAddSamplePart={handleAddSamplePart}
      />
      
      <InventoryStatsCards parts={parts} />
      
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

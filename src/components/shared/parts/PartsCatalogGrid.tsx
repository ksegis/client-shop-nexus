
import { useState, useEffect } from 'react';
import { Part } from '@/types/parts';
import { toast } from '@/hooks/use-toast';
import { LoadingPartsGrid } from './grid/LoadingPartsGrid';
import { EmptyPartsGrid } from './grid/EmptyPartsGrid';
import { PartsGrid } from './grid/PartsGrid';
import { PartsGridHeader } from './grid/PartsGridHeader';
import { CatalogPagination } from './grid/CatalogPagination';
import { PartsTable } from './grid/PartsTable';
import { ViewModeToggle } from './grid/ViewModeToggle';

interface PartsCatalogGridProps {
  parts: Part[];
  isLoading: boolean;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  onAddToCart?: (part: Part) => void;
  onAddToQuotation?: (part: Part) => void;
  onViewDetails: (partId: string) => void;
  onOpenCoreReturn?: (part: Part) => void;
  showInventory?: boolean;
  hideSupplier?: boolean;
  hideSku?: boolean;
}

export const PartsCatalogGrid = ({
  parts,
  isLoading,
  viewMode = 'grid',
  onViewModeChange,
  onAddToCart,
  onAddToQuotation,
  onViewDetails,
  onOpenCoreReturn,
  showInventory = false,
  hideSupplier = false,
  hideSku = false
}: PartsCatalogGridProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  
  // Debug useEffect to log when this component renders
  useEffect(() => {
    console.log('PartsCatalogGrid rendered', { parts, isLoading, viewMode });
  }, [parts, isLoading, viewMode]);
  
  const totalPages = Math.ceil(parts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const visibleParts = parts.slice(startIndex, startIndex + pageSize);
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };
  
  const handleAddToCart = (part: Part) => {
    if (onAddToCart) {
      onAddToCart(part);
      toast({
        title: "Part added to cart",
        description: `${part.name} has been added to your cart.`,
      });
    }
  };

  const handleAddToQuotation = (part: Part) => {
    if (onAddToQuotation) {
      onAddToQuotation(part);
      toast({
        title: "Part added to quotation",
        description: `${part.name} has been added to your quotation.`,
      });
    }
  };

  const handleOpenCoreReturn = (part: Part) => {
    if (onOpenCoreReturn) {
      onOpenCoreReturn(part);
    }
  };
  
  if (isLoading) {
    return <LoadingPartsGrid />;
  }
  
  if (parts.length === 0) {
    return <EmptyPartsGrid />;
  }
  
  return (
    <div className="space-y-6">
      <PartsGridHeader
        totalItems={parts.length}
        startIndex={startIndex}
        endIndex={endIndex}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
      />
      
      <div className="flex justify-end mb-4">
        <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>
      
      {viewMode === 'grid' ? (
        <PartsGrid
          parts={visibleParts}
          onAddToCart={onAddToCart ? handleAddToCart : undefined}
          onAddToQuotation={onAddToQuotation ? handleAddToQuotation : undefined}
          onOpenCoreReturn={onOpenCoreReturn ? handleOpenCoreReturn : undefined}
          onViewDetails={onViewDetails}
          showInventory={showInventory}
          hideSupplier={hideSupplier}
          hideSku={hideSku}
        />
      ) : (
        <PartsTable
          parts={visibleParts}
          onAddToCart={onAddToCart ? handleAddToCart : undefined}
          onAddToQuotation={onAddToQuotation ? handleAddToQuotation : undefined}
          onOpenCoreReturn={onOpenCoreReturn ? handleOpenCoreReturn : undefined}
          onViewDetails={onViewDetails}
          showInventory={showInventory}
          hideSupplier={hideSupplier}
          hideSku={hideSku}
        />
      )}
      
      <CatalogPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

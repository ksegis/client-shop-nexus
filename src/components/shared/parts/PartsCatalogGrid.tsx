
import { useState } from 'react';
import { Part } from '@/types/parts';
import { useToast } from '@/hooks/use-toast';
import { LoadingPartsGrid } from './grid/LoadingPartsGrid';
import { EmptyPartsGrid } from './grid/EmptyPartsGrid';
import { PartsGrid } from './grid/PartsGrid';
import { PartsGridHeader } from './grid/PartsGridHeader';
import { CatalogPagination } from './grid/CatalogPagination';

interface PartsCatalogGridProps {
  parts: Part[];
  isLoading: boolean;
  onAddToCart?: (part: Part) => void;
  onViewDetails: (partId: string) => void;
  showInventory?: boolean;
}

export const PartsCatalogGrid = ({
  parts,
  isLoading,
  onAddToCart,
  onViewDetails,
  showInventory = false
}: PartsCatalogGridProps) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  
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
      
      <PartsGrid
        parts={visibleParts}
        onAddToCart={onAddToCart ? handleAddToCart : undefined}
        onViewDetails={onViewDetails}
        showInventory={showInventory}
      />
      
      <CatalogPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

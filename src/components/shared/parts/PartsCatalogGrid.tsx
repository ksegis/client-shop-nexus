
import { useState } from 'react';
import { Part } from '@/types/parts';
import { PartCard } from './PartCard';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

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
  const visibleParts = parts.slice(startIndex, startIndex + pageSize);
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
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
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-md"></div>
        ))}
      </div>
    );
  }
  
  if (parts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-muted-foreground">
          No parts found matching your criteria.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(startIndex + pageSize, parts.length)} of {parts.length} parts
        </p>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="pageSize" className="text-sm">Show</Label>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[70px]" id="pageSize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="48">48</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {visibleParts.map(part => (
          <PartCard
            key={part.id}
            part={part}
            onAddToCart={onAddToCart ? handleAddToCart : undefined}
            onViewDetails={onViewDetails}
            showInventory={showInventory}
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

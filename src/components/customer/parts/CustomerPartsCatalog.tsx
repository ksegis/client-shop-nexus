
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { PartsCatalogGrid } from '@/components/shared/parts/PartsCatalogGrid';
import { Part } from '@/types/parts';

interface CustomerPartsCatalogProps {
  parts: Part[];
  isLoading: boolean;
  activeCategory: string;
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
  onAddToCart: (part: Part) => void;
  onViewDetails: (partId: string) => void;
}

export const CustomerPartsCatalog = ({
  parts,
  isLoading,
  activeCategory,
  viewMode,
  setViewMode,
  onAddToCart,
  onViewDetails
}: CustomerPartsCatalogProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {activeCategory}
          <span className="text-gray-500 text-sm ml-2">
            ({parts.length} items)
          </span>
        </h2>
        
        <div className="flex items-center gap-2">
          <Select defaultValue="relevance">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A-Z</SelectItem>
            </SelectContent>
          </Select>
          
          <Button size="icon" variant="outline">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <PartsCatalogGrid
        parts={parts}
        isLoading={isLoading}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddToCart={onAddToCart}
        onViewDetails={onViewDetails}
        showInventory={true}
        hideSupplier={true}
        hideSku={true}
      />
    </div>
  );
};

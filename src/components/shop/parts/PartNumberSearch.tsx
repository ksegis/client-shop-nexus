
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePartNumberSearch } from '@/hooks/usePartNumberSearch';
import { InventorySearchPopover } from '@/components/shop/shared/InventorySearchPopover';
import { InventoryItem } from '@/pages/shop/inventory/types';

interface PartNumberSearchProps {
  onSelectPart: (part: InventoryItem) => void;
}

export const PartNumberSearch = ({ onSelectPart }: PartNumberSearchProps) => {
  const { 
    partSearchTerm, 
    setPartSearchTerm, 
    partSearchResults, 
    isSearching 
  } = usePartNumberSearch();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  const handleSearchClick = () => {
    if (partSearchTerm.trim().length >= 2) {
      setIsPopoverOpen(true);
    }
  };
  
  const handlePartSelect = (item: InventoryItem) => {
    onSelectPart(item);
    setIsPopoverOpen(false);
    setPartSearchTerm('');
  };
  
  const handleSearchChange = (value: string) => {
    setPartSearchTerm(value);
    if (value.length >= 2) {
      setIsPopoverOpen(true);
    } else {
      setIsPopoverOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full max-w-sm">
      <InventorySearchPopover
        isOpen={isPopoverOpen}
        onClose={() => setIsPopoverOpen(false)}
        results={partSearchResults}
        onSelect={handlePartSelect}
        searchTerm={partSearchTerm}
        onSearchChange={handleSearchChange}
      >
        <div className="flex gap-2 w-full">
          <Input
            placeholder="Search by part number..."
            value={partSearchTerm}
            onChange={(e) => setPartSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleSearchClick}
            disabled={isSearching || partSearchTerm.length < 2}
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
      </InventorySearchPopover>
    </div>
  );
};

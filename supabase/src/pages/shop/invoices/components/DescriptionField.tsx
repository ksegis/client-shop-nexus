
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { InventorySearchPopover } from '@/components/shop/shared/InventorySearchPopover';
import { InventoryItem } from '@/pages/shop/inventory/types';
import { useInventorySearch } from '@/hooks/useInventorySearch';
import { cn } from '@/lib/utils';

interface DescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSelectItem: (item: InventoryItem) => void;
}

export const DescriptionField = ({ 
  value, 
  onChange, 
  onSelectItem 
}: DescriptionFieldProps) => {
  const { searchTerm, setSearchTerm, searchResults, searchInventory } = useInventorySearch();
  const [showItemResults, setShowItemResults] = useState(false);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSearchTerm(newValue);
  };

  const handleFocusDescription = () => {
    setShowItemResults(true);
    if (value) {
      setSearchTerm(value);
      searchInventory(value);
    }
  };

  const handleCloseSearch = () => {
    setShowItemResults(false);
  };

  return (
    <InventorySearchPopover
      isOpen={showItemResults}
      onClose={handleCloseSearch}
      results={searchResults}
      onSelect={onSelectItem}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
    >
      <Input 
        value={value} 
        onChange={handleDescriptionChange}
        onClick={handleFocusDescription}
        placeholder="Description"
        className={cn(
          "w-full cursor-text",
          "border border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      />
    </InventorySearchPopover>
  );
};

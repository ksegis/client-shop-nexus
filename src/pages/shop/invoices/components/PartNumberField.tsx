
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { InventorySearchPopover } from '@/components/shop/shared/InventorySearchPopover';
import { InventoryItem } from '@/pages/shop/inventory/types';
import { usePartNumberSearch } from '@/hooks/usePartNumberSearch';
import { cn } from '@/lib/utils';

interface PartNumberFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSelectItem: (item: InventoryItem) => void;
}

export const PartNumberField = ({ 
  value, 
  onChange, 
  onSelectItem 
}: PartNumberFieldProps) => {
  const { partSearchTerm, setPartSearchTerm, partSearchResults } = usePartNumberSearch();
  const [showPartResults, setShowPartResults] = useState(false);

  const handlePartNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setPartSearchTerm(newValue);
  };

  const handleFocusPartNumber = () => {
    setShowPartResults(true);
    if (value) {
      setPartSearchTerm(value);
    }
  };

  const handleClosePartSearch = () => {
    setShowPartResults(false);
  };

  return (
    <InventorySearchPopover
      isOpen={showPartResults}
      onClose={handleClosePartSearch}
      results={partSearchResults}
      onSelect={onSelectItem}
      searchTerm={partSearchTerm}
      onSearchChange={setPartSearchTerm}
    >
      <Input 
        value={value || ''} 
        onChange={handlePartNumberChange}
        onClick={handleFocusPartNumber}
        placeholder="Part #"
        className={cn(
          "w-full cursor-text",
          "border border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      />
    </InventorySearchPopover>
  );
};

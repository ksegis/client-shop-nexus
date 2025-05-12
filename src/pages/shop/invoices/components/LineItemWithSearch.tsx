
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InventorySearchPopover } from '@/components/shop/shared/InventorySearchPopover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventorySearch } from '@/hooks/useInventorySearch';
import { InvoiceLineItem } from '../types';
import { Trash } from 'lucide-react';

interface LineItemWithSearchProps {
  item: InvoiceLineItem;
  index: number;
  vendors: { name: string }[];
  onUpdate: (index: number, field: keyof InvoiceLineItem, value: any) => void;
  onRemove: (index: number) => void;
}

export const LineItemWithSearch = ({ 
  item, 
  index, 
  vendors, 
  onUpdate, 
  onRemove 
}: LineItemWithSearchProps) => {
  const { searchTerm, setSearchTerm, searchResults, searchInventory } = useInventorySearch();
  const [showItemResults, setShowItemResults] = useState(false);

  // Handle inventory search as user types
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchInventory(searchTerm);
        setShowItemResults(true);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchInventory]);

  const handleSelectInventoryItem = (item: any) => {
    onUpdate(index, 'part_number', item.sku || '');
    onUpdate(index, 'description', item.name);
    onUpdate(index, 'price', item.price || 0);
    onUpdate(index, 'vendor', item.supplier || '');
    setShowItemResults(false);
  };

  const handleCloseSearch = () => {
    setShowItemResults(false);
    setSearchTerm('');
  };

  return (
    <div className="grid grid-cols-12 gap-2 p-3 border-t">
      {/* Part Number */}
      <div className="col-span-2">
        <Input 
          value={item.part_number || ''} 
          onChange={(e) => onUpdate(index, 'part_number', e.target.value)}
          placeholder="Part #"
        />
      </div>
      
      {/* Description with search */}
      <div className="col-span-4 relative">
        <InventorySearchPopover
          isOpen={showItemResults}
          onClose={handleCloseSearch}
          results={searchResults}
          onSelect={handleSelectInventoryItem}
          searchTerm={searchTerm}
        >
          <Input 
            value={item.description} 
            onChange={(e) => {
              onUpdate(index, 'description', e.target.value);
              setSearchTerm(e.target.value);
            }}
            placeholder="Description"
            className="w-full"
          />
        </InventorySearchPopover>
      </div>

      {/* Quantity */}
      <div className="col-span-1">
        <Input 
          type="number" 
          min="1" 
          value={item.quantity} 
          onChange={(e) => onUpdate(index, 'quantity', Number(e.target.value))}
        />
      </div>

      {/* Price */}
      <div className="col-span-2">
        <Input 
          type="number" 
          step="0.01" 
          min="0" 
          value={item.price} 
          onChange={(e) => onUpdate(index, 'price', Number(e.target.value))}
        />
      </div>

      {/* Vendor */}
      <div className="col-span-2">
        <Select
          value={item.vendor || ''}
          onValueChange={(value) => onUpdate(index, 'vendor', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select vendor" />
          </SelectTrigger>
          <SelectContent>
            {vendors.map((vendor, i) => (
              <SelectItem key={i} value={vendor.name || ''}>
                {vendor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Remove button */}
      <div className="col-span-1 flex items-center justify-end">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => onRemove(index)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

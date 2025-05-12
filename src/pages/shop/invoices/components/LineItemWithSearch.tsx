
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
  const [description, setDescription] = useState(item.description);

  // Sync description with parent component
  useEffect(() => {
    setDescription(item.description);
  }, [item.description]);

  // Handle inventory search as user types
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchInventory(searchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchInventory]);

  const handleSelectInventoryItem = (inventoryItem: any) => {
    console.log("Selected inventory item:", inventoryItem);
    
    // Ensure all fields are properly updated with inventory item data
    const partNumber = inventoryItem.sku || '';
    const itemDescription = inventoryItem.name || '';
    const price = parseFloat(inventoryItem.price) || 0;
    const vendor = inventoryItem.supplier || '';
    
    // Update all fields
    onUpdate(index, 'part_number', partNumber);
    onUpdate(index, 'description', itemDescription);
    onUpdate(index, 'price', price);
    onUpdate(index, 'vendor', vendor);
    
    // Update local state
    setDescription(itemDescription);
    
    // Close search and reset search term
    setShowItemResults(false);
    setSearchTerm('');
  };

  const handleCloseSearch = () => {
    setShowItemResults(false);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDescription(value);
    onUpdate(index, 'description', value);
    setSearchTerm(value);
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
      <div className="col-span-4">
        <InventorySearchPopover
          isOpen={showItemResults}
          onClose={handleCloseSearch}
          results={searchResults}
          onSelect={handleSelectInventoryItem}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        >
          <Input 
            value={description} 
            onChange={handleDescriptionChange}
            onClick={() => setShowItemResults(true)}
            placeholder="Description"
            className="w-full cursor-text"
          />
        </InventorySearchPopover>
      </div>

      {/* Quantity - with proper width */}
      <div className="col-span-1.5">
        <Input 
          type="number" 
          min="1" 
          value={item.quantity} 
          onChange={(e) => onUpdate(index, 'quantity', Number(e.target.value))}
        />
      </div>

      {/* Price - with proper width */}
      <div className="col-span-1.5">
        <Input 
          type="text" 
          inputMode="decimal"
          value={item.price} 
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, '');
            onUpdate(index, 'price', value === '' ? 0 : parseFloat(value));
          }}
          placeholder="0.00"
          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      {/* Vendor - increased column width */}
      <div className="col-span-2.5">
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

      {/* Remove button - decreased width */}
      <div className="col-span-0.5 flex items-center justify-end">
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

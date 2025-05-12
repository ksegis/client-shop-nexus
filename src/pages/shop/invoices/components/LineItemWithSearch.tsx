import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InventorySearchPopover } from '@/components/shop/shared/InventorySearchPopover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventorySearch } from '@/hooks/useInventorySearch';
import { InvoiceLineItem } from '../types';
import { Trash } from 'lucide-react';
import { InventoryItem } from '@/pages/shop/inventory/types';
import { supabase } from '@/integrations/supabase/client';

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
  const [partSearchTerm, setPartSearchTerm] = useState('');
  const [showPartResults, setShowPartResults] = useState(false);
  const [partSearchResults, setPartSearchResults] = useState<InventoryItem[]>([]);

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

  // Handle part number search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (partSearchTerm && partSearchTerm.length >= 2) {
        searchInventoryByPart(partSearchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [partSearchTerm]);

  const searchInventoryByPart = async (term: string) => {
    if (!term || term.length < 2) {
      setPartSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .or(`sku.ilike.%${term}%,part_number.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      setPartSearchResults(data as InventoryItem[]);
    } catch (error) {
      console.error('Error searching inventory by part number:', error);
      setPartSearchResults([]);
    }
  };

  const handleSelectInventoryItem = (inventoryItem: InventoryItem) => {
    console.log("Selected inventory item:", inventoryItem);
    
    // Extract values with proper type safety and detailed logging
    const partNumber = inventoryItem.sku || '';
    const itemDescription = inventoryItem.name || '';
    const price = typeof inventoryItem.price === 'number' ? inventoryItem.price : 0;
    const vendor = inventoryItem.supplier || '';
    
    console.log("Updating line item with values:", {
      partNumber,
      itemDescription,
      price,
      vendor
    });
    
    // Update all fields with explicit field names
    onUpdate(index, 'part_number', partNumber);
    onUpdate(index, 'description', itemDescription);
    onUpdate(index, 'price', price);
    if (vendor) {
      onUpdate(index, 'vendor', vendor);
    }
    
    // Update local state
    setDescription(itemDescription);
    
    // Close search and reset search term
    setShowItemResults(false);
    setShowPartResults(false);
    setSearchTerm('');
    setPartSearchTerm('');
  };

  const handleCloseSearch = () => {
    setShowItemResults(false);
  };

  const handleClosePartSearch = () => {
    setShowPartResults(false);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDescription(value);
    onUpdate(index, 'description', value);
    setSearchTerm(value);
  };

  const handlePartNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onUpdate(index, 'part_number', value);
    setPartSearchTerm(value);
  };

  const handleFocusDescription = () => {
    setShowItemResults(true);
    if (description) {
      setSearchTerm(description);
      searchInventory(description);
    }
  };

  const handleFocusPartNumber = () => {
    setShowPartResults(true);
    if (item.part_number) {
      setPartSearchTerm(item.part_number);
      searchInventoryByPart(item.part_number);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-2 p-3 border-t">
      {/* Part Number with search */}
      <div className="col-span-2">
        <InventorySearchPopover
          isOpen={showPartResults}
          onClose={handleClosePartSearch}
          results={partSearchResults}
          onSelect={handleSelectInventoryItem}
          searchTerm={partSearchTerm}
          onSearchChange={setPartSearchTerm}
        >
          <Input 
            value={item.part_number || ''} 
            onChange={handlePartNumberChange}
            onClick={handleFocusPartNumber}
            placeholder="Part #"
            className="w-full cursor-text"
          />
        </InventorySearchPopover>
      </div>
      
      {/* Description with search */}
      <div className="col-span-3">
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
            onClick={handleFocusDescription}
            placeholder="Description"
            className="w-full cursor-text"
          />
        </InventorySearchPopover>
      </div>

      {/* Quantity - increased width */}
      <div className="col-span-2">
        <Input 
          type="number" 
          min="1" 
          value={item.quantity} 
          onChange={(e) => onUpdate(index, 'quantity', Number(e.target.value))}
        />
      </div>

      {/* Price - increased width */}
      <div className="col-span-2">
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

      {/* Vendor - maintained width */}
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

      {/* Remove button - maintained small width */}
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


import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InvoiceLineItem } from '../types';
import { Trash } from 'lucide-react';
import { InventoryItem } from '@/pages/shop/inventory/types';
import { PartNumberField } from './PartNumberField';
import { DescriptionField } from './DescriptionField';
import { updateLineItemFromInventoryItem } from '../utils/inventoryItemHelpers';

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
  const [description, setDescription] = useState(item.description);

  // Sync description with parent component
  useEffect(() => {
    setDescription(item.description);
  }, [item.description]);

  const handleSelectInventoryItem = (inventoryItem: InventoryItem) => {
    console.log("Selected inventory item:", inventoryItem);
    
    const updatedLineItem = updateLineItemFromInventoryItem(item, inventoryItem);
    
    // Update all fields with explicit field names
    onUpdate(index, 'part_number', updatedLineItem.part_number);
    onUpdate(index, 'description', updatedLineItem.description);
    onUpdate(index, 'price', updatedLineItem.price);
    if (updatedLineItem.vendor) {
      onUpdate(index, 'vendor', updatedLineItem.vendor);
    }
    
    // Update local state
    setDescription(updatedLineItem.description);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    onUpdate(index, 'description', value);
  };

  const handlePartNumberChange = (value: string) => {
    onUpdate(index, 'part_number', value);
  };

  return (
    <div className="grid grid-cols-12 gap-2 p-3 border-t">
      {/* Part Number with search */}
      <div className="col-span-2">
        <PartNumberField
          value={item.part_number || ''}
          onChange={handlePartNumberChange}
          onSelectItem={handleSelectInventoryItem}
        />
      </div>
      
      {/* Description with search */}
      <div className="col-span-3">
        <DescriptionField
          value={description}
          onChange={handleDescriptionChange}
          onSelectItem={handleSelectInventoryItem}
        />
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

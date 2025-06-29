import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { LineItemWithSearch } from './LineItemWithSearch';
import { InvoiceLineItem } from '../types';

interface LineItemsSectionProps {
  lineItems: InvoiceLineItem[];
  setLineItems: (items: InvoiceLineItem[]) => void;
  vendors: { name: string }[];
  onAddItem?: () => void;
  onUpdateItem?: (index: number, field: keyof InvoiceLineItem, value: any) => void;
  onRemoveItem?: (index: number) => void;
}

export const LineItemsSection = ({ 
  lineItems, 
  setLineItems, 
  vendors,
  onAddItem,
  onUpdateItem,
  onRemoveItem
}: LineItemsSectionProps) => {
  
  const addLineItem = () => {
    if (onAddItem) {
      onAddItem();
    } else {
      setLineItems([
        ...lineItems,
        { description: "", quantity: 1, price: 0, part_number: "", vendor: "" }
      ]);
    }
  };

  const removeLineItem = (index: number) => {
    if (onRemoveItem) {
      onRemoveItem(index);
    } else {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    if (onUpdateItem) {
      onUpdateItem(index, field as keyof InvoiceLineItem, value);
    } else {
      const updatedItems = [...lineItems];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      setLineItems(updatedItems);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Line Items</h3>
        <Button 
          type="button" 
          onClick={addLineItem}
          size="sm" 
          className="h-8"
        >
          <Plus className="mr-1 h-4 w-4" /> Add Item
        </Button>
      </div>
      
      {lineItems.length > 0 ? (
        <div className="border rounded-md">
          <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 font-medium text-sm">
            <div className="col-span-4">Description</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Part #</div>
            <div className="col-span-1">Vendor</div>
            <div className="col-span-1"></div>
          </div>
          
          <div className="divide-y">
            {lineItems.map((item, index) => (
              <div key={index} className="p-3">
                <LineItemWithSearch
                  item={item}
                  index={index}
                  vendors={vendors}
                  onUpdate={updateLineItem}
                  onRemove={removeLineItem}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          No items added. Click "Add Item" to add items to this invoice.
        </div>
      )}
    </div>
  );
};


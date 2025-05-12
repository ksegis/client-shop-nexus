
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { LineItemWithSearch } from './LineItemWithSearch';
import { InvoiceLineItem } from '../types';

interface LineItemsSectionProps {
  lineItems: InvoiceLineItem[];
  setLineItems: (items: InvoiceLineItem[]) => void;
  vendors: { name: string }[];
}

export const LineItemsSection = ({ 
  lineItems, 
  setLineItems, 
  vendors 
}: LineItemsSectionProps) => {
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, price: 0, part_number: "", vendor: "" }
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setLineItems(updatedItems);
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
            <div className="col-span-2">Part #</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-1.5">Qty</div>
            <div className="col-span-1.5">Price</div>
            <div className="col-span-2.5">Vendor</div>
            <div className="col-span-0.5"></div>
          </div>
          
          {lineItems.map((item, index) => (
            <LineItemWithSearch
              key={index}
              item={item}
              index={index}
              vendors={vendors}
              onUpdate={updateLineItem}
              onRemove={removeLineItem}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          No items added. Click "Add Item" to add items to this invoice.
        </div>
      )}
    </div>
  );
};

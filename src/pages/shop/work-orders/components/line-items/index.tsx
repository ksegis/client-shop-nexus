import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WorkOrderLineItem } from '../../types';

interface LineItemsProps {
  items: WorkOrderLineItem[];
  onChange: (items: WorkOrderLineItem[]) => void;
  readOnly?: boolean;
}

export const LineItems = ({ items, onChange, readOnly = false }: LineItemsProps) => {
  // EXACT COPY of EstimateDialog state management
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [showItemResults, setShowItemResults] = useState(false);

  // Fetch vendors for dropdown
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data } = await supabase
        .from('inventory')
        .select('supplier')
        .not('supplier', 'is', null);
      
      // Get unique suppliers
      const uniqueSuppliers = [...new Set(data?.map(item => item.supplier))];
      return uniqueSuppliers.map(supplier => ({ name: supplier })) || [];
    },
  });

  // EXACT COPY of EstimateDialog inventory query
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory', itemSearchTerm],
    queryFn: async () => {
      if (!itemSearchTerm || itemSearchTerm.length < 2) return [];
      
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .or(`name.ilike.%${itemSearchTerm}%,description.ilike.%${itemSearchTerm}%,sku.ilike.%${itemSearchTerm}%`);
      
      return data || [];
    },
    enabled: itemSearchTerm.length >= 2,
  });

  // EXACT COPY of EstimateDialog functions
  const handleItemSearch = (value: string, index: number) => {
    setItemSearchTerm(value);
    setSelectedItemIndex(index);
    setShowItemResults(true);
  };

  const handleSelectInventoryItem = (item: any) => {
    console.log('=== SELECTING INVENTORY ITEM (WORK ORDER) ===');
    console.log('Selected item:', item);
    console.log('Selected index:', selectedItemIndex);
    
    if (selectedItemIndex !== null) {
      const updatedItems = [...items];
      updatedItems[selectedItemIndex] = {
        ...updatedItems[selectedItemIndex],
        part_number: item.sku || '',
        description: item.name,
        price: item.price || 0,
        vendor: item.supplier || ''
      };
      console.log('Updated items:', updatedItems);
      onChange(updatedItems);
      setShowItemResults(false);
      setItemSearchTerm("");
    }
    console.log('=== SELECTION COMPLETE ===');
  };

  const addLineItem = () => {
    console.log('Adding new line item');
    const tempId = `temp-${Date.now()}`;
    const newItem: WorkOrderLineItem = {
      id: tempId,
      work_order_id: '',
      description: "",
      quantity: 1,
      price: 0,
      part_number: "",
      vendor: ""
    };
    onChange([...items, newItem]);
  };

  const removeLineItem = (index: number) => {
    console.log('Removing line item at index:', index);
    const updatedItems = items.filter((_, i) => i !== index);
    onChange(updatedItems);
  };

  const updateLineItem = (index: number, field: keyof WorkOrderLineItem, value: any) => {
    console.log(`Updating line item ${index}, field ${field}, value:`, value);
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    onChange(updatedItems);
  };

  const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <div className="space-y-4">
      {/* REMOVED: Duplicate "Line Items" heading - it's already in WorkOrderForm */}
      <div className="flex justify-end items-center">
        {!readOnly && (
          <Button 
            type="button" 
            onClick={addLineItem}
            size="sm" 
            className="h-8"
          >
            <Plus className="mr-1 h-4 w-4" /> Add Item
          </Button>
        )}
      </div>
      
      {items.length > 0 ? (
        <div className="border rounded-md">
          <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 font-medium text-sm">
            <div className="col-span-2">Part #</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Vendor</div>
            {!readOnly && <div className="col-span-1"></div>}
          </div>
          
          {items.map((item, index) => (
            <div key={item.id || index} className="grid grid-cols-12 gap-2 p-3 border-t">
              {/* Part Number - EXACT COPY */}
              <div className="col-span-2">
                <Input 
                  value={item.part_number || ''} 
                  onChange={(e) => updateLineItem(index, 'part_number', e.target.value)}
                  placeholder="Part #"
                  readOnly={readOnly}
                />
              </div>
              
              {/* Description with search - EXACT COPY */}
              <div className="col-span-4 relative">
                <Popover open={showItemResults && selectedItemIndex === index}>
                  <PopoverTrigger asChild>
                    <div>
                      <Input 
                        value={item.description} 
                        onChange={(e) => {
                          updateLineItem(index, 'description', e.target.value);
                          if (!readOnly) {
                            handleItemSearch(e.target.value, index);
                          }
                        }}
                        placeholder="Description"
                        className="w-full"
                        readOnly={readOnly}
                      />
                    </div>
                  </PopoverTrigger>
                  {!readOnly && (
                    <PopoverContent className="w-96 p-0 max-h-[200px] overflow-y-auto">
                      {inventoryItems.length > 0 ? (
                        <div className="py-2">
                          {inventoryItems.map((invItem) => (
                            <div 
                              key={invItem.id} 
                              className="px-4 py-2 hover:bg-accent cursor-pointer"
                              onClick={() => handleSelectInventoryItem(invItem)}
                            >
                              <div className="font-medium">{invItem.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {invItem.sku && `SKU: ${invItem.sku}`}
                                {invItem.supplier && ` • Vendor: ${invItem.supplier}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No matching items found
                        </div>
                      )}
                    </PopoverContent>
                  )}
                </Popover>
              </div>

              {/* Quantity - EXACT COPY */}
              <div className="col-span-1">
                <Input 
                  type="number" 
                  min="1" 
                  value={item.quantity} 
                  onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                  readOnly={readOnly}
                />
              </div>

              {/* Price - EXACT COPY */}
              <div className="col-span-2">
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  value={item.price} 
                  onChange={(e) => updateLineItem(index, 'price', Number(e.target.value))}
                  readOnly={readOnly}
                />
              </div>

              {/* Vendor - EXACT COPY */}
              <div className="col-span-2">
                <Select
                  value={item.vendor || ''}
                  onValueChange={(value) => updateLineItem(index, 'vendor', value)}
                  disabled={readOnly}
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

              {/* Remove button - EXACT COPY */}
              {!readOnly && (
                <div className="col-span-1 flex items-center justify-end">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => removeLineItem(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          {/* Total */}
          <div className="p-3 border-t bg-muted/30">
            <div className="text-right">
              <span className="text-lg font-medium">
                Subtotal: ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          No items added. {!readOnly && "Click \"Add Item\" to add items to this work order."}
        </div>
      )}
    </div>
  );
};


import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Search, Trash2 } from 'lucide-react';
import { WorkOrderLineItem } from '../../types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LineItemsProps {
  items: WorkOrderLineItem[];
  onChange: (items: WorkOrderLineItem[]) => void;
  readOnly?: boolean;
}

export const LineItems = ({ items, onChange, readOnly = false }: LineItemsProps) => {
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [showItemResults, setShowItemResults] = useState(false);

  // Fetch inventory items for search
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory', itemSearchTerm],
    queryFn: async () => {
      if (itemSearchTerm.length < 2) return [];
      
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .or(`name.ilike.%${itemSearchTerm}%,sku.ilike.%${itemSearchTerm}%`)
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: itemSearchTerm.length >= 2,
  });

  // Fetch vendors for dropdown
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('supplier')
        .not('supplier', 'is', null)
        .neq('supplier', '');
      
      if (error) throw error;
      
      // Extract unique suppliers
      const uniqueSuppliers = [...new Set(data?.map(item => item.supplier))];
      return uniqueSuppliers.map(supplier => ({ name: supplier }));
    },
  });

  const addLineItem = () => {
    const newItem: WorkOrderLineItem = {
      id: `temp-${Date.now()}`,
      work_order_id: '',
      description: '',
      quantity: 1,
      price: 0,
      part_number: '',
      vendor: ''
    };
    onChange([...items, newItem]);
  };

  const removeLineItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const updateLineItem = (index: number, field: keyof WorkOrderLineItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const handleItemSearch = (searchTerm: string, index: number) => {
    setItemSearchTerm(searchTerm);
    setSelectedItemIndex(index);
    setShowItemResults(searchTerm.length >= 2);
  };

  const handleSelectInventoryItem = (item: any) => {
    if (selectedItemIndex !== null) {
      const updatedItems = [...items];
      updatedItems[selectedItemIndex] = {
        ...updatedItems[selectedItemIndex],
        part_number: item.sku || '',
        description: item.name,
        price: item.price || 0,
        vendor: item.supplier || ''
      };
      onChange(updatedItems);
      setShowItemResults(false);
      setItemSearchTerm("");
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Line Items</h3>
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
          <div className="grid grid-cols-12 gap-3 p-3 bg-muted/50 font-medium text-sm">
            <div className="col-span-2">Part #</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Vendor</div>
            {!readOnly && <div className="col-span-1"></div>}
          </div>
          
          {items.map((item, index) => (
            <div key={item.id || index} className="grid grid-cols-12 gap-3 p-3 border-t">
              {/* Part Number */}
              <div className="col-span-2">
                <Input 
                  value={item.part_number || ''} 
                  onChange={(e) => updateLineItem(index, 'part_number', e.target.value)}
                  placeholder="Part #"
                  readOnly={readOnly}
                />
              </div>
              
              {/* Description with Search */}
              <div className="col-span-4">
                <Popover open={showItemResults && selectedItemIndex === index} onOpenChange={setShowItemResults}>
                  <div className="relative">
                    <Input 
                      value={item.description} 
                      onChange={(e) => {
                        updateLineItem(index, 'description', e.target.value);
                        handleItemSearch(e.target.value, index);
                      }}
                      placeholder="Description"
                      readOnly={readOnly}
                    />
                    {!readOnly && (
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => handleItemSearch(item.description, index)}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                    )}
                  </div>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="max-h-60 overflow-auto">
                      {inventoryItems.length > 0 ? (
                        inventoryItems.map((inventoryItem) => (
                          <div
                            key={inventoryItem.id}
                            className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                            onClick={() => handleSelectInventoryItem(inventoryItem)}
                          >
                            <div className="font-medium">{inventoryItem.name}</div>
                            <div className="text-sm text-muted-foreground">
                              SKU: {inventoryItem.sku} | Price: ${inventoryItem.price} | Supplier: {inventoryItem.supplier}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-muted-foreground">
                          {itemSearchTerm.length < 2 ? 'Type 2+ characters to search' : 'No items found'}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Quantity */}
              <div className="col-span-1">
                <Input 
                  type="number" 
                  value={item.quantity} 
                  onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                  placeholder="Qty"
                  min="0"
                  readOnly={readOnly}
                />
              </div>
              
              {/* Price */}
              <div className="col-span-2">
                <Input 
                  type="number" 
                  value={item.price} 
                  onChange={(e) => updateLineItem(index, 'price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  readOnly={readOnly}
                />
              </div>
              
              {/* Vendor */}
              <div className="col-span-2">
                <Select 
                  value={item.vendor || ''} 
                  onValueChange={(value) => updateLineItem(index, 'vendor', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.name} value={vendor.name}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Remove Button */}
              {!readOnly && (
                <div className="col-span-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeLineItem(index)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          No items added. Click "Add Item" to add items to this work order.
        </div>
      )}

      {/* Subtotal */}
      {items.length > 0 && (
        <div className="flex justify-end">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Subtotal</div>
            <div className="text-lg font-semibold">${calculateSubtotal().toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add the missing default export to fix the build error
export default LineItems;


import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SimpleLineItem } from './SimpleLineItem';
import { supabase } from '@/integrations/supabase/client';

interface LineItem {
  description: string;
  quantity: number;
  price: number;
  part_number: string;
  vendor: string;
}

interface SimpleLineItemsSectionProps {
  initialItems?: LineItem[];
  onItemsChange: (items: LineItem[]) => void;
}

export function SimpleLineItemsSection({ initialItems = [], onItemsChange }: SimpleLineItemsSectionProps) {
  const [items, setItems] = useState<LineItem[]>(initialItems);
  const [vendors, setVendors] = useState<string[]>([]);

  // Fetch vendors from database
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('supplier')
          .not('supplier', 'is', null)
          .neq('supplier', '');

        if (error) throw error;

        const uniqueVendors = [...new Set(data.map(item => item.supplier))];
        setVendors(uniqueVendors);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        setVendors(['OEM Parts', 'Aftermarket', 'Local Supplier']);
      }
    };

    fetchVendors();
  }, []);

  // Initialize items
  useEffect(() => {
    if (initialItems.length > 0) {
      setItems(initialItems);
    }
  }, [initialItems]);

  // Notify parent when items change
  useEffect(() => {
    onItemsChange(items);
  }, [items, onItemsChange]);

  const addItem = () => {
    const newItem: LineItem = {
      description: '',
      quantity: 1,
      price: 0,
      part_number: '',
      vendor: ''
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, updatedItem: LineItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Line Items</h3>
        <Button onClick={addItem} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Add Item
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="border rounded-md p-4">
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 mb-4 font-medium text-sm text-gray-600">
            <div className="col-span-2">Part #</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Vendor</div>
            <div className="col-span-1"></div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <SimpleLineItem
                key={index}
                item={item}
                index={index}
                onChange={updateItem}
                onRemove={removeItem}
                vendors={vendors}
              />
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t">
            <div className="text-right">
              <span className="text-lg font-medium">
                Total: ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center text-gray-500">
          No items added. Click "Add Item" to get started.
        </div>
      )}
    </div>
  );
}


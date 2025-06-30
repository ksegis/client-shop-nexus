import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LineItem {
  description: string;
  quantity: number;
  price: number;
  part_number: string;
  vendor: string;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  price: number;
}

interface LineItemRowProps {
  item: LineItem;
  index: number;
  onUpdate: (index: number, field: keyof LineItem, value: any) => void;
  onRemove: (index: number) => void;
  vendors: string[];
}

function LineItemRow({ item, index, onUpdate, onRemove, vendors }: LineItemRowProps) {
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // The local state and useEffect for synchronization have been removed.
  // The component now relies directly on the 'item' prop from the parent.

  const updateField = (field: keyof LineItem, value: any) => {
    console.log(`Updating field ${field} to:`, value);
    // This directly notifies the parent, which will update its state and re-render this row.
    onUpdate(index, field, value);
  };

  const searchInventory = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching for:', query);
      const { data, error } = await supabase
        .from('inventory')
        .select('id, name, sku, price')
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      
      console.log('Search results:', data);
      setSearchResults(data || []);
      setShowDropdown(data && data.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  const selectItem = (inventoryItem: InventoryItem) => {
    console.log('=== SELECTING INVENTORY ITEM ===');
    console.log('Selected item:', inventoryItem);
    
    // Notify the parent of all changes at once.
    // The parent's state update will trigger a re-render with the new props.
    onUpdate(index, 'description', inventoryItem.name);
    onUpdate(index, 'price', inventoryItem.price);
    onUpdate(index, 'part_number', inventoryItem.sku);
    
    // Clear search
    setSearchResults([]);
    setShowDropdown(false);
    
    console.log('=== SELECTION COMPLETE ===');
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateField('description', value);
    
    // Search after typing
    setTimeout(() => {
      searchInventory(value);
    }, 300);
  };

  return (
    <div className="grid grid-cols-12 gap-3 items-start border-b pb-3">
      {/* Part Number */}
      <div className="col-span-2">
        <Input
          placeholder="Part #"
          value={item.part_number} // Bind directly to the prop
          onChange={(e) => updateField('part_number', e.target.value)}
        />
      </div>

      {/* Description with Search */}
      <div className="col-span-4 relative">
        <div className="relative">
          <Input
            placeholder="Search or enter description"
            value={item.description} // Bind directly to the prop
            onChange={handleDescriptionChange}
            className="pr-8"
          />
          <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="p-2 text-center text-sm text-gray-500">Searching...</div>
            ) : (
              <div className="p-1">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer rounded text-sm"
                    onClick={() => selectItem(result)}
                  >
                    <div className="font-medium">{result.name}</div>
                    <div className="text-xs text-gray-500">
                      SKU: {result.sku} | ${result.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quantity */}
      <div className="col-span-1">
        <Input
          type="number"
          placeholder="Qty"
          min="1"
          value={item.quantity} // Bind directly to the prop
          onChange={(e) => updateField('quantity', parseInt(e.target.value) || 1)}
        />
      </div>

      {/* Price */}
      <div className="col-span-2">
        <Input
          type="number"
          placeholder="Price"
          step="0.01"
          min="0"
          value={item.price} // Bind directly to the prop
          onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Vendor */}
      <div className="col-span-2">
        <Select value={item.vendor} onValueChange={(value) => updateField('vendor', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Vendor" />
          </SelectTrigger>
          <SelectContent>
            {vendors.map((vendor) => (
              <SelectItem key={vendor} value={vendor}>
                {vendor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Delete */}
      <div className="col-span-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onRemove(index)}
          className="h-10 w-10 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface LineItemsSectionProps {
  lineItems: LineItem[];
  setLineItems: (items: LineItem[]) => void;
  vendors: { name: string }[];
  onAddItem?: () => void;
  onUpdateItem?: (index: number, field: keyof LineItem, value: any) => void;
  onRemoveItem?: (index: number) => void;
}

// === FIX: Add the 'export' keyword here to make it a named export ===
export const LineItemsSection = ({ 
  lineItems, 
  setLineItems, 
  vendors,
  onAddItem,
  onUpdateItem,
  onRemoveItem
}: LineItemsSectionProps) => {
  const [items, setItems] = useState<LineItem[]>(lineItems);
  const [vendorNames, setVendorNames] = useState<string[]>([]);

  // Convert vendors prop to string array
  useEffect(() => {
    const names = vendors.map(v => v.name);
    setVendorNames(names);
  }, [vendors]);

  // Keep items in sync with props
  useEffect(() => {
    setItems(lineItems);
  }, [lineItems]);

  // Notify parent when items change
  useEffect(() => {
    setLineItems(items);
  }, [items, setLineItems]);

  const addItem = () => {
    const newItem: LineItem = {
      description: '',
      quantity: 1,
      price: 0,
      part_number: '',
      vendor: ''
    };
    console.log('Adding new item');
    const newItems = [...items, newItem];
    setItems(newItems);
    
    if (onAddItem) {
      onAddItem();
    }
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    console.log(`Updating item ${index}, field ${field}, value:`, value);
    
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    
    if (onUpdateItem) {
      onUpdateItem(index, field, value);
    }
  };

  const removeItem = (index: number) => {
    console.log(`Removing item at index ${index}`);
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    
    if (onRemoveItem) {
      onRemoveItem(index);
    }
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
              <LineItemRow
                key={index}
                item={item}
                index={index}
                onUpdate={updateItem}
                onRemove={removeItem}
                vendors={vendorNames}
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
};
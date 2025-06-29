import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceLineItem } from '../types';
import { CoreIndicatorBadge } from '@/pages/shop/inventory/components/CoreIndicatorBadge';

interface LineItemWithSearchProps {
  item: InvoiceLineItem;
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  vendors: {name: string}[];
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  core_charge: number | null;
}

export function LineItemWithSearch({ item, index, onUpdate, onRemove, vendors }: LineItemWithSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [showSearchPopover, setShowSearchPopover] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchInventory();
      setShowSearchPopover(true);
    } else {
      setSearchResults([]);
      setShowSearchPopover(false);
    }
  }, [searchQuery]);

  const searchInventory = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, name, sku, price, core_charge')
        .or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching inventory:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectInventoryItem = (inventoryItem: InventoryItem) => {
    setSelectedInventoryItem(inventoryItem);
    onUpdate(index, 'description', inventoryItem.name);
    onUpdate(index, 'price', inventoryItem.price);
    onUpdate(index, 'part_number', inventoryItem.sku || '');
    onUpdate(index, 'core_charge', inventoryItem.core_charge || 0);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchPopover(false);
  };

  const handleDescriptionChange = (value: string) => {
    setSearchQuery(value);
    onUpdate(index, 'description', value);
  };

  const handleSearchIconClick = () => {
    if (item.description && item.description.length > 2) {
      setSearchQuery(item.description);
      searchInventory();
      setShowSearchPopover(true);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-start">
      <div className="col-span-4">
        <Popover open={showSearchPopover} onOpenChange={setShowSearchPopover}>
          <div className="relative">
            <Input
              placeholder="Search or enter description"
              value={item.description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="pr-8"
            />
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-gray-100"
                onClick={handleSearchIconClick}
              >
                <Search className="h-4 w-4 text-gray-400" />
              </Button>
            </PopoverTrigger>
          </div>
          
          <PopoverContent className="w-80 p-2" align="start">
            {isSearching ? (
              <div className="p-2 text-center text-sm text-gray-500">
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer rounded flex justify-between items-center"
                    onClick={() => selectInventoryItem(result)}
                  >
                    <div>
                      <div className="font-medium">{result.name}</div>
                      <div className="text-sm text-gray-500">
                        SKU: {result.sku} | ${result.price.toFixed(2)}
                      </div>
                    </div>
                    {result.core_charge && result.core_charge > 0 && (
                      <CoreIndicatorBadge coreCharge={result.core_charge} />
                    )}
                  </div>
                ))}
              </div>
            ) : searchQuery.length > 2 ? (
              <div className="p-2 text-center text-sm text-gray-500">
                No items found for "{searchQuery}"
              </div>
            ) : (
              <div className="p-2 text-center text-sm text-gray-500">
                Type 3+ characters to search inventory
              </div>
            )}
          </PopoverContent>
        </Popover>
        
        {selectedInventoryItem && selectedInventoryItem.core_charge && selectedInventoryItem.core_charge > 0 && (
          <div className="mt-1">
            <CoreIndicatorBadge coreCharge={selectedInventoryItem.core_charge} />
          </div>
        )}
      </div>

      <div className="col-span-2">
        <Input
          type="number"
          placeholder="Qty"
          min="1"
          value={item.quantity}
          onChange={(e) => onUpdate(index, 'quantity', parseInt(e.target.value) || 1)}
        />
      </div>

      <div className="col-span-2">
        <Input
          type="number"
          placeholder="Price"
          step="0.01"
          min="0"
          value={item.price}
          onChange={(e) => onUpdate(index, 'price', parseFloat(e.target.value) || 0)}
        />
      </div>

      <div className="col-span-2">
        <Input
          placeholder="Part #"
          value={item.part_number || ''}
          onChange={(e) => onUpdate(index, 'part_number', e.target.value)}
        />
      </div>

      <div className="col-span-1">
        <Select 
          value={item.vendor || ''} 
          onValueChange={(value) => onUpdate(index, 'vendor', value)}
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


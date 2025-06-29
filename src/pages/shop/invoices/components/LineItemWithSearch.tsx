import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceLineItem } from '../types';

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
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchInventory();
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  const searchInventory = async () => {
    setIsSearching(true);
    try {
      console.log('Searching for:', searchQuery);
      const { data, error } = await supabase
        .from('inventory')
        .select('id, name, sku, price, core_charge')
        .or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) {
        console.error('Search error:', error);
        throw error;
      }
      
      console.log('Search results:', data);
      setSearchResults(data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching inventory:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const selectInventoryItem = (inventoryItem: InventoryItem) => {
    console.log('Selecting item:', inventoryItem);
    onUpdate(index, 'description', inventoryItem.name);
    onUpdate(index, 'price', inventoryItem.price);
    onUpdate(index, 'part_number', inventoryItem.sku || '');
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleDescriptionChange = (value: string) => {
    setSearchQuery(value);
    onUpdate(index, 'description', value);
  };

  const handleSearchClick = () => {
    console.log('Search icon clicked');
    if (item.description && item.description.length > 2) {
      setSearchQuery(item.description);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-start">
      <div className="col-span-4 relative">
        <div className="relative">
          <Input
            placeholder="Search or enter description"
            value={item.description || ''}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className="pr-8"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-gray-100"
            onClick={handleSearchClick}
          >
            <Search className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
        
        {/* Simple dropdown for search results */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="p-2 text-center text-sm text-gray-500">
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1 p-1">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer rounded text-sm"
                    onClick={() => selectInventoryItem(result)}
                  >
                    <div className="font-medium">{result.name}</div>
                    <div className="text-xs text-gray-500">
                      SKU: {result.sku} | ${result.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 text-center text-sm text-gray-500">
                No items found for "{searchQuery}"
              </div>
            )}
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


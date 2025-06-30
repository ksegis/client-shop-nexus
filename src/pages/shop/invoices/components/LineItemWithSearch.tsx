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
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Force re-render when item prop changes
  const [, forceUpdate] = useState({});
  useEffect(() => {
    forceUpdate({});
  }, [item]);

  // Simple search function
  const searchInventory = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching for:', query);
      const { data, error } = await supabase
        .from('inventory')
        .select('id, name, sku, price, core_charge')
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Search error:', error);
        throw error;
      }
      
      console.log('Search results:', data);
      setSearchResults(data || []);
      setShowResults(data && data.length > 0);
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
    
    // Update all fields
    onUpdate(index, 'description', inventoryItem.name);
    onUpdate(index, 'price', inventoryItem.price);
    onUpdate(index, 'part_number', inventoryItem.sku || '');
    
    // Clear search results
    setSearchResults([]);
    setShowResults(false);
    
    // Force component to re-render with new values
    setTimeout(() => {
      forceUpdate({});
    }, 100);
  };

  // Direct onChange handlers with proper typing
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Description changed to:', value);
    onUpdate(index, 'description', value);
    
    // Trigger search after a short delay
    setTimeout(() => {
      searchInventory(value);
    }, 300);
  };

  const handlePartNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Part number changed to:', value);
    onUpdate(index, 'part_number', value);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    console.log('Quantity changed to:', value);
    onUpdate(index, 'quantity', value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    console.log('Price changed to:', value);
    onUpdate(index, 'price', value);
  };

  const handleVendorChange = (value: string) => {
    console.log('Vendor changed to:', value);
    onUpdate(index, 'vendor', value);
  };

  const handleSearchClick = () => {
    console.log('Search icon clicked, current description:', item.description);
    if (item.description) {
      searchInventory(item.description);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-3 items-start">
      {/* Part # - Column 1 */}
      <div className="col-span-2">
        <Input
          placeholder="Part #"
          value={item.part_number || ''}
          onChange={handlePartNumberChange}
        />
      </div>

      {/* Description with Search - Column 2 */}
      <div className="col-span-4 relative">
        <div className="relative">
          <Input
            placeholder="Search or enter description"
            value={item.description || ''}
            onChange={handleDescriptionChange}
            className="pr-8"
            onFocus={() => console.log('Description field focused')}
            onBlur={() => console.log('Description field blurred')}
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
        
        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
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
          </div>
        )}
        
        {isSearching && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-2">
            <div className="text-center text-sm text-gray-500">Searching...</div>
          </div>
        )}
      </div>

      {/* Quantity - Column 3 */}
      <div className="col-span-1">
        <Input
          type="number"
          placeholder="Qty"
          min="1"
          value={item.quantity || 1}
          onChange={handleQuantityChange}
        />
      </div>

      {/* Price - Column 4 */}
      <div className="col-span-2">
        <Input
          type="number"
          placeholder="Price"
          step="0.01"
          min="0"
          value={item.price || 0}
          onChange={handlePriceChange}
        />
      </div>

      {/* Vendor - Column 5 */}
      <div className="col-span-2">
        <Select 
          value={item.vendor || ''} 
          onValueChange={handleVendorChange}
        >
          <SelectTrigger className="w-full">
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

      {/* Delete Button - Column 6 */}
      <div className="col-span-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('Removing item at index:', index);
            onRemove(index);
          }}
          className="h-10 w-10 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


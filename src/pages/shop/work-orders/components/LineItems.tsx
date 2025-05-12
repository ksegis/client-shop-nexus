
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WorkOrderLineItem } from '../types';
import { Trash2, Plus, Search } from 'lucide-react';
import { InventorySearchPopover } from './InventorySearchPopover';
import { useInventorySearch } from '../hooks/useInventorySearch';

interface LineItemsProps {
  items: WorkOrderLineItem[];
  onChange: (items: WorkOrderLineItem[]) => void;
  readOnly?: boolean;
}

export const LineItems = ({ items, onChange, readOnly = false }: LineItemsProps) => {
  const [newItem, setNewItem] = useState<Partial<WorkOrderLineItem>>({
    description: '',
    quantity: 1,
    price: 0,
    part_number: '',
  });
  
  const { searchResults, searchInventory } = useInventorySearch();
  const [activeSearchField, setActiveSearchField] = useState<{
    type: 'part_number' | 'description',
    index: number | null
  } | null>(null);

  const handleAddItem = () => {
    if (!newItem.description) return;
    
    const tempId = `temp-${Date.now()}`;
    const itemToAdd = {
      ...newItem,
      id: tempId,
      work_order_id: '',
      description: newItem.description || '',
      quantity: newItem.quantity || 1,
      price: newItem.price || 0,
    } as WorkOrderLineItem;
    
    onChange([...items, itemToAdd]);
    
    setNewItem({
      description: '',
      quantity: 1,
      price: 0,
      part_number: '',
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const handleItemChange = (index: number, field: keyof WorkOrderLineItem, value: any) => {
    const newItems = [...items];
    
    if (field === 'quantity' || field === 'price') {
      newItems[index][field] = parseFloat(value) || 0;
    } else {
      (newItems[index] as any)[field] = value;
    }
    
    onChange(newItems);
  };

  const handleInventoryItemSelect = (inventoryItem: any, index: number | null) => {
    if (index === null) {
      // For new item row
      setNewItem({
        ...newItem,
        part_number: inventoryItem.sku || '',
        description: inventoryItem.name || '',
        price: inventoryItem.price || 0,
      });
    } else {
      // For existing item
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        part_number: inventoryItem.sku || '',
        description: inventoryItem.name || '',
        price: inventoryItem.price || 0,
      };
      onChange(newItems);
    }
    setActiveSearchField(null);
  };

  const calculateItemTotal = (quantity: number, price: number) => {
    return quantity * price;
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item.quantity, item.price), 0);
  };

  const handleSearchClick = (type: 'part_number' | 'description', index: number | null, searchTerm: string) => {
    searchInventory(searchTerm);
    setActiveSearchField({ type, index });
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Part #</TableHead>
            <TableHead className="w-full">Description</TableHead>
            <TableHead className="w-[100px] text-right">Quantity</TableHead>
            <TableHead className="w-[150px] text-right">Price</TableHead>
            <TableHead className="w-[120px] text-right">Total</TableHead>
            {!readOnly && <TableHead className="w-10"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={readOnly ? 5 : 6} className="text-center text-muted-foreground">
                No items added yet
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <TableRow key={item.id || index}>
                <TableCell className="py-4">
                  {readOnly ? (
                    item.part_number || '-'
                  ) : (
                    <div className="relative flex items-center">
                      <Input 
                        value={item.part_number || ''}
                        onChange={(e) => handleItemChange(index, 'part_number', e.target.value)}
                        className="h-12 text-base w-full pr-8"
                      />
                      <InventorySearchPopover
                        isOpen={activeSearchField?.type === 'part_number' && activeSearchField.index === index}
                        onClose={() => setActiveSearchField(null)}
                        results={searchResults}
                        onSelect={(item) => handleInventoryItemSelect(item, index)}
                        searchTerm={item.part_number || ''}
                      >
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => handleSearchClick('part_number', index, item.part_number || '')}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </InventorySearchPopover>
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  {readOnly ? (
                    <div className="whitespace-normal break-words">{item.description}</div>
                  ) : (
                    <div className="relative flex items-center">
                      <Input 
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="h-12 text-base w-full pr-8"
                      />
                      <InventorySearchPopover
                        isOpen={activeSearchField?.type === 'description' && activeSearchField.index === index}
                        onClose={() => setActiveSearchField(null)}
                        results={searchResults}
                        onSelect={(item) => handleInventoryItemSelect(item, index)}
                        searchTerm={item.description || ''}
                      >
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => handleSearchClick('description', index, item.description || '')}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </InventorySearchPopover>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right py-4">
                  {readOnly ? (
                    item.quantity
                  ) : (
                    <Input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="h-12 text-base text-right w-full"
                    />
                  )}
                </TableCell>
                <TableCell className="text-right py-4">
                  {readOnly ? (
                    `$${item.price.toFixed(2)}`
                  ) : (
                    <Input 
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      className="h-12 text-base text-right w-full"
                    />
                  )}
                </TableCell>
                <TableCell className="text-right font-medium py-4">
                  ${calculateItemTotal(item.quantity, item.price).toFixed(2)}
                </TableCell>
                {!readOnly && (
                  <TableCell className="py-4">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
          
          {!readOnly && (
            <TableRow>
              <TableCell className="py-4">
                <div className="relative flex items-center">
                  <Input 
                    placeholder="Part #"
                    value={newItem.part_number || ''}
                    onChange={(e) => setNewItem({...newItem, part_number: e.target.value})}
                    className="h-12 text-base w-full pr-8"
                  />
                  <InventorySearchPopover
                    isOpen={activeSearchField?.type === 'part_number' && activeSearchField.index === null}
                    onClose={() => setActiveSearchField(null)}
                    results={searchResults}
                    onSelect={(item) => handleInventoryItemSelect(item, null)}
                    searchTerm={newItem.part_number || ''}
                  >
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => handleSearchClick('part_number', null, newItem.part_number || '')}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </InventorySearchPopover>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="relative flex items-center">
                  <Input 
                    placeholder="Description"
                    value={newItem.description || ''}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    className="h-12 text-base w-full pr-8"
                  />
                  <InventorySearchPopover
                    isOpen={activeSearchField?.type === 'description' && activeSearchField.index === null}
                    onClose={() => setActiveSearchField(null)}
                    results={searchResults}
                    onSelect={(item) => handleInventoryItemSelect(item, null)}
                    searchTerm={newItem.description || ''}
                  >
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => handleSearchClick('description', null, newItem.description || '')}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </InventorySearchPopover>
                </div>
              </TableCell>
              <TableCell className="text-right py-4">
                <Input 
                  type="number"
                  placeholder="Qty"
                  value={newItem.quantity || ''}
                  onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                  className="h-12 text-base text-right w-full"
                />
              </TableCell>
              <TableCell className="text-right py-4">
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={newItem.price || ''}
                  onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                  className="h-12 text-base text-right w-full"
                />
              </TableCell>
              <TableCell className="text-right font-medium py-4">
                ${((newItem.quantity || 0) * (newItem.price || 0)).toFixed(2)}
              </TableCell>
              <TableCell className="py-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleAddItem}
                  disabled={!newItem.description}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      <div className="flex justify-end">
        <div className="w-64 bg-muted/20 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <span className="font-medium text-lg">Subtotal:</span>
            <span className="font-bold text-lg">${calculateSubtotal().toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

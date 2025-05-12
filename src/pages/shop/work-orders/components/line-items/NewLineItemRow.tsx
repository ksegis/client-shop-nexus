
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WorkOrderLineItem } from '../../types';
import { Plus, Search } from 'lucide-react';
import { InventorySearchPopover } from '../InventorySearchPopover';

interface NewLineItemRowProps {
  newItem: Partial<WorkOrderLineItem>;
  onNewItemChange: (field: keyof WorkOrderLineItem, value: any) => void;
  onAddItem: () => void;
  onSearchClick: (type: 'part_number' | 'description', index: number | null, searchTerm: string) => void;
  onInventoryItemSelect: (inventoryItem: any, index: number | null) => void;
  activeSearchField: { type: 'part_number' | 'description'; index: number | null } | null;
  searchResults: any[];
}

export const NewLineItemRow = ({
  newItem,
  onNewItemChange,
  onAddItem,
  onSearchClick,
  onInventoryItemSelect,
  activeSearchField,
  searchResults,
}: NewLineItemRowProps) => {
  const calculateItemTotal = (quantity: number, price: number) => {
    return quantity * price;
  };

  return (
    <TableRow>
      <TableCell className="py-4">
        <div className="relative flex items-center">
          <Input 
            placeholder="Part #"
            value={newItem.part_number || ''}
            onChange={(e) => onNewItemChange('part_number', e.target.value)}
            className="h-12 text-base w-full pr-8"
          />
          <InventorySearchPopover
            isOpen={activeSearchField?.type === 'part_number' && activeSearchField.index === null}
            onClose={() => onSearchClick('part_number', -1, '')}
            results={searchResults}
            onSelect={(item) => onInventoryItemSelect(item, null)}
            searchTerm={newItem.part_number || ''}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => onSearchClick('part_number', null, newItem.part_number || '')}
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
            onChange={(e) => onNewItemChange('description', e.target.value)}
            className="h-12 text-base w-full pr-8"
          />
          <InventorySearchPopover
            isOpen={activeSearchField?.type === 'description' && activeSearchField.index === null}
            onClose={() => onSearchClick('description', -1, '')}
            results={searchResults}
            onSelect={(item) => onInventoryItemSelect(item, null)}
            searchTerm={newItem.description || ''}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => onSearchClick('description', null, newItem.description || '')}
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
          onChange={(e) => onNewItemChange('quantity', parseInt(e.target.value) || 0)}
          className="h-12 text-base text-right w-full"
        />
      </TableCell>
      <TableCell className="text-right py-4">
        <Input 
          type="text"
          inputMode="decimal"
          placeholder="Price"
          value={newItem.price || ''}
          onChange={(e) => onNewItemChange('price', parseFloat(e.target.value) || 0)}
          className="h-12 text-base text-right w-full"
        />
      </TableCell>
      <TableCell className="text-right font-medium py-4">
        ${calculateItemTotal((newItem.quantity || 0), (newItem.price || 0)).toFixed(2)}
      </TableCell>
      <TableCell className="py-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onAddItem}
          disabled={!newItem.description}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </TableCell>
    </TableRow>
  );
};


import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WorkOrderLineItem } from '../../types';
import { Trash2, Search } from 'lucide-react';
import { InventorySearchPopover } from '../InventorySearchPopover';

interface LineItemRowProps {
  item: WorkOrderLineItem;
  index: number;
  readOnly?: boolean;
  onItemChange: (index: number, field: keyof WorkOrderLineItem, value: any) => void;
  onRemoveItem: (index: number) => void;
  onSearchClick: (type: 'part_number' | 'description', index: number, searchTerm: string) => void;
  onInventoryItemSelect: (inventoryItem: any, index: number) => void;
  activeSearchField: { type: 'part_number' | 'description'; index: number | null } | null;
  searchResults: any[];
}

export const LineItemRow = ({
  item,
  index,
  readOnly = false,
  onItemChange,
  onRemoveItem,
  onSearchClick,
  onInventoryItemSelect,
  activeSearchField,
  searchResults,
}: LineItemRowProps) => {
  const calculateItemTotal = (quantity: number, price: number) => {
    return quantity * price;
  };

  return (
    <TableRow>
      <TableCell className="py-4">
        {readOnly ? (
          item.part_number || '-'
        ) : (
          <div className="relative flex items-center">
            <Input 
              value={item.part_number || ''}
              onChange={(e) => onItemChange(index, 'part_number', e.target.value)}
              className="h-12 text-base w-full pr-8"
            />
            <InventorySearchPopover
              isOpen={activeSearchField?.type === 'part_number' && activeSearchField.index === index}
              onClose={() => onSearchClick('part_number', -1, '')}
              results={searchResults}
              onSelect={(item) => onInventoryItemSelect(item, index)}
              searchTerm={item.part_number || ''}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => onSearchClick('part_number', index, item.part_number || '')}
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
              onChange={(e) => onItemChange(index, 'description', e.target.value)}
              className="h-12 text-base w-full pr-8"
            />
            <InventorySearchPopover
              isOpen={activeSearchField?.type === 'description' && activeSearchField.index === index}
              onClose={() => onSearchClick('description', -1, '')}
              results={searchResults}
              onSelect={(item) => onInventoryItemSelect(item, index)}
              searchTerm={item.description || ''}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => onSearchClick('description', index, item.description || '')}
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
            onChange={(e) => onItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
            className="h-12 text-base text-right w-full"
          />
        )}
      </TableCell>
      <TableCell className="text-right py-4">
        {readOnly ? (
          `$${item.price.toFixed(2)}`
        ) : (
          <Input 
            type="text"
            inputMode="decimal"
            value={item.price}
            onChange={(e) => onItemChange(index, 'price', parseFloat(e.target.value) || 0)}
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
            onClick={() => onRemoveItem(index)}
          >
            <Trash2 className="h-5 w-5 text-destructive" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
};

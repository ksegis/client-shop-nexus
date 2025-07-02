
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WorkOrderLineItem } from '../../types';
import { LineItemRow } from './LineItemRow';
import { NewLineItemRow } from './NewLineItemRow';

interface LineItemsTableProps {
  items: WorkOrderLineItem[];
  newItem: Partial<WorkOrderLineItem>;
  readOnly?: boolean;
  onItemChange: (index: number, field: keyof WorkOrderLineItem, value: any) => void;
  onRemoveItem: (index: number) => void;
  onNewItemChange: (field: keyof WorkOrderLineItem, value: any) => void;
  onAddItem: () => void;
  onSearchClick: (type: 'part_number' | 'description', index: number | null, searchTerm: string) => void;
  onInventoryItemSelect: (inventoryItem: any, index: number | null) => void;
  activeSearchField: { type: 'part_number' | 'description'; index: number | null } | null;
  searchResults: any[];
}

export const LineItemsTable = ({
  items,
  newItem,
  readOnly = false,
  onItemChange,
  onRemoveItem,
  onNewItemChange,
  onAddItem,
  onSearchClick,
  onInventoryItemSelect,
  activeSearchField,
  searchResults,
}: LineItemsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px] min-w-[180px]">Part #</TableHead>
          <TableHead className="min-w-[150px]">Description</TableHead>
          <TableHead className="w-[100px] min-w-[100px] text-right">Quantity</TableHead>
          <TableHead className="w-[140px] min-w-[140px] text-right">Price</TableHead>
          <TableHead className="w-[120px] min-w-[120px] text-right">Total</TableHead>
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
            <LineItemRow
              key={item.id || index}
              item={item}
              index={index}
              readOnly={readOnly}
              onItemChange={onItemChange}
              onRemoveItem={onRemoveItem}
              onSearchClick={onSearchClick}
              onInventoryItemSelect={onInventoryItemSelect}
              activeSearchField={activeSearchField}
              searchResults={searchResults}
            />
          ))
        )}
        
        {!readOnly && (
          <NewLineItemRow
            newItem={newItem}
            onNewItemChange={onNewItemChange}
            onAddItem={onAddItem}
            onSearchClick={onSearchClick}
            onInventoryItemSelect={onInventoryItemSelect}
            activeSearchField={activeSearchField}
            searchResults={searchResults}
          />
        )}
      </TableBody>
    </Table>
  );
};

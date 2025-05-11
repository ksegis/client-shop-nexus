
import { ArrowUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { InventoryItem } from '../types';

interface SortableTableHeaderProps {
  field: keyof InventoryItem;
  label: string;
  currentSortField: keyof InventoryItem;
  onSort: (field: keyof InventoryItem) => void;
}

export const SortableTableHeader = ({ 
  field, 
  label, 
  currentSortField, 
  onSort 
}: SortableTableHeaderProps) => {
  return (
    <TableHead className="cursor-pointer" onClick={() => onSort(field)}>
      <div className="flex items-center">
        {label}
        {currentSortField === field && (
          <ArrowUpDown className="ml-1 h-4 w-4" />
        )}
      </div>
    </TableHead>
  );
};

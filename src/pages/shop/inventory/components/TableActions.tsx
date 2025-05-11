
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import { DeleteConfirmation } from './DeleteConfirmation';
import { InventoryItem } from '../types';

interface TableActionsProps {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export const TableActions = ({ item, onEdit, onDelete }: TableActionsProps) => {
  return (
    <div className="flex justify-end space-x-2">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => onEdit(item)}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <DeleteConfirmation onDelete={() => onDelete(item.id)} />
      </Popover>
    </div>
  );
};

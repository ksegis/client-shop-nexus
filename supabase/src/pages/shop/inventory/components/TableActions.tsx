
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { InventoryItem } from '../types';
import { CoreReturnButton } from './CoreReturnButton';

interface TableActionsProps {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export const TableActions = ({ item, onEdit, onDelete }: TableActionsProps) => {
  return (
    <div className="flex items-center gap-2">
      <CoreReturnButton item={item} />
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(item)}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

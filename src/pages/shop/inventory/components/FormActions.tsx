
import { Button } from '@/components/ui/button';
import { InventoryItem } from '../types';

interface FormActionsProps {
  isSubmitting?: boolean;
  editingItem?: InventoryItem | null;
}

export const FormActions = ({ isSubmitting, editingItem }: FormActionsProps) => {
  return (
    <div className="flex justify-end gap-2">
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
      </Button>
    </div>
  );
};

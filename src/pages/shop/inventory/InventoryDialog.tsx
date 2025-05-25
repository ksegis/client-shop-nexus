
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { InventoryForm } from './InventoryForm';
import { InventoryFormValues, InventoryItem } from './types';

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InventoryFormValues) => void;
  editingItem: InventoryItem | null;
  isSubmitting: boolean;
}

export const InventoryDialog = ({
  open,
  onOpenChange,
  onSubmit,
  editingItem,
  isSubmitting,
}: InventoryDialogProps) => {
  const isEditing = !!editingItem;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the details of your inventory item below.' 
              : 'Enter the details of the new inventory item below.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <InventoryForm
          onSubmit={onSubmit}
          editingItem={editingItem}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

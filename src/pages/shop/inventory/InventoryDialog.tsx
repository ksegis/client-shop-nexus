
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
  
  const defaultValues = editingItem ? {
    name: editingItem.name,
    description: editingItem.description || '',
    sku: editingItem.sku || '',
    quantity: editingItem.quantity,
    price: editingItem.price,
    cost: editingItem.cost || 0,
    category: editingItem.category || '',
    supplier: editingItem.supplier || '',
    reorder_level: editingItem.reorder_level || 10,
  } : undefined;

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
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
          isEditing={isEditing}
        />
      </DialogContent>
    </Dialog>
  );
};

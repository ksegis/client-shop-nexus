import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { InventoryForm } from './InventoryForm';
import { InventoryFormValues, InventoryItem } from './types';
import { useToast } from '@/hooks/use-toast';

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InventoryFormValues) => Promise<void>;
  editingItem?: InventoryItem | null;
  isSubmitting?: boolean;
}

export const InventoryDialog = ({
  open,
  onOpenChange,
  onSubmit,
  editingItem,
  isSubmitting,
}: InventoryDialogProps) => {
  const { toast } = useToast();
  const isEditing = !!editingItem;

  // Improved onSubmit handler with proper error handling
  const handleSubmit = async (values: InventoryFormValues) => {
    try {
      // Validate form data before submission
      if (!values.name?.trim()) {
        throw new Error('Name is required');
      }

      if (values.quantity < 0) {
        throw new Error('Quantity cannot be negative');
      }

      if (values.price < 0) {
        throw new Error('Price cannot be negative');
      }

      if (values.cost !== null && values.cost !== undefined && values.cost < 0) {
        throw new Error('Cost cannot be negative');
      }

      if (values.reorder_level !== null && values.reorder_level !== undefined && values.reorder_level < 0) {
        throw new Error('Reorder level cannot be negative');
      }

      if (values.core_charge !== null && values.core_charge !== undefined && values.core_charge < 0) {
        throw new Error('Core charge cannot be negative');
      }

      // Call the actual onSubmit function with proper error handling
      await onSubmit(values);
      
      // Close dialog on successful submission
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Form submission error:', error);
      
      // Show user-friendly error message
      let errorMessage = 'An unexpected error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Handle specific error types
      if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again';
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        errorMessage = 'An item with this name or SKU already exists';
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Don't close dialog on error so user can fix issues
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details of your inventory item below.'
              : 'Enter the details of the new inventory item below.'}
          </DialogDescription>
        </DialogHeader>
        <InventoryForm
          onSubmit={handleSubmit}
          editingItem={editingItem}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};


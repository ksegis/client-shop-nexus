
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCustomers } from '../CustomersContext';
import { useState } from 'react';

interface DeleteConfirmationDialogProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteConfirmationDialog({
  customerId,
  open,
  onOpenChange,
}: DeleteConfirmationDialogProps) {
  const { customers, deleteCustomer } = useCustomers();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const customer = customers.find((c) => c.id === customerId);
  const customerName = customer ? 
    `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 
    'this customer';
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCustomer(customerId);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting customer:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Customer</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {customerName}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

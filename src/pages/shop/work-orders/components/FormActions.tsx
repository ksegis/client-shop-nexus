
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface FormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}

export const FormActions = ({ onCancel, isSubmitting, isEditing }: FormActionsProps) => {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isEditing ? 'Updating...' : 'Creating...'}
          </>
        ) : (
          isEditing ? 'Update Work Order' : 'Create Work Order'
        )}
      </Button>
    </DialogFooter>
  );
};

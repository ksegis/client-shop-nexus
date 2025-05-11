
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

interface FormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}

export const FormActions = ({ onCancel, isSubmitting, isEditing }: FormActionsProps) => {
  return (
    <DialogFooter>
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isEditing ? 'Update Item' : 'Add Item'}
      </Button>
    </DialogFooter>
  );
};


import { Button } from '@/components/ui/button';
import { PopoverContent } from '@/components/ui/popover';

interface DeleteConfirmationProps {
  onDelete: () => void;
}

export const DeleteConfirmation = ({ onDelete }: DeleteConfirmationProps) => {
  return (
    <PopoverContent className="w-60">
      <div className="space-y-4">
        <div className="font-medium">Delete Item</div>
        <div className="text-sm text-muted-foreground">
          Are you sure you want to delete this item? This action cannot be undone.
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm">Cancel</Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </PopoverContent>
  );
};

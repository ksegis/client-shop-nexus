
import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useUserManagement } from '../UserManagementContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userEmail: string | null;
}

export function DeleteUserDialog({ open, onOpenChange, userId, userEmail }: DeleteUserDialogProps) {
  const { deleteUser } = useUserManagement();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!userId || !userEmail) return;
    
    setIsDeleting(true);
    setErrorMessage(null);
    
    try {
      const success = await deleteUser(userId, userEmail);
      if (success) {
        toast({
          title: "User Deleted",
          description: `User ${userEmail} has been successfully deleted.`
        });
        onOpenChange(false);
      }
    } catch (error: any) {
      let message = "Failed to delete user.";
      
      // Check for foreign key constraint violation
      if (error.message?.includes('foreign key constraint') || 
          error.message?.includes('profiles_invited_by_fkey')) {
        message = "Cannot delete this user because they have invited other users. You need to reassign or delete those users first.";
      }
      
      setErrorMessage(message);
      toast({
        title: "Delete Failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete the user <strong>{userEmail}</strong> and all associated data. 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {errorMessage && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm mt-2">
            {errorMessage}
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            className="bg-destructive text-destructive-foreground"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete User"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

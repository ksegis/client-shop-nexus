
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserForm } from './UserForm';
import { User } from './types';

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userData: User | null;
}

export function UserDialog({ open, onOpenChange, onSuccess, userData }: UserDialogProps) {
  const isEditing = !!userData;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit User' : 'Add New User'}
          </DialogTitle>
        </DialogHeader>
        <UserForm 
          userData={userData} 
          onCancel={() => onOpenChange(false)} 
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

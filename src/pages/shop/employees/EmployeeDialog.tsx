
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmployeeForm } from './EmployeeForm';

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EmployeeDialog({ open, onOpenChange, onSuccess }: EmployeeDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Create a new employee account. The employee will receive an email to confirm their account.
          </DialogDescription>
        </DialogHeader>
        
        <EmployeeForm 
          onCancel={() => onOpenChange(false)} 
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

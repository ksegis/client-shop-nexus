
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmployeeForm } from './EmployeeForm';
import { Employee } from './EmployeesContext';

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  employee?: Employee | null;
}

export function EmployeeDialog({ open, onOpenChange, onSuccess, employee }: EmployeeDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    if (onSuccess) onSuccess();
  };

  const isEditing = !!employee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update employee information. The employee will receive an email if their email address is changed.'
              : 'Create a new employee account. The employee will receive an email to confirm their account.'}
          </DialogDescription>
        </DialogHeader>
        
        <EmployeeForm 
          onCancel={() => onOpenChange(false)} 
          onSuccess={handleSuccess}
          employeeData={employee}
        />
      </DialogContent>
    </Dialog>
  );
}


import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface EmployeeHeaderProps {
  onAddEmployee: () => void;
}

export const EmployeeHeader = ({ onAddEmployee }: EmployeeHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
        <p className="text-muted-foreground">
          Manage your shop staff and admin accounts.
        </p>
      </div>
      <Button className="flex gap-2" onClick={onAddEmployee}>
        <UserPlus className="h-4 w-4" />
        <span>Add Employee</span>
      </Button>
    </div>
  );
};

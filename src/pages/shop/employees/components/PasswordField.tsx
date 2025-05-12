
import React from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Control } from 'react-hook-form';
import { EmployeeFormCreateValues, EmployeeFormUpdateValues } from '../employeeFormSchema';

interface PasswordFieldProps {
  control: Control<EmployeeFormCreateValues | EmployeeFormUpdateValues>;
  isEditing: boolean;
}

export function PasswordField({ control, isEditing }: PasswordFieldProps) {
  return (
    <FormField
      control={control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {isEditing ? 'New Password (Optional)' : 'Password'}
          </FormLabel>
          <FormControl>
            <Input type="password" {...field} />
          </FormControl>
          <FormDescription>
            {isEditing ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

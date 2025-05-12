
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { NameFields } from './components/NameFields';
import { ContactFields } from './components/ContactFields';
import { RoleField } from './components/RoleField';
import { PasswordField } from './components/PasswordField';
import { useEmployeesContext } from './EmployeesContext';
import { Employee } from './types';
import { employeeFormSchema } from './employeeFormSchema';
import { getEmployeeFormValues } from './employeeFormUtils';
import { ExtendedUserRole } from '@/integrations/supabase/types-extensions';

type FormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  employeeData: Employee | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function EmployeeForm({ employeeData, onCancel, onSuccess }: EmployeeFormProps) {
  const { createEmployee, updateEmployee } = useEmployeesContext();
  const isEditing = !!employeeData;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: getEmployeeFormValues(employeeData),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && employeeData) {
        await updateEmployee(
          employeeData.id,
          {
            ...values,
            role: values.role as ExtendedUserRole,
          },
          values.password || undefined
        );
      } else {
        await createEmployee(
          {
            ...values,
            role: values.role as ExtendedUserRole,
          }, 
          values.password || ''
        );
      }
      
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NameFields control={form.control} />
          </div>
        </div>

        {/* Contact Fields */}
        <ContactFields 
          control={form.control} 
          emailReadOnly={isEditing} 
        />

        {/* Role Selection */}
        <RoleField 
          control={form.control} 
        />

        {/* Password Field */}
        <PasswordField 
          control={form.control} 
          isEditing={isEditing} 
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            type="button" 
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting}
          >
            {isEditing ? 'Update Employee' : 'Add Employee'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

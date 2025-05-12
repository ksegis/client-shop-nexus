
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Employee, ExtendedRole } from './types';
import { useEmployees } from './EmployeesContext';
import { Database, ExtendedUserRole } from '@/integrations/supabase/types-extensions';
import { FormActions } from '../inventory/components/FormActions';
import { NameFields } from './components/NameFields';
import { ContactFields } from './components/ContactFields';
import { RoleField } from './components/RoleField';
import { PasswordField } from './components/PasswordField';
import { 
  createFormSchema, 
  updateFormSchema, 
  EmployeeFormCreateValues, 
  EmployeeFormUpdateValues 
} from './employeeFormSchema';
import { getBaseRole, isRoleInactive } from './employeeFormUtils';

interface EmployeeFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  employeeData?: Employee | null;
}

export function EmployeeForm({ onCancel, onSuccess, employeeData }: EmployeeFormProps) {
  const { toast } = useToast();
  const { refetchEmployees } = useEmployees();
  const isEditing = !!employeeData;
  
  const form = useForm<EmployeeFormCreateValues | EmployeeFormUpdateValues>({
    resolver: zodResolver(isEditing ? updateFormSchema : createFormSchema),
    defaultValues: isEditing && employeeData
      ? {
          first_name: employeeData.first_name || '',
          last_name: employeeData.last_name || '',
          email: employeeData.email || '',
          phone: employeeData.phone || '',
          role: getBaseRole(employeeData.role),
        }
      : {
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          role: 'staff',
          password: '',
        },
  });

  const onSubmit = async (values: EmployeeFormCreateValues | EmployeeFormUpdateValues) => {
    try {
      if (isEditing && employeeData) {
        // Determine if the employee is currently inactive
        const isCurrentlyInactive = isRoleInactive(employeeData.role);
        
        // Preserve inactive status if employee is currently inactive
        const updatedRole = isCurrentlyInactive ? 
          (values.role === 'admin' ? 'inactive_admin' : 'inactive_staff') as ExtendedRole : 
          values.role as ExtendedRole;
        
        // Update existing employee
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            phone: values.phone,
            role: updatedRole as unknown as Database['public']['Enums']['user_role'],
          })
          .eq('id', employeeData.id);

        if (updateError) throw updateError;

        // If password was provided, update it (would require special auth handling)
        if ('password' in values && values.password && values.password.trim() !== '') {
          toast({
            description: "Password updates require admin API access and aren't supported in this demo.",
            variant: 'default',
          });
        }

        toast({
          title: 'Employee updated',
          description: `${values.first_name} ${values.last_name} has been updated successfully`,
        });
      } else {
        // Create new employee
        const createValues = values as EmployeeFormCreateValues;
        
        // Sign up the user with email and password
        const { error: signUpError } = await supabase.auth.signUp({
          email: createValues.email,
          password: createValues.password,
          options: {
            data: {
              first_name: createValues.first_name,
              last_name: createValues.last_name,
              phone: createValues.phone,
              role: createValues.role,
            },
          },
        });

        if (signUpError) throw signUpError;

        toast({
          title: 'Employee added',
          description: `${createValues.first_name} ${createValues.last_name} has been added successfully`,
        });
      }

      // Reset form and notify parent
      form.reset();
      refetchEmployees();
      onSuccess();
    } catch (error: any) {
      toast({
        title: isEditing ? 'Failed to update employee' : 'Failed to add employee',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <NameFields form={form} />
        <ContactFields form={form} />
        <RoleField form={form} />
        <PasswordField form={form} isEditing={isEditing} />

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

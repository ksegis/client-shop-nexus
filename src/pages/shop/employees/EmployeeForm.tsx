import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees, Employee, ExtendedRole } from './EmployeesContext';

// Schema for creating new employees
const createFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['staff', 'admin']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Schema for updating existing employees (password optional)
const updateFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['staff', 'admin']),
  password: z.string().optional(),
});

export type EmployeeFormCreateValues = z.infer<typeof createFormSchema>;
export type EmployeeFormUpdateValues = z.infer<typeof updateFormSchema>;
type StaffRole = 'staff' | 'admin';

interface EmployeeFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  employeeData?: Employee | null;
}

export function EmployeeForm({ onCancel, onSuccess, employeeData }: EmployeeFormProps) {
  const { toast } = useToast();
  const { refetchEmployees } = useEmployees();
  const isEditing = !!employeeData;
  
  // Helper function to get base role (remove inactive_ prefix)
  const getBaseRole = (role: ExtendedRole): StaffRole => {
    return role.startsWith('inactive_') 
      ? role.substring('inactive_'.length) as StaffRole
      : role as StaffRole;
  };
  
  // Helper function to check if a role is inactive
  const isRoleInactive = (role: ExtendedRole): boolean => {
    return role.startsWith('inactive_');
  };
  
  const form = useForm<EmployeeFormCreateValues | EmployeeFormUpdateValues>({
    resolver: zodResolver(isEditing ? updateFormSchema : createFormSchema),
    defaultValues: isEditing 
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
          `inactive_${values.role}` as ExtendedRole : 
          values.role as ExtendedRole;
        
        // Update existing employee
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            phone: values.phone,
            role: updatedRole,
          })
          .eq('id', employeeData.id);

        if (updateError) throw updateError;

        // If password was provided, update it (would require special auth handling)
        if ('password' in values && values.password && values.password.trim() !== '') {
          // In a real application, you'd need admin privileges to reset passwords
          // This is a simplified example
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormDescription>Optional</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditing && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormDescription>Minimum 6 characters</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {isEditing && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password (Optional)</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormDescription>Leave blank to keep current password</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            type="button" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">{isEditing ? 'Update Employee' : 'Add Employee'}</Button>
        </div>
      </form>
    </Form>
  );
}

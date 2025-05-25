
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AdminUser } from '../types/adminTypes';
import { useAdminActions } from '../hooks/useAdminActions';

const userProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['customer', 'staff', 'admin']),
  active: z.boolean(),
});

type UserProfileFormData = z.infer<typeof userProfileSchema>;

interface UserProfileFormProps {
  user: AdminUser;
  onClose: () => void;
}

export const UserProfileForm = ({ user, onClose }: UserProfileFormProps) => {
  const { updateUser } = useAdminActions();
  
  const form = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      active: user.active,
    },
  });

  const onSubmit = async (data: UserProfileFormData) => {
    try {
      await updateUser(user.id, data);
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            {...form.register('first_name')}
            placeholder="Enter first name"
          />
          {form.formState.errors.first_name && (
            <p className="text-sm text-red-600">{form.formState.errors.first_name.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            {...form.register('last_name')}
            placeholder="Enter last name"
          />
          {form.formState.errors.last_name && (
            <p className="text-sm text-red-600">{form.formState.errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...form.register('email')}
          placeholder="Enter email address"
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          {...form.register('phone')}
          placeholder="Enter phone number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select value={form.watch('role')} onValueChange={(value) => form.setValue('role', value as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={form.watch('active')}
          onCheckedChange={(checked) => form.setValue('active', checked)}
        />
        <Label htmlFor="active">Active Account</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

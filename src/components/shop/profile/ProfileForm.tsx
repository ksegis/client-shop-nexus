
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonation } from '@/utils/admin/impersonationUtils';

export const profileFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  current_password: z.string().optional(),
  new_password: z.string().optional(),
  confirm_password: z.string().optional(),
}).refine((data) => {
  if (data.new_password && !data.current_password) {
    return false;
  }
  if (data.new_password && data.new_password !== data.confirm_password) {
    return false;
  }
  return true;
}, {
  message: "Password validation failed",
  path: ["confirm_password"],
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  profile: any;
  onUpdate: () => void;
}

export const ProfileForm = ({ profile, onUpdate }: ProfileFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { isImpersonating } = useImpersonation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
    },
  });

  const watchedPassword = watch('new_password');
  const showPasswordFields = !isImpersonating(); // Hide password fields during impersonation

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    
    try {
      // Update profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Update password if provided and not impersonating
      if (data.new_password && !isImpersonating()) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.new_password,
        });

        if (passwordError) throw passwordError;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      onUpdate();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        {isImpersonating() && (
          <p className="text-sm text-orange-600">
            Password changes are disabled during impersonation
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                {...register('first_name')}
                className={errors.first_name ? 'border-red-500' : ''}
              />
              {errors.first_name && (
                <p className="text-sm text-red-500 mt-1">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                {...register('last_name')}
                className={errors.last_name ? 'border-red-500' : ''}
              />
              {errors.last_name && (
                <p className="text-sm text-red-500 mt-1">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register('phone')}
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
            )}
          </div>

          {showPasswordFields && (
            <>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Change Password</h3>
                
                <div>
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    {...register('current_password')}
                    className={errors.current_password ? 'border-red-500' : ''}
                  />
                  {errors.current_password && (
                    <p className="text-sm text-red-500 mt-1">{errors.current_password.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    {...register('new_password')}
                    className={errors.new_password ? 'border-red-500' : ''}
                  />
                  {errors.new_password && (
                    <p className="text-sm text-red-500 mt-1">{errors.new_password.message}</p>
                  )}
                </div>

                {watchedPassword && (
                  <div>
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      {...register('confirm_password')}
                      className={errors.confirm_password ? 'border-red-500' : ''}
                    />
                    {errors.confirm_password && (
                      <p className="text-sm text-red-500 mt-1">{errors.confirm_password.message}</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

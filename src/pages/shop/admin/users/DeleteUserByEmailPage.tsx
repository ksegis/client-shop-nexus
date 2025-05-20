
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserManagementProvider, useUserManagement } from './UserManagementContext';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

const DeleteUserForm = () => {
  const { deleteUser } = useUserManagement();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsDeleting(true);
    setErrorMessage(null);
    
    try {
      // First find the user ID by email
      const { data: userData, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', data.email)
        .single();
      
      if (fetchError) {
        throw new Error(`User not found: ${data.email}`);
      }
      
      const userId = userData.id;
      
      // Attempt to delete the user
      const success = await deleteUser(userId, data.email);
      
      if (success) {
        toast({
          title: "User Deleted",
          description: `User ${data.email} has been successfully deleted.`
        });
        
        // Redirect back to user management after successful deletion
        setTimeout(() => {
          navigate('/shop/admin/user-management');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      let message = "Failed to delete user.";
      
      // Check for foreign key constraint violation
      if (error.message?.includes('foreign key constraint') || 
          error.message?.includes('profiles_invited_by_fkey')) {
        message = "Cannot delete this user because they have invited other users. You need to reassign or delete those users first.";
      }
      
      setErrorMessage(message);
      toast({
        title: "Delete Failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User Email</FormLabel>
              <FormControl>
                <Input placeholder="example@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {errorMessage && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}
        
        <div className="flex flex-col space-y-2">
          <Button 
            type="submit" 
            variant="destructive"
            disabled={isDeleting}
            className="w-full"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting User...
              </>
            ) : (
              "Delete User"
            )}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/shop/admin/user-management')}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to User Management
          </Button>
        </div>
      </form>
    </Form>
  );
};

const DeleteUserByEmailPage = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Verifying your permissions...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle unauthorized access
  if (!user || profile?.role !== 'admin') {
    return (
      <div className="container mx-auto py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Current role: {profile?.role || 'Not authenticated'}</p>
            <Button onClick={() => navigate('/shop/admin')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Admin Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Authorized user view
  return (
    <UserManagementProvider>
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Delete User by Email</CardTitle>
            <CardDescription>
              Enter the email address of the user you want to delete. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteUserForm />
          </CardContent>
        </Card>
      </div>
    </UserManagementProvider>
  );
};

export default DeleteUserByEmailPage;


import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle } from 'lucide-react';

const DeleteUserPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(true);
  
  useEffect(() => {
    const deleteTargetUser = async () => {
      const email = "kevin.shelton@egisdynamics.com";
      
      try {
        setIsDeleting(true);
        // First find the user ID
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();
        
        if (userError) {
          throw new Error(`User not found: ${userError.message}`);
        }
        
        const userId = userData.id;
        
        // Call the Edge Function to delete the auth user
        const { data, error } = await supabase.functions.invoke('delete-auth-user', {
          body: { userId }
        });

        if (error) throw error;
        
        setIsDeleting(false);
        toast({
          title: "User Deleted",
          description: `User ${email} has been permanently deleted`,
        });
        
        // Redirect to user management page
        setTimeout(() => {
          navigate('/shop/admin/user-management');
        }, 2000);
        
      } catch (error: any) {
        console.error('Error deleting user:', error);
        setIsDeleting(false);
        
        let errorMessage = error.message || "Could not delete user";
        
        // Handle foreign key constraint violation
        if (errorMessage.includes('foreign key constraint') || 
            errorMessage.includes('profiles_invited_by_fkey')) {
          errorMessage = "Cannot delete this user because they have invited other users. You need to reassign or delete those users first.";
        }
        
        setError(errorMessage);
        
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: errorMessage,
        });
        
        // Redirect to user management page even on failure
        setTimeout(() => {
          navigate('/shop/admin/user-management');
        }, 5000);
      }
    };
    
    deleteTargetUser();
  }, [toast, navigate]);
  
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Deleting User</CardTitle>
        </CardHeader>
        <CardContent>
          {isDeleting ? (
            <>
              <p>Deleting user kevin.shelton@egisdynamics.com...</p>
              <div className="mt-4 flex items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
                <span>Processing deletion request</span>
              </div>
            </>
          ) : error ? (
            <div className="text-destructive flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-medium">Error: Delete Failed</p>
                <p>{error}</p>
                <p className="mt-2 text-sm">Redirecting to user management...</p>
              </div>
            </div>
          ) : (
            <div className="text-green-600">
              <p>User successfully deleted!</p>
              <p className="text-sm">Redirecting to user management...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeleteUserPage;

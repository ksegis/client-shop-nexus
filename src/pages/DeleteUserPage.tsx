
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const DeleteUserPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    const deleteTargetUser = async () => {
      const email = "kevin.shelton@egisdynamics.com";
      
      try {
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
        
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: error.message || "Could not delete user",
        });
        
        // Redirect to user management page even on failure
        setTimeout(() => {
          navigate('/shop/admin/user-management');
        }, 2000);
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
          <p>Deleting user kevin.shelton@egisdynamics.com...</p>
          <div className="mt-4 flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
            <span>Processing deletion request</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeleteUserPage;

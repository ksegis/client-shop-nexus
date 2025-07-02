
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';

export const useUserDeletion = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const deleteUser = async (userId: string) => {
    try {
      // Check if user is authenticated
      if (!user) {
        throw new Error('You must be logged in to delete users');
      }

      // Get the current session to ensure we have a valid token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get session');
      }

      if (!session?.access_token) {
        throw new Error('No valid session token available');
      }

      console.log('Attempting to delete user:', userId);

      // Call the Edge Function to delete the user
      const response = await fetch(`https://vqkxrbflwhunvbotjdds.supabase.co/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete user response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete user');
      }

      console.log('User deleted successfully:', result);

      toast({
        title: "Success",
        description: "User deleted successfully"
      });

      return result;

    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
      throw error;
    }
  };

  return { deleteUser };
};

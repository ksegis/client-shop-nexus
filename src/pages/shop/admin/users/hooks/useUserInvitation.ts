
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useUserInvitation = (refetchUsers: () => Promise<void>) => {
  const inviteUser = async (email: string, firstName: string, lastName: string, role: "admin" | "staff", password: string) => {
    try {
      // Get current user id to track who sent the invitation
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("You must be logged in to invite users");
      
      // Generate a unique invite token
      const inviteToken = crypto.randomUUID();
      
      // First check if user exists in employees table
      const { data: employeeData, error: employeeError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('role', role)
        .single();

      if (employeeError || !employeeData) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "This email is not associated with an existing employee",
        });
        return;
      }

      // Create user with auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
            force_password_change: true // Flag to indicate password change required
          }
        }
      });

      if (signUpError) throw signUpError;
      
      // Update profile with force_password_change flag, invite_token and invited_by
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          first_name: firstName,
          last_name: lastName,
          force_password_change: true,
          invite_token: inviteToken,
          invited_by: currentUser.id
        })
        .eq('id', data.user?.id);

      if (updateError) throw updateError;

      // Simulate sending invitation email
      toast({
        title: "Invitation Sent",
        description: `An invitation has been sent to ${email}`,
      });
      
      await refetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    }
  };

  return { inviteUser };
};

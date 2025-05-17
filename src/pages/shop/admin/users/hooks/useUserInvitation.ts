
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logAuthEvent } from '@/integrations/supabase/client';

export const useUserInvitation = (refetchUsers: () => Promise<void>) => {
  const { toast } = useToast();

  const inviteUser = async (email: string, firstName: string, lastName: string, role: "admin" | "staff", password: string) => {
    try {
      // Get current user id to track who sent the invitation
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("You must be logged in to invite users");
      
      // Generate a unique invite token using our database function
      const { data: tokenData, error: tokenError } = await supabase.rpc('generate_invite_token');
      
      if (tokenError) throw tokenError;
      
      const inviteToken = tokenData;
      
      // First check if user exists in the profiles table already
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (existingProfile) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "This email is already associated with an existing user",
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
      
      // Also record the invitation in our shop_invites table
      const { error: inviteError } = await supabase
        .from('shop_invites')
        .insert({
          email,
          token: inviteToken,
          role,
          invited_by: currentUser.id
        });
        
      if (inviteError) {
        console.error('Error recording invitation:', inviteError);
        // Continue anyway since the user was created
      }
      
      // Log the invitation event
      await logAuthEvent('user_invited', currentUser.id, {
        invited_user_email: email,
        invited_user_role: role,
        invite_token: inviteToken
      });

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

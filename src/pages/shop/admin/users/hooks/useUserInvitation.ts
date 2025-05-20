
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
      
      // Verify that the current user is an admin
      const { data: currentProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();
      
      if (profileCheckError) throw profileCheckError;
      
      if (currentProfile?.role !== 'admin') {
        throw new Error("Only administrators can invite new users");
      }
      
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
      
      // Get the application's base URL
      const baseUrl = window.location.origin;
      
      // Construct the invitation URL
      const inviteUrl = `${baseUrl}/auth/invite?token=${inviteToken}`;
      
      // Log the invitation event
      await logAuthEvent('user_invited', currentUser.id, {
        invited_user_email: email,
        invited_user_role: role,
        invite_token: inviteToken,
        invite_url: inviteUrl
      });

      // Show invitation information with the URL
      toast({
        title: "Invitation Created",
        description: "Send this link to the user to complete their registration",
        action: (
          <div className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-hidden">
            <div className="font-medium mb-1">Invitation Link:</div>
            <div className="text-xs break-all">{inviteUrl}</div>
          </div>
        ),
        duration: 10000, // Show for longer so they can copy the link
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

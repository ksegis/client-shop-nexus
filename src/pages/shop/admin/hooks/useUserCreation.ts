
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLogger } from './useAuditLogger';
import { CreateUserData } from './types';

export const useUserCreation = () => {
  const { toast } = useToast();
  const { logAuditEvent } = useAuditLogger();

  const createUser = async (userData: CreateUserData) => {
    try {
      // Create user with Supabase Auth Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
        }
      });

      if (authError) throw authError;

      // Update profile with role and additional data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
          role: userData.role,
          active: true
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      await logAuditEvent('create_user', authData.user.id, `Created new ${userData.role} user`);

      toast({
        title: "Success",
        description: "User created successfully"
      });

    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive"
      });
      throw error;
    }
  };

  return { createUser };
};

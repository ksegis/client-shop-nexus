
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminUserManagement } from './useAdminUserManagement';

interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'customer' | 'staff' | 'admin';
  sendWelcomeEmail: boolean;
}

interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: 'customer' | 'staff' | 'admin';
  active?: boolean;
}

export const useAdminActions = () => {
  const { toast } = useToast();

  const logAuditEvent = async (action: string, targetUserId: string, description?: string, metadata?: any) => {
    try {
      await supabase.rpc('log_audit_event', {
        p_action: action,
        p_target_user_id: targetUserId,
        p_description: description,
        p_metadata: metadata || {}
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  };

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

  const updateUser = async (userId: string, updates: UpdateUserData) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      await logAuditEvent('update_user', userId, 'Updated user profile', updates);

      toast({
        title: "Success",
        description: "User updated successfully"
      });

    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive"
      });
      throw error;
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      
      const { error } = await supabase
        .from('profiles')
        .update({ active: newStatus })
        .eq('id', userId);

      if (error) throw error;

      await logAuditEvent('toggle_status', userId, `${newStatus ? 'Activated' : 'Deactivated'} user`);

      toast({
        title: "Success",
        description: `User ${newStatus ? 'activated' : 'deactivated'} successfully`
      });

    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive"
      });
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/change-password`
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset email sent successfully"
      });

    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Delete user using Supabase Admin API
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) throw authError;

      await logAuditEvent('delete_user', userId, 'Deleted user account');

      toast({
        title: "Success",
        description: "User deleted successfully"
      });

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

  return {
    createUser,
    updateUser,
    toggleUserStatus,
    sendPasswordReset,
    deleteUser
  };
};

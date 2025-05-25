
import { useToast } from '@/hooks/use-toast';

export function useUserActivation(refetchUsers: () => Promise<void>) {
  const { toast } = useToast();

  const toggleUserActive = async (userId: string, currentRole: string) => {
    try {
      const isActive = !currentRole.startsWith('inactive_');
      const action = isActive ? 'deactivated' : 'activated';
      
      console.log(`Mock ${action} user: ${userId}`);
      
      toast({
        title: `User ${action} successfully`,
        description: `User has been ${action}`,
      });

      await refetchUsers();
    } catch (error: any) {
      console.error('Error toggling user active status:', error);
      toast({
        title: "Error updating user status",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteUser = async (userId: string, email: string): Promise<boolean> => {
    try {
      console.log(`Mock delete user: ${email}`);
      
      toast({
        title: "User deleted successfully",
        description: `${email} has been deleted`,
      });

      await refetchUsers();
      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error deleting user",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
      return false;
    }
  };

  return { toggleUserActive, deleteUser };
}

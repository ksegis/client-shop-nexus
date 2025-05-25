
import { useToast } from '@/hooks/use-toast';

export function useUserInvitation(refetchUsers: () => Promise<void>) {
  const { toast } = useToast();

  const inviteUser = async (
    email: string, 
    firstName: string, 
    lastName: string, 
    role: "admin" | "staff", 
    password: string
  ) => {
    try {
      // For development mode, just show success toast
      console.log(`Mock invite user: ${email} as ${role}`);
      
      toast({
        title: "User invited successfully",
        description: `${firstName} ${lastName} has been invited as ${role}`,
      });

      await refetchUsers();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast({
        title: "Error inviting user",
        description: error.message || "Failed to invite user",
        variant: "destructive",
      });
      throw error;
    }
  };

  return { inviteUser };
}


import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User } from '../types';

export const useProfileManagement = (refetchUsers: () => Promise<void>) => {
  const updateUserProfile = async (userId: string, profileData: Partial<User>) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          facebook_url: profileData.facebook_url,
          twitter_url: profileData.twitter_url,
          instagram_url: profileData.instagram_url,
          linkedin_url: profileData.linkedin_url,
        })
        .eq('id', userId);

      if (updateError) throw updateError;
      
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

  return { updateUserProfile };
};

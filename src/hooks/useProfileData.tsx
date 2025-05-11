
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type ProfileData = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

type ProfileUpdateData = Partial<Omit<ProfileData, 'id' | 'email' | 'created_at' | 'updated_at' | 'role'>>;

export const useProfileData = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchProfileData = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      setProfileData(data as ProfileData);
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfileData = async (updateData: ProfileUpdateData) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      // Refresh profile data after update
      await fetchProfileData();
    } catch (err) {
      console.error('Error updating profile data:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user?.id]);

  return { profileData, isLoading, error, updateProfileData, refreshProfile: fetchProfileData };
};

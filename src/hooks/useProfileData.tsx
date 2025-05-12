
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
  avatar_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
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
      
      // Use maybeSingle() instead of single() to handle case where profile might not exist
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (data) {
        setProfileData(data as ProfileData);
      } else {
        // If no profile exists, create default profile data from user info
        const defaultProfile: ProfileData = {
          id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          phone: null,
          role: 'staff', // Default to staff for shop portal users
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfileData(defaultProfile);
        
        // Optionally create the missing profile in the database
        try {
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            role: 'staff'
          });
        } catch (insertError) {
          console.error('Error creating profile:', insertError);
        }
      }
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

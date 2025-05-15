
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { ProfileData, ProfileUpdateData } from './types';
import { 
  fetchProfile, 
  updateProfileMetadata, 
  createNewProfile, 
  updateUserProfile,
  isTestUser 
} from './profileDbOperations';
import { createProfileFromUserMetadata } from './profileUtils';
import { ExtendedUserRole } from '@/integrations/supabase/types-extensions';
import { toast } from "@/hooks/use-toast";

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
      setError(null); // Reset any previous errors
      
      // Check if this is a mock or test user
      if (isTestUser(user.id)) {
        console.log('Using mock or test user profile, skipping database fetch');
        const mockProfile: ProfileData = {
          id: user.id,
          email: user.email || 'user@example.com',
          first_name: user.user_metadata?.first_name || 'Test',
          last_name: user.user_metadata?.last_name || 'User',
          phone: user.user_metadata?.phone || '555-1234',
          role: (user.user_metadata?.role || 'customer') as ExtendedUserRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          avatar_url: user.user_metadata?.avatar_url || null
        };
        
        setProfileData(mockProfile);
        setIsLoading(false);
        return;
      }

      // Regular flow for real users with valid UUIDs
      const data = await fetchProfile(user.id);
      
      if (data) {
        // Profile exists
        setProfileData(data);
        console.log(`Profile loaded for user ${user.id}:`, data.role);
      } else {
        // If no profile exists, create default profile data from user info
        const userEmail = user.email || '';
        const defaultProfile = createProfileFromUserMetadata(
          user.id, 
          userEmail, 
          user.user_metadata || {}
        );
        
        setProfileData(defaultProfile);
        console.log(`Creating new profile for user ${user.id}`);
        
        // Create the missing profile in the database
        await createNewProfile(user.id, userEmail, user.user_metadata || {});
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

    // Check if this is a mock or test user
    if (isTestUser(user.id)) {
      // Just update the local state for development use
      const updatedProfile = { ...profileData, ...updateData, updated_at: new Date().toISOString() };
      setProfileData(updatedProfile as ProfileData);
      toast({
        title: "Profile updated (test mode)",
        description: "Profile updated successfully in test/mock mode",
      });
      return;
    }

    try {
      await updateUserProfile(user.id, updateData);
      // Refresh profile data after update
      await fetchProfileData();
    } catch (err) {
      console.error('Error updating profile data:', err);
      throw err;
    }
  };

  const updateProfileAvatar = async (avatarUrl: string) => {
    return updateProfileData({ avatar_url: avatarUrl });
  };

  useEffect(() => {
    if (user?.id) {
      fetchProfileData();
    }
  }, [user?.id]);

  return { 
    profileData, 
    isLoading, 
    error, 
    updateProfileData, 
    updateProfileAvatar, 
    refreshProfile: fetchProfileData 
  };
};

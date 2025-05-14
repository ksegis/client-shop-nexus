
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { ProfileData, ProfileUpdateData } from './types';
import { 
  fetchProfile, 
  updateProfileMetadata, 
  createNewProfile, 
  updateUserProfile 
} from './profileDbOperations';
import { createProfileFromUserMetadata } from './profileUtils';

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
      
      const data = await fetchProfile(user.id);
      
      if (data) {
        // If profile exists but first_name/last_name are null, try to update from user metadata
        if (!data.first_name || !data.last_name || !data.phone) {
          const { first_name, last_name, phone, role } = user.user_metadata || {};
          
          if (first_name || last_name || phone || role) {
            const updateData: Record<string, any> = {};
            if (first_name) updateData.first_name = first_name;
            if (last_name) updateData.last_name = last_name;
            if (phone) updateData.phone = phone;
            if (role) updateData.role = role; // Make sure role is updated if present in metadata
            
            const updated = await updateProfileMetadata(user.id, updateData);
            
            if (updated) {
              // Update the local data with the metadata
              data.first_name = first_name || data.first_name;
              data.last_name = last_name || data.last_name;
              data.phone = phone || data.phone;
              if (role) data.role = role;
            }
          }
        }
        
        setProfileData(data);
      } else {
        // If no profile exists, create default profile data from user info
        const userEmail = user.email || '';
        const defaultProfile = createProfileFromUserMetadata(
          user.id, 
          userEmail, 
          user.user_metadata || {}
        );
        
        setProfileData(defaultProfile);
        
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

    try {
      await updateUserProfile(user.id, updateData);
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


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
      
      // Check if this is a mock or test user by looking at the ID format
      // UUID format validation check - mock and test users have string IDs, not UUIDs
      const isValidUuid = 
        user.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) !== null;
      
      if (!isValidUuid || user.id.includes('mock') || user.id.includes('test')) {
        console.log('Using mock or test user profile, skipping database fetch');
        const mockProfile: ProfileData = {
          id: user.id,
          email: user.email || 'user@example.com',
          first_name: user.user_metadata?.first_name || 'Test',
          last_name: user.user_metadata?.last_name || 'User',
          phone: user.user_metadata?.phone || '555-1234',
          role: (user.user_metadata?.role || 'customer') as ExtendedUserRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setProfileData(mockProfile);
        setIsLoading(false);
        return;
      }

      // Regular flow for real users with valid UUIDs
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
            if (role) updateData.role = role as ExtendedUserRole;
            
            const updated = await updateProfileMetadata(user.id, updateData);
            
            if (updated) {
              // Update the local data with the metadata
              data.first_name = first_name || data.first_name;
              data.last_name = last_name || data.last_name;
              data.phone = phone || data.phone;
              if (role) data.role = role as ExtendedUserRole;
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

    // Check if this is a mock or test user
    const isValidUuid = 
      user.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) !== null;
    
    if (!isValidUuid || user.id.includes('mock') || user.id.includes('test')) {
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

  useEffect(() => {
    fetchProfileData();
  }, [user?.id]);

  return { profileData, isLoading, error, updateProfileData, refreshProfile: fetchProfileData };
};

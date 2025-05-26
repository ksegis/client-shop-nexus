
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/contexts/auth/types';
import { User } from '@supabase/supabase-js';

export function useProfileManagement() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<Error | null>(null);
  const [portalType, setPortalType] = useState<'shop' | 'customer' | null>(null);

  // Fetch the user's profile from the database
  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) return null;

    setIsLoadingProfile(true);
    setProfileError(null);
    
    try {
      console.log("Checking profile for user:", userId);
      
      // Use a fresh query without caching to ensure we get the latest role
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfileError(error);
        return null;
      }

      if (!data) {
        console.warn(`No profile found for user: ${userId}`);
        return null;
      }

      // Save to state
      const userProfile = data as UserProfile;
      setProfile(userProfile);
      
      // Set portal type based on role
      const newPortalType = getPortalType(userProfile);
      setPortalType(newPortalType);
      
      console.info(`Profile loaded for ${userProfile.email}: Role=${userProfile.role}, Portal type=${newPortalType}`);
      
      return userProfile;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      setProfileError(err as Error);
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  // Create a profile for a new user
  const createProfile = useCallback(async (userId: string, profileData: Partial<UserProfile>) => {
    if (!userId) return null;

    try {
      // Make sure email is provided as it's required by the database
      if (!profileData.email) {
        console.error('Email is required when creating a profile');
        return null;
      }
      
      const defaultProfile: UserProfile = {
        id: userId,
        email: profileData.email,
        role: profileData.role || 'customer',
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        avatar_url: profileData.avatar_url || '',
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([defaultProfile])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      const userProfile = data as UserProfile;
      setProfile(userProfile);
      
      // Set portal type based on role
      const newPortalType = getPortalType(userProfile);
      setPortalType(newPortalType);
      
      return userProfile;
    } catch (err) {
      console.error('Error in createProfile:', err);
      return null;
    }
  }, []);

  // Update a user's profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id || !profile) {
      return { success: false, error: new Error('No authenticated user or profile') };
    }

    try {
      // Don't allow email to be updated as it's managed by auth
      const { email, ...validUpdates } = updates;
      
      const { error } = await supabase
        .from('profiles')
        .update(validUpdates)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return { success: false, error };
      }

      // Update the local profile state with the changes
      setProfile(prevProfile => {
        if (!prevProfile) return null;
        const updatedProfile = { ...prevProfile, ...validUpdates };
        
        // Update portal type if role changed
        if (validUpdates.role) {
          const newPortalType = getPortalType(updatedProfile);
          setPortalType(newPortalType);
        }
        
        return updatedProfile;
      });

      return { success: true };
    } catch (err) {
      console.error('Error in updateProfile:', err);
      return { success: false, error: err };
    }
  }, [profile]);

  // Get the portal type based on the user's role
  const getPortalType = useCallback((userProfile: UserProfile | null) => {
    if (!userProfile) return null;
    
    const role = userProfile.role;
    console.log(`Determining portal type for role: ${role}`);
    
    if (role === 'customer') {
      return 'customer';
    } else if (role === 'admin' || role === 'staff') {
      return 'shop';
    }
    
    console.warn(`Unknown role: ${role}, defaulting to customer portal`);
    return 'customer';
  }, []);
  
  return {
    profile,
    portalType,
    isLoadingProfile,
    profileError,
    fetchProfile,
    createProfile,
    updateProfile,
    getPortalType,
  };
}


import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '../types';
import { User } from '@supabase/supabase-js';

export function useProfileManagement(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<Error | null>(null);

  // Clear profile when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
    }
  }, [user]);

  // Fetch the user's profile from the database
  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) return null;

    setIsLoadingProfile(true);
    setProfileError(null);
    
    try {
      console.log("Checking profile for user:", userId);
      
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
      
      console.info(`Profile loaded: ${userProfile.role} Portal type: ${
        userProfile.role === 'customer' ? 'customer' : 'shop'
      }`);
      
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
      const defaultProfile: UserProfile = {
        id: userId,
        email: profileData.email || '',
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
      
      return userProfile;
    } catch (err) {
      console.error('Error in createProfile:', err);
      return null;
    }
  }, []);

  // Update a user's profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id || !profile) {
      return { success: false, error: new Error('No authenticated user or profile') };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return { success: false, error };
      }

      // Update the local profile state with the changes
      setProfile(prevProfile => {
        if (!prevProfile) return null;
        return { ...prevProfile, ...updates };
      });

      return { success: true };
    } catch (err) {
      console.error('Error in updateProfile:', err);
      return { success: false, error: err };
    }
  }, [user, profile]);

  // Get the portal type based on the user's role
  const getPortalType = useCallback((userProfile: UserProfile | null) => {
    if (!userProfile) return null;
    
    const role = userProfile.role;
    
    if (role === 'customer') {
      return 'customer';
    } else if (role === 'admin' || role === 'staff') {
      return 'shop';
    }
    
    return null;
  }, []);
  
  return {
    profile,
    isLoadingProfile,
    profileError,
    fetchProfile,
    createProfile,
    updateProfile,
    getPortalType,
  };
}

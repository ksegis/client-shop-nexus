
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/contexts/auth/types';

export interface ProfileManagement {
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  profileError: Error | null;
  portalType: 'customer' | 'shop' | null;
  fetchProfile: (userId: string) => Promise<UserProfile | null>;
  createProfile: (userId: string, profileData: Partial<UserProfile>) => Promise<UserProfile | null>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: any }>;
  getPortalType: (userProfile: UserProfile | null) => 'customer' | 'shop' | null;
}

export const useProfileManagement = (): ProfileManagement => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<Error | null>(null);
  const [portalType, setPortalType] = useState<'customer' | 'shop' | null>(null);

  const getPortalType = useCallback((userProfile: UserProfile | null): 'customer' | 'shop' | null => {
    if (!userProfile) return null;
    
    const role = userProfile.role;
    if (role === 'customer') return 'customer';
    if (role === 'staff' || role === 'admin') return 'shop';
    
    return null;
  }, []);

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!userId) {
      setProfile(null);
      setPortalType(null);
      setIsLoadingProfile(false);
      return null;
    }
    
    setIsLoadingProfile(true);
    setProfileError(null);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        const userProfile = data as UserProfile;
        setProfile(userProfile);
        const detectedPortalType = getPortalType(userProfile);
        setPortalType(detectedPortalType);
        return userProfile;
      } else {
        setProfile(null);
        setPortalType(null);
        return null;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileError(error as Error);
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, [getPortalType]);

  const createProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
    try {
      // Ensure email is provided as it's required by the database
      if (!profileData.email) {
        throw new Error("Email is required to create a profile");
      }

      const profileToInsert = {
        id: userId,
        email: profileData.email,
        role: profileData.role || 'customer',
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        avatar_url: profileData.avatar_url || '',
        phone: profileData.phone || ''
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileToInsert)
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        const newProfile = data as UserProfile;
        setProfile(newProfile);
        const detectedPortalType = getPortalType(newProfile);
        setPortalType(detectedPortalType);
        return newProfile;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: any }> => {
    if (!profile?.id) {
      return { success: false, error: 'No profile to update' };
    }
    
    try {
      // Make a copy of updates without modifying the original object
      const updateData = { ...updates };
      
      // Delete email from updates if it exists, since we shouldn't update it
      if ('email' in updateData) {
        delete updateData.email;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);
        
      if (error) throw error;
      
      // Update the local state
      setProfile((prev) => {
        if (!prev) return null;
        const updated = { ...prev, ...updateData };
        const detectedPortalType = getPortalType(updated);
        setPortalType(detectedPortalType);
        return updated;
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error };
    }
  };

  return {
    profile,
    isLoadingProfile,
    profileError,
    portalType,
    fetchProfile,
    createProfile,
    updateProfile,
    getPortalType,
  };
};

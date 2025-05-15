
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '../types';

export function useProfileManagement(authUser: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [portalType, setPortalType] = useState<'shop' | 'customer' | null>(null);
  
  // Load profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser) {
        setProfile(null);
        setProfileLoading(false);
        setPortalType(null);
        return;
      }

      // Fetch profile from database
      try {
        console.log('Checking profile for user:', authUser.id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          // If there's a network error, don't clear the profile - this might cause redirect loops
          if (profileError.code === 'PGRST116') {
            console.log('Network error when fetching profile - keeping current auth state');
            setProfileLoading(false);
            return;
          }
        }

        if (profileData) {
          const userProfile: UserProfile = {
            id: profileData.id,
            email: profileData.email,
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            role: profileData.role || 'customer',
            avatar_url: profileData.avatar_url
          };
          
          setProfile(userProfile);
          setPortalType(getPortalByRole(userProfile.role));
          console.log('Profile loaded:', userProfile.role, 'Portal type:', getPortalByRole(userProfile.role));
        } else if (authUser) {
          // If no profile exists but we have a user, create a default one
          console.log('No profile found, creating default profile with user metadata');
          const role = (authUser.user_metadata?.role as UserRole) || 'customer';
          
          const newUserProfile: UserProfile = {
            id: authUser.id,
            email: authUser.email || '',
            first_name: authUser.user_metadata?.first_name || '',
            last_name: authUser.user_metadata?.last_name || '',
            role: role
          };
          
          setProfile(newUserProfile);
          setPortalType(getPortalByRole(role));
          
          console.warn('Created default profile for authenticated user');
          
          // Also create the profile in the database
          try {
            // Map the role to a database-compatible role
            const dbRole = mapRoleToDbRole(role);
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: authUser.id,
                email: authUser.email,
                first_name: authUser.user_metadata?.first_name || '',
                last_name: authUser.user_metadata?.last_name || '',
                role: dbRole
              });
              
            if (insertError) {
              console.error('Failed to create profile in database:', insertError);
            } else {
              console.log('Created profile in database');
            }
          } catch (insertErr) {
            console.error('Error creating profile:', insertErr);
          }
        }
      } catch (error) {
        console.error('Error processing profile data:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    if (authUser) {
      fetchProfile();
    } else {
      setProfile(null);
      setPortalType(null);
      setProfileLoading(false);
    }
  }, [authUser]);

  const getPortalByRole = (role: UserRole): 'shop' | 'customer' => {
    // Admin users should always be directed to the shop portal
    if (role === 'admin') return 'shop';
    
    // For all other roles, check if they're customer or shop staff
    return role === 'customer' ? 'customer' : 'shop';
  };
  
  return { 
    profile, 
    setProfile, 
    profileLoading, 
    portalType 
  };
}

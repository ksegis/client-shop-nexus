
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '../types';

export function useProfileManagement(authUser: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Check if profile exists for RLS policies to work correctly
  useEffect(() => {
    const checkAndCreateProfile = async () => {
      if (!authUser) return;
      
      try {
        console.log('Checking profile for user:', authUser.id);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, role')
          .eq('id', authUser.id)
          .maybeSingle();
        
        if (profileError || !profileData) {
          console.warn('Profile not found for authenticated user, creating one...');
          
          // Create profile if none exists (important for RLS policies)
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              email: authUser.email || '',
              role: authUser.user_metadata?.role || 'staff',
              first_name: authUser.user_metadata?.first_name || '',
              last_name: authUser.user_metadata?.last_name || ''
            });
            
          if (insertError) {
            console.error('Failed to create profile:', insertError);
          } else {
            console.log('Profile created successfully for RLS policies');
          }
        } else {
          setProfile(profileData as UserProfile);
        }
      } catch (err) {
        console.error('Error checking/creating profile:', err);
      }
    };
    
    checkAndCreateProfile();
  }, [authUser]);
  
  return { profile, setProfile };
}

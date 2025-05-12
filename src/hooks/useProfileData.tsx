
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ExtendedUserRole, mapExtendedRoleToDbRole } from '@/integrations/supabase/types-extensions';
import { Database } from '@/integrations/supabase/types';

// Use the database user role type for type safety with Supabase operations
type DatabaseUserRole = Database['public']['Enums']['user_role'];

type ProfileData = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: ExtendedUserRole;  // Use the ExtendedUserRole type from types-extensions.ts
  created_at: string;
  updated_at: string;
  avatar_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
};

type ProfileUpdateData = Partial<Omit<ProfileData, 'id' | 'email' | 'created_at' | 'updated_at' | 'role'>> & {
  role?: ExtendedUserRole;  // Add role as an optional property with the correct type
};

// Helper function to convert from database profile to our extended profile type
const mapDbProfileToExtendedProfile = (dbProfile: any): ProfileData => {
  // By default, consider all DB roles as active
  let extendedRole = dbProfile.role as ExtendedUserRole;
  
  // Here we'd apply additional business logic to determine if a role should be marked as inactive
  // This would typically involve checking other fields or conditions
  
  return {
    ...dbProfile,
    role: extendedRole
  };
};

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
      
      // Use maybeSingle() instead of single() to handle case where profile might not exist
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (data) {
        // If profile exists but first_name/last_name are null, try to update from user metadata
        if (!data.first_name || !data.last_name) {
          const { first_name, last_name } = user.user_metadata || {};
          
          if (first_name || last_name) {
            const updateData: Record<string, any> = {};
            if (first_name) updateData.first_name = first_name;
            if (last_name) updateData.last_name = last_name;
            
            try {
              // Update the profile with metadata from the user object
              const { error: updateError } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id);
                
              if (updateError) throw updateError;
                
              // Update the local data with the metadata
              data.first_name = first_name || data.first_name;
              data.last_name = last_name || data.last_name;
              
              console.log('Updated profile with metadata from user:', first_name, last_name);
            } catch (updateError) {
              console.error('Error updating profile with user metadata:', updateError);
            }
          }
        }
        
        // Convert the database profile to our extended profile type
        setProfileData(mapDbProfileToExtendedProfile(data));
      } else {
        // If no profile exists, create default profile data from user info
        const userEmail = user.email || '';
        const firstName = user.user_metadata?.first_name || '';
        const lastName = user.user_metadata?.last_name || '';
        const role = user.user_metadata?.role || 'customer'; // Default to customer role unless specified
        const extendedRole = role as ExtendedUserRole;
        
        console.log('Creating profile from user metadata:', { firstName, lastName, role });
        
        const defaultProfile: ProfileData = {
          id: user.id,
          email: userEmail,
          first_name: firstName,
          last_name: lastName,
          phone: null,
          role: extendedRole, // Use the extended role type
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfileData(defaultProfile);
        
        // Create the missing profile in the database
        try {
          // When saving to the database, we need to map the extended role to a database role
          const dbRole: DatabaseUserRole = mapExtendedRoleToDbRole(extendedRole);
          
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            email: userEmail,
            first_name: firstName,
            last_name: lastName,
            role: dbRole // Use the database role type
          });
          
          if (insertError) throw insertError;
          
          console.log('Created new profile for user:', user.id);
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
      // Create a new object for database update that doesn't include extended role
      const dbUpdateData: Record<string, any> = {};
      
      // Copy all properties except role from updateData
      Object.keys(updateData).forEach(key => {
        if (key !== 'role') {
          dbUpdateData[key] = (updateData as any)[key];
        }
      });
      
      // If role is included in the update data, map it to database role
      if (updateData.role) {
        dbUpdateData.role = mapExtendedRoleToDbRole(updateData.role);
      }
      
      // Update the profile with the database-compatible data
      const { error: updateError } = await supabase
        .from('profiles')
        .update(dbUpdateData)
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

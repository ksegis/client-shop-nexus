
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches user profile data from the profiles table
 * @param userId The user ID to fetch profile data for
 */
export const fetchUserProfile = async (userId: string) => {
  if (!userId) {
    console.error("fetchUserProfile called with empty userId");
    return null;
  }
  
  try {
    console.log("Fetching profile for user:", userId);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, first_name, last_name, email')
      .eq('id', userId)
      .maybeSingle(); // Using maybeSingle instead of single to prevent errors when no profile exists
      
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    
    if (!profile) {
      console.log("No profile found for user:", userId);
      return null;
    }
    
    console.log("Got user role from profile:", profile?.role);
    return profile;
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    return null;
  }
};

/**
 * Synchronizes the user's role from profile to auth metadata
 * @param userId The user ID to update
 * @param role The role to set
 */
export const syncUserRoleToMetadata = async (userId: string, role: string) => {
  if (!userId || !role) {
    console.error("syncUserRoleToMetadata called with empty userId or role");
    return false;
  }
  
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: { role }
    });
    
    if (error) {
      console.error("Error syncing user role to metadata:", error);
      return false;
    }
    
    console.log("Successfully synced role to auth metadata:", role);
    return true;
  } catch (error) {
    console.error("Error syncing user role to metadata:", error);
    return false;
  }
};

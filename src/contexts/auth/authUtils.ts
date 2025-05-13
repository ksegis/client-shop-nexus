
import { supabase } from '@/integrations/supabase/client';
import { ExtendedUserRole, mapExtendedRoleToDbRole } from '@/integrations/supabase/types-extensions';

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
    
    // Sync the role to user metadata
    if (profile.role) {
      try {
        // Update the session data to include role information
        await supabase.auth.refreshSession();
        console.log("Auth session refreshed after profile fetch");
      } catch (refreshError) {
        console.error("Error refreshing auth session:", refreshError);
      }
    }
    
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
export const syncUserRoleToMetadata = async (userId: string, role: ExtendedUserRole) => {
  if (!userId || !role) {
    console.error("syncUserRoleToMetadata called with empty userId or role");
    return false;
  }
  
  try {
    // Map the extended role to a database role before saving
    const dbRole = mapExtendedRoleToDbRole(role);
    
    // Update the profile with the database-compatible role
    const { error } = await supabase
      .from('profiles')
      .update({ role: dbRole })
      .eq('id', userId);
    
    if (error) {
      console.error("Error syncing user role to profile:", error);
      return false;
    }
    
    console.log("Successfully updated role in profile table:", role);
    
    // Force refresh the session to update the local user object
    await supabase.auth.refreshSession();
    
    return true;
  } catch (error) {
    console.error("Error syncing user role to profile:", error);
    return false;
  }
};

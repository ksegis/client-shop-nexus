
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches user profile data from the profiles table
 * @param userId The user ID to fetch profile data for
 */
export const fetchUserProfile = async (userId: string) => {
  try {
    console.log("Fetching profile for user:", userId);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    
    console.log("Got user role from profile:", profile?.role);
    return profile;
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    return null;
  }
};

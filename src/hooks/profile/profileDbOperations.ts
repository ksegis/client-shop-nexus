
import { supabase } from '@/integrations/supabase/client';
import { mapExtendedRoleToDbRole } from '@/integrations/supabase/types-extensions';
import { ProfileData, ProfileUpdateData } from './types';
import { mapDbProfileToExtendedProfile, createProfileFromUserMetadata } from './profileUtils';

export const fetchProfile = async (userId: string): Promise<ProfileData | null> => {
  try {
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (fetchError) throw fetchError;
    
    return data ? mapDbProfileToExtendedProfile(data) : null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const updateProfileMetadata = async (userId: string, updateData: Record<string, any>) => {
  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
      
    if (updateError) throw updateError;
    
    console.log('Updated profile with metadata');
    return true;
  } catch (updateError) {
    console.error('Error updating profile with user metadata:', updateError);
    return false;
  }
};

export const createNewProfile = async (userId: string, email: string, metadata: any) => {
  try {
    // When saving to the database, we need to map the extended role to a database role
    const dbRole = mapExtendedRoleToDbRole(metadata?.role || 'customer');
    
    const { error: insertError } = await supabase.from('profiles').insert({
      id: userId,
      email: email,
      first_name: metadata?.first_name || '',
      last_name: metadata?.last_name || '',
      phone: metadata?.phone || '',
      role: dbRole // Use the database role type
    });
    
    if (insertError) throw insertError;
    
    console.log('Created new profile for user:', userId);
    return true;
  } catch (insertError) {
    console.error('Error creating profile:', insertError);
    throw insertError;
  }
};

export const updateUserProfile = async (userId: string, updateData: ProfileUpdateData) => {
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
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
    return true;
  } catch (err) {
    console.error('Error updating profile data:', err);
    throw err;
  }
};

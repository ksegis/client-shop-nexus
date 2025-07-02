
import { Database } from '@/integrations/supabase/types';
import { ExtendedUserRole, mapExtendedRoleToDbRole } from '@/integrations/supabase/types-extensions';

// Use the database user role type for type safety with Supabase operations
export type DatabaseUserRole = Database['public']['Enums']['user_role'];

// Helper function to convert from database profile to our extended profile type
export const mapDbProfileToExtendedProfile = (dbProfile: any) => {
  // By default, consider all DB roles as active
  let extendedRole = dbProfile.role as ExtendedUserRole;
  
  // Here we'd apply additional business logic to determine if a role should be marked as inactive
  // This would typically involve checking other fields or conditions
  
  return {
    ...dbProfile,
    role: extendedRole
  };
};

// Create profile data from user metadata
export const createProfileFromUserMetadata = (userId: string, email: string, metadata: any) => {
  const firstName = metadata?.first_name || '';
  const lastName = metadata?.last_name || '';
  const phone = metadata?.phone || '';
  const role = metadata?.role || 'customer'; // Default to customer role unless specified
  const extendedRole = role as ExtendedUserRole;
  
  console.log('Creating profile from user metadata:', { firstName, lastName, phone, role });
  
  return {
    id: userId,
    email: email,
    first_name: firstName,
    last_name: lastName,
    phone: phone,
    role: extendedRole,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

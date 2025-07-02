
import { ExtendedUserRole } from '@/integrations/supabase/types-extensions';

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: ExtendedUserRole;
  created_at: string;
  updated_at: string;
  force_password_change?: boolean;
  avatar_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  invite_token?: string | null;
  invited_by?: string | null;
}

export function isRoleInactive(role: string): boolean {
  return role.startsWith('inactive_');
}

// Get the base role name without 'inactive_' prefix
export function getBaseRole(role: string): "admin" | "staff" | "customer" {
  if (role.startsWith('inactive_')) {
    const baseRole = role.replace('inactive_', '') as "admin" | "staff" | "customer";
    return baseRole;
  }
  return role as "admin" | "staff" | "customer";
}

export interface InviteUserFormValues {
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "staff"; // Restricting to valid role values
  password: string;
}

export interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  phone: string | null;
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  linkedin: string | null;
}

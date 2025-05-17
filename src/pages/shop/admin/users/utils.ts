
import { ExtendedUserRole } from '@/integrations/supabase/types-extensions';

export function isRoleInactive(role: string): boolean {
  return role.startsWith('inactive_');
}

export function formatUserRole(role: string): string {
  // Remove 'inactive_' prefix if present
  const baseRole = role.replace('inactive_', '');
  
  // Remove 'test_' prefix if present
  const cleanRole = baseRole.replace('test_', '');
  
  // Capitalize first letter
  return cleanRole.charAt(0).toUpperCase() + cleanRole.slice(1);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Get the base role name without 'inactive_' prefix
export function getBaseRole(role: ExtendedUserRole): "admin" | "staff" | "customer" {
  if (role.startsWith('inactive_')) {
    const baseRole = role.replace('inactive_', '') as "admin" | "staff" | "customer";
    return baseRole;
  }
  return role as "admin" | "staff" | "customer";
}

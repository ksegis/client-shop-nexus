
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

/**
 * Generates a strong random password
 * @returns A secure password with uppercase, lowercase, numbers and special characters
 */
export function generateStrongPassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
  
  // Make sure we have at least one of each character type
  let password = '';
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += symbols.charAt(Math.floor(Math.random() * symbols.length));
  
  // Fill the rest with random characters (to make it 12 characters long)
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = 0; i < 8; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password characters
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

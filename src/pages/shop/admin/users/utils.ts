
import { format } from 'date-fns';
import { isRoleInactive } from '../../users/types';

// Format a role for display, removing any 'inactive_' prefix
export const formatUserRole = (role: string): string => {
  if (role.startsWith('inactive_')) {
    return role.replace('inactive_', '');
  }
  return role;
};

// Format a date for display
export const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Generate a strong password for user accounts
export const generateStrongPassword = (): string => {
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+';
  
  // Generate at least one character from each set
  const upper = upperChars[Math.floor(Math.random() * upperChars.length)];
  const lower = lowerChars[Math.floor(Math.random() * lowerChars.length)];
  const number = numbers[Math.floor(Math.random() * numbers.length)];
  const special = specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Generate remaining characters randomly (total password length = 12)
  const allChars = upperChars + lowerChars + numbers + specialChars;
  let password = upper + lower + number + special;
  
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Re-export isRoleInactive for convenience
export { isRoleInactive };

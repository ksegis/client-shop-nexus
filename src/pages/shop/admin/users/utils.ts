
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

// Re-export isRoleInactive for convenience
export { isRoleInactive };

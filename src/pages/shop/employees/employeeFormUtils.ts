
import { ExtendedRole } from './types';
import { FormRole } from './employeeFormSchema';

// Helper function to get base role (remove inactive_ prefix)
export const getBaseRole = (role: ExtendedRole): FormRole => {
  if (role === 'inactive_staff') return 'staff';
  if (role === 'inactive_admin') return 'admin';
  return role === 'admin' ? 'admin' : 'staff';
};

// Helper function to check if a role is inactive
export const isRoleInactive = (role: ExtendedRole): boolean => {
  return role === 'inactive_staff' || role === 'inactive_admin';
};

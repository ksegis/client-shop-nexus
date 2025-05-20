
/**
 * Checks if a role is an inactive role
 */
export const isRoleInactive = (role: string): boolean => {
  return role.startsWith('inactive_');
};


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
  avatar_url: string | null;
}

export type FormRole = 'customer' | 'staff' | 'admin';

export interface UserContextType {
  users: User[];
  isLoading: boolean;
  error: Error | null;
  createUser: (user: Partial<User>, password: string) => Promise<void>;
  updateUser: (id: string, user: Partial<User>, password?: string) => Promise<void>;
  toggleUserActive: (id: string, currentRole: string) => Promise<void>;
  refetchUsers: () => Promise<void>;
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
}

// Helper functions for role management
export const getBaseRole = (role: ExtendedUserRole): FormRole => {
  if (role === 'inactive_staff' || role === 'test_staff') return 'staff';
  if (role === 'inactive_admin' || role === 'test_admin') return 'admin';
  return role === 'admin' ? 'admin' : role === 'staff' ? 'staff' : 'customer';
};

export const isRoleInactive = (role: ExtendedUserRole): boolean => {
  return role === 'inactive_staff' || role === 'inactive_admin';
};

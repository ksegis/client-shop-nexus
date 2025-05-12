
export interface Employee {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: ExtendedRole;
  created_at: string;
  updated_at: string;
}

export type ExtendedRole = 'staff' | 'admin' | 'inactive_staff' | 'inactive_admin';

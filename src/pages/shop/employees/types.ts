
import { ExtendedUserRole } from '@/integrations/supabase/types-extensions';

export interface Employee {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: ExtendedUserRole;
  created_at: string;
  updated_at: string;
}

// ExtendedRole should be aligned with the ExtendedUserRole type
export type ExtendedRole = ExtendedUserRole;

// Define the base role types needed by EmployeesContext
export type BaseRole = 'staff' | 'admin';

// Add back the EmployeesContextType interface that was accidentally removed
export interface EmployeesContextType {
  employees: Employee[];
  isLoading: boolean;
  error: Error | null;
  createEmployee: (employee: Partial<Employee>, password: string) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>, password?: string) => Promise<void>;
  toggleEmployeeActive: (id: string, currentRole: ExtendedRole) => Promise<void>;
  refetchEmployees: () => Promise<void>;
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;
}

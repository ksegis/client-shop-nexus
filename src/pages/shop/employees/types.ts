
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

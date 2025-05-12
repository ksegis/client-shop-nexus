
// Define the base role types
export type BaseRole = 'customer' | 'staff' | 'admin';

// Define the extended role type that includes inactive roles
export type ExtendedRole = BaseRole | `inactive_${Exclude<BaseRole, 'customer'>}`;

export type Employee = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: ExtendedRole;
  created_at: string;
  updated_at: string;
};

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

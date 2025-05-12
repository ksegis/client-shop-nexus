
import { Employee } from './types';
import { EmployeeFormUpdateValues, FormRole } from './employeeFormSchema';

// Helper function to get base role (remove inactive_ prefix)
export const getBaseRole = (role: string): FormRole => {
  if (role === 'inactive_staff') return 'staff';
  if (role === 'inactive_admin') return 'admin';
  return role === 'admin' ? 'admin' : 'staff';
};

// Helper function to check if a role is inactive
export const isRoleInactive = (role: string): boolean => {
  return role === 'inactive_staff' || role === 'inactive_admin';
};

// Helper function to get form values from employee data
export const getEmployeeFormValues = (employee: Employee | null): EmployeeFormUpdateValues => {
  if (!employee) {
    return {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'staff',
      password: ''
    };
  }

  return {
    first_name: employee.first_name || '',
    last_name: employee.last_name || '',
    email: employee.email,
    phone: employee.phone || '',
    role: getBaseRole(employee.role),
    password: ''
  };
};


import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Employee, EmployeesContextType, ExtendedRole } from './types';
import { useEmployeesQuery } from './useEmployeesQuery';
import { useEmployeeOperations } from './employeeOperations';

const EmployeesContext = createContext<EmployeesContextType | undefined>(undefined);

export function EmployeesProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  console.log('Initializing EmployeesProvider');
  const { data: employees = [], isLoading, refetch } = useEmployeesQuery();
  
  console.log('Employees fetched:', employees.length);
  
  // Set error from the query if it fails
  React.useEffect(() => {
    return () => {
      setError(null);
    };
  }, []);

  const refetchEmployees = async () => {
    console.log('Refetching employees...');
    await refetch();
  };

  const { createEmployee, updateEmployee, toggleEmployeeActive } = useEmployeeOperations(refetchEmployees);

  return (
    <EmployeesContext.Provider
      value={{
        employees,
        isLoading,
        error,
        createEmployee,
        updateEmployee,
        toggleEmployeeActive,
        refetchEmployees,
        selectedEmployeeId,
        setSelectedEmployeeId
      }}
    >
      {children}
    </EmployeesContext.Provider>
  );
}

export function useEmployees() {
  const context = useContext(EmployeesContext);
  if (context === undefined) {
    throw new Error('useEmployees must be used within an EmployeesProvider');
  }
  return context;
}

// Export the useEmployeesContext as an alias of useEmployees to maintain compatibility
export const useEmployeesContext = useEmployees;

// Re-export types
export type { Employee, ExtendedRole, BaseRole } from './types';

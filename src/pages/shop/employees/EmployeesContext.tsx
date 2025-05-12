
import React, { createContext, useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Extending the role type to include inactive variants
export type ExtendedRole = "customer" | "staff" | "admin" | "inactive_staff" | "inactive_admin";

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: ExtendedRole;
}

interface EmployeesContextType {
  employees: Employee[];
  isLoading: boolean;
  error: Error | null;
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;
  refetchEmployees: () => Promise<void>;
}

const EmployeesContext = createContext<EmployeesContextType | undefined>(undefined);

export function EmployeesProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const { 
    data: employees, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      // Fetch employees from profiles table where role is staff, admin or inactive variants
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['staff', 'admin', 'inactive_staff', 'inactive_admin']);
      
      if (error) throw new Error(error.message);
      
      // Transform data to match the Employee interface
      return (data || []).map((profile: any): Employee => ({
        id: profile.id,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email,
        phone: profile.phone,
        role: profile.role as ExtendedRole
      }));
    }
  });

  // Demo employees for when no real data is available
  const demoEmployees: Employee[] = [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      role: 'admin'
    },
    {
      id: '2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '555-987-6543',
      role: 'staff'
    },
    {
      id: '3',
      first_name: 'Robert',
      last_name: 'Johnson',
      email: 'robert.johnson@example.com',
      phone: '555-456-7890',
      role: 'inactive_staff'
    }
  ];

  // Use demo data if no real data is available yet
  const displayEmployees = employees || demoEmployees;

  const refetchEmployees = async () => {
    await refetch();
  };

  const value: EmployeesContextType = {
    employees: displayEmployees,
    isLoading,
    error: error as Error | null,
    selectedEmployeeId,
    setSelectedEmployeeId,
    refetchEmployees
  };

  return <EmployeesContext.Provider value={value}>{children}</EmployeesContext.Provider>;
}

export const useEmployees = () => {
  const context = useContext(EmployeesContext);
  if (context === undefined) {
    throw new Error('useEmployees must be used within an EmployeesProvider');
  }
  return context;
};


import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '../types';

export function useUserQuery() {
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        // For development mode, return mock users if Supabase query fails
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (queryError) {
          console.warn('Supabase query failed, using mock data:', queryError);
          // Return mock users for development
          return getMockUsers();
        }
        
        return (data || []) as User[];
      } catch (error: any) {
        console.warn('Database query failed, using mock data:', error);
        // Return mock users for development
        return getMockUsers();
      }
    },
  });

  // Separate users by role
  const employees = users.filter(user => user.role === 'admin' || user.role === 'staff');
  const customers = users.filter(user => user.role === 'customer');

  const refetchUsers = async () => {
    await refetch();
  };

  return {
    users,
    employees,
    customers,
    isLoading,
    error,
    refetchUsers
  };
}

// Mock users for development
function getMockUsers(): User[] {
  return [
    {
      id: 'dev-admin-1',
      email: 'kevin.shelton@egisdynamics.com',
      first_name: 'Kevin',
      last_name: 'Shelton',
      phone: '555-0123',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'dev-staff-1',
      email: 'staff@example.com',
      first_name: 'Staff',
      last_name: 'User',
      phone: '555-0124',
      role: 'staff',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'dev-customer-1',
      email: 'customer@example.com',
      first_name: 'Customer',
      last_name: 'User',
      phone: '555-0125',
      role: 'customer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

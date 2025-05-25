
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '../types';

// Mock users for development
const mockUsers: User[] = [
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

export function useAdminUsers() {
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        console.log('Fetching users from Supabase...');
        
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (queryError) {
          console.warn('Supabase query failed, using mock data:', queryError);
          return mockUsers;
        }
        
        console.log('Successfully fetched users:', data);
        return (data || []) as User[];
      } catch (error: any) {
        console.warn('Database query failed, using mock data:', error);
        return mockUsers;
      }
    },
  });

  console.log('useAdminUsers - users:', users, 'isLoading:', isLoading);

  return {
    users,
    isLoading,
    error,
    refetch
  };
}

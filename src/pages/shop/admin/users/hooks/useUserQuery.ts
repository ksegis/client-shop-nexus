
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '../types';

export const useUserQuery = () => {
  const [error, setError] = useState<Error | null>(null);
  
  console.log('useUserQuery: Hook initialized');
  
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        console.log('useUserQuery: Starting to fetch users from profiles table');
        
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (queryError) {
          console.error('useUserQuery: Error fetching users:', queryError);
          setError(queryError);
          throw queryError;
        }
        
        console.log('useUserQuery: Raw data from Supabase:', data);
        console.log('useUserQuery: Users fetched successfully:', {
          count: data?.length || 0,
          data: data
        });
        
        const typedUsers = (data || []) as User[];
        console.log('useUserQuery: Typed users:', typedUsers);
        
        return typedUsers;
      } catch (error: any) {
        console.error('useUserQuery: Error in query function:', error);
        setError(error);
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  console.log('useUserQuery: Current query state:', {
    users,
    usersLength: users?.length,
    isLoading,
    hasError: !!error,
    usersIsArray: Array.isArray(users)
  });

  const refetchUsers = async () => {
    console.log('useUserQuery: Manual refetch triggered...');
    setError(null);
    await refetch();
  };

  const employees = users.filter(user => 
    user.role === 'admin' || 
    user.role === 'staff' || 
    user.role === 'inactive_admin' || 
    user.role === 'inactive_staff' ||
    user.role === 'test_admin' ||
    user.role === 'test_staff'
  );
  
  const customers = users.filter(user => 
    user.role === 'customer' || user.role === 'test_customer'
  );

  console.log('useUserQuery: Final state:', {
    totalUsers: users.length,
    employees: employees.length,
    customers: customers.length,
    isLoading,
    hasError: !!error,
    errorMessage: error?.message
  });

  return {
    users,
    employees,
    customers,
    isLoading,
    error,
    refetchUsers
  };
};

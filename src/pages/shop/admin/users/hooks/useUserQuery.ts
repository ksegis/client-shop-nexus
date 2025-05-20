
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '../types';

export const useUserQuery = () => {
  const [error, setError] = useState<Error | null>(null);
  
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        console.log('Fetching users from profiles table');
        
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (queryError) {
          console.error('Error fetching users:', queryError);
          throw queryError;
        }
        
        console.log('Users fetched:', data?.length || 0);
        return (data || []) as User[];
      } catch (error: any) {
        console.error('Error in useUserQuery:', error);
        setError(error);
        throw error;
      }
    },
  });

  const refetchUsers = async () => {
    console.log('Refetching users...');
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

  return {
    users,
    employees,
    customers,
    isLoading,
    error,
    refetchUsers
  };
};

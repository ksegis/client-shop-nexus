
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
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (queryError) throw queryError;
        
        return (data || []) as User[];
      } catch (error: any) {
        setError(error);
        throw error;
      }
    },
  });

  const refetchUsers = async () => {
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


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { User } from '../types';

export const useUserQuery = () => {
  const [error, setError] = useState<Error | null>(null);
  const { user, profile } = useAuth();
  
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        console.log('useUserQuery: Fetching users from profiles table');
        
        // Get current session to ensure we're authenticated
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          throw new Error('No active session found');
        }
        
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (queryError) {
          console.error('useUserQuery: Error fetching users:', queryError);
          setError(queryError);
          throw queryError;
        }
        
        console.log('useUserQuery: Successfully fetched', data?.length || 0, 'users');
        
        const typedUsers = (data || []) as User[];
        return typedUsers;
      } catch (error: any) {
        console.error('useUserQuery: Error in query function:', error);
        setError(error);
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    // Only run query if we have an authenticated admin user
    enabled: !!(user && profile && profile.role === 'admin'),
  });

  const refetchUsers = async () => {
    console.log('useUserQuery: Manual refetch triggered');
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

  return {
    users,
    employees,
    customers,
    isLoading,
    error,
    refetchUsers
  };
};

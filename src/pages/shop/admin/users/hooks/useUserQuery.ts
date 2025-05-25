
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { User } from '../types';

export const useUserQuery = () => {
  const [error, setError] = useState<Error | null>(null);
  const { user, profile } = useAuth();
  
  console.log('useUserQuery: Hook initialized with auth state:', {
    hasUser: !!user,
    hasProfile: !!profile,
    userRole: profile?.role,
    userId: user?.id
  });
  
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        console.log('useUserQuery: Starting to fetch users from profiles table');
        console.log('useUserQuery: Current auth state:', {
          user: user ? { id: user.id, email: user.email } : null,
          profile: profile ? { id: profile.id, role: profile.role } : null
        });
        
        // Get current session to ensure we're authenticated
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('useUserQuery: Session check:', { 
          hasSession: !!sessionData.session,
          sessionError,
          accessToken: sessionData.session?.access_token ? 'present' : 'missing'
        });
        
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
    // Only run query if we have an authenticated admin user
    enabled: !!(user && profile && profile.role === 'admin'),
  });

  console.log('useUserQuery: Current query state:', {
    users,
    usersLength: users?.length,
    isLoading,
    hasError: !!error,
    usersIsArray: Array.isArray(users),
    queryEnabled: !!(user && profile && profile.role === 'admin'),
    authState: {
      hasUser: !!user,
      hasProfile: !!profile,
      userRole: profile?.role
    }
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
    errorMessage: error?.message,
    queryEnabled: !!(user && profile && profile.role === 'admin')
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


import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Employee, ExtendedRole } from './types';
import { Database } from '@/integrations/supabase/types-extensions';

export const useEmployeesQuery = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        // Define our allowed roles explicitly
        const allowedRoles: ExtendedRole[] = ['staff', 'admin', 'inactive_staff', 'inactive_admin'];
        
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .in('role', allowedRoles as unknown as Array<Database['public']['Enums']['user_role']>)
          .order('created_at', { ascending: false });
          
        if (queryError) throw queryError;
        
        return (data || []) as Employee[];
      } catch (error) {
        throw error;
      }
    },
  });
};

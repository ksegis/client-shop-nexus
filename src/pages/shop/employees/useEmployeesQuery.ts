
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Employee, ExtendedRole } from './types';
import { DatabaseUserRole } from '@/integrations/supabase/types-extensions';

export const useEmployeesQuery = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        // Define our allowed roles - including both active and inactive roles
        const allowedRoles: ExtendedRole[] = [
          'staff', 'admin', 'inactive_staff', 'inactive_admin'
        ];
        
        // Use 'in' with a type cast to string[] to avoid TypeScript errors
        // This is safe because our database accepts these role values
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .in('role', allowedRoles as string[]);
          
        if (queryError) throw queryError;
        
        return (data || []) as Employee[];
      } catch (error) {
        throw error;
      }
    },
  });
};

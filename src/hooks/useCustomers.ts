
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

export function useCustomers() {
  const [error, setError] = useState<Error | null>(null);

  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'customer')
          .order('created_at', { ascending: false });
          
        if (queryError) throw queryError;
        
        return (data as Customer[]) || [];
      } catch (err) {
        setError(err as Error);
        return [];
      }
    },
  });

  const fetchCustomerById = async (id: string) => {
    try {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (queryError) throw queryError;
      
      return data as Customer;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to fetch customer: ${(err as Error).message}`,
      });
      throw err;
    }
  };

  return {
    customers,
    isLoading,
    error,
    refetch,
    fetchCustomerById
  };
}

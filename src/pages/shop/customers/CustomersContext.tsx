
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Customer = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

interface CustomersContextType {
  customers: Customer[];
  isLoading: boolean;
  error: Error | null;
  createCustomer: (customer: Partial<Customer>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  refreshCustomers: () => Promise<void>;
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

export function CustomersProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
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
        
        return (data || []) as Customer[];
      } catch (error) {
        setError(error as Error);
        return [];
      }
    },
  });

  const createCustomer = async (customer: Partial<Customer>) => {
    try {
      // First create an auth user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: customer.email || '',
        password: Math.random().toString(36).slice(-10), // generate random password
        options: {
          data: {
            first_name: customer.first_name || '',
            last_name: customer.last_name || '',
          },
        }
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('Failed to create user');
      }
      
      // Update the profile with additional information
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone: customer.phone || '',
          role: 'customer'
        })
        .eq('id', authData.user.id);
      
      if (updateError) throw updateError;
      
      await refetch();
      toast({
        title: "Success",
        description: "Customer profile created successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create customer: ${(error as Error).message}`,
      });
      throw error;
    }
  };

  const updateCustomer = async (id: string, updatedCustomer: Partial<Customer>) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatedCustomer)
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      await refetch();
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update customer: ${(error as Error).message}`,
      });
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      // We only need to delete the auth user, 
      // the profile will be automatically deleted via cascade
      const { error: adminDeleteError } = await supabase.auth.admin.deleteUser(id);
      
      if (adminDeleteError) {
        // If admin delete fails, just delete the profile
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);
        
        if (deleteError) throw deleteError;
      }
      
      await refetch();
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete customer: ${(error as Error).message}`,
      });
      throw error;
    }
  };

  const refreshCustomers = async () => {
    await refetch();
  };

  return (
    <CustomersContext.Provider
      value={{
        customers,
        isLoading,
        error,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        refreshCustomers
      }}
    >
      {children}
    </CustomersContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomersContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomersProvider');
  }
  return context;
}

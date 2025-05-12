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
      // Instead of using auth.admin.createUser, we'll just insert the customer profile
      // Set role to customer and ensure required fields
      const customerData = { 
        ...customer, 
        role: 'customer' as const,
        // Generate a UUID for the customer - this will be their future auth ID
        id: crypto.randomUUID(),
        // Ensure email is not undefined
        email: customer.email || ''    
      };
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(customerData);
      
      if (insertError) throw insertError;
      
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
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
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

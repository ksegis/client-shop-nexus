
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Invoice, InvoiceStatus } from '@/pages/shop/invoices/types';

interface CustomerInvoicesContextType {
  invoices: Invoice[];
  isLoading: boolean;
  error: Error | null;
  refreshInvoices: () => Promise<void>;
}

const CustomerInvoicesContext = createContext<CustomerInvoicesContextType | undefined>(undefined);

export function CustomerInvoicesProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const { data: invoices = [], isLoading, refetch } = useQuery({
    queryKey: ['customer-invoices', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) return [];
        
        const { data, error: queryError } = await supabase
          .from('invoices')
          .select(`
            *,
            vehicles (
              make,
              model,
              year
            )
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });
          
        if (queryError) throw queryError;
        
        return (data as Invoice[]) || [];
      } catch (error) {
        setError(error as Error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const refreshInvoices = async () => {
    await refetch();
  };

  return (
    <CustomerInvoicesContext.Provider
      value={{
        invoices,
        isLoading,
        error,
        refreshInvoices
      }}
    >
      {children}
    </CustomerInvoicesContext.Provider>
  );
}

export function useCustomerInvoices() {
  const context = useContext(CustomerInvoicesContext);
  if (context === undefined) {
    throw new Error('useCustomerInvoices must be used within a CustomerInvoicesProvider');
  }
  return context;
}

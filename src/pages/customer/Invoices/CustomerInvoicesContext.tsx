
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
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
        
        // For mock user, return mock data
        if (user.id === 'mock-user-id') {
          return [
            {
              id: 'mock-invoice-1',
              title: 'Oil Change Service',
              description: 'Regular maintenance service',
              total_amount: 89.99,
              status: 'paid' as InvoiceStatus,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              customer_id: 'mock-user-id',
              vehicle_id: 'mock-vehicle-1',
              vehicles: {
                make: 'Toyota',
                model: 'Camry',
                year: 2020
              }
            },
            {
              id: 'mock-invoice-2',
              title: 'Brake Pad Replacement',
              description: 'Front brake pads replacement',
              total_amount: 249.99,
              status: 'pending' as InvoiceStatus,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              customer_id: 'mock-user-id',
              vehicle_id: 'mock-vehicle-2',
              vehicles: {
                make: 'Honda',
                model: 'Civic',
                year: 2019
              }
            }
          ];
        }
        
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

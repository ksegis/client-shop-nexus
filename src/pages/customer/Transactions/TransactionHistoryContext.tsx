
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  customer_id: string;
  amount: number;
  description: string;
  status: TransactionStatus;
  payment_method: string;
  created_at: string;
  invoice_id?: string;
}

interface TransactionHistoryContextType {
  transactions: Transaction[];
  isLoading: boolean;
  error: Error | null;
  refreshTransactions: () => Promise<void>;
}

const TransactionHistoryContext = createContext<TransactionHistoryContextType | undefined>(undefined);

export function TransactionHistoryProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ['customer-transactions', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) return [];
        
        // Fetch completed payments for this customer
        const { data, error: queryError } = await supabase
          .from('transactions')
          .select(`
            *,
            invoices (
              id,
              title
            )
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });
          
        if (queryError) throw queryError;
        
        return (data as Transaction[]) || [];
      } catch (error) {
        setError(error as Error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const refreshTransactions = async () => {
    await refetch();
  };

  return (
    <TransactionHistoryContext.Provider
      value={{
        transactions,
        isLoading,
        error,
        refreshTransactions
      }}
    >
      {children}
    </TransactionHistoryContext.Provider>
  );
}

export function useTransactionHistory() {
  const context = useContext(TransactionHistoryContext);
  if (context === undefined) {
    throw new Error('useTransactionHistory must be used within a TransactionHistoryProvider');
  }
  return context;
}

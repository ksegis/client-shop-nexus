
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Define Transaction type
interface Transaction {
  id: string;
  created_at: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  status: string;
  description?: string;
  invoice_title?: string;
}

interface TransactionHistoryContextType {
  transactions: Transaction[];
  loading: boolean;
  error: Error | null;
}

const TransactionHistoryContext = createContext<TransactionHistoryContextType>({
  transactions: [],
  loading: false,
  error: null,
});

export const useTransactionHistory = () => useContext(TransactionHistoryContext);

export const TransactionHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        
        // For now, we'll fetch invoices and use them as transactions
        // since we don't have a dedicated transactions table yet
        const { data, error: fetchError } = await supabase
          .from('invoices')
          .select('id, created_at, title, total_amount, status, customer_id')
          .eq('customer_id', user.id);

        if (fetchError) throw fetchError;

        // Convert invoices to transactions format
        const formattedTransactions: Transaction[] = data.map(invoice => ({
          id: invoice.id,
          created_at: invoice.created_at,
          invoice_id: invoice.id,
          amount: invoice.total_amount,
          payment_method: 'Credit Card', // Default value for now
          status: invoice.status === 'paid' ? 'completed' : 'pending',
          description: 'Payment for invoice',
          invoice_title: invoice.title
        }));

        setTransactions(formattedTransactions);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
        toast({
          title: 'Error',
          description: 'Failed to load transaction history.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user, toast]);

  return (
    <TransactionHistoryContext.Provider value={{ transactions, loading, error }}>
      {children}
    </TransactionHistoryContext.Provider>
  );
};


import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/auth';
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
        
        // Check if we're using a mock user ID (for development)
        if (user.id === 'mock-user-id') {
          // Return mock data for development
          setTransactions([
            {
              id: '1',
              created_at: new Date().toISOString(),
              invoice_id: 'inv-001',
              amount: 249.99,
              payment_method: 'Credit Card',
              status: 'completed',
              description: 'Oil change and tire rotation',
              invoice_title: 'Regular Maintenance'
            },
            {
              id: '2',
              created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              invoice_id: 'inv-002',
              amount: 149.50,
              payment_method: 'Debit Card',
              status: 'pending',
              description: 'Brake inspection',
              invoice_title: 'Brake Service'
            }
          ]);
          return;
        }
        
        // For real users, fetch from Supabase
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
        console.error('Transaction fetch error:', err);
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

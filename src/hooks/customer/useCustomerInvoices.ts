
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';

// Helper function to check if a userId is a valid UUID
const isValidUuid = (id: string): boolean => {
  return id?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) !== null;
};

export const useCustomerInvoices = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.id) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // For test/mock users, provide mock data
        if (!isValidUuid(user.id)) {
          console.log(`Using mock invoices for non-UUID user: ${user.id}`);
          
          const mockInvoices = [
            {
              id: 'mock-inv-1',
              title: 'Brake Service Invoice',
              status: 'paid',
              total_amount: 450.75,
              created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              vehicles: {
                make: 'Toyota',
                model: 'Camry',
                year: 2020
              },
              invoice_items: [
                {
                  id: 'mock-item-1',
                  description: 'Front Brake Pads',
                  quantity: 1,
                  price: 120,
                  part_number: 'BP-2234'
                },
                {
                  id: 'mock-item-2',
                  description: 'Brake Labor',
                  quantity: 2,
                  price: 165.38,
                  part_number: null
                }
              ]
            },
            {
              id: 'mock-inv-2',
              title: 'Oil Change Invoice',
              status: 'unpaid',
              total_amount: 85.99,
              created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              vehicles: {
                make: 'Toyota',
                model: 'Camry',
                year: 2020
              },
              invoice_items: [
                {
                  id: 'mock-item-3',
                  description: 'Synthetic Oil',
                  quantity: 1,
                  price: 45.99,
                  part_number: 'OIL-5W30'
                },
                {
                  id: 'mock-item-4',
                  description: 'Oil Change Labor',
                  quantity: 1,
                  price: 40,
                  part_number: null
                }
              ]
            }
          ];
          
          setInvoices(mockInvoices);
          setLoading(false);
          return;
        }
        
        // For real users, fetch from database
        const { data, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            *,
            vehicles (
              make,
              model,
              year
            ),
            invoice_items (
              id,
              description,
              quantity,
              price,
              part_number,
              vendor
            )
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });
          
        if (invoicesError) throw invoicesError;
        
        setInvoices(data || []);
      } catch (err: any) {
        console.error('Error fetching invoices:', err);
        setError(err);
        toast({
          variant: "destructive",
          title: "Error loading invoices",
          description: err.message || "Failed to load your invoices"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoices();
  }, [user?.id, toast]);
  
  return { invoices, loading, error };
};

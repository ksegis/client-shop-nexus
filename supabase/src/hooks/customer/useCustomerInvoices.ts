
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { toast } from '@/hooks/use-toast';

export function useCustomerInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  // Helper function to check if a userId is a valid UUID
  const isValidUuid = (id: string): boolean => {
    return id?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) !== null;
  };

  const fetchInvoices = async () => {
    if (!user) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // For non-UUID user IDs (mock or test users), return mock invoices
      if (!isValidUuid(user.id)) {
        console.log(`Using mock invoice data for non-UUID user ID: ${user.id}`);
        
        // Return mock invoice data for test/mock users
        const mockInvoices = [
          {
            id: 'mock-invoice-1',
            customer_id: user.id,
            vehicle_id: 'mock-vehicle-1',
            title: 'Oil Change Service',
            description: 'Regular maintenance service including oil change and filter replacement',
            total_amount: 89.99,
            status: 'pending',
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            vehicles: {
              make: 'Toyota',
              model: 'Camry',
              year: 2020
            }
          },
          {
            id: 'mock-invoice-2',
            customer_id: user.id,
            vehicle_id: 'mock-vehicle-2',
            title: 'Brake Pad Replacement',
            description: 'Front and rear brake pad replacement with inspection',
            total_amount: 349.99,
            status: 'paid',
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            vehicles: {
              make: 'Honda',
              model: 'CR-V',
              year: 2019
            }
          },
          {
            id: 'mock-invoice-3',
            customer_id: user.id,
            vehicle_id: 'mock-vehicle-1',
            title: 'Tire Rotation',
            description: 'Tire rotation and balance service',
            total_amount: 69.99,
            status: 'overdue',
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            vehicles: {
              make: 'Toyota',
              model: 'Camry',
              year: 2020
            }
          }
        ];
        
        setInvoices(mockInvoices);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          vehicles(make, model, year),
          invoice_items(id, description, quantity, price, part_number, vendor)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
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

  const payInvoice = async (invoiceId: string) => {
    if (!user) return;
    
    // For test users, we'll just update the mock data
    if (!isValidUuid(user.id)) {
      setInvoices(prev => 
        prev.map(invoice => 
          invoice.id === invoiceId 
            ? { ...invoice, status: 'paid', updated_at: new Date().toISOString() }
            : invoice
        )
      );
      
      toast({
        title: "Payment successful",
        description: "Your invoice has been marked as paid."
      });
      
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', invoiceId)
        .eq('customer_id', user.id)
        .select();
        
      if (error) throw error;
      
      // Update local state
      setInvoices(prev => 
        prev.map(invoice => 
          invoice.id === invoiceId 
            ? { ...invoice, status: 'paid', updated_at: new Date().toISOString() }
            : invoice
        )
      );
      
      toast({
        title: "Payment successful",
        description: "Your invoice has been marked as paid."
      });
      
    } catch (err: any) {
      console.error('Error paying invoice:', err);
      
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: err.message || "Failed to process your payment"
      });
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    payInvoice
  };
}

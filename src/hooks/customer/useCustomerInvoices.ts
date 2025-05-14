
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceWithDetails = Invoice & {
  vehicles: {
    make: string;
    model: string;
    year: number;
  } | null;
  invoice_items: {
    id: string;
    description: string;
    quantity: number;
    price: number;
    part_number?: string;
    vendor?: string;
  }[];
};

export const useCustomerInvoices = () => {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch invoices for the current user
  const fetchInvoices = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
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
        
      if (error) throw error;
      
      setInvoices(data || []);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Error fetching invoices',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to realtime updates for invoices
  useEffect(() => {
    if (!user) return;
    
    fetchInvoices();
    
    // Set up realtime subscription
    const invoicesChannel = supabase
      .channel('customer-invoices')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'invoices',
          filter: `customer_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Realtime invoice update:', payload);
          fetchInvoices(); // Refresh invoices when changes occur
          
          // Show notification for new invoices
          if (payload.eventType === 'INSERT') {
            toast({
              title: 'New Invoice Available',
              description: 'You have a new invoice to review',
              variant: 'default',
            });
          }
          
          // Show notification for updated invoices
          if (payload.eventType === 'UPDATE') {
            toast({
              title: 'Invoice Updated',
              description: 'An invoice has been updated',
              variant: 'default',
            });
          }
        }
      )
      .subscribe();
      
    // Also subscribe to invoice_items changes
    const itemsChannel = supabase
      .channel('customer-invoice-items')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'invoice_items'
        }, 
        () => {
          fetchInvoices(); // Refresh invoices when line items change
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(invoicesChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [user, toast]);

  // Function to pay an invoice (placeholder for payment integration)
  const payInvoice = async (invoiceId: string) => {
    if (!user) return;
    
    try {
      // This is a placeholder - in a real application, this would integrate with a payment gateway
      // After payment success, we would update the invoice status
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId)
        .eq('customer_id', user.id);
        
      if (error) throw error;
      
      toast({
        title: 'Payment Successful',
        description: 'Your invoice has been paid',
        variant: 'default',
      });
      
      // Refresh invoices to update UI
      fetchInvoices();
      
      return true;
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Error',
        description: `Failed to process payment: ${error.message}`,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    invoices,
    loading,
    payInvoice,
    refreshInvoices: fetchInvoices
  };
};

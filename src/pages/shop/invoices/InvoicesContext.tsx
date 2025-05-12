
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Invoice, InvoiceStatus } from './types';

interface InvoicesContextType {
  invoices: Invoice[];
  isLoading: boolean;
  error: Error | null;
  createInvoice: (invoice: { 
    customer_id: string;
    vehicle_id: string;
    title: string;
    description?: string;
    total_amount?: number;
    status?: InvoiceStatus;
    estimate_id?: string;
  }) => Promise<void>;
  updateInvoice: (id: string, invoice: {
    title?: string;
    description?: string;
    total_amount?: number;
    status?: InvoiceStatus;
  }) => Promise<void>;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  refreshInvoices: () => Promise<void>;
}

const InvoicesContext = createContext<InvoicesContextType | undefined>(undefined);

export function InvoicesProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);

  const { data: invoices = [], isLoading, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('invoices')
          .select(`
            *,
            vehicles (
              make,
              model,
              year
            ),
            profiles!invoices_customer_id_fkey (
              first_name,
              last_name,
              email
            )
          `)
          .order('created_at', { ascending: false });
          
        if (queryError) throw queryError;
        
        return (data as Invoice[]) || [];
      } catch (error) {
        setError(error as Error);
        return [];
      }
    },
  });

  const createInvoice = async (invoice: { 
    customer_id: string;
    vehicle_id: string;
    title: string;
    description?: string;
    total_amount?: number;
    status?: InvoiceStatus;
    estimate_id?: string;
  }) => {
    try {
      // Type assertion to ensure compatibility with database enum
      const status = invoice.status || 'draft';
      
      const { error: insertError } = await supabase
        .from('invoices')
        .insert({
          customer_id: invoice.customer_id,
          vehicle_id: invoice.vehicle_id,
          title: invoice.title,
          description: invoice.description,
          total_amount: invoice.total_amount || 0,
          status: status,
          estimate_id: invoice.estimate_id
        });
      
      if (insertError) throw insertError;
      
      await refetch();
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create invoice: ${(error as Error).message}`,
      });
      throw error;
    }
  };

  const updateInvoice = async (id: string, invoice: {
    title?: string;
    description?: string;
    total_amount?: number;
    status?: InvoiceStatus;
  }) => {
    try {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          title: invoice.title,
          description: invoice.description,
          total_amount: invoice.total_amount,
          status: invoice.status
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      await refetch();
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update invoice: ${(error as Error).message}`,
      });
      throw error;
    }
  };

  const updateInvoiceStatus = async (id: string, status: InvoiceStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      await refetch();
      toast({
        title: "Success",
        description: `Invoice status updated to ${status}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update invoice status: ${(error as Error).message}`,
      });
      throw error;
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      await refetch();
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete invoice: ${(error as Error).message}`,
      });
      throw error;
    }
  };

  const refreshInvoices = async () => {
    await refetch();
  };

  return (
    <InvoicesContext.Provider
      value={{
        invoices,
        isLoading,
        error,
        createInvoice,
        updateInvoice,
        updateInvoiceStatus,
        deleteInvoice,
        refreshInvoices
      }}
    >
      {children}
    </InvoicesContext.Provider>
  );
}

export function useInvoices() {
  const context = useContext(InvoicesContext);
  if (context === undefined) {
    throw new Error('useInvoices must be used within an InvoicesProvider');
  }
  return context;
}

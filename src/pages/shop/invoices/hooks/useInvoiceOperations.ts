
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Invoice, InvoiceStatus, InvoiceLineItem } from '../types';

export function useInvoiceOperations() {
  const [error, setError] = useState<Error | null>(null);

  // Helper function to map application status to database status
  const mapStatusToDbStatus = (status?: InvoiceStatus): 'draft' | 'pending' | 'paid' | 'overdue' => {
    if (!status) return 'draft';
    
    // Convert 'sent' to 'pending' and 'void' to 'draft' for database compatibility
    switch (status) {
      case 'sent': 
        return 'pending'; 
      case 'void': 
        return 'draft';
      default:
        return status as 'draft' | 'paid' | 'overdue';
    }
  };

  const fetchInvoices = async () => {
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
      
      // Fetch line items for each invoice
      if (data && data.length > 0) {
        const invoicesWithLineItems = await Promise.all(data.map(async (invoice) => {
          const { data: lineItems } = await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', invoice.id);
            
          return {
            ...invoice,
            lineItems: lineItems || []
          };
        }));
        
        return invoicesWithLineItems as Invoice[];
      }
      
      return (data as Invoice[]) || [];
    } catch (error) {
      setError(error as Error);
      return [];
    }
  };

  const createInvoice = async (invoice: { 
    customer_id: string;
    vehicle_id: string;
    title: string;
    description?: string;
    total_amount?: number;
    status?: InvoiceStatus;
    estimate_id?: string;
    lineItems?: InvoiceLineItem[];
  }) => {
    try {
      const dbStatus = mapStatusToDbStatus(invoice.status);
      
      // First create the invoice
      const { data: invoiceData, error: insertError } = await supabase
        .from('invoices')
        .insert({
          customer_id: invoice.customer_id,
          vehicle_id: invoice.vehicle_id,
          title: invoice.title,
          description: invoice.description,
          total_amount: invoice.total_amount || 0,
          status: dbStatus,
          estimate_id: invoice.estimate_id
        })
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      
      // Then add any line items
      if (invoice.lineItems && invoice.lineItems.length > 0 && invoiceData) {
        const lineItemsToInsert = invoice.lineItems.map(item => ({
          invoice_id: invoiceData.id,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          part_number: item.part_number,
          vendor: item.vendor
        }));
        
        const { error: lineItemsError } = await supabase
          .from('invoice_items')
          .insert(lineItemsToInsert);
          
        if (lineItemsError) throw lineItemsError;
      }
      
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      
      return invoiceData?.id;
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
    lineItems?: InvoiceLineItem[];
  }) => {
    try {
      const dbStatus = invoice.status ? mapStatusToDbStatus(invoice.status) : undefined;
      
      const updatePayload = {
        title: invoice.title,
        description: invoice.description,
        total_amount: invoice.total_amount,
        status: dbStatus
      };

      // Update the invoice
      const { error: updateError } = await supabase
        .from('invoices')
        .update(updatePayload)
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Handle line items update if provided
      if (invoice.lineItems) {
        // First, delete existing line items for this invoice
        const { error: deleteError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', id);
          
        if (deleteError) throw deleteError;
        
        // Then, insert the new line items
        if (invoice.lineItems.length > 0) {
          const lineItemsToInsert = invoice.lineItems.map(item => ({
            invoice_id: id,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            part_number: item.part_number,
            vendor: item.vendor
          }));
          
          const { error: insertError } = await supabase
            .from('invoice_items')
            .insert(lineItemsToInsert);
            
          if (insertError) throw insertError;
        }
      }
      
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
      
      return true;
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
      const dbStatus = mapStatusToDbStatus(status);
      
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: dbStatus })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Success",
        description: `Invoice status updated to ${status}`,
      });
      
      return true;
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
      // First delete line items
      const { error: deleteLineItemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);
      
      if (deleteLineItemsError) throw deleteLineItemsError;
      
      // Then delete the invoice
      const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
      
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete invoice: ${(error as Error).message}`,
      });
      throw error;
    }
  };

  return {
    error,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice
  };
}

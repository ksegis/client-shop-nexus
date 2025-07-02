
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Invoice, InvoiceStatus, InvoiceLineItem } from './types';
import { useInvoiceOperations } from './hooks/useInvoiceOperations';

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
    lineItems?: InvoiceLineItem[];
  }) => Promise<void>;
  updateInvoice: (id: string, invoice: {
    title?: string;
    description?: string;
    total_amount?: number;
    status?: InvoiceStatus;
    lineItems?: InvoiceLineItem[];
  }) => Promise<void>;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  refreshInvoices: () => Promise<void>;
}

const InvoicesContext = createContext<InvoicesContextType | undefined>(undefined);

export function InvoicesProvider({ children }: { children: ReactNode }) {
  const {
    error,
    fetchInvoices,
    createInvoice: createInvoiceOperation,
    updateInvoice: updateInvoiceOperation,
    updateInvoiceStatus: updateInvoiceStatusOperation,
    deleteInvoice: deleteInvoiceOperation
  } = useInvoiceOperations();

  const { data: invoices = [], isLoading, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
  });

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
    await createInvoiceOperation(invoice);
    await refetch();
  };

  const updateInvoice = async (id: string, invoice: {
    title?: string;
    description?: string;
    total_amount?: number;
    status?: InvoiceStatus;
    lineItems?: InvoiceLineItem[];
  }) => {
    await updateInvoiceOperation(id, invoice);
    await refetch();
  };

  const updateInvoiceStatus = async (id: string, status: InvoiceStatus) => {
    await updateInvoiceStatusOperation(id, status);
    await refetch();
  };

  const deleteInvoice = async (id: string) => {
    await deleteInvoiceOperation(id);
    await refetch();
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

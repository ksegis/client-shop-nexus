import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of your invoice data
interface Invoice {
  id: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid' | 'overdue';
  // Add other invoice properties as needed
}

// Define the context type
interface InvoicesContextType {
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  getInvoiceById: (id: string) => Invoice | undefined;
}

// Create the context
const InvoicesContext = createContext<InvoicesContextType | undefined>(undefined);

// Provider component
export const InvoicesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const addInvoice = (invoiceData: Omit<Invoice, 'id'>) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: Date.now().toString(), // Simple ID generation
    };
    setInvoices(prev => [...prev, newInvoice]);
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices(prev => 
      prev.map(invoice => 
        invoice.id === id ? { ...invoice, ...updates } : invoice
      )
    );
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(invoice => invoice.id !== id));
  };

  const getInvoiceById = (id: string) => {
    return invoices.find(invoice => invoice.id === id);
  };

  const value: InvoicesContextType = {
    invoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceById,
  };

  return (
    <InvoicesContext.Provider value={value}>
      {children}
    </InvoicesContext.Provider>
  );
};

// Custom hook to use the context
export const useInvoices = () => {
  const context = useContext(InvoicesContext);
  if (!context) {
    throw new Error('useInvoices must be used within an InvoicesProvider');
  }
  return context;
};

export default InvoicesContext;
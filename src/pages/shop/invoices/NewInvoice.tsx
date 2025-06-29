import React from 'react';
import { InvoicesProvider } from './InvoicesContext';
import InvoiceForm from '../components/InvoiceForm';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const NewInvoice = () => {
  return (
    <InvoicesProvider>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Link 
            to="/shop/invoices"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create New Invoice</h1>
            <p className="text-muted-foreground">
              Generate a new invoice for your customer
            </p>
          </div>
        </div>

        {/* Invoice Form */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <InvoiceForm />
          </div>
        </div>
      </div>
    </InvoicesProvider>
  );
};

export default NewInvoice;

// Cache bust: Mon Jun  9 17:17:11 EDT 2025

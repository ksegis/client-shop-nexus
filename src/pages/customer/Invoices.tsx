
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight, Search, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCustomerInvoices } from '@/hooks/customer/useCustomerInvoices';

const CustomerInvoices = () => {
  const { invoices, loading, payInvoice } = useCustomerInvoices();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter invoices based on search query
  const filteredInvoices = invoices.filter(invoice => 
    invoice.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (invoice.vehicles && `${invoice.vehicles.year} ${invoice.vehicles.make} ${invoice.vehicles.model}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
      case 'sent':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'sent':
      case 'pending':
        return 'Unpaid';
      case 'paid':
        return 'Paid';
      case 'overdue':
        return 'Overdue';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handlePayNow = async (invoiceId: string) => {
    await payInvoice(invoiceId);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search invoices..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Service Invoices</CardTitle>
          <CardDescription>View and manage your payment invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading invoices...</p>
              </div>
            ) : filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => {
                const vehicleName = invoice.vehicles 
                  ? `${invoice.vehicles.year} ${invoice.vehicles.make} ${invoice.vehicles.model}` 
                  : 'Unknown Vehicle';
                  
                const isUnpaid = ['draft', 'sent', 'pending', 'overdue'].includes(invoice.status);
                  
                return (
                  <div 
                    key={invoice.id} 
                    className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 hidden sm:block">
                        <FileText className="h-8 w-8 text-blue-500" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-medium">{invoice.title}</h3>
                        <p className="text-sm text-gray-500">{vehicleName}</p>
                        <p className="text-xs text-gray-400">Date: {new Date(invoice.created_at).toLocaleDateString()}</p>
                        <div className="md:hidden flex items-center justify-between mt-2">
                          <Badge className={getStatusColor(invoice.status)}>
                            {getStatusDisplay(invoice.status)}
                          </Badge>
                          <span className="font-bold">${invoice.total_amount?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-6">
                      <Badge className={getStatusColor(invoice.status)}>
                        {getStatusDisplay(invoice.status)}
                      </Badge>
                      <span className="font-bold w-24 text-right">${invoice.total_amount?.toFixed(2)}</span>
                      <Button variant="ghost" size="sm" asChild className="ml-2">
                        <Link to={`/customer/invoices/${invoice.id}`}>
                          <span className="sr-only">View invoice</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="md:hidden mt-4 grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link to={`/customer/invoices/${invoice.id}`}>
                          View Details
                        </Link>
                      </Button>
                      {isUnpaid && (
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => handlePayNow(invoice.id)}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                    
                    {isUnpaid && (
                      <div className="hidden md:block">
                        <Button 
                          size="sm"
                          onClick={() => handlePayNow(invoice.id)}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay Now
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium">No Invoices Yet</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  You don't have any invoices yet.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerInvoices;


import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight, Search, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CustomerInvoices = () => {
  // Mock invoices data
  const invoices = [
    {
      id: 'inv-001',
      title: 'Brake Service',
      vehicle: '2023 Ford F-150',
      date: '2023-05-15',
      status: 'unpaid',
      total: 450.00
    },
    {
      id: 'inv-002',
      title: 'Oil Change + Tire Rotation',
      vehicle: '2023 Ford F-150',
      date: '2023-04-20',
      status: 'paid',
      total: 120.00
    },
    {
      id: 'inv-003',
      title: 'Transmission Service',
      vehicle: '2022 Chevrolet Silverado',
      date: '2023-03-30',
      status: 'paid',
      total: 850.00
    }
  ];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
            {invoices.length > 0 ? (
              invoices.map((invoice) => (
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
                      <p className="text-sm text-gray-500">{invoice.vehicle}</p>
                      <p className="text-xs text-gray-400">Date: {new Date(invoice.date).toLocaleDateString()}</p>
                      <div className="md:hidden flex items-center justify-between mt-2">
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                        <span className="font-bold">${invoice.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-6">
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                    <span className="font-bold w-24 text-right">${invoice.total.toFixed(2)}</span>
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
                    {invoice.status === 'unpaid' && (
                      <Button size="sm" className="w-full">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                  
                  {invoice.status === 'unpaid' && (
                    <div className="hidden md:block">
                      <Button size="sm">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay Now
                      </Button>
                    </div>
                  )}
                </div>
              ))
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

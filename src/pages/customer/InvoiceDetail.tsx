
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer, CreditCard, DownloadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const CustomerInvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    if (!id || !user) return;

    const fetchInvoice = async () => {
      try {
        setLoading(true);

        // Fetch invoice details
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select(`
            *,
            vehicles (
              make,
              model,
              year
            )
          `)
          .eq('id', id)
          .eq('customer_id', user.id)
          .single();

        if (invoiceError) throw invoiceError;

        // Fetch invoice items
        const { data: itemsData, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', id);

        if (itemsError) throw itemsError;

        // Calculate subtotal and tax
        const subtotal = itemsData.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const tax = subtotal * 0.05; // Assuming 5% tax rate

        setInvoice({
          ...invoiceData,
          items: itemsData,
          subtotal,
          tax,
          total: invoiceData.total_amount,
          dueDate: new Date(new Date(invoiceData.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: invoiceData.description || 'Thank you for your business! Payment is due within 30 days.'
        });

      } catch (error: any) {
        console.error('Error fetching invoice:', error);
        toast({
          title: 'Error',
          description: `Could not load invoice: ${error.message}`,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();

    // Set up realtime subscription
    const invoiceChannel = supabase
      .channel('single-invoice')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `id=eq.${id}`
        },
        () => {
          fetchInvoice(); // Refresh invoice when it changes
        }
      )
      .subscribe();

    // Also subscribe to invoice_items changes
    const itemsChannel = supabase
      .channel('single-invoice-items')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoice_items',
          filter: `invoice_id=eq.${id}`
        },
        () => {
          fetchInvoice(); // Refresh invoice when items change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(invoiceChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [id, user, toast]);
  
  const handlePayNow = () => {
    setShowPaymentDialog(true);
  };
  
  const processPayment = async () => {
    try {
      // In a real application, this would integrate with a payment processor
      // This is a simplified implementation that just updates the status
      
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', id)
        .eq('customer_id', user?.id);
        
      if (error) throw error;
      
      toast({
        title: 'Payment Successful',
        description: 'Your invoice has been paid',
      });
      
      setShowPaymentDialog(false);
      
      // Force refresh invoice data
      setInvoice({
        ...invoice,
        status: 'paid'
      });
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Payment Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: "Your invoice PDF is being downloaded.",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-64">
        <p className="text-muted-foreground">Loading invoice details...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-medium mb-2">Invoice Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested invoice could not be found or you don't have permission to view it.</p>
          <Button asChild variant="outline">
            <Link to="/customer/invoices">Back to Invoices</Link>
          </Button>
        </div>
      </div>
    );
  }

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

  const isUnpaid = ['draft', 'sent', 'pending', 'overdue'].includes(invoice.status);
  const vehicleName = invoice.vehicles 
    ? `${invoice.vehicles.year} ${invoice.vehicles.make} ${invoice.vehicles.model}` 
    : 'Unknown Vehicle';

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link to="/customer/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </Button>
        
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="w-fit" onClick={handleDownload}>
            <DownloadCloud className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" className="w-fit">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Invoice #{id?.substring(0, 8)}</h1>
        
        <Badge className={getStatusColor(invoice.status)}>
          {getStatusDisplay(invoice.status)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>Service and payment details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Date</h3>
                  <p>{new Date(invoice.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Vehicle</h3>
                  <p>{vehicleName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Invoice #</h3>
                  <p>{id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Due Date</h3>
                  <p>{new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 md:w-24">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24 md:w-32">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24 md:w-32">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.description}</p>
                            {item.part_number && (
                              <p className="text-xs text-gray-500">Part #: {item.part_number}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          ${(item.quantity * item.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {invoice.notes && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
                  <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Subtotal</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tax</span>
                  <span>${invoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            {isUnpaid && (
              <CardFooter>
                <Button 
                  onClick={handlePayNow}
                  className="w-full"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now (${invoice.total.toFixed(2)})
                </Button>
              </CardFooter>
            )}
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 flex items-center">
                <div className="h-8 w-12 rounded bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Credit Card</p>
                  <p className="text-sm text-gray-500">Visa, Mastercard, American Express</p>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-500 pt-2">
                <p>Need help with your payment?</p>
                <p>Call us at (555) 123-4567</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Information</DialogTitle>
            <DialogDescription>
              Enter your payment details to process this invoice.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Card Number</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  placeholder="4242 4242 4242 4242"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Expiry Date</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  placeholder="MM/YY"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">CVV</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  placeholder="123"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Cardholder Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  placeholder="John Doe"
                />
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between font-medium">
                <span>Total Amount:</span>
                <span>${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
            <Button onClick={processPayment}>
              Process Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerInvoiceDetail;

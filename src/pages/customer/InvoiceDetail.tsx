
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer, CreditCard, DownloadCloud } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CustomerInvoiceDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  
  // Mock invoice data
  const invoice = {
    id: id || 'inv-001',
    title: 'Brake Service',
    date: '2023-05-15',
    vehicle: '2023 Ford F-150',
    status: 'unpaid',
    subtotal: 430.00,
    tax: 20.00,
    total: 450.00,
    items: [
      { id: 'item-1', description: 'Brake Pad Set - Front', quantity: 1, price: 150, part_number: 'BP-123F' },
      { id: 'item-2', description: 'Brake Pad Set - Rear', quantity: 1, price: 120, part_number: 'BP-123R' },
      { id: 'item-3', description: 'Brake Fluid', quantity: 2, price: 25, part_number: 'BF-500' },
      { id: 'item-4', description: 'Labor - Brake Service', quantity: 2, price: 55 }
    ],
    dueDate: '2023-06-15',
    notes: 'Thank you for your business! Payment is due within 30 days.'
  };
  
  const handlePayNow = () => {
    toast({
      title: "Payment Processing",
      description: "Redirecting to payment gateway...",
    });
  };
  
  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: "Your invoice PDF is being downloaded.",
    });
  };

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
        <h1 className="text-2xl md:text-3xl font-bold">Invoice #{invoice.id}</h1>
        
        <Badge className={
          invoice.status === 'unpaid' ? 'bg-red-100 text-red-800' :
          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
          'bg-blue-100 text-blue-800'
        }>
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
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
                  <p>{new Date(invoice.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Vehicle</h3>
                  <p>{invoice.vehicle}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Invoice #</h3>
                  <p>{invoice.id}</p>
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
                    {invoice.items.map((item) => (
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
                  <p className="text-sm">{invoice.notes}</p>
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
            {invoice.status === 'unpaid' && (
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
    </div>
  );
};

export default CustomerInvoiceDetail;

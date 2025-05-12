import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, ArrowLeft, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LineItem {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
  price: number;
  approved: boolean;
}

const EstimateDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  // State for the estimate data
  const [estimate, setEstimate] = useState({
    id: id || 'EST-1001',
    date: '2025-05-08',
    vehicle: '2019 Toyota Camry',
    status: 'pending',
    subtotal: 320.00,
    tax: 29.99,
    total: 349.99,
    notes: 'Customer reported strange noise when braking. Recommend full inspection and brake service.'
  });
  
  // State for related invoice if one exists
  const [relatedInvoice, setRelatedInvoice] = useState<any>(null);
  
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { 
      id: '1', 
      partNumber: 'BRK-292', 
      description: 'Front Brake Pads', 
      quantity: 1, 
      price: 120.00, 
      approved: false 
    },
    { 
      id: '2', 
      partNumber: 'BRK-300', 
      description: 'Brake Rotor Resurfacing', 
      quantity: 2, 
      price: 75.00, 
      approved: false 
    },
    { 
      id: '3', 
      partNumber: 'OIL-101', 
      description: 'Full Synthetic Oil Change', 
      quantity: 1, 
      price: 50.00, 
      approved: false 
    },
  ]);
  
  // Check if this estimate has a related invoice
  useEffect(() => {
    if (id) {
      const fetchRelatedInvoice = async () => {
        const { data, error } = await supabase
          .from('invoices')
          .select('id, title, status')
          .eq('estimate_id', id)
          .maybeSingle();
          
        if (data && !error) {
          setRelatedInvoice(data);
        }
      };
      
      fetchRelatedInvoice();
    }
  }, [id]);
  
  const toggleItemApproval = (itemId: string) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === itemId ? { ...item, approved: !item.approved } : item
      )
    );
  };
  
  const areAllItemsApproved = () => {
    return lineItems.every((item) => item.approved);
  };
  
  const handleApproveEstimate = () => {
    // Update all line items to approved
    setLineItems(lineItems.map((item) => ({ ...item, approved: true })));
    
    // Update estimate status
    setEstimate({ ...estimate, status: 'approved' });
    
    toast({
      title: "Estimate Approved",
      description: "Your estimate has been approved and sent to the shop.",
    });
    
    // Integration placeholder
    console.log('<!-- TODO: POST approval status via GHL webhook → Zapier → Supabase -->');
  };
  
  const handleRejectEstimate = () => {
    // Update estimate status
    setEstimate({ ...estimate, status: 'rejected' });
    
    toast({
      title: "Estimate Rejected",
      description: "Your estimate has been rejected.",
    });
    
    // Integration placeholder
    console.log('<!-- TODO: POST rejection status via GHL webhook → Zapier → Supabase -->');
  };

  return (
    <Layout portalType="customer">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link to="/customer/estimates">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Estimate {estimate.id}</h1>
          </div>
          
          <div className="flex space-x-2">
            {/* Show invoice link if available */}
            {relatedInvoice && (
              <Link to={`/customer/invoices/${relatedInvoice.id}`}>
                <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  <FileText className="mr-2 h-4 w-4" />
                  View Invoice
                </Button>
              </Link>
            )}
          
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={handleRejectEstimate}
              disabled={estimate.status !== 'pending'}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            
            <Button
              className="bg-shop-primary hover:bg-shop-primary/90"
              onClick={handleApproveEstimate}
              disabled={estimate.status !== 'pending'}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve All
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Part #</TableHead>
                    <TableHead className="w-full">Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox 
                          checked={item.approved}
                          onCheckedChange={() => toggleItemApproval(item.id)}
                          disabled={estimate.status !== 'pending'}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.partNumber}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${(item.quantity * item.price).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-6 flex justify-end">
                <div className="w-1/3 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">${estimate.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span className="font-medium">${estimate.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-semibold">Total:</span>
                    <span className="font-semibold">${estimate.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estimate Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-gray-500">Status</dt>
                    <dd className="font-medium capitalize mt-1">{estimate.status}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-gray-500">Date</dt>
                    <dd className="font-medium mt-1">{estimate.date}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-gray-500">Vehicle</dt>
                    <dd className="font-medium mt-1">{estimate.vehicle}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{estimate.notes}</p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Integration placeholder comments */}
        {/* <!-- TODO: fetch estimate detail via GHL webhook → Zapier → Supabase --> */}
        {/* <!-- TODO: POST line item approvals via GHL webhook --> */}
      </div>
    </Layout>
  );
};

export default EstimateDetailPage;

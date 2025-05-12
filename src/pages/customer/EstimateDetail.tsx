
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, ArrowLeft, FileText, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LineItem {
  id: string;
  part_number?: string;
  description: string;
  quantity: number;
  price: number;
  approved: boolean;
}

const EstimateDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State for the estimate data
  const [estimate, setEstimate] = useState({
    id: id || '',
    date: '',
    vehicle: '',
    status: '' as 'pending' | 'approved' | 'declined' | 'completed',
    subtotal: 0,
    tax: 0,
    total: 0,
    notes: '',
    workOrderStatus: null as string | null // Track work order status for disabling approvals
  });
  
  // State for related invoice if one exists
  const [relatedInvoice, setRelatedInvoice] = useState<any>(null);
  
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  // Flag to control if changes are allowed
  const [changesAllowed, setChangesAllowed] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Fetch the estimate and related data when the page loads
  useEffect(() => {
    if (!id || !user) return;
    
    const fetchEstimateData = async () => {
      try {
        setLoading(true);
        // Fetch estimate data
        const { data: estimateData, error: estimateError } = await supabase
          .from('estimates')
          .select('*, vehicles(make, model, year)')
          .eq('id', id)
          .single();
          
        if (estimateError) throw estimateError;
        
        if (!estimateData) {
          toast({
            title: "Estimate not found",
            description: "The requested estimate could not be found",
            variant: "destructive",
          });
          return;
        }
        
        // Check if the estimate belongs to the current user
        if (estimateData.customer_id !== user.id) {
          toast({
            title: "Unauthorized",
            description: "You do not have permission to view this estimate",
            variant: "destructive",
          });
          return;
        }
        
        setEstimate({
          id: estimateData.id,
          status: estimateData.status,
          date: new Date(estimateData.created_at).toISOString().split('T')[0],
          vehicle: estimateData.vehicles 
            ? `${estimateData.vehicles.year} ${estimateData.vehicles.make} ${estimateData.vehicles.model}`
            : 'Unknown',
          subtotal: estimateData.total_amount,
          tax: 0, // Tax calculation would go here
          total: estimateData.total_amount,
          notes: estimateData.description || '',
          workOrderStatus: null
        });
        
        // Fetch line items
        const { data: lineItemsData, error: lineItemsError } = await supabase
          .from('estimate_items')
          .select('*')
          .eq('estimate_id', id);
          
        if (lineItemsError) throw lineItemsError;
        
        // Transform the data for our component
        const transformedItems = (lineItemsData || []).map(item => ({
          id: item.id,
          part_number: item.part_number || '',
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          approved: estimateData.status === 'approved' || estimateData.status === 'completed'
        }));
        
        setLineItems(transformedItems);
        
        // Check if there's a related work order
        // For now we're determining this by the estimate status
        const workOrderInProgress = ['approved', 'completed'].includes(estimateData.status);
        if (workOrderInProgress) {
          setEstimate(prev => ({ 
            ...prev, 
            workOrderStatus: estimateData.status === 'completed' ? 'completed' : 'started' 
          }));
          // If work order is started or later status, prevent changes
          if (workOrderInProgress) {
            setChangesAllowed(false);
          }
        }
        
        // Fetch related invoice if any
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('id, title, status')
          .eq('estimate_id', id)
          .maybeSingle();
          
        if (!invoiceError && invoiceData) {
          setRelatedInvoice(invoiceData);
        }
        
      } catch (error: any) {
        console.error('Error fetching estimate data:', error);
        toast({
          title: "Error",
          description: `Failed to load estimate: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEstimateData();
  }, [id, user, toast]);
  
  // Update changes allowed state based on estimate status
  useEffect(() => {
    if (['approved', 'declined', 'completed'].includes(estimate.status)) {
      setChangesAllowed(false);
    } else {
      // Only allow changes if work order hasn't started
      const workOrderStarted = estimate.workOrderStatus === 'started' || 
                               estimate.workOrderStatus === 'in_progress' || 
                               estimate.workOrderStatus === 'completed' || 
                               estimate.workOrderStatus === 'delivered';
      setChangesAllowed(!workOrderStarted);
    }
  }, [estimate.status, estimate.workOrderStatus]);
  
  const toggleItemApproval = (itemId: string) => {
    // Only allow changes if the estimate status is pending or the work order hasn't started
    if (!changesAllowed) {
      toast({
        title: "Changes not allowed",
        description: "This estimate cannot be modified in its current state",
        variant: "destructive",
      });
      return;
    }
    
    setLineItems(
      lineItems.map((item) =>
        item.id === itemId ? { ...item, approved: !item.approved } : item
      )
    );
  };
  
  const areAllItemsApproved = () => {
    return lineItems.every((item) => item.approved);
  };
  
  const handleApproveEstimate = async () => {
    if (!id || !user) return;
    
    // Check if changes are allowed
    if (!changesAllowed) {
      toast({
        title: "Operation not allowed",
        description: "This estimate cannot be modified in its current state",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Update all line items to approved
      setLineItems(lineItems.map((item) => ({ ...item, approved: true })));
      
      // Update estimate status
      const { error } = await supabase
        .from('estimates')
        .update({ status: 'approved' })
        .eq('id', id)
        .eq('customer_id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setEstimate({ ...estimate, status: 'approved' });
      setChangesAllowed(false);
      
      toast({
        title: "Estimate Approved",
        description: "Your estimate has been approved and sent to the shop.",
      });
    } catch (error: any) {
      console.error('Error approving estimate:', error);
      toast({
        title: "Error",
        description: `Failed to approve estimate: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  const handleRejectEstimate = async () => {
    if (!id || !user) return;
    
    // Check if changes are allowed
    if (!changesAllowed) {
      toast({
        title: "Operation not allowed",
        description: "This estimate cannot be modified in its current state",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Update estimate status
      const { error } = await supabase
        .from('estimates')
        .update({ status: 'declined' })
        .eq('id', id)
        .eq('customer_id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setEstimate({ ...estimate, status: 'declined' });
      setChangesAllowed(false);
      
      toast({
        title: "Estimate Rejected",
        description: "Your estimate has been rejected.",
      });
    } catch (error: any) {
      console.error('Error rejecting estimate:', error);
      toast({
        title: "Error",
        description: `Failed to reject estimate: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Show warning message if changes are not allowed
  const renderStatusWarning = () => {
    if (!changesAllowed) {
      return (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md mb-6 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">You cannot modify this estimate</p>
            <p className="text-sm">
              {['approved', 'completed'].includes(estimate.status) 
                ? "This estimate has already been approved or completed." 
                : "Work has already begun on this estimate."}
              {" "}Contact the shop to make changes.
            </p>
          </div>
        </div>
      );
    }
    return null;
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
            <h1 className="text-2xl font-bold tracking-tight">Estimate {loading ? '' : `#${estimate.id.substring(0, 8)}...`}</h1>
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
              disabled={!changesAllowed || estimate.status !== 'pending' || loading}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            
            <Button
              className="bg-shop-primary hover:bg-shop-primary/90"
              onClick={handleApproveEstimate}
              disabled={!changesAllowed || estimate.status !== 'pending' || loading}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve All
            </Button>
          </div>
        </div>
        
        {renderStatusWarning()}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <p>Loading estimate details...</p>
          </div>
        ) : (
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
                    {lineItems.length > 0 ? (
                      lineItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox 
                              checked={item.approved}
                              onCheckedChange={() => toggleItemApproval(item.id)}
                              disabled={!changesAllowed}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{item.part_number || '-'}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${(item.quantity * item.price).toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          No line items found
                        </TableCell>
                      </TableRow>
                    )}
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
                  <p className="text-sm">{estimate.notes || 'No notes available.'}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EstimateDetailPage;

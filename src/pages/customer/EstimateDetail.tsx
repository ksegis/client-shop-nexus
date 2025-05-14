
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer, Check, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEstimateDetail } from '@/hooks/useEstimateDetail';

const CustomerEstimateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  
  // Mock data - in a real app, we would use the useEstimateDetail hook
  const mockEstimate = {
    id: id || 'est-001',
    date: '2023-05-10',
    vehicle: '2023 Ford F-150',
    status: 'pending',
    subtotal: 430.00,
    tax: 20.00,
    total: 450.00,
    notes: 'Includes brake pad replacement for all wheels and brake fluid flush.',
    workOrderStatus: null
  };
  
  const mockLineItems = [
    { id: 'item-1', description: 'Brake Pad Set - Front', quantity: 1, price: 150, approved: false, part_number: 'BP-123F' },
    { id: 'item-2', description: 'Brake Pad Set - Rear', quantity: 1, price: 120, approved: false, part_number: 'BP-123R' },
    { id: 'item-3', description: 'Brake Fluid', quantity: 2, price: 25, approved: false, part_number: 'BF-500' },
    { id: 'item-4', description: 'Labor - Brake Service', quantity: 2, price: 55, approved: false }
  ];
  
  // State for storing line items
  const [lineItems, setLineItems] = useState(mockLineItems);
  const [estimate] = useState(mockEstimate);
  
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
  
  const openApproveDialog = () => {
    setAction('approve');
    setConfirmDialogOpen(true);
  };
  
  const openRejectDialog = () => {
    setAction('reject');
    setConfirmDialogOpen(true);
  };
  
  const handleApproveEstimate = async () => {
    try {
      // Update all line items to approved
      setLineItems(lineItems.map((item) => ({ ...item, approved: true })));
      
      // In a real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Estimate Approved",
        description: "Your estimate has been approved and sent to the shop.",
      });
      
      navigate('/customer/estimates');
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
    try {
      // In a real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Estimate Rejected",
        description: "Your estimate has been rejected.",
      });
      
      navigate('/customer/estimates');
    } catch (error: any) {
      console.error('Error rejecting estimate:', error);
      toast({
        title: "Error",
        description: `Failed to reject estimate: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  const handleConfirmAction = () => {
    if (action === 'approve') {
      handleApproveEstimate();
    } else if (action === 'reject') {
      handleRejectEstimate();
    }
    setConfirmDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link to="/customer/estimates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Estimates
          </Link>
        </Button>
        
        <Button variant="outline" size="sm" className="w-fit">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Estimate #{estimate.id}</h1>
        
        <Badge className={
          estimate.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          estimate.status === 'approved' ? 'bg-green-100 text-green-800' :
          estimate.status === 'completed' ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
        }>
          {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Estimate Details</CardTitle>
              <CardDescription>Review the services and parts included in this estimate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Date</h3>
                  <p>{new Date(estimate.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Vehicle</h3>
                  <p>{estimate.vehicle}</p>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {estimate.status === 'pending' && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                          Approve
                        </th>
                      )}
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
                    {lineItems.map((item) => (
                      <tr key={item.id}>
                        {estimate.status === 'pending' && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Checkbox 
                              checked={item.approved} 
                              onCheckedChange={() => toggleItemApproval(item.id)} 
                            />
                          </td>
                        )}
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
              
              {estimate.notes && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Additional Notes</h3>
                  <p className="text-sm">{estimate.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Subtotal</span>
                  <span>${estimate.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tax</span>
                  <span>${estimate.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>${estimate.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            {estimate.status === 'pending' && (
              <CardFooter className="flex flex-col space-y-3">
                <Button 
                  onClick={openApproveDialog}
                  className="w-full"
                  disabled={!areAllItemsApproved()}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve Estimate
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={openRejectDialog}
                >
                  <X className="mr-2 h-4 w-4" />
                  Decline Estimate
                </Button>
                
                {!areAllItemsApproved() && (
                  <div className="flex items-start gap-2 mt-3 text-amber-600 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <p>Please approve each line item before approving the entire estimate</p>
                  </div>
                )}
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
      
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === 'approve' ? 'Approve Estimate?' : 'Reject Estimate?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === 'approve'
                ? 'Are you sure you want to approve this estimate? This will authorize the shop to begin work.'
                : 'Are you sure you want to reject this estimate? The shop will be notified and no work will be done.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              {action === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomerEstimateDetail;

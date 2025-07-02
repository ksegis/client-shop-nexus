
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Printer, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useEstimateDetail } from '@/hooks/useEstimateDetail';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CustomerEstimateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comments, setComments] = useState('');
  
  if (!id) return <div>Estimate ID is required</div>;
  
  const { 
    estimate, 
    lineItems, 
    relatedInvoice,
    loading, 
    changesAllowed,
    handleApproveEstimate,
    handleRejectEstimate
  } = useEstimateDetail(id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApproveSubmit = async () => {
    await handleApproveEstimate();
    setShowApproveDialog(false);
    setComments('');
  };

  const handleRejectSubmit = async () => {
    await handleRejectEstimate();
    setShowRejectDialog(false);
    setComments('');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-64">
        <p className="text-muted-foreground">Loading estimate details...</p>
      </div>
    );
  }

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
          Print Estimate
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Estimate #{id.substring(0, 8)}</h1>
        
        <Badge className={getStatusColor(estimate.status)}>
          {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
        </Badge>
      </div>

      {estimate.workOrderStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Work In Progress</h3>
              <p className="text-blue-700 text-sm">
                {estimate.workOrderStatus === 'completed' 
                  ? 'The work has been completed based on this estimate.'
                  : 'Work on your vehicle has started based on this estimate.'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {relatedInvoice && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-900">Invoice Created</h3>
              <p className="text-green-700 text-sm">
                An invoice has been created based on this estimate.
              </p>
              <Link 
                to={`/customer/invoices/${relatedInvoice.id}`}
                className="text-sm text-green-700 underline mt-1 inline-block"
              >
                View Invoice
              </Link>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Estimate Details</CardTitle>
              <CardDescription>Service and parts breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Date</h3>
                  <p>{estimate.date}</p>
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
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
                  <p className="text-sm whitespace-pre-line">{estimate.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Estimate Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Subtotal</span>
                  <span>${estimate.subtotal.toFixed(2)}</span>
                </div>
                {estimate.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Tax</span>
                    <span>${estimate.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>${estimate.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            {estimate.status === 'pending' && changesAllowed && (
              <CardFooter className="flex flex-col space-y-2">
                <Button 
                  onClick={() => setShowApproveDialog(true)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Estimate
                </Button>
                <Button 
                  onClick={() => setShowRejectDialog(true)}
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline Estimate
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
      
      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Estimate</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this estimate? Work can begin once approved.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <label className="block text-sm font-medium mb-2">Add comments (optional)</label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any comments or special instructions for the shop..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleApproveSubmit}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve Estimate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Estimate</DialogTitle>
            <DialogDescription>
              Please let us know why you're declining this estimate or what changes you'd like to see.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <label className="block text-sm font-medium mb-2">Reason for declining</label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Please explain why you're declining this estimate..."
              className="min-h-[100px]"
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleRejectSubmit}
              variant="destructive"
            >
              Decline Estimate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerEstimateDetail;

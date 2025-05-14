import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, History, InfoIcon, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { ServiceUpdatesList } from '@/components/shared/service/ServiceUpdatesList';
import { useServiceUpdates } from '@/hooks/useServiceUpdates';

const CustomerWorkOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [workOrder, setWorkOrder] = useState<any | null>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { updates, isLoading: updatesLoading } = useServiceUpdates(id);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!id || !user) return;

    const fetchWorkOrder = async () => {
      try {
        setLoading(true);
        
        // Fetch work order details
        const { data: workOrderData, error: workOrderError } = await supabase
          .from('work_orders')
          .select(`
            *,
            vehicles (
              make,
              model,
              year,
              vin,
              license_plate,
              color
            )
          `)
          .eq('id', id)
          .eq('customer_id', user.id)
          .single();
          
        if (workOrderError) throw workOrderError;
        
        // Fetch work order line items
        const { data: lineItemsData, error: lineItemsError } = await supabase
          .from('work_order_line_items')
          .select('*')
          .eq('work_order_id', id);
          
        if (lineItemsError) throw lineItemsError;
        
        setWorkOrder(workOrderData);
        setLineItems(lineItemsData || []);
      } catch (error: any) {
        console.error('Error fetching work order:', error);
        toast({
          title: 'Error',
          description: `Could not load work order: ${error.message}`,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkOrder();
    
    // Set up real-time subscription for work order updates
    const workOrderChannel = supabase
      .channel('single-work-order')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_orders',
          filter: `id=eq.${id}`
        },
        (payload) => {
          // Update work order when it changes
          if (payload.eventType === 'UPDATE') {
            const updatedWorkOrder = payload.new as any;
            setWorkOrder(prevWorkOrder => ({ ...prevWorkOrder, ...updatedWorkOrder }));
            
            // Show notification for status changes
            const oldStatus = (payload.old as any).status;
            const newStatus = updatedWorkOrder.status;
            
            if (oldStatus !== newStatus) {
              toast({
                title: 'Work Order Updated',
                description: `Status changed to: ${newStatus.replace('_', ' ')}`,
              });
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(workOrderChannel);
    };
  }, [id, user, toast]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-64">
        <p className="text-muted-foreground">Loading work order details...</p>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-medium mb-2">Work Order Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested work order could not be found or you don't have permission to view it.</p>
          <Button asChild variant="outline">
            <Link to="/customer/work-orders">Back to Work Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (status: string) => {
    return status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link to="/customer/work-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Work Orders
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Work Order #{id?.substring(0, 8)}</h1>
        
        <Badge className={getStatusColor(workOrder.status)}>
          {getStatusDisplay(workOrder.status)}
        </Badge>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="details" className="flex items-center">
            <InfoIcon className="h-4 w-4 mr-2 md:mr-1" />
            <span className="hidden md:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center">
            <History className="h-4 w-4 mr-2 md:mr-1" />
            <span className="hidden md:inline">Updates</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2 md:mr-1" />
            <span className="hidden md:inline">Contact Shop</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Work Order Details</CardTitle>
                  <CardDescription>Service and repair information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                      <Badge className={getStatusColor(workOrder.status)}>
                        {getStatusDisplay(workOrder.status)}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                      <p>{new Date(workOrder.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Vehicle</h3>
                      <p>
                        {workOrder.vehicles 
                          ? `${workOrder.vehicles.year} ${workOrder.vehicles.make} ${workOrder.vehicles.model}`
                          : 'Not specified'}
                      </p>
                      {workOrder.vehicles?.license_plate && (
                        <p className="text-sm text-muted-foreground">
                          License: {workOrder.vehicles.license_plate}
                        </p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Estimated Completion</h3>
                      <p>Not specified</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                    <p className="text-sm whitespace-pre-line mb-6">{workOrder.description || 'No description provided'}</p>
                  </div>
                  
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Service Items</h3>
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
                        {lineItems.length > 0 ? (
                          lineItems.map((item) => (
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                              No line items added yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Estimated Cost</span>
                      <span>${workOrder.estimated_cost?.toFixed(2) || '0.00'}</span>
                    </div>
                    {workOrder.status === 'completed' && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Final Cost</span>
                        <span>${workOrder.actual_cost?.toFixed(2) || '0.00'}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t mt-2">
                      <Button variant="outline" asChild className="w-full">
                        <Link to={`/customer/messages`}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Contact Shop
                        </Link>
                      </Button>
                    </div>
                    {workOrder.status === 'completed' && (
                      <Button variant="outline" asChild className="w-full">
                        <Link to={`/customer/invoices`}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Invoice
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="updates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Updates</CardTitle>
              <CardDescription>Latest updates on your service</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceUpdatesList
                updates={updates}
                loading={updatesLoading}
                isShopPortal={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact the Shop</CardTitle>
              <CardDescription>Have questions about your service?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>If you have questions about your service or need to provide additional information, you can contact the shop directly.</p>
              
              <div className="flex flex-col space-y-2">
                <Button asChild>
                  <Link to="/customer/messages">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Message
                  </Link>
                </Button>
                
                <Button variant="outline">
                  Call Shop: (555) 123-4567
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerWorkOrderDetail;

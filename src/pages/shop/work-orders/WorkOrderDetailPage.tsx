
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, MessageSquare, History, Car, InfoIcon } from 'lucide-react';
import { useWorkOrders } from '../work-orders/WorkOrdersContext';
import { useServiceUpdates } from '@/hooks/useServiceUpdates';
import { ServiceUpdatesList } from '@/components/shared/service/ServiceUpdatesList';
import { ServiceUpdateForm } from '@/components/shop/service/ServiceUpdateForm';

const WorkOrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { workOrders, getWorkOrderLineItems } = useWorkOrders();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const { updates, isLoading: updatesLoading, addUpdate } = useServiceUpdates(id);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  // Fetch work order data
  useEffect(() => {
    if (!id) return;
    
    const foundWorkOrder = workOrders.find(wo => wo.id === id);
    if (foundWorkOrder) {
      setWorkOrder(foundWorkOrder);
      
      // Fetch line items
      const fetchLineItems = async () => {
        try {
          const items = await getWorkOrderLineItems(id);
          setLineItems(items);
        } catch (error) {
          console.error('Error fetching line items:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchLineItems();
    } else {
      setLoading(false);
    }
  }, [id, workOrders, getWorkOrderLineItems]);

  // Handle service update submission
  const handleAddServiceUpdate = async (updateData: {
    content: string;
    milestone?: string;
    milestone_completed?: boolean;
    images?: File[];
  }) => {
    if (!id) return;
    
    setIsSubmittingUpdate(true);
    try {
      await addUpdate({
        work_order_id: id,
        ...updateData
      });
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

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
          <p className="text-muted-foreground mb-4">The requested work order could not be found.</p>
          <Button asChild variant="outline">
            <Link to="/shop/work-orders">Back to Work Orders</Link>
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link to="/shop/work-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Work Orders
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Work Order #{id?.substring(0, 8)}</h1>
        
        <Badge className={getStatusColor(workOrder.status)}>
          {workOrder.status.replace('_', ' ').charAt(0).toUpperCase() + workOrder.status.replace('_', ' ').slice(1)}
        </Badge>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-4">
          <TabsTrigger value="details" className="flex items-center">
            <InfoIcon className="h-4 w-4 mr-2 md:mr-1" />
            <span className="hidden md:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center">
            <History className="h-4 w-4 mr-2 md:mr-1" />
            <span className="hidden md:inline">Updates</span>
          </TabsTrigger>
          <TabsTrigger value="customer" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2 md:mr-1" />
            <span className="hidden md:inline">Customer</span>
          </TabsTrigger>
          <TabsTrigger value="vehicle" className="flex items-center">
            <Car className="h-4 w-4 mr-2 md:mr-1" />
            <span className="hidden md:inline">Vehicle</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Work Order Details</CardTitle>
                  <CardDescription>Service and parts breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                      <Badge className={getStatusColor(workOrder.status)}>
                        {workOrder.status.replace('_', ' ').charAt(0).toUpperCase() + workOrder.status.replace('_', ' ').slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                      <p>{new Date(workOrder.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                      <p>
                        {workOrder.priority === 3 ? 'High' : 
                         workOrder.priority === 2 ? 'Medium' : 'Low'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Estimated Hours</h3>
                      <p>{workOrder.estimated_hours || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                    <p className="text-sm whitespace-pre-line mb-6">{workOrder.description || 'No description provided'}</p>
                  </div>
                  
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Line Items</h3>
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
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full">
                    Mark as In Progress
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Invoice
                  </Button>
                  <Button variant="outline" className="w-full">
                    Edit Work Order
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Costs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Estimated Cost</span>
                      <span>${workOrder.estimated_cost?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Actual Cost</span>
                      <span>${workOrder.actual_cost?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Estimated Hours</span>
                      <span>{workOrder.estimated_hours || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Actual Hours</span>
                      <span>{workOrder.actual_hours || '0'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="updates" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Service Updates</CardTitle>
                  <CardDescription>Progress updates shared with the customer</CardDescription>
                </CardHeader>
                <CardContent>
                  <ServiceUpdatesList
                    updates={updates}
                    loading={updatesLoading}
                    isShopPortal={true}
                  />
                </CardContent>
              </Card>
            </div>
            
            <div>
              <ServiceUpdateForm
                onSubmit={handleAddServiceUpdate}
                isSubmitting={isSubmittingUpdate}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="customer" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
                  <p>John Doe</p>
                  <p className="text-sm text-muted-foreground">john.doe@example.com</p>
                  <p className="text-sm text-muted-foreground">(555) 123-4567</p>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                  
                  <Button variant="outline" asChild>
                    <Link to={`/shop/customers/details/${workOrder.customer_id}`}>
                      View Customer Details
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="vehicle" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Vehicle</h3>
                    <p>2019 Honda Accord</p>
                    <p className="text-sm text-muted-foreground">VIN: 1HGCV1F34MA000000</p>
                    <p className="text-sm text-muted-foreground">License: ABC123</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Details</h3>
                    <p>Color: White</p>
                    <p className="text-sm text-muted-foreground">Mileage: 45,000 mi</p>
                    <p className="text-sm text-muted-foreground">Last Service: 03/15/2023</p>
                  </div>
                </div>
                
                <Button variant="outline" asChild>
                  <Link to={`/shop/vehicles/details/${workOrder.vehicle_id}`}>
                    View Vehicle History
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkOrderDetailPage;

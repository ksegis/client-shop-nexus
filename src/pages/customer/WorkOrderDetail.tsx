
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Info,
  MessageCircle,
  Car,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { ServiceUpdatesList } from '@/components/shared/service/ServiceUpdatesList';

const CustomerWorkOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    // Fetch work order data - mock data for now
    const fetchWorkOrder = async () => {
      try {
        // Simulate API call
        setTimeout(() => {
          // Mock data based on the ID
          const mockWorkOrder = {
            id: id,
            title: 'Brake Service',
            description: 'Complete brake service including replacement of front and rear brake pads, inspection of rotors and brake lines.',
            status: 'in_progress',
            date: '2023-05-10',
            progress: 75,
            estimatedCompletion: '2023-05-12',
            customer: {
              name: 'John Doe',
              email: 'john.doe@example.com',
              phone: '(555) 123-4567'
            },
            vehicle: {
              year: '2023',
              make: 'Ford',
              model: 'F-150',
              vin: '1FTEW1E53NFC12345',
              license: 'ABC123'
            },
            lineItems: [
              {
                id: '1',
                description: 'Front Brake Pads (Premium)',
                quantity: 1,
                price: 120.00,
                total: 120.00
              },
              {
                id: '2',
                description: 'Rear Brake Pads (Premium)',
                quantity: 1,
                price: 110.00,
                total: 110.00
              },
              {
                id: '3',
                description: 'Labor - Brake Service',
                quantity: 3,
                price: 85.00,
                total: 255.00
              }
            ],
            total: 485.00
          };
          
          setWorkOrder(mockWorkOrder);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching work order:', error);
        toast({
          title: 'Error',
          description: 'Failed to load work order details. Please try again.',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };

    // Fetch service updates - mock data
    const fetchUpdates = async () => {
      // Simulate API call
      setTimeout(() => {
        // Mock updates
        const mockUpdates = [
          {
            id: '1',
            date: new Date(Date.now() - 86400000).toISOString(),
            content: 'Initial diagnostic completed. Found excessive wear on front brake pads and rotors. Replacement recommended.',
            milestone: 'Diagnostic Completed',
            milestone_completed: true,
            created_by: {
              name: 'Mike Technician'
            }
          },
          {
            id: '2',
            date: new Date(Date.now() - 43200000).toISOString(),
            content: 'Parts ordered, waiting for delivery.',
            milestone: 'Parts Ordered',
            milestone_completed: true,
            created_by: {
              name: 'Mike Technician'
            }
          },
          {
            id: '3',
            date: new Date().toISOString(),
            content: 'Parts arrived. Repair scheduled for tomorrow morning.',
            milestone: 'Parts Received',
            milestone_completed: true,
            created_by: {
              name: 'Mike Technician'
            }
          }
        ];
        
        setUpdates(mockUpdates);
      }, 800);
    };
    
    fetchWorkOrder();
    fetchUpdates();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'scheduled':
        return 'Scheduled';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-6 w-1/3 bg-gray-200 rounded mb-4"></div>
          <div className="h-40 bg-gray-200 rounded mb-4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-2">Work Order Not Found</h2>
          <p className="mb-4">The work order you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link to="/customer/work-orders">
            <Button>Back to Work Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/customer/work-orders">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Work Orders
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{workOrder.title}</h1>
          <Badge className={getStatusColor(workOrder.status)}>
            {getStatusLabel(workOrder.status)}
          </Badge>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details" className="flex items-center">
            <Info className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Updates
          </TabsTrigger>
          <TabsTrigger value="vehicle" className="flex items-center">
            <Car className="mr-2 h-4 w-4" />
            Vehicle
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Work Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Description</h3>
                <p className="text-gray-600">{workOrder.description}</p>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Line Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b">
                        <th className="py-2 text-left">Description</th>
                        <th className="py-2 text-center">Qty</th>
                        <th className="py-2 text-right">Price</th>
                        <th className="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workOrder.lineItems.map((item: any) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-3">{item.description}</td>
                          <td className="py-3 text-center">{item.quantity}</td>
                          <td className="py-3 text-right">${item.price.toFixed(2)}</td>
                          <td className="py-3 text-right">${item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="font-medium">
                        <td className="pt-3" colSpan={3}>Total</td>
                        <td className="pt-3 text-right">${workOrder.total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="updates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceUpdatesList 
                updates={updates}
                loading={false}
                isShopPortal={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="vehicle" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Vehicle</h3>
                  <p className="text-gray-600">{workOrder.vehicle.year} {workOrder.vehicle.make} {workOrder.vehicle.model}</p>
                  <p className="text-gray-500 text-sm">VIN: {workOrder.vehicle.vin}</p>
                  <p className="text-gray-500 text-sm">License: {workOrder.vehicle.license}</p>
                </div>
              </div>
              
              <div className="pt-4">
                <Link to={`/customer/vehicles`}>
                  <Button variant="outline">
                    <Car className="mr-2 h-4 w-4" />
                    View All Vehicles
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerWorkOrderDetail;


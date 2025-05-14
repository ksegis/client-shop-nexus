
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CalendarClock, Wrench, ClipboardList, MessageCircle, Phone } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

const CustomerWorkOrderDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  
  // Mock work order data
  const workOrder = {
    id: id || 'wo-001',
    title: 'Brake Service',
    date: '2023-05-10',
    vehicle: '2023 Ford F-150',
    status: 'in_progress',
    progress: 75,
    estimatedCompletion: '2023-05-12',
    description: 'Complete brake service including front and rear brake pad replacement, rotor inspection, and brake fluid flush.',
    technician: 'Mike Johnson',
    updates: [
      { id: 1, date: '2023-05-10 09:00 AM', message: 'Vehicle received for service' },
      { id: 2, date: '2023-05-10 11:30 AM', message: 'Inspection complete. Front and rear brake pads need replacement. Rotors are in good condition.' },
      { id: 3, date: '2023-05-11 02:15 PM', message: 'Front brake pads replaced. Working on rear brakes now.' }
    ],
    parts: [
      { id: 'p1', name: 'Brake Pad Set - Front', status: 'installed' },
      { id: 'p2', name: 'Brake Pad Set - Rear', status: 'in_progress' },
      { id: 'p3', name: 'Brake Fluid', status: 'pending' }
    ],
    tasks: [
      { id: 't1', name: 'Vehicle Inspection', status: 'completed', percentage: 100 },
      { id: 't2', name: 'Front Brake Service', status: 'completed', percentage: 100 },
      { id: 't3', name: 'Rear Brake Service', status: 'in_progress', percentage: 50 },
      { id: 't4', name: 'Brake Fluid Flush', status: 'pending', percentage: 0 },
      { id: 't5', name: 'Test Drive', status: 'pending', percentage: 0 }
    ]
  };
  
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
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'installed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      default:
        return status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1);
    }
  };
  
  const handleContactShop = () => {
    toast({
      title: 'Contact Information',
      description: 'Shop phone: (555) 123-4567',
    });
  };
  
  const calculateTotalProgress = () => {
    if (!workOrder.tasks || workOrder.tasks.length === 0) return 0;
    
    const totalPercentage = workOrder.tasks.reduce((acc, task) => acc + task.percentage, 0);
    return Math.round(totalPercentage / workOrder.tasks.length);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to="/customer/work-orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Work Orders
        </Link>
      </Button>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Work Order #{workOrder.id}</h1>
          <p className="text-gray-500 mt-1">{workOrder.vehicle}</p>
        </div>
        
        <div className="flex gap-3">
          <Badge className={getStatusColor(workOrder.status)}>
            {getStatusLabel(workOrder.status)}
          </Badge>
          
          <Button variant="outline" size="sm" onClick={handleContactShop}>
            <Phone className="mr-2 h-4 w-4" />
            Contact Shop
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{workOrder.title}</CardTitle>
                <CardDescription>
                  Started on {new Date(workOrder.date).toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Technician</p>
                <p>{workOrder.technician}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="progress">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="progress">
                  <Wrench className="h-4 w-4 mr-2" />
                  Progress
                </TabsTrigger>
                <TabsTrigger value="updates">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Updates
                </TabsTrigger>
                <TabsTrigger value="details">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Details
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="progress" className="space-y-6 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{calculateTotalProgress()}%</span>
                  </div>
                  <Progress value={calculateTotalProgress()} className="h-2" />
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Estimated completion: {new Date(workOrder.estimatedCompletion).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Service Tasks</h3>
                  
                  <div className="space-y-3">
                    {workOrder.tasks.map((task) => (
                      <div key={task.id} className="space-y-2 pb-3 border-b last:border-0">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{task.name}</span>
                          <Badge className={getStatusColor(task.status)}>
                            {getStatusLabel(task.status)}
                          </Badge>
                        </div>
                        <Progress value={task.percentage} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Parts</h3>
                  
                  <div className="space-y-2">
                    {workOrder.parts.map((part) => (
                      <div key={part.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span className="text-sm">{part.name}</span>
                        <Badge className={getStatusColor(part.status)}>
                          {getStatusLabel(part.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="updates" className="pt-4">
                <div className="space-y-6">
                  <div className="relative pl-6 border-l-2 border-gray-200 space-y-6">
                    {workOrder.updates.map((update, index) => (
                      <div key={update.id} className="relative pb-6">
                        <div className="absolute -left-[19px] h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <CalendarClock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-4 space-y-1">
                          <p className="text-xs text-gray-500">{update.date}</p>
                          <p className="text-sm">{update.message}</p>
                        </div>
                        {index < workOrder.updates.length - 1 && (
                          <div className="absolute left-[-2px] top-8 h-[calc(100%-24px)] w-0.5 bg-gray-200"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="pt-4 space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Service Description</h3>
                  <p className="text-sm">{workOrder.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Vehicle Information</h3>
                    <p className="text-sm">{workOrder.vehicle}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Service Date</h3>
                    <p className="text-sm">{new Date(workOrder.date).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Shop Information</h3>
                  <p className="text-sm">Custom Truck Connections</p>
                  <p className="text-sm">123 Main St, Anytown USA</p>
                  <p className="text-sm">(555) 123-4567</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Service Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Started</span>
              <span className="text-sm">{new Date(workOrder.date).toLocaleDateString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Estimated Completion</span>
              <span className="text-sm">{new Date(workOrder.estimatedCompletion).toLocaleDateString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status</span>
              <Badge className={getStatusColor(workOrder.status)}>
                {getStatusLabel(workOrder.status)}
              </Badge>
            </div>
            
            <div className="pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Overall Progress</span>
                  <span>{calculateTotalProgress()}%</span>
                </div>
                <Progress value={calculateTotalProgress()} className="h-2" />
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Need Help?</h3>
              <Button variant="outline" onClick={handleContactShop} className="w-full">
                <Phone className="mr-2 h-4 w-4" />
                Contact Shop
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerWorkOrderDetail;


import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { Wrench, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCustomerWorkOrders } from '@/hooks/customer';
import { Skeleton } from '@/components/ui/skeleton';

const CustomerWorkOrders = () => {
  const { workOrders, loading, error } = useCustomerWorkOrders();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter work orders based on search term
  const filteredWorkOrders = workOrders.filter(order => 
    order.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="mt-1 hidden sm:block">
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                  <div className="space-y-2 w-full max-w-[300px]">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
                <div className="hidden md:block">
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between items-center mt-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <Wrench className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium">Error Loading Work Orders</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            {error.message}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      );
    }

    if (workOrders.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Wrench className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium">No Work Orders Yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            You don't have any service work orders yet.
          </p>
        </div>
      );
    }

    if (filteredWorkOrders.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium">No Results Found</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            No work orders match your search. Try different keywords.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredWorkOrders.map((workOrder) => (
          <div 
            key={workOrder.id} 
            className="p-4 border rounded-lg hover:bg-slate-50"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-1 hidden sm:block">
                  <Wrench className="h-8 w-8 text-blue-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium">{workOrder.title}</h3>
                  <p className="text-sm text-gray-500">{workOrder.vehicle.year} {workOrder.vehicle.make} {workOrder.vehicle.model}</p>
                  <p className="text-xs text-gray-400">Created: {new Date(workOrder.date).toLocaleDateString()}</p>
                  
                  <div className="md:hidden mt-2">
                    <Badge className={getStatusColor(workOrder.status)}>
                      {getStatusLabel(workOrder.status)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="hidden md:block">
                <Badge className={getStatusColor(workOrder.status)}>
                  {getStatusLabel(workOrder.status)}
                </Badge>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{workOrder.progress}%</span>
              </div>
              <Progress value={workOrder.progress} className="h-2" />
              
              <div className="flex justify-between items-center mt-4">
                {workOrder.estimatedCompletion && workOrder.status !== 'completed' && (
                  <div className="text-xs text-gray-500">
                    Est. completion: {new Date(workOrder.estimatedCompletion).toLocaleDateString()}
                  </div>
                )}
                
                <div className="ml-auto">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/customer/work-orders/${workOrder.id}`}>
                      View Details
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search work orders..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Service Progress</CardTitle>
          <CardDescription>Track the status of your vehicle service</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerWorkOrders;

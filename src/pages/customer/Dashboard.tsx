
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Wrench, FileText, CreditCard, Truck, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const CustomerDashboard = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // This would normally come from the API
  const notifications = [
    { id: 1, title: "New Estimate Available", message: "Review your new brake service estimate", date: "2 hours ago", type: "estimate" },
    { id: 2, title: "Work Order Updated", message: "Your vehicle service is 75% complete", date: "1 day ago", type: "workOrder" },
    { id: 3, title: "Invoice Ready", message: "Your invoice for recent service is ready for payment", date: "2 days ago", type: "invoice" }
  ];
  
  const handleNotificationClick = (notification: any) => {
    toast({
      title: notification.title,
      description: notification.message,
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, John</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access your most important information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                size={isMobile ? "lg" : "default"} 
                className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-slate-50"
                asChild
              >
                <Link to="/customer/estimates">
                  <FileText className="h-6 w-6 text-blue-500" />
                  <span>Estimates</span>
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size={isMobile ? "lg" : "default"} 
                className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-slate-50"
                asChild
              >
                <Link to="/customer/invoices">
                  <CreditCard className="h-6 w-6 text-green-500" />
                  <span>Invoices</span>
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size={isMobile ? "lg" : "default"} 
                className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-slate-50"
                asChild
              >
                <Link to="/customer/work-orders">
                  <Wrench className="h-6 w-6 text-orange-500" />
                  <span>Work Orders</span>
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size={isMobile ? "lg" : "default"} 
                className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-slate-50"
                asChild
              >
                <Link to="/customer/vehicles">
                  <Truck className="h-6 w-6 text-purple-500" />
                  <span>My Vehicles</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Recent updates on your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-gray-500">{notification.message}</p>
                    <p className="text-xs text-gray-400">{notification.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>Current status of your vehicle service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">2023 Ford F-150</h3>
                  <p className="text-sm text-gray-500">Brake Service</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                  In Progress
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: "75%" }}></div>
              </div>
              
              <p className="text-xs text-gray-500">Estimated completion: Tomorrow, 2:00 PM</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
            <CardDescription>Overview of your recent payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Outstanding</h3>
                  <p className="text-sm text-gray-500">1 invoice due</p>
                </div>
                <span className="text-xl font-bold">$245.00</span>
              </div>
              
              <Button asChild className="w-full">
                <Link to="/customer/invoices">View All Invoices</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerDashboard;

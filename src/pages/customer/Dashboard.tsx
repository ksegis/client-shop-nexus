
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, Navigate } from 'react-router-dom';
import { FileText, CreditCard, Truck, AlertCircle, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

// Define types for our data
interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: string;
}

interface WorkOrder {
  id: string;
  title: string;
  status: string;
  progress: number;
  estimated_completion?: string;
  vehicle?: {
    make: string;
    model: string;
    year: string;
  };
}

interface Invoice {
  id: string;
  amount_due: number;
  due_date?: string;
}

const CustomerDashboard = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeWorkOrder, setActiveWorkOrder] = useState<WorkOrder | null>(null);
  const [outstandingInvoice, setOutstandingInvoice] = useState<Invoice | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  
  useEffect(() => {
    // Only fetch data if user is authenticated
    if (!user?.id || !isAuthenticated) return;
    
    const fetchUserProfile = async () => {
      try {
        // Fetch profile information
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single();
          
        if (profileData?.first_name) {
          setFirstName(profileData.first_name);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    const fetchUserData = async () => {
      setLoading(true);
      
      try {
        // Fetch notifications (could be from messages table, estimates updates, etc.)
        const { data: notificationData } = await supabase
          .from('message_threads')
          .select('*')
          .eq('customer_id', user.id)
          .order('last_message_at', { ascending: false })
          .limit(3);
          
        if (notificationData?.length) {
          // Transform data into the format we need
          const formattedNotifications = notificationData.map(thread => ({
            id: thread.id,
            title: thread.subject || 'New Message',
            message: 'You have a new message',
            date: new Date(thread.last_message_at).toLocaleDateString(),
            type: 'message'
          }));
          
          setNotifications(formattedNotifications);
        }
        
        // Fetch active work orders
        const { data: workOrdersData } = await supabase
          .from('work_orders')
          .select(`
            id,
            title,
            status,
            vehicle_id,
            estimated_cost,
            updated_at,
            vehicles (
              make,
              model,
              year
            )
          `)
          .eq('customer_id', user.id)
          .eq('status', 'in_progress')
          .order('updated_at', { ascending: false })
          .limit(1);
          
        if (workOrdersData?.length) {
          const wo = workOrdersData[0];
          setActiveWorkOrder({
            id: wo.id,
            title: wo.title,
            status: wo.status,
            progress: 75, // Hard-coded for now, could be calculated
            estimated_completion: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 2 days from now
            vehicle: wo.vehicles
          });
        }
        
        // Fetch outstanding invoices
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('id, total_amount, updated_at')
          .eq('customer_id', user.id)
          .eq('status', 'unpaid')
          .order('updated_at', { ascending: false })
          .limit(1);
          
        if (invoiceData?.length) {
          setOutstandingInvoice({
            id: invoiceData[0].id,
            amount_due: invoiceData[0].total_amount,
            due_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() // 1 week from now
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          variant: "destructive",
          title: "Error loading dashboard",
          description: "Could not load your dashboard data. Please try again later."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
    fetchUserData();
  }, [user?.id, isAuthenticated, toast]);

  const handleNotificationClick = (notification: Notification) => {
    toast({
      title: notification.title,
      description: notification.message,
    });
  };
  
  // If not authenticated and not currently loading auth status, redirect to login
  if (!isAuthenticated && !authLoading) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        {loading || authLoading ? (
          <Skeleton className="h-10 w-64" />
        ) : (
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {firstName || 'Customer'}
          </h1>
        )}
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
            {loading || authLoading ? (
              <>
                <Skeleton className="h-20 w-full mb-2" />
                <Skeleton className="h-20 w-full mb-2" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
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
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>No new notifications</p>
              </div>
            )}
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
            {loading || authLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : activeWorkOrder ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">
                      {activeWorkOrder.vehicle ? 
                        `${activeWorkOrder.vehicle.year} ${activeWorkOrder.vehicle.make} ${activeWorkOrder.vehicle.model}` 
                        : 'Vehicle Service'}
                    </h3>
                    <p className="text-sm text-gray-500">{activeWorkOrder.title}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                    In Progress
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${activeWorkOrder.progress}%` }}></div>
                </div>
                
                <p className="text-xs text-gray-500">
                  Estimated completion: {activeWorkOrder.estimated_completion || 'To be determined'}
                </p>
                
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/customer/work-orders/${activeWorkOrder.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>No active service orders</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
            <CardDescription>Overview of your recent payments</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || authLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : outstandingInvoice ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Outstanding</h3>
                    <p className="text-sm text-gray-500">Due: {outstandingInvoice.due_date || 'ASAP'}</p>
                  </div>
                  <span className="text-xl font-bold">${outstandingInvoice.amount_due.toFixed(2)}</span>
                </div>
                
                <Button asChild className="w-full">
                  <Link to={`/customer/invoices/${outstandingInvoice.id}`}>View Invoice</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">No Outstanding Payments</h3>
                    <p className="text-sm text-gray-500">Your account is up to date</p>
                  </div>
                </div>
                
                <Button asChild variant="outline" className="w-full">
                  <Link to="/customer/invoices">View All Invoices</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerDashboard;

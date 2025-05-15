
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define types
export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: string;
}

export interface WorkOrderSummary {
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

export interface InvoiceSummary {
  id: string;
  amount_due: number;
  due_date?: string;
}

export interface CustomerDashboardData {
  firstName: string;
  notifications: Notification[];
  activeWorkOrder: WorkOrderSummary | null;
  outstandingInvoice: InvoiceSummary | null;
  loading: boolean;
  error: Error | null;
}

// Helper function to check if a userId is a valid UUID
const isValidUuid = (id: string): boolean => {
  return id?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) !== null;
};

export const useCustomerDashboard = (): CustomerDashboardData => {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeWorkOrder, setActiveWorkOrder] = useState<WorkOrderSummary | null>(null);
  const [outstandingInvoice, setOutstandingInvoice] = useState<InvoiceSummary | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    // Only fetch data if user is authenticated
    if (!user?.id || !isAuthenticated) return;
    
    const fetchUserProfile = async () => {
      try {
        if (!isValidUuid(user.id)) {
          // For mock/dev users, use the metadata directly
          setFirstName(user.user_metadata?.first_name || 'Customer');
          return;
        }

        // Fetch profile information for real users
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
        // For dev/mock users, provide mock data
        if (!isValidUuid(user.id)) {
          console.log('Using mock dashboard data for dev/mock user');
          
          // Mock notifications
          const mockNotifications = [
            {
              id: 'mock-notif-1',
              title: 'Service Completed',
              message: 'Your oil change service has been completed.',
              date: new Date().toLocaleDateString(),
              type: 'service'
            },
            {
              id: 'mock-notif-2',
              title: 'New Message',
              message: 'You have a new message from the service department.',
              date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString(),
              type: 'message'
            },
            {
              id: 'mock-notif-3',
              title: 'Estimate Ready',
              message: 'Your estimate for brake service is ready for review.',
              date: new Date(Date.now() - 48 * 60 * 60 * 1000).toLocaleDateString(),
              type: 'estimate'
            }
          ];
          
          // Mock active work order
          const mockWorkOrder = {
            id: 'mock-wo-1',
            title: 'Brake Service',
            status: 'in_progress',
            progress: 75,
            estimated_completion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            vehicle: {
              make: 'Toyota',
              model: 'Camry',
              year: '2020'
            }
          };
          
          // Mock outstanding invoice
          const mockInvoice = {
            id: 'mock-inv-1',
            amount_due: 156.75,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
          };
          
          setNotifications(mockNotifications);
          setActiveWorkOrder(mockWorkOrder);
          setOutstandingInvoice(mockInvoice);
          setLoading(false);
          return;
        }
        
        // For real users, proceed with database queries
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
            vehicle: {
              make: wo.vehicles.make,
              model: wo.vehicles.model,
              year: String(wo.vehicles.year) // Convert number to string to match the expected type
            }
          });
        }
        
        // Fetch outstanding invoices
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('id, total_amount, updated_at')
          .eq('customer_id', user.id)
          .eq('status', 'draft') // Using draft which is a valid status
          .order('updated_at', { ascending: false })
          .limit(1);
          
        if (invoiceData?.length) {
          setOutstandingInvoice({
            id: invoiceData[0].id,
            amount_due: invoiceData[0].total_amount,
            due_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() // 1 week from now
          });
        }
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError(error);
        
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

  return { 
    firstName, 
    notifications, 
    activeWorkOrder, 
    outstandingInvoice, 
    loading: loading || authLoading,
    error 
  };
};

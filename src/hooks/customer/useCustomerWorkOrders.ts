
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { WorkOrder } from '@/hooks/work-orders';
import { toast } from '@/hooks/use-toast';

// Helper function to check if a userId is a valid UUID
const isValidUuid = (id: string): boolean => {
  return id?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) !== null;
};

export function useCustomerWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchWorkOrders = async () => {
    if (!user) {
      setWorkOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // For non-UUID user IDs (mock or test users), return mock work orders with appropriate structure
      if (!isValidUuid(user.id)) {
        console.log(`Using mock work order data for non-UUID user ID: ${user.id}`);
        
        const mockWorkOrders = [
          {
            id: 'wo-001',
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
          },
          {
            id: 'wo-002',
            title: 'Oil Change + Tire Rotation',
            description: 'Standard oil change with synthetic oil and tire rotation',
            status: 'completed',
            date: '2023-04-15',
            progress: 100,
            estimatedCompletion: '2023-04-15',
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
            lineItems: [],
            total: 89.99
          },
          {
            id: 'wo-003',
            title: 'Transmission Service',
            description: 'Complete transmission fluid flush and filter replacement',
            status: 'scheduled',
            progress: 0,
            date: '2023-03-22',
            estimatedCompletion: '2023-06-05',
            customer: {
              name: 'John Doe',
              email: 'john.doe@example.com',
              phone: '(555) 123-4567'
            },
            vehicle: {
              year: '2022',
              make: 'Chevrolet',
              model: 'Silverado',
              vin: '1GCHK29U72E123456',
              license: 'XYZ789'
            },
            lineItems: [],
            total: 249.99
          }
        ];
        
        setWorkOrders(mockWorkOrders as WorkOrder[]);
        setLoading(false);
        return;
      }
      
      // For real users, fetch from database
      const { data, error: fetchError } = await supabase
        .from('work_orders')
        .select(`
          *,
          vehicles:vehicle_id (make, model, year, license_plate, vin),
          profiles:customer_id (first_name, last_name, email, phone)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
        
      if (fetchError) throw fetchError;
      
      // Transform the data to match the expected format
      const transformedData = data?.map(order => {
        // Calculate progress based on status
        let progress = 0;
        switch(order.status) {
          case 'pending': progress = 0; break;
          case 'in_progress': progress = 75; break;
          case 'completed': progress = 100; break;
          default: progress = 25;
        }
        
        return {
          id: order.id,
          title: order.title || 'Untitled Work Order',
          description: order.description || '',
          status: order.status,
          date: new Date(order.created_at).toISOString().split('T')[0],
          progress: progress,
          estimatedCompletion: order.estimated_completion || new Date(order.created_at).toISOString().split('T')[0],
          customer: {
            name: order.profiles ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim() : 'Unknown',
            email: order.profiles?.email || '',
            phone: order.profiles?.phone || ''
          },
          vehicle: {
            year: order.vehicles?.year?.toString() || '',
            make: order.vehicles?.make || '',
            model: order.vehicles?.model || '',
            vin: order.vehicles?.vin || '',
            license: order.vehicles?.license_plate || ''
          },
          lineItems: [], // These will be fetched separately if needed
          total: 0 // This would be calculated from line items
        };
      }) || [];
      
      setWorkOrders(transformedData as WorkOrder[]);
      
    } catch (err: any) {
      console.error('Error fetching work orders:', err);
      setError(err);
      
      toast({
        variant: "destructive",
        title: "Error loading work orders",
        description: err.message || "Failed to load your work orders"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch work orders when component mounts or user changes
  useEffect(() => {
    fetchWorkOrders();
  }, [user?.id]);

  return { workOrders, loading, error, fetchWorkOrders };
}

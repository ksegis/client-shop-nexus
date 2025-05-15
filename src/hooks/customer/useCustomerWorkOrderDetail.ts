
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { WorkOrder, WorkOrderLineItem } from '@/hooks/work-orders';
import { toast } from '@/hooks/use-toast';

// Helper function to check if a userId is a valid UUID
const isValidUuid = (id: string): boolean => {
  return id?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) !== null;
};

export function useCustomerWorkOrderDetail(workOrderId: string) {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [lineItems, setLineItems] = useState<WorkOrderLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchWorkOrder = async () => {
    if (!user?.id || !workOrderId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // For non-UUID user IDs (mock or test users), return mock work order data
      if (!isValidUuid(user.id)) {
        console.log(`Using mock work order data for non-UUID user ID: ${user.id}`);
        
        // Generate mock data (same as in the original useWorkOrder hook)
        const mockWorkOrder = {
          id: workOrderId,
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
        
        setWorkOrder(mockWorkOrder as WorkOrder);
        setLineItems(mockWorkOrder.lineItems as WorkOrderLineItem[]);
        setLoading(false);
        return;
      }
      
      // For real users, fetch from database
      // First, fetch the work order with related data
      const { data: orderData, error: orderError } = await supabase
        .from('work_orders')
        .select(`
          *,
          vehicles:vehicle_id (*),
          profiles:customer_id (*)
        `)
        .eq('id', workOrderId)
        .eq('customer_id', user.id)
        .single();
      
      if (orderError) throw orderError;
      
      if (!orderData) {
        setWorkOrder(null);
        setLoading(false);
        return;
      }
      
      // Next, fetch line items
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('work_order_line_items')
        .select('*')
        .eq('work_order_id', workOrderId);
        
      if (lineItemsError) throw lineItemsError;
      
      // Transform line items
      const transformedLineItems = lineItemsData?.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
      })) || [];
      
      // Calculate total from line items
      const total = transformedLineItems.reduce((sum, item) => sum + item.total, 0);
      
      // Transform the data to match the expected format
      const transformedOrder = {
        id: orderData.id,
        title: orderData.title || 'Untitled Work Order',
        description: orderData.description || '',
        status: orderData.status,
        date: new Date(orderData.created_at).toISOString().split('T')[0],
        progress: orderData.status === 'completed' ? 100 : orderData.status === 'in_progress' ? 75 : 0,
        estimatedCompletion: orderData.estimated_completion || null,
        customer: {
          name: `${orderData.profiles?.first_name || ''} ${orderData.profiles?.last_name || ''}`.trim(),
          email: orderData.profiles?.email || '',
          phone: orderData.profiles?.phone || ''
        },
        vehicle: {
          year: orderData.vehicles?.year?.toString() || '',
          make: orderData.vehicles?.make || '',
          model: orderData.vehicles?.model || '',
          vin: orderData.vehicles?.vin || '',
          license: orderData.vehicles?.license_plate || ''
        },
        lineItems: transformedLineItems,
        total: total
      };
      
      setWorkOrder(transformedOrder as WorkOrder);
      setLineItems(transformedLineItems as WorkOrderLineItem[]);
      
    } catch (err: any) {
      console.error('Error fetching work order:', err);
      setError(err);
      
      toast({
        variant: "destructive",
        title: "Error loading work order details",
        description: err.message || "Failed to load work order details"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch work order when component mounts or parameters change
  useEffect(() => {
    if (workOrderId && user?.id) {
      fetchWorkOrder();
    }
  }, [workOrderId, user?.id]);

  return { workOrder, lineItems, loading, error };
}

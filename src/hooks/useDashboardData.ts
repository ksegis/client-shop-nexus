
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { handleRlsError } from '@/integrations/supabase/client';

export interface DashboardMetrics {
  totalEstimates: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  recentEstimates: {
    id: string;
    title: string;
    vehicle: string;
    amount: number;
  }[];
  activeWorkOrders: {
    id: string;
    title: string;
    vehicle: string;
    status: string;
  }[];
  inventoryAlerts: {
    type: 'low_stock' | 'order_reminder';
    message: string;
    count: number;
  }[];
}

export const useDashboardData = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // Fetch estimates metrics
        const { data: estimatesData, error: estimatesError } = await supabase
          .from('estimates')
          .select('id, status')
          .order('created_at', { ascending: false });

        if (estimatesError) {
          if (handleRlsError(estimatesError, toast)) return;
          throw new Error(`Error fetching estimates: ${estimatesError.message}`);
        }

        // Fetch recent estimates with vehicle and customer info
        const { data: recentEstimates, error: recentEstimatesError } = await supabase
          .from('estimates')
          .select(`
            id, 
            title, 
            total_amount,
            vehicles:vehicle_id (make, model, year)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentEstimatesError) {
          if (handleRlsError(recentEstimatesError, toast)) return;
          throw new Error(`Error fetching recent estimates: ${recentEstimatesError.message}`);
        }

        // Fetch active work orders
        const { data: workOrdersData, error: workOrdersError } = await supabase
          .from('work_orders')
          .select(`
            id, 
            title, 
            status,
            vehicles:vehicle_id (make, model, year)
          `)
          .eq('status', 'in_progress')
          .order('created_at', { ascending: false })
          .limit(5);

        if (workOrdersError) {
          if (handleRlsError(workOrdersError, toast)) return;
          throw new Error(`Error fetching work orders: ${workOrdersError.message}`);
        }

        // Fetch inventory alerts (items below reorder level)
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select('*')
          .lt('quantity', 10)
          .order('quantity', { ascending: true });

        if (inventoryError) {
          if (handleRlsError(inventoryError, toast)) return;
          throw new Error(`Error fetching inventory: ${inventoryError.message}`);
        }

        // Process data for dashboard metrics
        const totalEstimates = estimatesData.length;
        const pendingApproval = estimatesData.filter(est => est.status === 'pending').length;
        const approved = estimatesData.filter(est => est.status === 'approved').length;
        const rejected = estimatesData.filter(est => est.status === 'declined').length;

        const formattedRecentEstimates = recentEstimates.map(est => ({
          id: est.id,
          title: est.title,
          vehicle: est.vehicles ? `${est.vehicles.make} ${est.vehicles.model} (${est.vehicles.year})` : 'Unknown vehicle',
          amount: est.total_amount
        }));

        const formattedWorkOrders = workOrdersData.map(wo => ({
          id: wo.id,
          title: wo.title,
          vehicle: wo.vehicles ? `${wo.vehicles.make} ${wo.vehicles.model} (${wo.vehicles.year})` : 'Unknown vehicle',
          status: wo.status
        }));

        // Inventory alerts
        const lowStockItems = inventoryData.filter(item => item.quantity < item.reorder_level);
        const pendingOrderItems = inventoryData.filter(item => item.quantity === 0);
        
        const inventoryAlerts = [
          {
            type: 'low_stock' as const,
            message: 'Low Stock Alert',
            count: lowStockItems.length
          }
        ];

        if (pendingOrderItems.length > 0) {
          inventoryAlerts.push({
            type: 'order_reminder' as const,
            message: 'Order Reminder',
            count: pendingOrderItems.length
          });
        }

        setMetrics({
          totalEstimates,
          pendingApproval,
          approved,
          rejected,
          recentEstimates: formattedRecentEstimates,
          activeWorkOrders: formattedWorkOrders,
          inventoryAlerts
        });
        
        setError(null);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching dashboard data'));
        toast({
          title: "Error loading dashboard data",
          description: err instanceof Error ? err.message : "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [toast]);

  return { metrics, loading, error };
};

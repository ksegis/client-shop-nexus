
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DashboardSummary {
  estimates: {
    count: number;
    pending: number;
    approved: number;
    recent: {
      id: string;
      title: string;
      customer_name: string;
      created_at: string;
      total_amount: number;
    }[];
  };
  workOrders: {
    count: number;
    inProgress: number;
    completed: number;
    recent: {
      id: string;
      title: string;
      customer_name: string;
      status: string;
      created_at: string;
    }[];
  };
  inventory: {
    lowStock: number;
    totalParts: number;
    alerts: {
      id: string;
      part_name: string;
      current_stock: number;
      min_stock: number;
      alert_type: 'low_stock' | 'overstock' | 'order_needed';
    }[];
  };
  customerCount: number;
  loading: boolean;
  error: Error | null;
}

export const useDashboardData = (): DashboardSummary => {
  const { data: estimatesData, isLoading: isEstimatesLoading, error: estimatesError } = useQuery({
    queryKey: ['dashboard', 'estimates'],
    queryFn: async () => {
      // Instead of joining with customers which might not exist, fetch estimates and handle customer names separately
      const { data, error } = await supabase
        .from('estimates')
        .select('id, title, total_amount, status, created_at, customer_id')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // For each estimate, fetch the customer profile
      const estimatesWithCustomers = await Promise.all(
        data.map(async (estimate) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', estimate.customer_id)
            .single();
          
          const customerName = profileData 
            ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Unknown Customer'
            : 'Unknown Customer';
            
          return {
            ...estimate,
            customer_name: customerName
          };
        })
      );
      
      return estimatesWithCustomers;
    }
  });

  const { data: workOrdersData, isLoading: isWorkOrdersLoading, error: workOrdersError } = useQuery({
    queryKey: ['dashboard', 'workOrders'],
    queryFn: async () => {
      // Similarly for work orders, fetch separately and handle customer names manually
      const { data, error } = await supabase
        .from('work_orders')
        .select('id, title, status, created_at, customer_id')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // For each work order, fetch the customer profile
      const workOrdersWithCustomers = await Promise.all(
        data.map(async (workOrder) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', workOrder.customer_id)
            .single();
          
          const customerName = profileData 
            ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Unknown Customer'
            : 'Unknown Customer';
            
          return {
            ...workOrder,
            customer_name: customerName
          };
        })
      );
      
      return workOrdersWithCustomers;
    }
  });

  const { data: inventoryData, isLoading: isInventoryLoading, error: inventoryError } = useQuery({
    queryKey: ['dashboard', 'inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('quantity', { ascending: true })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: customerData, isLoading: isCustomerLoading, error: customerError } = useQuery({
    queryKey: ['dashboard', 'customers'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');
      
      if (error) throw error;
      return count || 0;
    }
  });

  const isLoading = isEstimatesLoading || isWorkOrdersLoading || isInventoryLoading || isCustomerLoading;
  const error = estimatesError || workOrdersError || inventoryError || customerError || null;

  // Process estimates data
  const estimates = {
    count: estimatesData?.length || 0,
    pending: estimatesData?.filter(e => e.status === 'pending').length || 0,
    approved: estimatesData?.filter(e => e.status === 'approved').length || 0,
    recent: estimatesData?.map(e => ({
      id: e.id,
      title: e.title,
      customer_name: e.customer_name,
      created_at: e.created_at,
      total_amount: e.total_amount
    })) || []
  };

  // Process work orders data
  const workOrders = {
    count: workOrdersData?.length || 0,
    inProgress: workOrdersData?.filter(w => w.status === 'in_progress').length || 0,
    completed: workOrdersData?.filter(w => w.status === 'completed').length || 0,
    recent: workOrdersData?.map(w => ({
      id: w.id,
      title: w.title,
      customer_name: w.customer_name,
      status: w.status,
      created_at: w.created_at
    })) || []
  };

  // Process inventory data
  const lowStockItems = inventoryData?.filter(p => p.quantity <= (p.reorder_level || 10)) || [];
  
  const inventoryAlerts = lowStockItems.map(item => ({
    id: item.id,
    part_name: item.name,
    current_stock: item.quantity,
    min_stock: item.reorder_level || 10,
    alert_type: 'low_stock' as const
  }));

  const inventory = {
    lowStock: lowStockItems.length,
    totalParts: inventoryData?.length || 0,
    alerts: inventoryAlerts
  };

  return {
    estimates,
    workOrders,
    inventory,
    customerCount: customerData || 0,
    loading: isLoading,
    error
  };
};

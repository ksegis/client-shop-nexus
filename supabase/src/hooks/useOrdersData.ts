import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase'; // Adjust path to match your project structure

// Order interface for dashboard
interface DashboardOrder {
  id: string;
  orderReference: string;
  customerName: string;
  customerEmail: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  shippingMethod?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

// Orders summary interface
interface OrdersSummary {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
  averageOrderValue: number;
}

// Orders data hook
export const useOrdersData = () => {
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [summary, setSummary] = useState<OrdersSummary>({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  });
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch orders data
  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get Supabase client using your singleton pattern
      const supabase = getSupabaseClient();

      // Fetch orders from special_orders table
      const { data: ordersData, error: ordersError } = await supabase
        .from('special_orders')
        .select(`
          id,
          order_reference,
          customer_first_name,
          customer_last_name,
          customer_email,
          status,
          total_amount,
          item_count,
          created_at,
          updated_at,
          shipping_method,
          tracking_number,
          estimated_delivery
        `)
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw new Error(`Failed to fetch orders: ${ordersError.message}`);
      }

      // Transform data to match our interface
      const transformedOrders: DashboardOrder[] = (ordersData || []).map(order => ({
        id: order.id,
        orderReference: order.order_reference || `ORD-${order.id}`,
        customerName: `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim() || 'Unknown Customer',
        customerEmail: order.customer_email || '',
        status: order.status || 'pending',
        totalAmount: parseFloat(order.total_amount) || 0,
        itemCount: order.item_count || 0,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        shippingMethod: order.shipping_method,
        trackingNumber: order.tracking_number,
        estimatedDelivery: order.estimated_delivery
      }));

      setOrders(transformedOrders);

      // Calculate summary statistics
      const totalOrders = transformedOrders.length;
      const pendingOrders = transformedOrders.filter(o => o.status === 'pending').length;
      const processingOrders = transformedOrders.filter(o => o.status === 'processing').length;
      const shippedOrders = transformedOrders.filter(o => o.status === 'shipped').length;
      const deliveredOrders = transformedOrders.filter(o => o.status === 'delivered').length;
      const cancelledOrders = transformedOrders.filter(o => o.status === 'cancelled').length;
      
      // Calculate revenue (excluding cancelled orders)
      const totalRevenue = transformedOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, order) => sum + order.totalAmount, 0);
      
      const averageOrderValue = totalOrders > 0 ? totalRevenue / (totalOrders - cancelledOrders) : 0;

      setSummary({
        total: totalOrders,
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
        totalRevenue,
        averageOrderValue
      });

      // Set recent orders (last 10)
      setRecentOrders(transformedOrders.slice(0, 10));

    } catch (err) {
      console.error('Error fetching orders data:', err);
      setError(err as Error);
      
      // Reset to empty state on error
      setOrders([]);
      setRecentOrders([]);
      setSummary({
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0,
        averageOrderValue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchOrdersData();
  }, []);

  // Refresh function
  const refreshOrders = () => {
    fetchOrdersData();
  };

  // Get orders by status
  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  // Get orders requiring attention (pending, processing)
  const getOrdersRequiringAttention = () => {
    return orders.filter(order => ['pending', 'processing'].includes(order.status));
  };

  // Get recent orders (last N days)
  const getRecentOrdersInPeriod = (days: number = 7) => {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return orders.filter(order => new Date(order.createdAt) >= cutoffDate);
  };

  // Get orders by date range
  const getOrdersByDateRange = (startDate: Date, endDate: Date) => {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  };

  // Get revenue for a specific period
  const getRevenueForPeriod = (days: number = 30) => {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return orders
      .filter(order => 
        new Date(order.createdAt) >= cutoffDate && 
        order.status !== 'cancelled'
      )
      .reduce((sum, order) => sum + order.totalAmount, 0);
  };

  return {
    // Data
    orders,
    summary,
    recentOrders,
    loading,
    error,
    
    // Actions
    refreshOrders,
    
    // Filters
    getOrdersByStatus,
    getOrdersRequiringAttention,
    getRecentOrdersInPeriod,
    getOrdersByDateRange,
    
    // Analytics
    getRevenueForPeriod
  };
};

// Export types for use in other components
export type { DashboardOrder, OrdersSummary };


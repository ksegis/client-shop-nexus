import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (you may need to adjust this based on your setup)
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || '',
  process.env.REACT_APP_SUPABASE_ANON_KEY || ''
);

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

      // Fetch orders from your orders table
      // Note: Adjust table name and columns based on your actual database schema
      const { data: ordersData, error: ordersError } = await supabase
        .from('special_orders') // Adjust table name as needed
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
        throw ordersError;
      }

      // Transform data to match our interface
      const transformedOrders: DashboardOrder[] = (ordersData || []).map(order => ({
        id: order.id,
        orderReference: order.order_reference || `ORD-${order.id}`,
        customerName: `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim(),
        customerEmail: order.customer_email || '',
        status: order.status || 'pending',
        totalAmount: order.total_amount || 0,
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
      const totalRevenue = transformedOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, order) => sum + order.totalAmount, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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
      
      // Fallback to mock data for development
      const mockOrders: DashboardOrder[] = [
        {
          id: '1',
          orderReference: 'ORD-2024-001',
          customerName: 'John Smith',
          customerEmail: 'john.smith@email.com',
          status: 'pending',
          totalAmount: 245.99,
          itemCount: 3,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          shippingMethod: 'UPS Ground'
        },
        {
          id: '2',
          orderReference: 'ORD-2024-002',
          customerName: 'Sarah Johnson',
          customerEmail: 'sarah.j@email.com',
          status: 'processing',
          totalAmount: 189.50,
          itemCount: 2,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          shippingMethod: 'FedEx Express',
          trackingNumber: 'FX123456789'
        },
        {
          id: '3',
          orderReference: 'ORD-2024-003',
          customerName: 'Mike Davis',
          customerEmail: 'mike.davis@email.com',
          status: 'shipped',
          totalAmount: 567.25,
          itemCount: 5,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          shippingMethod: 'UPS Next Day',
          trackingNumber: 'UPS987654321',
          estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          orderReference: 'ORD-2024-004',
          customerName: 'Lisa Wilson',
          customerEmail: 'lisa.wilson@email.com',
          status: 'delivered',
          totalAmount: 123.75,
          itemCount: 1,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          shippingMethod: 'USPS Priority',
          trackingNumber: 'USPS456789123'
        },
        {
          id: '5',
          orderReference: 'ORD-2024-005',
          customerName: 'Robert Brown',
          customerEmail: 'robert.brown@email.com',
          status: 'pending',
          totalAmount: 89.99,
          itemCount: 1,
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          shippingMethod: 'Standard Shipping'
        }
      ];

      setOrders(mockOrders);
      setRecentOrders(mockOrders);
      setSummary({
        total: 5,
        pending: 2,
        processing: 1,
        shipped: 1,
        delivered: 1,
        cancelled: 0,
        totalRevenue: 1216.48,
        averageOrderValue: 243.30
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

  // Get recent orders (last 7 days)
  const getRecentOrdersInPeriod = (days: number = 7) => {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return orders.filter(order => new Date(order.createdAt) >= cutoffDate);
  };

  return {
    orders,
    summary,
    recentOrders,
    loading,
    error,
    refreshOrders,
    getOrdersByStatus,
    getOrdersRequiringAttention,
    getRecentOrdersInPeriod
  };
};

// Export types for use in other components
export type { DashboardOrder, OrdersSummary };


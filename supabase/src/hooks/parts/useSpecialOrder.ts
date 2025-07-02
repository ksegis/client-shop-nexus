
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Part } from '@/types/parts';

export type SpecialOrderFormData = {
  partName: string;
  description: string;
  manufacturer: string;
  quantity: number;
  customerNotes: string;
  urgency: 'normal' | 'rush' | 'emergency';
  targetPrice?: number;
};

export type SpecialOrderStatus = 
  | 'requested' 
  | 'sourcing' 
  | 'quoted'
  | 'ordered'
  | 'received'
  | 'completed'
  | 'cancelled';

export type SpecialOrder = {
  id: string;
  part_name: string;
  description: string;
  manufacturer: string;
  quantity: number;
  customer_notes: string;
  urgency: string;
  status: SpecialOrderStatus;
  created_at: string;
  updated_at: string;
  target_price: number | null;
  quoted_price: number | null;
  estimated_arrival: string | null;
  customer_id: string | null;
};

export const useSpecialOrder = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specialOrders, setSpecialOrders] = useState<SpecialOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const createSpecialOrder = async (formData: SpecialOrderFormData) => {
    setIsSubmitting(true);
    try {
      // Currently we'll just log this for demo purposes
      // In a real implementation, this would be stored in the database
      console.log('Creating special order:', formData);
      
      toast({
        title: "Special Order Requested",
        description: "Your special order has been submitted.",
      });
      return true;
    } catch (error) {
      console.error('Error creating special order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit special order. Please try again.",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchSpecialOrders = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from the database
      // For now, we'll just simulate some data
      const mockOrders: SpecialOrder[] = [
        {
          id: '1',
          part_name: 'Custom Exhaust Flange',
          description: 'High temperature resistant exhaust flange for modified trucks',
          manufacturer: 'Performance Plus',
          quantity: 2,
          customer_notes: 'Need this to complete engine rebuild',
          urgency: 'normal',
          status: 'sourcing',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          target_price: 120.00,
          quoted_price: null,
          estimated_arrival: null,
          customer_id: null
        },
        {
          id: '2',
          part_name: 'Custom Lift Kit',
          description: '4-inch lift kit compatible with 2023 Ford F-250',
          manufacturer: 'OffRoad Masters',
          quantity: 1,
          customer_notes: 'Looking for something that won\'t affect ride quality too much',
          urgency: 'rush',
          status: 'quoted',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          target_price: 1500.00,
          quoted_price: 1650.00,
          estimated_arrival: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          customer_id: null
        }
      ];
      
      setSpecialOrders(mockOrders);
      return mockOrders;
    } catch (error) {
      console.error('Error fetching special orders:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load special orders.",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const updateSpecialOrderStatus = async (id: string, status: SpecialOrderStatus) => {
    try {
      // In a real implementation, this would update the database
      console.log('Updating special order status:', { id, status });
      
      // Update local state to reflect changes
      setSpecialOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === id ? { ...order, status, updated_at: new Date().toISOString() } : order
        )
      );
      
      toast({
        title: "Status Updated",
        description: `Order status changed to ${status}.`,
      });
      return true;
    } catch (error) {
      console.error('Error updating special order status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status.",
      });
      return false;
    }
  };

  return {
    createSpecialOrder,
    fetchSpecialOrders,
    updateSpecialOrderStatus,
    specialOrders,
    isLoading,
    isSubmitting
  };
};

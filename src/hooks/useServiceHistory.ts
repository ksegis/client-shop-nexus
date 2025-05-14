
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';

export interface ServiceHistoryEntry {
  id: string;
  customer_id: string;
  vehicle_id: string;
  service_date: string;
  service_type: string;
  description: string;
  technician_notes: string;
  parts_used: string[];
  labor_hours: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

export const useServiceHistory = (vehicleId?: string, customerId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // For staff: Get service history for a specific vehicle or customer
  const { data: serviceHistory = [], refetch } = useQuery({
    queryKey: ['service-history', vehicleId, customerId],
    queryFn: async () => {
      try {
        setIsLoading(true);
        let query = supabase
          .from('service_history')
          .select('*, vehicles(make, model, year), profiles(first_name, last_name)');

        if (vehicleId) {
          query = query.eq('vehicle_id', vehicleId);
        } 
        
        if (customerId) {
          query = query.eq('customer_id', customerId);
        }

        const { data, error } = await query
          .order('service_date', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching service history",
          description: error.message,
        });
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    enabled: !!(user && (vehicleId || customerId || user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'staff')),
  });

  // For customers: Get their own service history
  const { data: customerServiceHistory = [] } = useQuery({
    queryKey: ['customer-service-history', user?.id],
    queryFn: async () => {
      try {
        setIsLoading(true);
        if (!user?.id) return [];

        const { data, error } = await supabase
          .from('service_history')
          .select('*, vehicles(make, model, year)')
          .eq('customer_id', user.id)
          .order('service_date', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching your service history",
          description: error.message,
        });
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    enabled: !!user?.id,
  });

  // Get service history for a specific vehicle (used by vehicle detail page)
  const getVehicleServiceHistory = async (vehicleId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('service_history')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('service_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching vehicle service history",
        description: error.message,
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    serviceHistory,
    customerServiceHistory,
    getVehicleServiceHistory,
    isLoading,
    refetch,
  };
};


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { ServiceHistoryEntry } from '@/integrations/supabase/types-extensions';

export type { ServiceHistoryEntry };

export const useServiceHistory = (vehicleId?: string, customerId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Check if we're using dev customer mode
  const isDevCustomer = user?.id === 'dev-customer-user-id';

  // For staff: Get service history for a specific vehicle or customer
  const { data: serviceHistory = [], refetch } = useQuery({
    queryKey: ['service-history', vehicleId, customerId],
    queryFn: async () => {
      try {
        setIsLoading(true);
        
        // For dev customer mode, return mock data
        if ((customerId === 'dev-customer-user-id' || isDevCustomer) && !vehicleId) {
          return [{
            id: 'mock-history-1',
            customer_id: 'dev-customer-user-id',
            vehicle_id: 'mock-vehicle-1',
            service_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            service_type: 'Oil Change',
            description: 'Regular maintenance service',
            technician_notes: 'All systems checked, oil and filter replaced',
            parts_used: ['Oil filter', 'Synthetic oil'],
            labor_hours: 1.5,
            total_cost: 89.99,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            vehicles: {
              make: 'Toyota',
              model: 'Camry',
              year: 2020
            },
            profiles: {
              first_name: 'Dev',
              last_name: 'Customer',
              email: 'customer@example.com'
            }
          }];
        }
        
        let query = supabase
          .from('service_history')
          .select('*, vehicles(make, model, year), profiles(first_name, last_name)');

        if (vehicleId) {
          query = query.eq('vehicle_id', vehicleId);
        } 
        
        if (customerId && customerId !== 'dev-customer-user-id') {
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
        
        // For dev customer mode, return mock data
        if (isDevCustomer) {
          return [{
            id: 'mock-history-1',
            customer_id: user.id,
            vehicle_id: 'mock-vehicle-1',
            service_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            service_type: 'Oil Change',
            description: 'Regular maintenance service',
            technician_notes: 'All systems checked, oil and filter replaced',
            parts_used: ['Oil filter', 'Synthetic oil'],
            labor_hours: 1.5,
            total_cost: 89.99,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            vehicles: {
              make: 'Toyota',
              model: 'Camry',
              year: 2020
            }
          }];
        }

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
      
      // For dev customer mode with mock vehicle, return mock data
      if (isDevCustomer && vehicleId.startsWith('mock-')) {
        return [{
          id: 'mock-history-1',
          customer_id: user?.id || 'dev-customer-user-id',
          vehicle_id: vehicleId,
          service_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          service_type: 'Oil Change',
          description: 'Regular maintenance service',
          technician_notes: 'All systems checked, oil and filter replaced',
          parts_used: ['Oil filter', 'Synthetic oil'],
          labor_hours: 1.5,
          total_cost: 89.99,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }];
      }
      
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


import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WorkOrder } from "../types";

export const useWorkOrdersQuery = () => {
  const [error, setError] = useState<Error | null>(null);
  
  const { data: workOrders = [], isLoading, refetch } = useQuery({
    queryKey: ['workOrders'],
    queryFn: async () => {
      try {
        // Fix the query to properly specify the relationships for customer and assigned staff
        const { data, error: queryError } = await supabase
          .from('work_orders')
          .select(`
            *,
            vehicle:vehicles(*),
            customer:profiles!work_orders_customer_id_fkey(*)
          `)
          .order('created_at', { ascending: false });
          
        if (queryError) throw queryError;
        
        return (data || []) as unknown as WorkOrder[];
      } catch (error) {
        console.error("Error fetching work orders:", error);
        setError(error as Error);
        return [];
      }
    },
  });

  const refreshWorkOrders = async () => {
    await refetch();
  };

  return {
    workOrders,
    isLoading,
    error,
    refreshWorkOrders
  };
};

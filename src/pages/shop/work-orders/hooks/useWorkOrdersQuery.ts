
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
        const { data, error: queryError } = await supabase
          .from('work_orders')
          .select(`
            *,
            vehicle:vehicles(*),
            customer:profiles(*)
          `)
          .order('created_at', { ascending: false });
          
        if (queryError) throw queryError;
        
        return (data || []) as unknown as WorkOrder[];
      } catch (error) {
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

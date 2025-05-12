
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WorkOrder, WorkOrderStatus } from './types';

interface WorkOrdersContextType {
  workOrders: WorkOrder[];
  isLoading: boolean;
  error: Error | null;
  createWorkOrder: (workOrder: Partial<WorkOrder>) => Promise<void>;
  updateWorkOrder: (id: string, workOrder: Partial<WorkOrder>) => Promise<void>;
  deleteWorkOrder: (id: string) => Promise<void>;
  refreshWorkOrders: () => Promise<void>;
}

const WorkOrdersContext = createContext<WorkOrdersContextType | undefined>(undefined);

export function WorkOrdersProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
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

  const createWorkOrder = async (workOrder: Partial<WorkOrder>) => {
    try {
      console.log("Creating work order with data:", workOrder);
      
      // Fix: Ensure we're passing a single object not an array and handle required fields
      if (!workOrder.customer_id || !workOrder.vehicle_id || !workOrder.title) {
        throw new Error("Missing required fields: customer_id, vehicle_id, or title");
      }
      
      const { data, error: insertError } = await supabase
        .from('work_orders')
        .insert(workOrder)
        .select();
      
      if (insertError) {
        console.error("Error creating work order:", insertError);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to create work order: ${insertError.message || 'Unknown error'}`,
        });
        throw insertError;
      }
      
      console.log("Work order created successfully:", data);
      await refetch();
      toast({
        title: "Success",
        description: "Work order created successfully",
      });
    } catch (error) {
      console.error("Error in createWorkOrder function:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create work order: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    }
  };

  const updateWorkOrder = async (id: string, updatedWorkOrder: Partial<WorkOrder>) => {
    try {
      console.log("Updating work order:", id, updatedWorkOrder);
      
      const { error: updateError } = await supabase
        .from('work_orders')
        .update(updatedWorkOrder)
        .eq('id', id);
      
      if (updateError) {
        console.error("Error updating work order:", updateError);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to update work order: ${updateError.message || 'Unknown error'}`,
        });
        throw updateError;
      }
      
      await refetch();
      toast({
        title: "Success",
        description: "Work order updated successfully",
      });
    } catch (error) {
      console.error("Error in updateWorkOrder function:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update work order: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    }
  };

  const deleteWorkOrder = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to delete work order: ${deleteError.message || 'Unknown error'}`,
        });
        throw deleteError;
      }
      
      await refetch();
      toast({
        title: "Success",
        description: "Work order deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete work order: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    }
  };

  const refreshWorkOrders = async () => {
    await refetch();
  };

  return (
    <WorkOrdersContext.Provider
      value={{
        workOrders,
        isLoading,
        error,
        createWorkOrder,
        updateWorkOrder,
        deleteWorkOrder,
        refreshWorkOrders
      }}
    >
      {children}
    </WorkOrdersContext.Provider>
  );
}

export function useWorkOrders() {
  const context = useContext(WorkOrdersContext);
  if (context === undefined) {
    throw new Error('useWorkOrders must be used within a WorkOrdersProvider');
  }
  return context;
}

export { WorkOrdersContext };

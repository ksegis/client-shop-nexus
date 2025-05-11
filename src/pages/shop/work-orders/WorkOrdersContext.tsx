
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
        const { data, error } = await supabase
          .from('work_orders')
          .select(`
            *,
            vehicle:vehicles(*),
            customer:profiles(*)
          `)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        return data as WorkOrder[];
      } catch (error) {
        setError(error as Error);
        return [];
      }
    },
  });

  const createWorkOrder = async (workOrder: Partial<WorkOrder>) => {
    try {
      const { error: insertError } = await supabase
        .from('work_orders')
        .insert([workOrder]);
      
      if (insertError) throw insertError;
      
      await refetch();
      toast({
        title: "Success",
        description: "Work order created successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create work order: ${(error as Error).message}`,
      });
      throw error;
    }
  };

  const updateWorkOrder = async (id: string, updatedWorkOrder: Partial<WorkOrder>) => {
    try {
      const { error: updateError } = await supabase
        .from('work_orders')
        .update(updatedWorkOrder)
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      await refetch();
      toast({
        title: "Success",
        description: "Work order updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update work order: ${(error as Error).message}`,
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
      
      if (deleteError) throw deleteError;
      
      await refetch();
      toast({
        title: "Success",
        description: "Work order deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete work order: ${(error as Error).message}`,
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

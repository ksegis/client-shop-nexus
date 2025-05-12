
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WorkOrder, WorkOrderStatus, WorkOrderLineItem } from './types';

interface WorkOrdersContextType {
  workOrders: WorkOrder[];
  isLoading: boolean;
  error: Error | null;
  createWorkOrder: (workOrder: Partial<WorkOrder>, lineItems?: WorkOrderLineItem[]) => Promise<void>;
  updateWorkOrder: (id: string, workOrder: Partial<WorkOrder>, lineItems?: WorkOrderLineItem[]) => Promise<void>;
  deleteWorkOrder: (id: string) => Promise<void>;
  refreshWorkOrders: () => Promise<void>;
  getWorkOrderLineItems: (workOrderId: string) => Promise<WorkOrderLineItem[]>;
  addLineItem: (workOrderId: string, lineItem: Partial<WorkOrderLineItem>) => Promise<void>;
  updateLineItem: (lineItemId: string, lineItem: Partial<WorkOrderLineItem>) => Promise<void>;
  deleteLineItem: (lineItemId: string) => Promise<void>;
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

  const getWorkOrderLineItems = async (workOrderId: string): Promise<WorkOrderLineItem[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('work_order_line_items')
        .select('*')
        .eq('work_order_id', workOrderId);
        
      if (fetchError) throw fetchError;
      return (data || []) as WorkOrderLineItem[];
    } catch (error) {
      console.error("Error fetching work order line items:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to fetch line items: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      return [];
    }
  };

  const addLineItem = async (workOrderId: string, lineItem: Partial<WorkOrderLineItem>) => {
    try {
      const newLineItem = {
        work_order_id: workOrderId,
        description: lineItem.description || '',
        quantity: lineItem.quantity || 1,
        price: lineItem.price || 0,
        part_number: lineItem.part_number,
        vendor: lineItem.vendor
      };

      const { error: insertError } = await supabase
        .from('work_order_line_items')
        .insert(newLineItem);
      
      if (insertError) throw insertError;
      
      await refetch();
      toast({
        title: "Success",
        description: "Line item added successfully",
      });
    } catch (error) {
      console.error("Error adding line item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add line item: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    }
  };

  const updateLineItem = async (lineItemId: string, lineItem: Partial<WorkOrderLineItem>) => {
    try {
      const { error: updateError } = await supabase
        .from('work_order_line_items')
        .update(lineItem)
        .eq('id', lineItemId);
      
      if (updateError) throw updateError;
      
      await refetch();
      toast({
        title: "Success",
        description: "Line item updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update line item: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    }
  };

  const deleteLineItem = async (lineItemId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('work_order_line_items')
        .delete()
        .eq('id', lineItemId);
      
      if (deleteError) throw deleteError;
      
      await refetch();
      toast({
        title: "Success",
        description: "Line item deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete line item: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    }
  };

  const createWorkOrder = async (workOrder: Partial<WorkOrder>, lineItems?: WorkOrderLineItem[]) => {
    try {
      console.log("Creating work order with data:", workOrder);
      
      // Fix: Ensure we're passing a single object not an array and handle required fields
      if (!workOrder.customer_id || !workOrder.vehicle_id || !workOrder.title) {
        throw new Error("Missing required fields: customer_id, vehicle_id, or title");
      }
      
      // Create a properly typed object that satisfies Supabase's requirements
      const newWorkOrder = {
        customer_id: workOrder.customer_id,
        vehicle_id: workOrder.vehicle_id,
        title: workOrder.title,
        description: workOrder.description,
        status: workOrder.status || 'pending',
        estimated_hours: workOrder.estimated_hours,
        estimated_cost: workOrder.estimated_cost,
        actual_hours: workOrder.actual_hours,
        actual_cost: workOrder.actual_cost,
        priority: workOrder.priority || 1,
        assigned_to: workOrder.assigned_to
      };
      
      const { data, error: insertError } = await supabase
        .from('work_orders')
        .insert(newWorkOrder)
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
      
      // Insert line items if provided
      if (lineItems && lineItems.length > 0 && data && data[0]) {
        const workOrderId = data[0].id;
        
        const lineItemsWithWorkOrderId = lineItems.map(item => ({
          ...item,
          work_order_id: workOrderId,
          id: undefined // Remove any existing IDs for insertion
        }));
        
        const { error: lineItemError } = await supabase
          .from('work_order_line_items')
          .insert(lineItemsWithWorkOrderId);
        
        if (lineItemError) {
          console.error("Error adding line items:", lineItemError);
          // We don't throw here to prevent rolling back the work order creation
          toast({
            variant: "destructive",
            title: "Warning",
            description: `Work order created but some line items failed to add: ${lineItemError.message}`,
          });
        }
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

  const updateWorkOrder = async (id: string, updatedWorkOrder: Partial<WorkOrder>, lineItems?: WorkOrderLineItem[]) => {
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
      
      // Update line items if provided
      if (lineItems && lineItems.length > 0) {
        // First delete existing line items
        const { error: deleteError } = await supabase
          .from('work_order_line_items')
          .delete()
          .eq('work_order_id', id);
        
        if (deleteError) {
          console.error("Error deleting existing line items:", deleteError);
          toast({
            variant: "destructive",
            title: "Warning",
            description: `Failed to update line items: ${deleteError.message}`,
          });
        } else {
          // Then insert new line items
          const lineItemsWithWorkOrderId = lineItems.map(item => ({
            ...item,
            work_order_id: id,
            id: undefined // Remove any existing IDs for re-insertion
          }));
          
          const { error: insertError } = await supabase
            .from('work_order_line_items')
            .insert(lineItemsWithWorkOrderId);
          
          if (insertError) {
            console.error("Error updating line items:", insertError);
            toast({
              variant: "destructive",
              title: "Warning",
              description: `Work order updated but line items failed to update: ${insertError.message}`,
            });
          }
        }
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
      // First delete any associated line items
      await supabase
        .from('work_order_line_items')
        .delete()
        .eq('work_order_id', id);
        
      // Then delete the work order itself
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
        refreshWorkOrders,
        getWorkOrderLineItems,
        addLineItem,
        updateLineItem,
        deleteLineItem
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

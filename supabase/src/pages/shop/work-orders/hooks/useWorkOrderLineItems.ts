
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { WorkOrderLineItem } from "../types";

export const useWorkOrderLineItems = () => {
  const { toast } = useToast();

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
      
      toast({
        title: "Success",
        description: "Line item added successfully",
      });
      return true;
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
      
      toast({
        title: "Success",
        description: "Line item updated successfully",
      });
      return true;
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
      
      toast({
        title: "Success",
        description: "Line item deleted successfully",
      });
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete line item: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    }
  };

  return {
    getWorkOrderLineItems,
    addLineItem,
    updateLineItem,
    deleteLineItem
  };
};

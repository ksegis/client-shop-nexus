
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InventoryFormValues } from './types';

export const useInventory = () => {
  const queryClient = useQueryClient();

  // Add inventory item mutation
  const addItemMutation = useMutation({
    mutationFn: async (values: InventoryFormValues) => {
      console.log('Adding new inventory item:', values);
      
      if (!values.name) {
        throw new Error("Name is required");
      }
      
      const { error } = await supabase.from('inventory').insert({
        name: values.name,
        description: values.description,
        sku: values.sku,
        quantity: values.quantity,
        price: values.price,
        cost: values.cost,
        category: values.category,
        supplier: values.supplier,
        reorder_level: values.reorder_level
      });
      
      if (error) {
        console.error('Error adding inventory item:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-inventory'] });
      toast({
        title: "Item added",
        description: "New inventory item has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding item",
        description: error.message || 'An unknown error occurred',
        variant: "destructive",
      });
    },
  });

  return {
    addItemMutation,
  };
};

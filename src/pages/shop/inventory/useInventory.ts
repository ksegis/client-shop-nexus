
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
      
      // Proceed with add operation
      const { data, error } = await supabase.from('inventory').insert({
        name: values.name,
        description: values.description,
        sku: values.sku,
        quantity: values.quantity,
        price: values.price,
        cost: values.cost,
        category: values.category,
        supplier: values.supplier,
        reorder_level: values.reorder_level
      }).select();
      
      if (error) {
        console.error('Error adding inventory item:', error);
        throw error;
      }
      
      console.log('Successfully added inventory item:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Item added",
        description: "New inventory item has been added successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Error in addItemMutation:', error);
      toast({
        title: "Error adding item",
        description: error.message || 'An unknown error occurred',
        variant: "destructive",
      });
    },
  });

  // Update inventory item mutation
  const updateItemMutation = useMutation({
    mutationFn: async (values: InventoryFormValues & { id: string }) => {
      const { id, ...itemData } = values;
      
      console.log('Updating inventory item:', id, itemData);
      
      if (!itemData.name) {
        throw new Error("Name is required");
      }
      
      const { data, error } = await supabase
        .from('inventory')
        .update(itemData)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating inventory item:', error);
        throw error;
      }
      
      console.log('Successfully updated inventory item:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Item updated",
        description: "Inventory item has been updated successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Error in updateItemMutation:', error);
      toast({
        title: "Error updating item",
        description: error.message || 'An unknown error occurred',
        variant: "destructive",
      });
    },
  });
  
  // Delete inventory item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting inventory item:', id);
      
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting inventory item:', error);
        throw error;
      }
      
      console.log('Successfully deleted inventory item:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Item deleted",
        description: "Inventory item has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Error in deleteItemMutation:', error);
      toast({
        title: "Error deleting item",
        description: error.message || 'An unknown error occurred',
        variant: "destructive",
      });
    },
  });

  return {
    addItemMutation,
    updateItemMutation,
    deleteItemMutation
  };
};


import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { InventoryItem, InventoryFormValues } from './types';

export const useInventory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sortField, setSortField] = useState<keyof InventoryItem>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch inventory items
  const { data: inventoryItems, isLoading, error } = useQuery({
    queryKey: ['inventory', sortField, sortDirection],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });
      
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  // Add inventory item mutation
  const addItemMutation = useMutation({
    mutationFn: async (values: InventoryFormValues) => {
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
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Item added",
        description: "Inventory item has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update inventory item mutation
  const updateItemMutation = useMutation({
    mutationFn: async (values: InventoryFormValues & { id: string }) => {
      const { id, ...itemData } = values;
      
      if (!itemData.name) {
        throw new Error("Name is required");
      }
      
      const { error } = await supabase
        .from('inventory')
        .update(itemData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Item updated",
        description: "Inventory item has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle sort
  const handleSort = (field: keyof InventoryItem) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return {
    inventoryItems: inventoryItems || [],
    isLoading,
    error,
    sortField,
    sortDirection,
    handleSort,
    addItemMutation,
    updateItemMutation,
  };
};

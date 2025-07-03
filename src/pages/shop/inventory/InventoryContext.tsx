import { createContext, useContext, ReactNode, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem, InventoryFormValues } from './types';

interface InventoryContextProps {
  inventoryItems: InventoryItem[];
  isLoading: boolean;
  error: Error | null;
  sortField: keyof InventoryItem;
  sortDirection: 'asc' | 'desc';
  handleSort: (field: keyof InventoryItem) => void;
  addItem: (values: InventoryFormValues) => Promise<void>;
  updateItem: (values: InventoryFormValues & { id: string }) => Promise<void>;
  isSubmitting: boolean;
}

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sortField, setSortField] = useState<keyof InventoryItem>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch inventory items with improved error handling
  const { data: inventoryItems, isLoading, error } = useQuery({
    queryKey: ['inventory', sortField, sortDirection],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .order(sortField, { ascending: sortDirection === 'asc' });

        if (error) {
          console.error('Supabase fetch error:', error.message, error.details);
          throw new Error(`Failed to fetch inventory: ${error.message}`);
        }

        if (!data) {
          throw new Error('No data returned from inventory query');
        }

        return data as InventoryItem[];
      } catch (err: any) {
        console.error('Inventory fetch error:', err);
        throw err;
      }
    },
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors, but not for auth/permission errors
      if (failureCount < 3 && !error.message.includes('permission')) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Add inventory item mutation with improved error handling
  const addItemMutation = useMutation({
    mutationFn: async (values: InventoryFormValues) => {
      try {
        // Validate required fields
        if (!values.name) {
          throw new Error('Name is required');
        }

        const inventoryItem = {
          name: values.name,
          description: values.description,
          sku: values.sku,
          quantity: values.quantity,
          price: values.price,
          cost: values.cost,
          category: values.category,
          supplier: values.supplier,
          reorder_level: values.reorder_level,
          core_charge: values.core_charge,
        };

        const { data, error } = await supabase
          .from('inventory')
          .insert(inventoryItem)
          .select()
          .single();

        if (error) {
          console.error('Supabase insert error:', error.message, error.details, error.hint);
          
          // Provide more specific error messages
          if (error.code === '23505') {
            throw new Error('An item with this name or SKU already exists');
          } else if (error.code === '42501') {
            throw new Error('Permission denied. Please check your access rights.');
          } else if (error.code === '23502') {
            throw new Error('Missing required field. Please fill in all required information.');
          } else {
            throw new Error(`Failed to add item: ${error.message}`);
          }
        }

        if (!data) {
          throw new Error('No data returned after inserting item');
        }

        return data;
      } catch (err: any) {
        console.error('Add item error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Success",
        description: "Item added successfully",
      });
    },
    onError: (error: any) => {
      console.error('Add item mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add item",
        variant: "destructive",
      });
    },
  });

  // Update inventory item mutation with improved error handling
  const updateItemMutation = useMutation({
    mutationFn: async (values: InventoryFormValues & { id: string }) => {
      try {
        // Validate required fields
        if (!values.name) {
          throw new Error('Name is required');
        }
        if (!values.id) {
          throw new Error('Item ID is required for update');
        }

        const inventoryItem = {
          name: values.name,
          description: values.description,
          sku: values.sku,
          quantity: values.quantity,
          price: values.price,
          cost: values.cost,
          category: values.category,
          supplier: values.supplier,
          reorder_level: values.reorder_level,
          core_charge: values.core_charge,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('inventory')
          .update(inventoryItem)
          .eq('id', values.id)
          .select()
          .single();

        if (error) {
          console.error('Supabase update error:', error.message, error.details, error.hint);
          
          // Provide more specific error messages
          if (error.code === '23505') {
            throw new Error('An item with this name or SKU already exists');
          } else if (error.code === '42501') {
            throw new Error('Permission denied. Please check your access rights.');
          } else if (error.code === '23502') {
            throw new Error('Missing required field. Please fill in all required information.');
          } else if (error.code === 'PGRST116') {
            throw new Error('Item not found. It may have been deleted by another user.');
          } else {
            throw new Error(`Failed to update item: ${error.message}`);
          }
        }

        if (!data) {
          throw new Error('No data returned after updating item');
        }

        return data;
      } catch (err: any) {
        console.error('Update item error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Update item mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive",
      });
    },
  });

  const handleSort = (field: keyof InventoryItem) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const addItem = async (values: InventoryFormValues): Promise<void> => {
    return new Promise((resolve, reject) => {
      addItemMutation.mutate(values, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
  };

  const updateItem = async (values: InventoryFormValues & { id: string }): Promise<void> => {
    return new Promise((resolve, reject) => {
      updateItemMutation.mutate(values, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
  };

  const value: InventoryContextProps = {
    inventoryItems: inventoryItems || [],
    isLoading,
    error,
    sortField,
    sortDirection,
    handleSort,
    addItem,
    updateItem,
    isSubmitting: addItemMutation.isPending || updateItemMutation.isPending,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

const InventoryContext = createContext<InventoryContextProps | undefined>(undefined);

export const useInventoryContext = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventoryContext must be used within an InventoryProvider');
  }
  return context;
};


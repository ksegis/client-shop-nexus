import React, { createContext, useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { InventoryItem, InventoryFormValues } from './types';

interface InventoryContextType {
  // Data
  items: InventoryItem[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  
  // Pagination
  currentPage: number;
  pageSize: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // CRUD operations
  addItem: (item: InventoryFormValues) => Promise<void>;
  updateItem: (id: string, item: InventoryFormValues) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  
  // Utility
  refetchInventory: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate pagination values
  const offset = (currentPage - 1) * pageSize;

  // Fetch inventory with pagination and search
  const {
    data: inventoryData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['inventory', currentPage, pageSize, searchTerm],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching inventory:', { currentPage, pageSize, searchTerm, offset });
        
        let query = supabase
          .from('inventory')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);

        // Add search filter if search term exists
        if (searchTerm && searchTerm.trim()) {
          query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,supplier.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query;

        if (error) {
          console.error('❌ Inventory fetch error:', error);
          throw new Error(`Failed to fetch inventory: ${error.message}`);
        }

        // Defensive programming - ensure data is always an array
        const safeData = Array.isArray(data) ? data : [];
        const safeCount = typeof count === 'number' ? count : 0;

        console.log('✅ Fetched inventory:', { 
          items: safeData.length, 
          totalCount: safeCount,
          page: currentPage,
          pageSize 
        });

        return {
          items: safeData,
          totalCount: safeCount
        };
      } catch (error) {
        console.error('💥 Query function error:', error);
        // Return safe defaults on error
        return {
          items: [],
          totalCount: 0
        };
      }
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    // Provide default data to prevent undefined errors
    initialData: {
      items: [],
      totalCount: 0
    },
  });

  // Defensive data extraction with fallbacks
  const items = Array.isArray(inventoryData?.items) ? inventoryData.items : [];
  const totalCount = typeof inventoryData?.totalCount === 'number' ? inventoryData.totalCount : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: InventoryFormValues) => {
      console.log('➕ Adding inventory item:', item.name);
      
      const { data, error } = await supabase
        .from('inventory')
        .insert([item])
        .select()
        .single();

      if (error) {
        console.error('❌ Add item error:', error);
        throw new Error(`Failed to add item: ${error.message}`);
      }

      console.log('✅ Item added successfully:', data?.id);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Item added successfully",
      });
      // Invalidate and refetch inventory data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => {
      console.error('❌ Add item mutation error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, item }: { id: string; item: InventoryFormValues }) => {
      console.log('🔄 Updating inventory item:', id, item.name);
      
      const { data, error } = await supabase
        .from('inventory')
        .update(item)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Update item error:', error);
        throw new Error(`Failed to update item: ${error.message}`);
      }

      console.log('✅ Item updated successfully:', data?.id);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      // Invalidate and refetch inventory data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => {
      console.error('❌ Update item mutation error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('🗑️ Deleting inventory item:', id);
      
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Delete item error:', error);
        throw new Error(`Failed to delete item: ${error.message}`);
      }

      console.log('✅ Item deleted successfully:', id);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      // Invalidate and refetch inventory data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      
      // If we're on a page that no longer has items, go to previous page
      if (items.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    },
    onError: (error) => {
      console.error('❌ Delete item mutation error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Wrapper functions for mutations
  const addItem = async (item: InventoryFormValues) => {
    await addItemMutation.mutateAsync(item);
  };

  const updateItem = async (id: string, item: InventoryFormValues) => {
    await updateItemMutation.mutateAsync({ id, item });
  };

  const deleteItem = async (id: string) => {
    await deleteItemMutation.mutateAsync(id);
  };

  const refetchInventory = async () => {
    console.log('🔄 Manually refetching inventory');
    await refetch();
  };

  // Reset to first page when search term changes
  React.useEffect(() => {
    if (searchTerm && searchTerm.trim()) {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  // Defensive page bounds checking
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  const safePageSize = Math.max(1, pageSize);

  const value: InventoryContextType = {
    // Data with defensive defaults
    items: items || [],
    totalCount: totalCount || 0,
    isLoading: isLoading || false,
    error: error as Error | null,
    
    // Pagination with safe bounds
    currentPage: safeCurrentPage,
    pageSize: safePageSize,
    totalPages: totalPages || 1,
    setCurrentPage: (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages))),
    setPageSize: (size: number) => setPageSize(Math.max(1, size)),
    
    // Search
    searchTerm: searchTerm || '',
    setSearchTerm,
    
    // CRUD operations
    addItem,
    updateItem,
    deleteItem,
    
    // Utility
    refetchInventory,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventoryContext() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventoryContext must be used within an InventoryProvider');
  }
  return context;
}


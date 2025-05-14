
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem } from '@/pages/shop/inventory/types';
import { useAuth } from '@/contexts/auth';
import { handleRlsError } from '@/integrations/supabase/client';

export const useRlsAwareInventoryData = () => {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  
  const { data: inventoryItems, isLoading, error, refetch } = useQuery({
    queryKey: ['rls-inventory'],
    queryFn: async () => {
      try {
        console.log('Fetching inventory with auth state:', { 
          isAuthenticated: !!user, 
          userId: user?.id,
          userMetadata: user?.user_metadata
        });
        
        // First check that we're authenticated for RLS
        if (!user) {
          console.warn('User not authenticated, RLS policies may block data access');
        }
        
        // Test connection first
        console.log('Testing Supabase connection...');
        const { error: connectionError } = await supabase.from('inventory').select('count').limit(1);
        
        if (connectionError) {
          console.error('Supabase connection error:', connectionError);
          throw new Error(`Connection error: ${connectionError.message}`);
        }
        
        // If connection is good, fetch the data
        console.log('Fetching inventory data with RLS policies active...');
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .order('name');
        
        if (error) {
          // Special handling for RLS errors
          if (error.message.includes('new row violates row-level security policy')) {
            console.error('RLS policy violation:', error);
            throw new Error(`RLS policy error: ${error.message}. You may not have permission to view this data.`);
          }
          throw error;
        }
        
        console.log('Successfully fetched inventory data:', data?.length || 0, 'items');
        return data as InventoryItem[];
      } catch (err: any) {
        console.error('Error fetching inventory with RLS:', err);
        toast({
          variant: "destructive",
          title: "Data Access Error",
          description: `Failed to load inventory: ${err.message || 'Unknown error'}`
        });
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, 
    // Don't run the query until auth is loaded
    enabled: !loading
  });

  // Add inventory item with RLS handling
  const addItem = useMutation({
    mutationFn: async (values: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        console.log('Adding inventory item with RLS awareness:', values);
        
        // Include an explicit user_id field if needed for RLS
        const { data, error } = await supabase
          .from('inventory')
          .insert(values)
          .select();
        
        if (error) {
          handleRlsError(error, toast);
          throw error;
        }
        
        return data;
      } catch (err) {
        console.error('Error adding inventory item:', err);
        throw err;
      }
    },
    onSuccess: () => {
      toast({
        title: "Item Added",
        description: "New inventory item has been added successfully",
      });
      refetch();
    }
  });

  // Update inventory item with RLS handling
  const updateItem = useMutation({
    mutationFn: async ({ id, ...values }: InventoryItem) => {
      try {
        console.log('Updating inventory item with RLS awareness:', id, values);
        
        const { data, error } = await supabase
          .from('inventory')
          .update(values)
          .eq('id', id)
          .select();
          
        if (error) {
          handleRlsError(error, toast);
          throw error;
        }
        
        return data;
      } catch (err) {
        console.error('Error updating inventory item:', err);
        throw err;
      }
    },
    onSuccess: () => {
      toast({
        title: "Item Updated",
        description: "Inventory item has been updated successfully",
      });
      refetch();
    }
  });

  // Delete inventory item with RLS handling
  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      try {
        console.log('Deleting inventory item with RLS awareness:', id);
        
        const { error } = await supabase
          .from('inventory')
          .delete()
          .eq('id', id);
          
        if (error) {
          handleRlsError(error, toast);
          throw error;
        }
      } catch (err) {
        console.error('Error deleting inventory item:', err);
        throw err;
      }
    },
    onSuccess: () => {
      toast({
        title: "Item Deleted",
        description: "Inventory item has been deleted successfully",
      });
      refetch();
    }
  });

  // Temporarily disable RLS for development purposes (admin only)
  const temporarilyDisableRls = useMutation({
    mutationFn: async () => {
      try {
        console.log('Attempting to temporarily disable RLS for development...');
        
        const { data, error } = await supabase.rpc('disable_all_rls');
        
        if (error) throw error;
        
        return data;
      } catch (err) {
        console.error('Error disabling RLS:', err);
        throw err;
      }
    },
    onSuccess: () => {
      toast({
        title: "RLS Disabled",
        description: "Row Level Security has been temporarily disabled for development",
      });
      refetch();
    }
  });

  // Test RLS policies
  const testRlsPolicies = useMutation({
    mutationFn: async () => {
      try {
        console.log('Testing RLS policies...');
        
        const { data, error } = await supabase.rpc('test_rls_policies');
        
        if (error) throw error;
        
        return data;
      } catch (err) {
        console.error('Error testing RLS policies:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log('RLS policy test results:', data);
      toast({
        title: "RLS Policies Tested",
        description: "Check the console for detailed results",
      });
    }
  });

  return {
    inventoryItems: inventoryItems || [],
    isLoading,
    error,
    refetch,
    addItem,
    updateItem,
    deleteItem,
    temporarilyDisableRls,
    testRlsPolicies,
    isAuthenticated: !!user,
    userId: user?.id
  };
};


import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem } from '@/pages/shop/inventory/types';

export const useRlsAwareInventoryData = () => {
  const { toast } = useToast();
  
  // Query to fetch inventory data
  const { data: inventoryItems, isLoading, error: fetchError, refetch } = useQuery({
    queryKey: ['rls-aware-inventory'],
    queryFn: async () => {
      try {
        // Check if user is authenticated
        const { data: session } = await supabase.auth.getSession();
        const isAuthenticated = !!session?.session;
        console.log('Current authentication status:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
        
        // Test connection to database
        console.log('Testing Supabase connection...');
        const { error: connectionError } = await supabase.from('inventory').select('count').limit(1);
        
        if (connectionError) {
          console.error('Supabase connection error:', connectionError);
          throw new Error(`Connection error: ${connectionError.message}`);
        }
        
        // If connection is good, fetch all inventory items
        console.log('Fetching inventory data...');
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Error from Supabase:', error);
          throw error;
        }
        
        console.log(`Fetched ${data?.length || 0} inventory items`);
        
        if (data && data.length > 0) {
          console.log('Sample inventory item:', data[0]);
        } else {
          console.log('No inventory items found in database');
        }
        
        return data as InventoryItem[];
      } catch (error: any) {
        console.error('Error in fetching inventory:', error);
        toast({
          variant: "destructive",
          title: "Database Error",
          description: `Failed to load inventory: ${error.message || 'Unknown error'}`
        });
        throw error;
      }
    },
    staleTime: 1000 * 60, // 1 minute
    retry: 1
  });

  // RPC function to check database connectivity
  const checkConnection = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('is_authenticated');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Test",
        description: `Database connected: ${data ? 'Authenticated' : 'Not authenticated'}`
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: `Failed to connect to database: ${error.message}`
      });
    }
  });

  // Check RLS status
  const checkRlsStatus = useMutation({
    mutationFn: async () => {
      // Direct query to view all RLS policies
      const { data, error } = await supabase
        .from('rls_status')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "RLS Status",
        description: `Retrieved RLS status for ${data.length} tables`
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "RLS Status Error",
        description: `Failed to check RLS status: ${error.message}`
      });
    }
  });

  // Direct query to disable RLS (admin only)
  const disableRls = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('disable_all_rls');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "RLS Disabled",
        description: "Row Level Security has been disabled for all tables"
      });
      // Refresh the inventory data
      refetch();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to disable RLS: ${error.message}`
      });
    }
  });

  // Return the hook data
  return {
    inventoryItems: inventoryItems || [],
    isLoading,
    fetchError,
    refetch,
    checkConnection,
    checkRlsStatus,
    disableRls
  };
};

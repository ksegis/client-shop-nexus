
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem } from '@/pages/shop/inventory/types';

export const useInventoryData = () => {
  const { toast } = useToast();
  
  const { data: inventoryItems, isLoading, error, refetch } = useQuery({
    queryKey: ['simple-inventory'],
    queryFn: async () => {
      try {
        // Check if user is authenticated
        const { data: session } = await supabase.auth.getSession();
        console.log('Current session:', session ? 'Authenticated' : 'Not authenticated');
        
        // Test connection first
        console.log('Testing Supabase connection...');
        const { error: connectionError } = await supabase.from('inventory').select('count').limit(1);
        
        if (connectionError) {
          console.error('Supabase connection error:', connectionError);
          throw new Error(`Connection error: ${connectionError.message}`);
        }
        
        // If connection is good, fetch the data
        console.log('Fetching inventory data...');
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Error from Supabase:', error);
          throw error;
        }
        
        // Log the fetched data for debugging
        console.log('Fetched inventory data:', data);
        console.log('Number of items:', data?.length || 0);
        
        if (data && data.length > 0) {
          // Log some example items
          console.log('Example item:', data[0]);
          
          // Check for proper structure
          const hasExpectedFields = data[0].hasOwnProperty('quantity') && 
                                   data[0].hasOwnProperty('name') && 
                                   data[0].hasOwnProperty('price');
          console.log('Has expected fields:', hasExpectedFields);
        } else {
          console.log('No inventory items found in database. The database table might be empty.');
        }
        
        return data as InventoryItem[];
      } catch (error: any) {
        console.error('Error fetching inventory:', error);
        toast({
          variant: "destructive",
          title: "Database Error",
          description: `Failed to load inventory: ${error.message || 'Unknown error'}`
        });
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry failed requests up to 2 times
  });

  return {
    inventoryItems: inventoryItems || [],
    isLoading,
    error,
    refetch
  };
};

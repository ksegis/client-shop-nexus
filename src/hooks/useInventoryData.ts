
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
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .order('name');
        
        if (error) throw error;
        return data as InventoryItem[];
      } catch (error) {
        console.error('Error fetching inventory:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load inventory data. Please try again."
        });
        return [];
      }
    }
  });

  return {
    inventoryItems: inventoryItems || [],
    isLoading,
    error,
    refetch
  };
};

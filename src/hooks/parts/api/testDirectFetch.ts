
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Function to test direct fetching from inventory
export const testDirectFetch = async (toast: ReturnType<typeof useToast>['toast']) => {
  try {
    console.log('Testing direct fetch from inventory table...');
    const { data, error } = await supabase
      .from('inventory')
      .select('*');
    
    if (error) throw error;
    
    console.log('Direct fetch result:', data);
    console.log('Number of items in inventory:', data ? data.length : 0);
    
    toast({
      title: "Inventory Check",
      description: `Found ${data ? data.length : 0} items in inventory table.`,
    });
    
    return data;
  } catch (err) {
    console.error('Error in direct fetch:', err);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to check inventory directly.",
    });
    return null;
  }
};

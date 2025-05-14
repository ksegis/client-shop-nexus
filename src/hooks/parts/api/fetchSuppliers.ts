
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Function to fetch unique suppliers from the database
export const fetchSuppliers = async (toast: ReturnType<typeof useToast>['toast']) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('supplier')
      .not('supplier', 'is', null)
      .order('supplier', { ascending: true });
      
    if (error) throw error;
    
    // Extract unique suppliers
    const suppliers = new Set(data.map((item: any) => item.supplier).filter(Boolean));
    const suppliersArray = Array.from(suppliers);
    console.log('Suppliers fetched:', suppliersArray);
    return suppliersArray;
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to load suppliers.",
    });
    return [];
  }
};

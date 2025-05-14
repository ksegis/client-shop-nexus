
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Function to fetch unique categories from the database
export const fetchCategories = async (toast: ReturnType<typeof useToast>['toast']) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('category')
      .not('category', 'is', null)
      .order('category', { ascending: true });
      
    if (error) throw error;
    
    // Extract unique categories
    const categories = new Set(data.map((item: any) => item.category).filter(Boolean));
    const categoriesArray = Array.from(categories);
    console.log('Categories fetched:', categoriesArray);
    return categoriesArray;
  } catch (err) {
    console.error('Error fetching categories:', err);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to load part categories.",
    });
    return [];
  }
};

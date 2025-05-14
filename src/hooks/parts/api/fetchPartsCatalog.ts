
import { supabase } from '@/integrations/supabase/client';
import { Part, PartSearchFilters } from '@/types/parts';
import { useToast } from '@/hooks/use-toast';

// Function to fetch the parts catalog from the database
export const fetchPartsCatalog = async (searchFilters: PartSearchFilters, toast: ReturnType<typeof useToast>['toast']) => {
  try {
    console.log('Fetching parts with filters:', JSON.stringify(searchFilters));
    
    // Start building the query
    let query = supabase
      .from('inventory')
      .select('*')
      .order('name', { ascending: true });
    
    // Apply filters if they exist
    if (searchFilters.query) {
      const searchTerm = searchFilters.query.trim();
      console.log('Applying search term filter:', searchTerm);
      query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }
    
    if (searchFilters.category) {
      console.log('Applying category filter:', searchFilters.category);
      query = query.eq('category', searchFilters.category);
    }
    
    if (searchFilters.manufacturer) {
      console.log('Applying manufacturer filter:', searchFilters.manufacturer);
      query = query.eq('supplier', searchFilters.manufacturer);
    }
    
    if (searchFilters.minPrice !== undefined) {
      console.log('Applying min price filter:', searchFilters.minPrice);
      query = query.gte('price', searchFilters.minPrice);
    }
    
    if (searchFilters.maxPrice !== undefined) {
      console.log('Applying max price filter:', searchFilters.maxPrice);
      query = query.lte('price', searchFilters.maxPrice);
    }
    
    // Log the final query for debugging
    console.log('Final query built:', query);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error from Supabase query:', error);
      throw error;
    }
    
    // Log the raw response to see what we're getting
    console.log('Raw inventory data from Supabase:', data);
    console.log('Parts data fetched:', data ? data.length : 0, 'items found');
    
    if (data && data.length === 0) {
      // No results found, show a toast
      toast({
        title: "No parts found",
        description: "Try adjusting your search filters or add items to inventory",
      });
    }
    
    // Map the inventory items to the Part interface
    const partsData: Part[] = (data || []).map((item: any) => {
      console.log('Processing inventory item:', item);
      return {
        id: item.id,
        sku: item.sku || '',
        name: item.name,
        description: item.description || '',
        category: item.category || 'Uncategorized',
        price: item.price || 0,
        cost: item.cost || 0,
        quantity: item.quantity || 0,
        reorder_level: item.reorder_level || 10,
        supplier: item.supplier || '',
        location: item.location || '',
        is_special_order: false, // Default value since it's not in the current schema
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
    });
    
    console.log('Processed parts data:', partsData);
    
    return partsData;
  } catch (err) {
    console.error('Error fetching parts catalog:', err);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to load parts catalog. Please try again later.",
    });
    return [];
  }
};

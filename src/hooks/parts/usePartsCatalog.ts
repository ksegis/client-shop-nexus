
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Part, PartSearchFilters } from '@/types/parts';

export const usePartsCatalog = () => {
  const { toast } = useToast();
  const [searchFilters, setSearchFilters] = useState<PartSearchFilters>({});
  
  const { 
    data: parts, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['parts-catalog', searchFilters],
    queryFn: async () => {
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
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Debug effect to log state changes
  useEffect(() => {
    console.log('Parts catalog state:', {
      partsCount: parts?.length || 0,
      isLoading,
      error: error ? 'Error fetching parts' : null,
      filters: searchFilters
    });
  }, [parts, isLoading, error, searchFilters]);
  
  const getCategories = async () => {
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
  
  const getSuppliers = async () => {
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

  // Helper function to add a sample part for testing
  const addSamplePart = async () => {
    try {
      const samplePart = {
        name: "Sample Brake Pad",
        description: "High-quality brake pads for heavy-duty trucks",
        sku: "BP-12345",
        category: "Brakes",
        supplier: "BrakeMaster",
        price: 89.99,
        cost: 45.50,
        quantity: 25,
        reorder_level: 10
      };

      const { data, error } = await supabase
        .from('inventory')
        .insert(samplePart)
        .select();

      if (error) throw error;
      
      toast({
        title: "Sample part added",
        description: "A sample part has been added to inventory for testing.",
      });
      
      // Refresh the catalog
      refetch();
      
      return data;
    } catch (err) {
      console.error('Error adding sample part:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add sample part to inventory.",
      });
      return null;
    }
  };
  
  // Function to test direct fetch from inventory
  const testDirectFetch = async () => {
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
  
  return {
    parts: parts || [],
    isLoading,
    error,
    searchFilters,
    setSearchFilters,
    getCategories,
    getSuppliers,
    refreshCatalog: refetch,
    addSamplePart, // Added for testing
    testDirectFetch  // Added for direct table check
  };
};

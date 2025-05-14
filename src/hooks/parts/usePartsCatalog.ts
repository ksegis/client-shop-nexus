
import { useState } from 'react';
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
        // Start building the query
        let query = supabase
          .from('inventory')
          .select('*')
          .order('name', { ascending: true });
        
        // Apply filters if they exist
        if (searchFilters.query) {
          query = query.or(`name.ilike.%${searchFilters.query}%,sku.ilike.%${searchFilters.query}%,description.ilike.%${searchFilters.query}%`);
        }
        
        if (searchFilters.category) {
          query = query.eq('category', searchFilters.category);
        }
        
        if (searchFilters.manufacturer) {
          query = query.eq('supplier', searchFilters.manufacturer);
        }
        
        if (searchFilters.minPrice !== undefined) {
          query = query.gte('price', searchFilters.minPrice);
        }
        
        if (searchFilters.maxPrice !== undefined) {
          query = query.lte('price', searchFilters.maxPrice);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Map the inventory items to the Part interface
        const partsData: Part[] = (data || []).map((item: any) => ({
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
        }));
        
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
  });
  
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
      return Array.from(categories);
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
      return Array.from(suppliers);
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
  
  return {
    parts: parts || [],
    isLoading,
    error,
    searchFilters,
    setSearchFilters,
    getCategories,
    getSuppliers,
    refreshCatalog: refetch
  };
};

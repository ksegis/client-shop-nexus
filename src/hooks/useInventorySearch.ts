
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InventoryItem } from '@/pages/shop/inventory/types';
import { useToast } from '@/hooks/use-toast';

export const useInventorySearch = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);

  const searchInventory = async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .or(`name.ilike.%${term}%,sku.ilike.%${term}%,description.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data as InventoryItem[]);
    } catch (error) {
      console.error('Error searching inventory:', error);
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Failed to search inventory items",
      });
      setSearchResults([]);
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    searchInventory
  };
};


import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { InventoryItem } from '@/pages/shop/inventory/types';

export const usePartNumberSearch = () => {
  const [partSearchTerm, setPartSearchTerm] = useState('');
  const [partSearchResults, setPartSearchResults] = useState<InventoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (partSearchTerm && partSearchTerm.length >= 2) {
        searchInventoryByPart(partSearchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [partSearchTerm]);

  const searchInventoryByPart = async (term: string) => {
    if (!term || term.length < 2) {
      setPartSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .or(`sku.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      setPartSearchResults(data as InventoryItem[]);
    } catch (error) {
      console.error('Error searching inventory by part number:', error);
      setPartSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return {
    partSearchTerm,
    setPartSearchTerm,
    partSearchResults,
    searchInventoryByPart,
    isSearching
  };
};

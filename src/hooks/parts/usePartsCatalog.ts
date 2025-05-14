
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Part, PartSearchFilters } from '@/types/parts';
import { fetchPartsCatalog } from './api/fetchPartsCatalog';
import { fetchCategories } from './api/fetchCategories';
import { fetchSuppliers } from './api/fetchSuppliers';
import { addSamplePart } from './api/addSamplePart';
import { testDirectFetch } from './api/testDirectFetch';

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
    queryFn: async () => fetchPartsCatalog(searchFilters, toast),
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
    return fetchCategories(toast);
  };
  
  const getSuppliers = async () => {
    return fetchSuppliers(toast);
  };

  // Helper function to add a sample part for testing
  const handleAddSamplePart = async () => {
    const result = await addSamplePart(toast);
    if (result) {
      // Refresh the catalog
      refetch();
    }
    return result;
  };
  
  // Function to test direct fetch from inventory
  const handleTestDirectFetch = async () => {
    return testDirectFetch(toast);
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
    addSamplePart: handleAddSamplePart,
    testDirectFetch: handleTestDirectFetch
  };
};


import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Part, PartSearchFilters } from '@/types/parts';
import { fetchPartsCatalog } from './api/fetchPartsCatalog';
import { fetchCategories } from './api/fetchCategories';
import { fetchSuppliers } from './api/fetchSuppliers';
import { addSamplePart } from './api/addSamplePart';
import { testDirectFetch } from './api/testDirectFetch';
import debounce from 'lodash/debounce';

export const usePartsCatalog = () => {
  const { toast } = useToast();
  const [searchFilters, setSearchFilters] = useState<PartSearchFilters>({});
  const [debouncedFilters, setDebouncedFilters] = useState<PartSearchFilters>({});
  
  // Set up debounced filter updates
  const debouncedSetFilters = useCallback(
    debounce((filters: PartSearchFilters) => {
      console.log('Applying debounced filters:', filters);
      setDebouncedFilters(filters);
    }, 500),
    []
  );
  
  // Update debounced filters whenever searchFilters changes
  useEffect(() => {
    debouncedSetFilters(searchFilters);
  }, [searchFilters, debouncedSetFilters]);
  
  const { 
    data: parts, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['parts-catalog', debouncedFilters],
    queryFn: async () => {
      console.log('Executing fetchPartsCatalog with filters:', debouncedFilters);
      const result = await fetchPartsCatalog(debouncedFilters, toast);
      console.log('Fetch result:', result);
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Debug effect to log state changes
  useEffect(() => {
    console.log('Parts catalog state:', {
      partsCount: parts?.length || 0,
      isLoading,
      error: error ? 'Error fetching parts' : null,
      filters: debouncedFilters
    });
  }, [parts, isLoading, error, debouncedFilters]);
  
  // Force initial data fetch on component mount
  useEffect(() => {
    console.log('Forcing initial parts catalog refresh');
    refetch();
  }, [refetch]);
  
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

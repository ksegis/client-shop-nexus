
import { useState } from 'react';
import { usePartsCatalog } from '@/hooks/parts/usePartsCatalog';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem } from '@/pages/shop/inventory/types';
import { Part } from '@/types/parts';

export function useCatalogViewer() {
  const { toast } = useToast();
  const { 
    parts, 
    isLoading, 
    searchFilters, 
    setSearchFilters,
    getCategories,
    getSuppliers,
    refreshCatalog,
    addSamplePart,
    testDirectFetch
  } = usePartsCatalog();
  
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  
  const handleViewDetails = (partId: string) => {
    setSelectedPartId(partId);
  };
  
  const handleCloseDetails = () => {
    setSelectedPartId(null);
  };
  
  // New handler for part selection from quick search
  const handleQuickPartSelect = (item: InventoryItem) => {
    // Convert the inventory item to a Part format
    const part: Part = {
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
      location: '',
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
    
    // Open the part details dialog
    setSelectedPartId(item.id);
    
    toast({
      title: "Part found",
      description: `Found part: ${item.name}`,
    });
  };
  
  // Handle adding a sample part for testing
  const handleAddSamplePart = async () => {
    await addSamplePart();
  };
  
  // Handle direct inventory check
  const handleCheckInventory = async () => {
    await testDirectFetch();
  };
  
  const loadFilterOptions = async () => {
    const categoriesList = await getCategories();
    const suppliersList = await getSuppliers();
    
    setCategories(categoriesList as string[]);
    setSuppliers(suppliersList as string[]);
  };

  return {
    parts,
    isLoading,
    searchFilters,
    setSearchFilters,
    categories,
    suppliers,
    selectedPartId,
    handleViewDetails,
    handleCloseDetails,
    handleQuickPartSelect,
    handleAddSamplePart,
    handleCheckInventory,
    loadFilterOptions,
    refreshCatalog
  };
}

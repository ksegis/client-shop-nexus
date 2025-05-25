
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Part } from '@/types/parts';
import { supabase } from '@/integrations/supabase/client';

export function usePart(partId: string | null) {
  const [quantity, setQuantity] = useState(1);
  
  // Reset quantity when dialog opens with a new part
  useEffect(() => {
    if (partId) {
      setQuantity(1);
    }
  }, [partId]);
  
  // Handle quantity changes without stock restrictions
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };
  
  // Fetch the part details if we have a partId
  const { data: part, isLoading } = useQuery({
    queryKey: ['part-detail', partId],
    queryFn: async () => {
      // Return early if no partId
      if (!partId) return null;
      
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', partId)
        .single();
      
      if (error) throw error;
      
      // Convert to Part type with optional properties
      const partData: Part = {
        id: data.id,
        sku: data.sku || '',
        name: data.name,
        description: data.description || '',
        category: data.category || 'Uncategorized',
        price: data.price || 0,
        cost: data.cost || 0,
        quantity: data.quantity || 0,
        reorder_level: data.reorder_level || 10,
        supplier: data.supplier || '',
        location: '', 
        core_charge: 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      
      return partData;
    },
    enabled: !!partId,
  });

  return {
    part,
    isLoading,
    quantity,
    setQuantity: handleQuantityChange
  };
}

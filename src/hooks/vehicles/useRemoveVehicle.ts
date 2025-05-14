
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useRemoveVehicle = () => {
  const { toast } = useToast();

  const removeVehicle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Vehicle removed',
        description: 'Vehicle has been removed from your account',
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: 'Error removing vehicle',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  return { removeVehicle };
};

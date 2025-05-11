
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Database } from '@/integrations/supabase/types';

type Estimate = Database['public']['Tables']['estimates']['Row'];
type EstimateWithVehicle = Estimate & {
  vehicles: {
    make: string;
    model: string;
    year: number;
  };
};

export const useEstimates = () => {
  const [estimates, setEstimates] = useState<EstimateWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    
    const fetchEstimates = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('estimates')
          .select(`
            *,
            vehicles (
              make,
              model,
              year
            )
          `)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setEstimates(data || []);
      } catch (error: any) {
        toast({
          title: 'Error fetching estimates',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEstimates();
  }, [user, toast]);

  const updateEstimateStatus = async (id: string, status: Database['public']['Enums']['estimate_status']) => {
    try {
      const { data, error } = await supabase
        .from('estimates')
        .update({ status })
        .eq('id', id)
        .select(`
          *,
          vehicles (
            make,
            model,
            year
          )
        `)
        .single();
      
      if (error) throw error;
      
      setEstimates(prev => prev.map(estimate => estimate.id === id ? data : estimate));
      
      toast({
        title: 'Estimate updated',
        description: `Status changed to ${status}`,
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: 'Error updating estimate',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    estimates,
    loading,
    updateEstimateStatus
  };
};

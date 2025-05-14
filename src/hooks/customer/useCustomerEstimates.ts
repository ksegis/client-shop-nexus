
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';

// Helper function to check if a userId is a valid UUID
const isValidUuid = (id: string): boolean => {
  return id?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) !== null;
};

export const useCustomerEstimates = () => {
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.id) {
      setEstimates([]);
      setLoading(false);
      return;
    }

    const fetchEstimates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // For test/mock users, provide mock data
        if (!isValidUuid(user.id)) {
          console.log(`Using mock estimates for non-UUID user: ${user.id}`);
          
          const mockEstimates = [
            {
              id: 'mock-est-1',
              title: 'Brake Service Estimate',
              status: 'pending',
              total_amount: 450.75,
              created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              vehicles: {
                make: 'Toyota',
                model: 'Camry',
                year: 2020
              },
              estimate_items: [
                {
                  id: 'mock-item-1',
                  description: 'Front Brake Pads',
                  quantity: 1,
                  price: 120,
                  part_number: 'BP-2234'
                },
                {
                  id: 'mock-item-2',
                  description: 'Brake Labor',
                  quantity: 2,
                  price: 165.38,
                  part_number: null
                }
              ]
            },
            {
              id: 'mock-est-2',
              title: 'Oil Change Estimate',
              status: 'approved',
              total_amount: 85.99,
              created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              vehicles: {
                make: 'Toyota',
                model: 'Camry',
                year: 2020
              },
              estimate_items: [
                {
                  id: 'mock-item-3',
                  description: 'Synthetic Oil',
                  quantity: 1,
                  price: 45.99,
                  part_number: 'OIL-5W30'
                },
                {
                  id: 'mock-item-4',
                  description: 'Oil Change Labor',
                  quantity: 1,
                  price: 40,
                  part_number: null
                }
              ]
            }
          ];
          
          setEstimates(mockEstimates);
          setLoading(false);
          return;
        }
        
        // For real users, fetch from database
        const { data, error: estimatesError } = await supabase
          .from('estimates')
          .select(`
            *,
            vehicles (
              make,
              model,
              year
            ),
            estimate_items (
              id,
              description,
              quantity,
              price,
              part_number,
              vendor
            )
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });
          
        if (estimatesError) throw estimatesError;
        
        setEstimates(data || []);
      } catch (err: any) {
        console.error('Error fetching estimates:', err);
        setError(err);
        toast({
          variant: "destructive",
          title: "Error loading estimates",
          description: err.message || "Failed to load your estimates"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEstimates();
  }, [user?.id, toast]);
  
  return { estimates, loading, error };
};

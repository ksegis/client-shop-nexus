
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { EstimateData, LineItem } from './types';

export const useFetchEstimate = (estimateId: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [estimate, setEstimate] = useState<EstimateData>({
    id: estimateId || '',
    date: '',
    vehicle: '',
    status: 'pending',
    subtotal: 0,
    tax: 0,
    total: 0,
    notes: '',
    workOrderStatus: null
  });
  
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [relatedInvoice, setRelatedInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!estimateId || !user) return;
    
    const fetchEstimateData = async () => {
      try {
        setLoading(true);
        // Fetch estimate data
        const { data: estimateData, error: estimateError } = await supabase
          .from('estimates')
          .select('*, vehicles(make, model, year)')
          .eq('id', estimateId)
          .single();
          
        if (estimateError) throw estimateError;
        
        if (!estimateData) {
          toast({
            title: "Estimate not found",
            description: "The requested estimate could not be found",
            variant: "destructive",
          });
          return;
        }
        
        // Check if the estimate belongs to the current user
        if (estimateData.customer_id !== user.id) {
          toast({
            title: "Unauthorized",
            description: "You do not have permission to view this estimate",
            variant: "destructive",
          });
          return;
        }
        
        setEstimate({
          id: estimateData.id,
          status: estimateData.status,
          date: new Date(estimateData.created_at).toISOString().split('T')[0],
          vehicle: estimateData.vehicles 
            ? `${estimateData.vehicles.year} ${estimateData.vehicles.make} ${estimateData.vehicles.model}`
            : 'Unknown',
          subtotal: estimateData.total_amount,
          tax: 0, // Tax calculation would go here
          total: estimateData.total_amount,
          notes: estimateData.description || '',
          workOrderStatus: null
        });
        
        // Fetch line items
        const { data: lineItemsData, error: lineItemsError } = await supabase
          .from('estimate_items')
          .select('*')
          .eq('estimate_id', estimateId);
          
        if (lineItemsError) throw lineItemsError;
        
        // Transform the data for our component
        const transformedItems = (lineItemsData || []).map(item => ({
          id: item.id,
          part_number: item.part_number || '',
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          approved: estimateData.status === 'approved' || estimateData.status === 'completed'
        }));
        
        setLineItems(transformedItems);
        
        // Check if there's a related work order
        // For now we're determining this by the estimate status
        const workOrderInProgress = ['approved', 'completed'].includes(estimateData.status);
        if (workOrderInProgress) {
          setEstimate(prev => ({ 
            ...prev, 
            workOrderStatus: estimateData.status === 'completed' ? 'completed' : 'started' 
          }));
        }
        
        // Fetch related invoice if any
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('id, title, status')
          .eq('estimate_id', estimateId)
          .maybeSingle();
          
        if (!invoiceError && invoiceData) {
          setRelatedInvoice(invoiceData);
        }
        
      } catch (error: any) {
        console.error('Error fetching estimate data:', error);
        toast({
          title: "Error",
          description: `Failed to load estimate: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEstimateData();
  }, [estimateId, user, toast]);

  return {
    estimate,
    setEstimate,
    lineItems,
    setLineItems,
    relatedInvoice,
    loading
  };
};


import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { EstimateData, LineItem } from './types';

// Helper function to check if a userId is a valid UUID
const isValidUuid = (id: string): boolean => {
  return id?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) !== null;
};

// Helper function to check if an ID is a mock estimate ID
const isMockEstimateId = (id: string): boolean => {
  return id?.startsWith('mock-est-');
};

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
        
        // For mock estimates, provide mock data
        if (isMockEstimateId(estimateId)) {
          console.log(`Using mock data for estimate: ${estimateId}`);
          
          if (estimateId === 'mock-est-1') {
            setEstimate({
              id: 'mock-est-1',
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              vehicle: '2020 Toyota Camry',
              status: 'pending',
              subtotal: 450.75,
              tax: 36.06,
              total: 486.81,
              notes: 'Brake service estimate includes parts and labor',
              workOrderStatus: null
            });
            
            setLineItems([
              {
                id: 'mock-item-1',
                part_number: 'BP-2234',
                description: 'Front Brake Pads',
                quantity: 1,
                price: 120,
                approved: false
              },
              {
                id: 'mock-item-2',
                part_number: '',
                description: 'Brake Labor',
                quantity: 2,
                price: 165.38,
                approved: false
              }
            ]);
          } else if (estimateId === 'mock-est-2') {
            setEstimate({
              id: 'mock-est-2',
              date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              vehicle: '2020 Toyota Camry',
              status: 'approved',
              subtotal: 85.99,
              tax: 6.88,
              total: 92.87,
              notes: 'Regular oil change service',
              workOrderStatus: 'started'
            });
            
            setLineItems([
              {
                id: 'mock-item-3',
                part_number: 'OIL-5W30',
                description: 'Synthetic Oil',
                quantity: 1,
                price: 45.99,
                approved: true
              },
              {
                id: 'mock-item-4',
                part_number: '',
                description: 'Oil Change Labor',
                quantity: 1,
                price: 40,
                approved: true
              }
            ]);
            
            // Add related invoice for this estimate
            setRelatedInvoice({
              id: 'mock-inv-2',
              title: 'Oil Change Invoice',
              status: 'unpaid'
            });
          }
          
          setLoading(false);
          return;
        }
        
        // For real users with valid UUIDs, fetch from database
        if (isValidUuid(user.id)) {
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
        } else {
          // For test users with non-UUID IDs, handle differently
          console.log(`Using default mock data for test user: ${user.id}`);
          
          // Set default mock data for non-specific mock/test estimates
          setEstimate({
            id: estimateId,
            date: new Date().toISOString().split('T')[0],
            vehicle: '2021 Test Vehicle',
            status: 'pending',
            subtotal: 249.99,
            tax: 20.00,
            total: 269.99,
            notes: 'Test estimate for non-UUID user',
            workOrderStatus: null
          });
          
          setLineItems([
            {
              id: 'mock-line-item-1',
              part_number: 'TEST-PART',
              description: 'Test Part',
              quantity: 1,
              price: 99.99,
              approved: false
            },
            {
              id: 'mock-line-item-2',
              part_number: '',
              description: 'Test Labor',
              quantity: 2,
              price: 75.00,
              approved: false
            }
          ]);
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

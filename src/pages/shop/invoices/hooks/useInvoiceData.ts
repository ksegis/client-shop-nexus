
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Estimate } from '../../estimates/types';

export function useInvoiceData() {
  const { toast } = useToast();
  const [customerId, setCustomerId] = useState<string>('');
  const [vehicleOptions, setVehicleOptions] = useState<{ value: string; label: string; }[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [customerDetails, setCustomerDetails] = useState<{ first_name?: string; last_name?: string; email: string; } | null>(null);
  const [sourceEstimateId, setSourceEstimateId] = useState<string | null>(null);
  const [openEstimates, setOpenEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch open estimates
  useEffect(() => {
    const fetchOpenEstimates = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('estimates')
          .select(`
            *,
            profiles!estimates_customer_id_fkey (
              first_name,
              last_name,
              email
            ),
            vehicles (
              make, 
              model, 
              year
            )
          `)
          .in('status', ['pending', 'approved']) // Only get pending or approved estimates
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching estimates:', error);
          setOpenEstimates([]);
          return;
        }
        
        // Ensure we always return an array
        setOpenEstimates(data || []);
      } catch (error) {
        console.error('Error fetching estimates:', error);
        setOpenEstimates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOpenEstimates();
  }, []);

  const fetchCustomerDetails = async (customerId: string) => {
    if (!customerId) {
      setCustomerDetails(null);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching customer details:', error);
        setCustomerDetails(null);
        return;
      }
      
      if (data) {
        setCustomerDetails({
          first_name: data.first_name || undefined,
          last_name: data.last_name || undefined,
          email: data.email,
        });
      } else {
        setCustomerDetails(null);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
      setCustomerDetails(null);
    }
  };

  const fetchVehicleOptions = async (customerId: string) => {
    if (!customerId) {
      setVehicleOptions([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', customerId);
      
      if (error) {
        console.error('Error fetching vehicle options:', error);
        setVehicleOptions([]);
        return;
      }
      
      const options = (data || []).map(vehicle => ({
        value: vehicle.id,
        label: `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Vehicle details unavailable',
      }));
      
      setVehicleOptions(options);
    } catch (error) {
      console.error('Error fetching vehicle options:', error);
      setVehicleOptions([]);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails(customerId);
      fetchVehicleOptions(customerId);
    } else {
      setVehicleOptions([]);
      setSelectedVehicleId('');
      setCustomerDetails(null);
    }
  }, [customerId]);

  const handleEstimateSelection = (estimateId: string) => {
    // Validate that we have estimates and the selected ID exists
    if (!Array.isArray(openEstimates) || openEstimates.length === 0) {
      console.error('No estimates available for selection');
      return;
    }
    
    const selectedEstimate = openEstimates.find(est => est.id === estimateId);
    if (!selectedEstimate) {
      console.error('Selected estimate not found');
      return;
    }
    
    setSourceEstimateId(selectedEstimate.id);
    
    // Set customer and vehicle if available
    if (selectedEstimate.customer_id) {
      setCustomerId(selectedEstimate.customer_id);
    }
    
    if (selectedEstimate.vehicle_id) {
      setSelectedVehicleId(selectedEstimate.vehicle_id);
    }
    
    return selectedEstimate;
  };

  const setVehicleId = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
  };

  return {
    customerId,
    setCustomerId,
    vehicleOptions,
    selectedVehicleId,
    setVehicleId,
    customerDetails,
    sourceEstimateId,
    setSourceEstimateId,
    openEstimates,
    loading,
    handleEstimateSelection,
    fetchCustomerDetails,
    fetchVehicleOptions,
  };
}


import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useInvoiceData() {
  const [customerId, setCustomerId] = useState<string>('');
  const [vehicleOptions, setVehicleOptions] = useState<{ value: string; label: string; }[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [customerDetails, setCustomerDetails] = useState<{ first_name?: string; last_name?: string; email: string; } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
      setLoading(true);
      Promise.all([
        fetchCustomerDetails(customerId),
        fetchVehicleOptions(customerId)
      ]).finally(() => setLoading(false));
    } else {
      setVehicleOptions([]);
      setSelectedVehicleId('');
      setCustomerDetails(null);
    }
  }, [customerId]);

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
    loading,
  };
}

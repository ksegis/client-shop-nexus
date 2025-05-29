
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomers } from '@/hooks/useCustomers';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/vehicle';
import { FormValues } from './types';

interface CustomerVehicleSectionProps {
  form: ReturnType<typeof useForm<FormValues>>;
  customerId?: string;
  onCustomerChange: (customerId: string) => void;
  onVehiclesLoaded: (vehicles: Vehicle[], customerContact: {email: string, phone: string | null}) => void;
}

const CustomerVehicleSection: React.FC<CustomerVehicleSectionProps> = ({ 
  form, 
  customerId, 
  onCustomerChange,
  onVehiclesLoaded
}) => {
  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  // Watch for form values to get current customer selection
  const selectedCustomerId = form.watch('customer_id') || customerId;

  // Memoize the vehicles loaded callback to prevent infinite re-renders
  const handleVehiclesLoaded = useCallback((vehicles: Vehicle[], contact: {email: string, phone: string | null}) => {
    onVehiclesLoaded(vehicles, contact);
  }, [onVehiclesLoaded]);

  // Fetch vehicles when customer changes
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!selectedCustomerId) {
        setCustomerVehicles([]);
        handleVehiclesLoaded([], { email: '', phone: null });
        return;
      }

      console.log('Fetching vehicles for customer:', selectedCustomerId);
      setIsLoadingVehicles(true);
      
      try {
        // Fetch vehicles
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('owner_id', selectedCustomerId);
        
        if (vehiclesError) {
          console.error('Error fetching vehicles:', vehiclesError);
          setCustomerVehicles([]);
          handleVehiclesLoaded([], { email: '', phone: null });
          return;
        }
        
        const vehicles = vehiclesData as Vehicle[] || [];
        console.log('Fetched vehicles:', vehicles);
        setCustomerVehicles(vehicles);

        // Fetch customer contact info
        const { data: customerData, error: customerError } = await supabase
          .from('profiles')
          .select('email, phone')
          .eq('id', selectedCustomerId)
          .single();

        if (customerError) {
          console.error('Error fetching customer data:', customerError);
          handleVehiclesLoaded(vehicles, { email: '', phone: null });
          return;
        }
        
        const customerContact = {
          email: customerData?.email || '',
          phone: customerData?.phone || null
        };

        handleVehiclesLoaded(vehicles, customerContact);
      } catch (error) {
        console.error('Error fetching customer data:', error);
        setCustomerVehicles([]);
        handleVehiclesLoaded([], { email: '', phone: null });
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, [selectedCustomerId, handleVehiclesLoaded]);

  // Handle customer change
  const handleCustomerChange = (customerId: string) => {
    console.log('Customer changed to:', customerId);
    onCustomerChange(customerId);
    // Clear vehicle selection when customer changes
    form.setValue('vehicle_id', '');
  };

  return (
    <>
      {!customerId && (
        <FormField
          control={form.control}
          name="customer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  handleCustomerChange(value);
                }} 
                value={field.value}
                disabled={isLoadingCustomers}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      
      <FormField
        control={form.control}
        name="vehicle_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Vehicle</FormLabel>
            <Select 
              onValueChange={field.onChange}
              value={field.value}
              disabled={!selectedCustomerId || isLoadingVehicles}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedCustomerId 
                      ? "Select customer first" 
                      : isLoadingVehicles 
                        ? "Loading vehicles..." 
                        : customerVehicles.length === 0
                          ? "No vehicles found"
                          : "Select vehicle"
                  } />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {customerVehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default CustomerVehicleSection;

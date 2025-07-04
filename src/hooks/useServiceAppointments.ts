
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { ServiceAppointment, NewAppointmentData } from '@/integrations/supabase/types-extensions';

export type { ServiceAppointment, NewAppointmentData };

export const useServiceAppointments = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if we're using dev customer mode
  const isDevCustomer = user?.id === 'dev-customer-user-id';

  // Fetch all appointments (for shop staff)
  const { data: appointments = [], refetch } = useQuery({
    queryKey: ['service-appointments'],
    queryFn: async () => {
      try {
        console.log('Fetching all service appointments...');
        const { data, error } = await supabase
          .from('service_appointments')
          .select('*, profiles(first_name, last_name, email), vehicles(make, model, year)')
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        if (error) {
          console.error('Error fetching appointments:', error);
          throw error;
        }
        
        console.log('Fetched appointments:', data);
        return data || [];
      } catch (error: any) {
        console.error('Service appointments fetch error:', error);
        toast({
          variant: "destructive",
          title: "Error fetching appointments",
          description: error.message,
        });
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch customer appointments (for customer portal)
  const { data: customerAppointments = [] } = useQuery({
    queryKey: ['customer-appointments', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) return [];
        
        // For dev customer mode, return mock data
        if (isDevCustomer) {
          return [{
            id: 'mock-appointment-1',
            customer_id: user.id,
            vehicle_id: 'mock-vehicle-1',
            appointment_date: new Date().toISOString().split('T')[0],
            appointment_time: '14:00:00',
            service_type: 'Oil Change',
            description: 'Regular maintenance',
            status: 'scheduled',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            vehicles: {
              make: 'Toyota',
              model: 'Camry',
              year: 2020
            }
          }];
        }

        const { data, error } = await supabase
          .from('service_appointments')
          .select('*, vehicles(make, model, year)')
          .eq('customer_id', user.id)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching your appointments",
          description: error.message,
        });
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Create a new appointment
  const createAppointment = async (appointmentData: NewAppointmentData) => {
    setIsLoading(true);
    try {
      console.log('Creating appointment with data:', appointmentData);
      
      // For dev customer mode, return mock data
      if (isDevCustomer) {
        const mockAppointment = {
          id: `mock-appointment-${Date.now()}`,
          customer_id: appointmentData.customer_id,
          vehicle_id: appointmentData.vehicle_id,
          appointment_date: appointmentData.appointment_date,
          appointment_time: appointmentData.appointment_time,
          service_type: appointmentData.service_type,
          description: appointmentData.description,
          status: appointmentData.status || 'scheduled',
          contact_email: appointmentData.contact_email,
          contact_phone: appointmentData.contact_phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        toast({
          title: "Appointment scheduled",
          description: "Your service appointment has been successfully scheduled.",
        });
        
        queryClient.invalidateQueries({ queryKey: ['customer-appointments', user?.id] });
        
        setIsLoading(false);
        return mockAppointment;
      }

      const { data, error } = await supabase
        .from('service_appointments')
        .insert({
          customer_id: appointmentData.customer_id,
          vehicle_id: appointmentData.vehicle_id,
          appointment_date: appointmentData.appointment_date,
          appointment_time: appointmentData.appointment_time,
          service_type: appointmentData.service_type,
          description: appointmentData.description,
          status: appointmentData.status || 'scheduled',
          contact_email: appointmentData.contact_email,
          contact_phone: appointmentData.contact_phone
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }

      console.log('Appointment created successfully:', data);

      toast({
        title: "Appointment scheduled",
        description: "Your service appointment has been successfully scheduled.",
      });

      // Invalidate both queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['service-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['customer-appointments', user?.id] });
      
      return data;
    } catch (error: any) {
      console.error('Create appointment error:', error);
      toast({
        variant: "destructive",
        title: "Failed to schedule appointment",
        description: error.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an appointment
  const updateAppointment = async (id: string, appointmentData: Partial<ServiceAppointment>) => {
    setIsLoading(true);
    try {
      // For dev customer mode, return mock data
      if (isDevCustomer) {
        toast({
          title: "Appointment updated",
          description: "The appointment has been updated successfully.",
        });
        
        queryClient.invalidateQueries({ queryKey: ['customer-appointments', user?.id] });
        
        setIsLoading(false);
        return { ...appointmentData, id };
      }

      const { data, error } = await supabase
        .from('service_appointments')
        .update(appointmentData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Appointment updated",
        description: "The appointment has been updated successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ['service-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['customer-appointments', user?.id] });
      
      return data;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update appointment",
        description: error.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel an appointment
  const cancelAppointment = async (id: string) => {
    setIsLoading(true);
    try {
      // For dev customer mode, return mock data
      if (isDevCustomer) {
        toast({
          title: "Appointment cancelled",
          description: "The appointment has been cancelled successfully.",
        });
        
        queryClient.invalidateQueries({ queryKey: ['customer-appointments', user?.id] });
        
        setIsLoading(false);
        return { id, status: 'cancelled' };
      }

      const { data, error } = await supabase
        .from('service_appointments')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Appointment cancelled",
        description: "The appointment has been cancelled successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ['service-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['customer-appointments', user?.id] });
      
      return data;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to cancel appointment",
        description: error.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    appointments,
    customerAppointments,
    isLoading,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    refetch,
  };
};

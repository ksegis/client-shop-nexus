
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { ServiceAppointment, NewAppointmentData } from '@/integrations/supabase/types-extensions';

export type { ServiceAppointment, NewAppointmentData };

export const useServiceAppointments = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all appointments (for shop staff)
  const { data: appointments = [], refetch } = useQuery({
    queryKey: ['service-appointments'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('service_appointments')
          .select('*, profiles(first_name, last_name, email), vehicles(make, model, year)')
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching appointments",
          description: error.message,
        });
        return [];
      }
    },
    enabled: !!user && (user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'staff'),
  });

  // Fetch customer appointments (for customer portal)
  const { data: customerAppointments = [] } = useQuery({
    queryKey: ['customer-appointments', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) return [];

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

      if (error) throw error;

      toast({
        title: "Appointment scheduled",
        description: "Your service appointment has been successfully scheduled.",
      });

      queryClient.invalidateQueries({ queryKey: ['service-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['customer-appointments', user?.id] });
      
      return data;
    } catch (error: any) {
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

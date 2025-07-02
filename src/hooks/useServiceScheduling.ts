
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailableDay {
  date: string;
  available: boolean;
  timeSlots: TimeSlot[];
}

export const useServiceScheduling = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Check availability for a specific date
  const checkDateAvailability = async (date: string) => {
    setIsLoading(true);
    try {
      // Get all appointments for the specified date
      const { data: existingAppointments, error } = await supabase
        .from('service_appointments')
        .select('appointment_time, status')
        .eq('appointment_date', date)
        .neq('status', 'cancelled');
        
      if (error) throw error;
      
      // Generate time slots (9 AM to 5 PM, 1-hour intervals)
      const timeSlots: TimeSlot[] = [];
      for (let hour = 9; hour < 17; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        const booked = existingAppointments?.some(appointment => 
          appointment.appointment_time === time && appointment.status !== 'cancelled'
        );
        
        timeSlots.push({
          time,
          available: !booked
        });
      }
      
      return {
        date,
        available: timeSlots.some(slot => slot.available),
        timeSlots
      };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error checking availability",
        description: error.message,
      });
      return { 
        date, 
        available: false, 
        timeSlots: [] 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Get available days for the next N days
  const getAvailableDays = async (daysToCheck: number = 14) => {
    setIsLoading(true);
    try {
      const availableDays: AvailableDay[] = [];
      const today = new Date();
      
      for (let i = 0; i < daysToCheck; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Skip weekends (Saturday = 6, Sunday = 0)
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          continue;
        }
        
        const dateStr = date.toISOString().split('T')[0];
        const availability = await checkDateAvailability(dateStr);
        availableDays.push(availability);
      }
      
      return availableDays;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching available days",
        description: error.message,
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkDateAvailability,
    getAvailableDays,
    isLoading,
  };
};

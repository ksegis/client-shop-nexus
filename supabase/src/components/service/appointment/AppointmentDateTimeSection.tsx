
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon, ClockIcon } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useServiceScheduling } from '@/hooks/useServiceScheduling';
import { FormValues } from './types';

interface AppointmentDateTimeSectionProps {
  form: ReturnType<typeof useForm<FormValues>>;
}

const AppointmentDateTimeSection: React.FC<AppointmentDateTimeSectionProps> = ({ form }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
  const { checkDateAvailability } = useServiceScheduling();

  // Update available time slots when selected date changes
  useEffect(() => {
    if (selectedDate) {
      const fetchAvailability = async () => {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const availability = await checkDateAvailability(dateString);
        setAvailableTimeSlots(availability.timeSlots);
      };
      
      fetchAvailability();
    }
  }, [selectedDate, checkDateAvailability]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="appointment_date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Appointment Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => {
                    field.onChange(date);
                    setSelectedDate(date);
                  }}
                  disabled={(date) => {
                    const now = new Date();
                    // Disable dates in the past, weekends, and dates more than 30 days in the future
                    return (
                      date < new Date(now.setHours(0, 0, 0, 0)) ||
                      date.getDay() === 0 ||
                      date.getDay() === 6 ||
                      date > new Date(now.setDate(now.getDate() + 30))
                    );
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="appointment_time"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Appointment Time</FormLabel>
            <Select onValueChange={field.onChange} disabled={!selectedDate || availableTimeSlots.length === 0}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select time">
                    <div className="flex items-center">
                      <ClockIcon className="mr-2 h-4 w-4" />
                      {field.value || "Select time"}
                    </div>
                  </SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableTimeSlots.map((slot) => (
                  <SelectItem 
                    key={slot.time} 
                    value={slot.time}
                    disabled={!slot.available}
                  >
                    {slot.time} {!slot.available && "(Unavailable)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default AppointmentDateTimeSection;

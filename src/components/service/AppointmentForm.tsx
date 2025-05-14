
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, ClockIcon } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useServiceScheduling } from '@/hooks/useServiceScheduling';
import { useVehicleManagement } from '@/hooks/vehicles/useVehicleManagement';
import { Vehicle } from '@/types/vehicle';
import { NewAppointmentData } from '@/hooks/useServiceAppointments';
import { useAuth } from '@/contexts/auth';

const serviceTypes = [
  { value: 'maintenance', label: 'Routine Maintenance' },
  { value: 'repair', label: 'Repair Service' },
  { value: 'diagnostic', label: 'Diagnostic Check' },
  { value: 'inspection', label: 'Vehicle Inspection' },
  { value: 'tire', label: 'Tire Service' },
  { value: 'oil', label: 'Oil Change' },
  { value: 'other', label: 'Other' }
];

const formSchema = z.object({
  vehicle_id: z.string({
    required_error: "Please select a vehicle",
  }),
  appointment_date: z.date({
    required_error: "Please select a date",
  }),
  appointment_time: z.string({
    required_error: "Please select an appointment time",
  }),
  service_type: z.string({
    required_error: "Please select the type of service",
  }),
  description: z.string()
    .min(5, "Please provide a brief description of the service needed")
    .max(500, "Description is too long"),
});

type FormValues = z.infer<typeof formSchema>;

interface AppointmentFormProps {
  onSubmit: (data: NewAppointmentData) => Promise<void>;
  customerId?: string;
}

const AppointmentForm = ({ onSubmit, customerId }: AppointmentFormProps) => {
  const { user } = useAuth();
  const { vehicles } = useVehicleManagement(); 
  const { checkDateAvailability } = useServiceScheduling();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ time: string; available: boolean }[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service_type: '',
      description: '',
    },
  });

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

  const handleSubmit = async (values: FormValues) => {
    if (!user) return;
    
    const appointmentData: NewAppointmentData = {
      customer_id: customerId || user.id,
      vehicle_id: values.vehicle_id,
      appointment_date: format(values.appointment_date, 'yyyy-MM-dd'),
      appointment_time: values.appointment_time,
      service_type: values.service_type,
      description: values.description,
    };
    
    await onSubmit(appointmentData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="vehicle_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Vehicle</FormLabel>
              <Select onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {vehicles.map((vehicle: Vehicle) => (
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
        
        <FormField
          control={form.control}
          name="service_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Type</FormLabel>
              <Select onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Please describe the issue or service needed" 
                  {...field}
                  rows={4} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full bg-shop-primary hover:bg-shop-primary/90">
          Schedule Appointment
        </Button>
      </form>
    </Form>
  );
};

export default AppointmentForm;

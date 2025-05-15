
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
import { useCustomers } from '@/hooks/useCustomers';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/vehicle';
import { NewAppointmentData } from '@/hooks/useServiceAppointments';
import { useAuth } from '@/contexts/auth';
import { Checkbox } from '@/components/ui/checkbox';

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
  customer_id: z.string({
    required_error: "Please select a customer",
  }),
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
  contact_email: z.string()
    .email("Please enter a valid email address"),
  contact_phone: z.string()
    .optional(),
  override_contact: z.boolean()
    .default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface AppointmentFormProps {
  onSubmit: (data: NewAppointmentData) => Promise<void>;
  customerId?: string;
}

const AppointmentForm = ({ onSubmit, customerId }: AppointmentFormProps) => {
  const { user } = useAuth();
  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const { checkDateAvailability } = useServiceScheduling();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(customerId);
  const [customerContact, setCustomerContact] = useState<{email: string, phone: string | null}>({
    email: '',
    phone: null
  });
  const [overrideContact, setOverrideContact] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service_type: '',
      description: '',
      customer_id: customerId || '',
      contact_email: '',
      contact_phone: '',
      override_contact: false,
    },
  });

  // Fetch vehicles when customer changes
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!selectedCustomerId) {
        setCustomerVehicles([]);
        setCustomerContact({ email: '', phone: null });
        return;
      }

      setIsLoadingVehicles(true);
      try {
        // Fetch vehicles
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('owner_id', selectedCustomerId);
        
        if (vehiclesError) throw vehiclesError;
        setCustomerVehicles(vehiclesData as Vehicle[]);

        // Fetch customer contact info
        const { data: customerData, error: customerError } = await supabase
          .from('profiles')
          .select('email, phone')
          .eq('id', selectedCustomerId)
          .single();

        if (customerError) throw customerError;
        
        if (customerData) {
          setCustomerContact({
            email: customerData.email || '',
            phone: customerData.phone || null
          });
          
          // Update form with customer contact info
          form.setValue('contact_email', customerData.email || '');
          if (customerData.phone) {
            form.setValue('contact_phone', customerData.phone);
          }
        }
      } catch (error) {
        console.error('Error fetching customer data:', error);
        setCustomerVehicles([]);
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    fetchVehicles();
    
    // Clear vehicle selection when customer changes
    form.setValue('vehicle_id', '');
  }, [selectedCustomerId, form]);

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

  // Handle override contact toggling
  useEffect(() => {
    if (!overrideContact && customerContact.email) {
      form.setValue('contact_email', customerContact.email);
      form.setValue('contact_phone', customerContact.phone || '');
    }
  }, [overrideContact, customerContact, form]);

  const handleSubmit = async (values: FormValues) => {
    if (!user) return;
    
    const appointmentData: NewAppointmentData = {
      customer_id: values.customer_id,
      vehicle_id: values.vehicle_id,
      appointment_date: format(values.appointment_date, 'yyyy-MM-dd'),
      appointment_time: values.appointment_time,
      service_type: values.service_type,
      description: values.description,
      contact_email: values.contact_email,
      contact_phone: values.contact_phone || null,
    };
    
    await onSubmit(appointmentData);
  };

  // Handle customer change
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    form.setValue('customer_id', customerId);
  };

  // Handle override contact change
  const handleOverrideContactChange = (checked: boolean) => {
    setOverrideContact(checked);
    form.setValue('override_contact', checked);
    
    if (!checked && customerContact.email) {
      form.setValue('contact_email', customerContact.email);
      form.setValue('contact_phone', customerContact.phone || '');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {!customerId && (
          <FormField
            control={form.control}
            name="customer_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select 
                  onValueChange={(value) => handleCustomerChange(value)} 
                  defaultValue={field.value}
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
                disabled={!selectedCustomerId || isLoadingVehicles}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCustomerId ? "Select vehicle" : "Select customer first"} />
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

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Contact Information</h3>
          
          <FormField
            control={form.control}
            name="override_contact"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      handleOverrideContactChange(checked as boolean);
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Override contact information</FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email for confirmation</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Email address"
                      disabled={!overrideContact && !!customerContact.email}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone number (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Phone number"
                      disabled={!overrideContact && !!customerContact.phone}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Button type="submit" className="w-full bg-shop-primary hover:bg-shop-primary/90">
          Schedule Appointment
        </Button>
      </form>
    </Form>
  );
};

export default AppointmentForm;

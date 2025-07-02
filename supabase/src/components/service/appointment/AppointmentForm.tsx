
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useAuth } from '@/contexts/auth';
import { Vehicle } from '@/types/vehicle';
import { NewAppointmentData } from '@/hooks/useServiceAppointments';

import { FormValues, formSchema, AppointmentFormProps } from './types';
import CustomerVehicleSection from './CustomerVehicleSection';
import AppointmentDateTimeSection from './AppointmentDateTimeSection';
import ServiceDetailsSection from './ServiceDetailsSection';
import ContactInfoSection from './ContactInfoSection';

const AppointmentForm = ({ onSubmit, customerId }: AppointmentFormProps) => {
  const { user } = useAuth();
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

  // Handle vehicles loaded
  const handleVehiclesLoaded = (
    vehicles: Vehicle[], 
    contact: {email: string, phone: string | null}
  ) => {
    setCustomerContact(contact);
    
    // Update form with customer contact info if available and not overridden
    if (contact.email && !overrideContact) {
      form.setValue('contact_email', contact.email);
      if (contact.phone) {
        form.setValue('contact_phone', contact.phone);
      }
    }
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
        <CustomerVehicleSection 
          form={form}
          customerId={customerId}
          onCustomerChange={handleCustomerChange}
          onVehiclesLoaded={handleVehiclesLoaded}
        />
        
        <AppointmentDateTimeSection form={form} />
        
        <ServiceDetailsSection form={form} />

        <ContactInfoSection 
          form={form}
          customerContact={customerContact}
          overrideContact={overrideContact}
          onOverrideContactChange={handleOverrideContactChange}
        />
        
        <Button type="submit" className="w-full bg-shop-primary hover:bg-shop-primary/90">
          Schedule Appointment
        </Button>
      </form>
    </Form>
  );
};

export default AppointmentForm;

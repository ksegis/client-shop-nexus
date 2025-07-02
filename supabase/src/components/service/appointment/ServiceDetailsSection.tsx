
import React from 'react';
import { useForm } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormValues, serviceTypes } from './types';

interface ServiceDetailsSectionProps {
  form: ReturnType<typeof useForm<FormValues>>;
}

const ServiceDetailsSection: React.FC<ServiceDetailsSectionProps> = ({ form }) => {
  return (
    <>
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
    </>
  );
};

export default ServiceDetailsSection;

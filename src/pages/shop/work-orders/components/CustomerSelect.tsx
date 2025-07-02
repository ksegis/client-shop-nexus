
import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { WorkOrderFormValues } from '../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { FormFieldWrapper } from './FormField';

interface Customer {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface CustomerSelectProps {
  form: UseFormReturn<WorkOrderFormValues>;
  loading: boolean;
  onCustomerChange: (customerId: string) => void;
  selectedCustomer: string;
}

export const CustomerSelect = ({
  form,
  loading,
  onCustomerChange,
  selectedCustomer,
}: CustomerSelectProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .order('last_name', { ascending: true });
        
        if (error) throw error;
        setCustomers(data || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    
    fetchCustomers();
  }, []);

  return (
    <FormFieldWrapper
      form={form}
      name="customer_id"
      label="Customer"
    >
      <Select
        onValueChange={onCustomerChange}
        defaultValue={selectedCustomer}
        disabled={loading}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select customer" />
        </SelectTrigger>
        <SelectContent>
          {customers.map((customer) => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.first_name} {customer.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormFieldWrapper>
  );
};

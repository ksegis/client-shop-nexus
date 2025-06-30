import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { WorkOrderFormValues } from '../types';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface NumericFieldProps {
  form: UseFormReturn<WorkOrderFormValues>;
  name: 'estimated_hours' | 'estimated_cost' | 'actual_hours' | 'actual_cost' | 'priority';
  label: string;
  placeholder?: string;
  min?: string;
  max?: string;
}

export const NumericField = ({
  form,
  name,
  label,
  placeholder = "0",
  min,
  max
}: NumericFieldProps) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step={name.includes('cost') ? "0.01" : "1"}
              placeholder={placeholder}
              min={min}
              max={max}
              value={field.value || ''}
              onChange={(e) => {
                const value = e.target.value;
                // Convert to number or null for empty string
                const numValue = value === '' ? null : Number(value);
                field.onChange(numValue);
              }}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};



import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ComponentType } from 'react';

interface FormFieldInputProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  step?: string;
  min?: string;
  required?: boolean;
  component?: ComponentType<any>;
}

export const FormFieldInput = ({ 
  form, 
  name, 
  label, 
  placeholder, 
  type = "text",
  step,
  min,
  required = false,
  component: Component = Input
}: FormFieldInputProps) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Component 
              placeholder={placeholder}
              type={type}
              step={step}
              min={min}
              {...field}
              value={field.value || ''}
              onChange={(e: any) => {
                const value = type === 'number' ? 
                  (e.target.value === '' ? 0 : Number(e.target.value)) : 
                  e.target.value;
                field.onChange(value);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

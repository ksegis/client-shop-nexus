
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFormContext } from 'react-hook-form';
import { InventoryFormValues } from '../types';

interface FormFieldInputProps {
  name: keyof InventoryFormValues;
  label: string;
  placeholder: string;
  type?: string;
  step?: string;
  onChange?: (value: any) => void;
}

export const FormFieldInput = ({ 
  name, 
  label, 
  placeholder, 
  type = 'text',
  step,
  onChange 
}: FormFieldInputProps) => {
  const form = useFormContext<InventoryFormValues>();
  
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input 
              type={type} 
              placeholder={placeholder} 
              {...field} 
              onChange={(e) => {
                if (onChange) {
                  onChange(type === 'number' ? 
                    (type === 'number' && step === '0.01' ? parseFloat(e.target.value) : parseInt(e.target.value)) || 0 
                    : e.target.value
                  );
                } else {
                  field.onChange(e);
                }
              }}
              value={field.value || ''}
              step={step}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

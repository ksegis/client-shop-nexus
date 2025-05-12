
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { WorkOrderFormValues } from '../types';
import { FormFieldWrapper } from './FormField';

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
  const { register, setValue } = form;
  const value = form.getValues(name);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert empty string to null for optional numeric fields
    const newValue = e.target.value === '' ? null : 
                    !isNaN(Number(e.target.value)) ? Number(e.target.value) : null;
    setValue(name, newValue as any);
  };

  // Use inputMode="decimal" instead of type="number" for cost fields
  const inputType = name.includes('cost') ? 'text' : 'number';
  const inputMode = name.includes('cost') ? 'decimal' : 'numeric';

  return (
    <FormFieldWrapper form={form} name={name} label={label}>
      <Input
        type={inputType}
        inputMode={inputMode}
        step="0.01"
        placeholder={placeholder}
        {...register(name, {
          setValueAs: (value) => {
            return value === '' ? null : 
                   !isNaN(Number(value)) ? Number(value) : null;
          }
        })}
        value={value === null ? '' : value}
        onChange={handleChange}
        min={min}
        max={max}
      />
    </FormFieldWrapper>
  );
};

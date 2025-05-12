
import { ReactNode } from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { WorkOrderFormValues } from '../WorkOrderDialog';

interface FormFieldWrapperProps {
  form: UseFormReturn<WorkOrderFormValues>;
  name: keyof WorkOrderFormValues;
  label: string;
  children: ReactNode;
}

export const FormFieldWrapper = ({
  form,
  name,
  label,
  children
}: FormFieldWrapperProps) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {children}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

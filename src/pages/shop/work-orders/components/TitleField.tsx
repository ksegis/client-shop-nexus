
import { UseFormReturn } from 'react-hook-form';
import { WorkOrderFormValues } from '../types';
import { Input } from '@/components/ui/input';
import { FormFieldWrapper } from './FormField';

interface TitleFieldProps {
  form: UseFormReturn<WorkOrderFormValues>;
}

export const TitleField = ({ form }: TitleFieldProps) => {
  return (
    <FormFieldWrapper form={form} name="title" label="Title">
      <Input placeholder="Oil Change Service" {...form.register('title')} />
    </FormFieldWrapper>
  );
};


import { UseFormReturn } from 'react-hook-form';
import { WorkOrderFormValues } from '../WorkOrderDialog';
import { Textarea } from '@/components/ui/textarea';
import { FormFieldWrapper } from './FormField';

interface DescriptionFieldProps {
  form: UseFormReturn<WorkOrderFormValues>;
}

export const DescriptionField = ({ form }: DescriptionFieldProps) => {
  const { register } = form;
  const description = form.watch('description') || '';
  
  return (
    <FormFieldWrapper form={form} name="description" label="Description">
      <Textarea 
        placeholder="Details about the work order..."
        className="min-h-[100px]"
        {...register('description')}
        value={description}
      />
    </FormFieldWrapper>
  );
};

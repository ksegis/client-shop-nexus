
import { UseFormReturn } from 'react-hook-form';
import { WorkOrderFormValues } from '../WorkOrderDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormFieldWrapper } from './FormField';

interface StatusSelectProps {
  form: UseFormReturn<WorkOrderFormValues>;
}

export const StatusSelect = ({ form }: StatusSelectProps) => {
  return (
    <FormFieldWrapper
      form={form}
      name="status"
      label="Status"
    >
      <Select
        onValueChange={form.setValue.bind(null, 'status')}
        defaultValue={form.getValues('status')}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </FormFieldWrapper>
  );
};

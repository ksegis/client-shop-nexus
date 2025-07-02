
import React from 'react';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { UseFormReturn } from 'react-hook-form';
import { VehicleFormValues } from '../VehicleFormSchema';
import { 
  VehicleBasicFields,
  VehicleTypeYearFields, 
  VehicleDetailsFields, 
  VehicleIdentificationFields 
} from '../form-fields/VehicleFormFields';

interface VehicleFormProps {
  form: UseFormReturn<VehicleFormValues>;
  onSubmit: (data: VehicleFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitButtonText: string;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  form,
  onSubmit,
  onCancel,
  isSubmitting,
  submitButtonText,
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <VehicleBasicFields form={form} />
        <VehicleTypeYearFields form={form} />
        <VehicleDetailsFields form={form} />
        <VehicleIdentificationFields form={form} />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
};


import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { WorkOrderFormValues } from './WorkOrderDialog';
import { CustomerSelect } from './components/CustomerSelect';
import { VehicleSelect } from './components/VehicleSelect';
import { StatusSelect } from './components/StatusSelect';
import { TitleField } from './components/TitleField';
import { NumericField } from './components/NumericField';
import { DescriptionField } from './components/DescriptionField';
import { FormActions } from './components/FormActions';

interface WorkOrderFormProps {
  form: UseFormReturn<WorkOrderFormValues>;
  onSubmit: (data: WorkOrderFormValues) => Promise<void>;
  isEditing: boolean;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const WorkOrderForm = ({ 
  form, 
  onSubmit, 
  isEditing, 
  onCancel, 
  isSubmitting = false 
}: WorkOrderFormProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>(form.getValues('customer_id') || '');

  const handleCustomerChange = (value: string) => {
    setSelectedCustomer(value);
    form.setValue('customer_id', value);
    form.setValue('vehicle_id', ''); // Reset vehicle when customer changes
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TitleField form={form} />
          <StatusSelect form={form} />

          <CustomerSelect 
            form={form} 
            loading={loading} 
            onCustomerChange={handleCustomerChange}
            selectedCustomer={selectedCustomer}
          />

          <VehicleSelect 
            form={form} 
            loading={loading}
            selectedCustomerId={selectedCustomer} 
          />

          <NumericField 
            form={form} 
            name="estimated_hours" 
            label="Estimated Hours" 
          />

          <NumericField 
            form={form} 
            name="estimated_cost" 
            label="Estimated Cost" 
          />

          <NumericField 
            form={form} 
            name="priority" 
            label="Priority (1-5)" 
            min="1"
            max="5"
          />
        </div>

        <DescriptionField form={form} />

        <FormActions 
          onCancel={onCancel} 
          isSubmitting={isSubmitting} 
          isEditing={isEditing}
        />
      </form>
    </Form>
  );
};

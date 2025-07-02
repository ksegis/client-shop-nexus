import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { WorkOrderFormValues, WorkOrderLineItem } from './types';
import { CustomerSelect } from './components/CustomerSelect';
import { VehicleSelect } from './components/VehicleSelect';
import { StatusSelect } from './components/StatusSelect';
import { TitleField } from './components/TitleField';
import { NumericField } from './components/NumericField';
import { DescriptionField } from './components/DescriptionField';
import { FormActions } from './components/FormActions';
import { LineItems } from './components/line-items';

interface WorkOrderFormProps {
  form: UseFormReturn<WorkOrderFormValues>;
  onSubmit: (data: WorkOrderFormValues) => Promise<void>;
  isEditing: boolean;
  onCancel: () => void;
  isSubmitting?: boolean;
  lineItems: WorkOrderLineItem[];
  onLineItemsChange: (items: WorkOrderLineItem[]) => void;
}

export const WorkOrderForm = ({ 
  form, 
  onSubmit, 
  isEditing, 
  onCancel, 
  isSubmitting = false,
  lineItems,
  onLineItemsChange
}: WorkOrderFormProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>(form.getValues('customer_id') || '');

  const handleCustomerChange = (value: string) => {
    setSelectedCustomer(value);
    form.setValue('customer_id', value);
    form.setValue('vehicle_id', ''); // Reset vehicle when customer changes
  };

  const handleFormSubmit = (data: WorkOrderFormValues) => {
    // Include line items with the form submission
    const fullData = {
      ...data,
      lineItems
    };
    return onSubmit(fullData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 pt-4">
        <div className="space-y-6">
          <TitleField form={form} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatusSelect form={form} />
            
            <NumericField 
              form={form} 
              name="priority" 
              label="Priority (1-5)" 
              min="1"
              max="5"
            />

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
          </div>

          <DescriptionField form={form} />

          {/* Line Items Section - Placed before estimated hours/cost */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4">Line Items</h3>
            <LineItems 
              items={lineItems}
              onChange={onLineItemsChange}
            />
          </div>
          
          {/* Estimated Hours/Cost Section - After line items */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4">Labor & Cost Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="actual_hours" 
                label="Actual Hours" 
              />

              <NumericField 
                form={form} 
                name="actual_cost" 
                label="Actual Cost" 
              />
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <FormActions 
            onCancel={onCancel} 
            isSubmitting={isSubmitting} 
            isEditing={isEditing}
          />
        </div>
      </form>
    </Form>
  );
};



import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { VehicleForm } from '../form/VehicleForm';
import { VehicleFormValues } from '../VehicleFormSchema';
import { DeleteVehicleDialog } from './DeleteVehicleDialog';

interface VehicleDetailsTabProps {
  form: UseFormReturn<VehicleFormValues>;
  onSubmit: (data: VehicleFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
}

export const VehicleDetailsTab: React.FC<VehicleDetailsTabProps> = ({
  form,
  onSubmit,
  onCancel,
  isSubmitting,
  onDelete,
  isDeleting
}) => {
  return (
    <div className="space-y-4">
      <VehicleForm 
        form={form}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitButtonText="Update Vehicle"
      />
      
      <div className="flex justify-start mt-4">
        <DeleteVehicleDialog 
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
};

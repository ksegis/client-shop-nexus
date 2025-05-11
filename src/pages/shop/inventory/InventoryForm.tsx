
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { InventoryFormValues, inventoryFormSchema } from './types';
import { FormFieldInput } from './components/FormFieldInput';
import { FormActions } from './components/FormActions';

interface InventoryFormProps {
  defaultValues?: InventoryFormValues;
  onSubmit: (values: InventoryFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}

export const InventoryForm = ({
  defaultValues = {
    name: '',
    description: '',
    sku: '',
    quantity: 0,
    price: 0,
    cost: 0,
    category: '',
    supplier: '',
    reorder_level: 10,
  },
  onSubmit,
  onCancel,
  isSubmitting,
  isEditing,
}: InventoryFormProps) => {
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormFieldInput 
          name="name" 
          label="Name" 
          placeholder="Item name"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormFieldInput 
            name="quantity" 
            label="Quantity" 
            placeholder="0" 
            type="number"
            onChange={(value) => form.setValue('quantity', value)}
          />
          
          <FormFieldInput 
            name="price" 
            label="Price ($)" 
            placeholder="0.00" 
            type="number" 
            step="0.01"
            onChange={(value) => form.setValue('price', value)}
          />
        </div>

        <FormFieldInput 
          name="description" 
          label="Description" 
          placeholder="Item description"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormFieldInput 
            name="sku" 
            label="SKU" 
            placeholder="Stock keeping unit"
          />

          <FormFieldInput 
            name="category" 
            label="Category" 
            placeholder="Category"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormFieldInput 
            name="supplier" 
            label="Supplier" 
            placeholder="Supplier name"
          />

          <FormFieldInput 
            name="cost" 
            label="Cost ($)" 
            placeholder="0.00" 
            type="number" 
            step="0.01"
            onChange={(value) => form.setValue('cost', value)}
          />
        </div>

        <FormFieldInput 
          name="reorder_level" 
          label="Reorder Level" 
          placeholder="10" 
          type="number"
          onChange={(value) => form.setValue('reorder_level', value)}
        />

        <FormActions 
          onCancel={onCancel} 
          isSubmitting={isSubmitting} 
          isEditing={isEditing} 
        />
      </form>
    </Form>
  );
};

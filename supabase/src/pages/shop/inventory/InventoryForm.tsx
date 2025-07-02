
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form } from '@/components/ui/form';
import { InventoryFormValues, inventoryFormSchema, InventoryItem } from './types';
import { FormFieldInput } from './components/FormFieldInput';
import { FormActions } from './components/FormActions';

interface InventoryFormProps {
  onSubmit: (values: InventoryFormValues) => void;
  editingItem?: InventoryItem | null;
  isSubmitting?: boolean;
}

export const InventoryForm = ({ onSubmit, editingItem, isSubmitting }: InventoryFormProps) => {
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: editingItem?.name || '',
      description: editingItem?.description || '',
      sku: editingItem?.sku || '',
      quantity: editingItem?.quantity || 0,
      price: editingItem?.price || 0,
      cost: editingItem?.cost || 0,
      category: editingItem?.category || '',
      supplier: editingItem?.supplier || '',
      reorder_level: editingItem?.reorder_level || 10,
      core_charge: editingItem?.core_charge || 0,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFieldInput
            form={form}
            name="name"
            label="Name"
            placeholder="Enter item name"
            required
          />
          
          <FormFieldInput
            form={form}
            name="sku"
            label="SKU"
            placeholder="Enter SKU"
          />
        </div>

        <FormFieldInput
          form={form}
          name="description"
          label="Description"
          placeholder="Enter description"
          component={Textarea}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFieldInput
            form={form}
            name="category"
            label="Category"
            placeholder="Enter category"
          />
          
          <FormFieldInput
            form={form}
            name="supplier"
            label="Supplier"
            placeholder="Enter supplier"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormFieldInput
            form={form}
            name="quantity"
            label="Quantity"
            type="number"
            min="0"
            required
          />
          
          <FormFieldInput
            form={form}
            name="price"
            label="Price ($)"
            type="number"
            step="0.01"
            min="0"
            required
          />
          
          <FormFieldInput
            form={form}
            name="cost"
            label="Cost ($)"
            type="number"
            step="0.01"
            min="0"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFieldInput
            form={form}
            name="reorder_level"
            label="Reorder Level"
            type="number"
            min="0"
          />
          
          <FormFieldInput
            form={form}
            name="core_charge"
            label="Core Charge ($)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </div>

        <FormActions isSubmitting={isSubmitting} editingItem={editingItem} />
      </form>
    </Form>
  );
};

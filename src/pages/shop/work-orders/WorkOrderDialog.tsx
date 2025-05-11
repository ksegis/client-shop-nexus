
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { WorkOrderForm } from './WorkOrderForm';
import { useWorkOrders } from './WorkOrdersContext';
import { WorkOrder } from './types';
import { Plus, Edit } from 'lucide-react';

// Schema for form validation
export const workOrderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  customer_id: z.string().min(1, 'Customer is required'),
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  estimated_hours: z.number().nullable().optional(),
  estimated_cost: z.number().nullable().optional(),
  actual_hours: z.number().nullable().optional(),
  actual_cost: z.number().nullable().optional(),
  priority: z.number().default(1),
  assigned_to: z.string().nullable().optional(),
});

export type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

interface WorkOrderDialogProps {
  workOrder?: WorkOrder;
}

export const WorkOrderDialog = ({ workOrder }: WorkOrderDialogProps) => {
  const [open, setOpen] = useState(false);
  const { createWorkOrder, updateWorkOrder } = useWorkOrders();
  const isEditing = !!workOrder;

  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      title: workOrder?.title || '',
      description: workOrder?.description || '',
      status: workOrder?.status || 'pending',
      customer_id: workOrder?.customer_id || '',
      vehicle_id: workOrder?.vehicle_id || '',
      estimated_hours: workOrder?.estimated_hours || null,
      estimated_cost: workOrder?.estimated_cost || null,
      actual_hours: workOrder?.actual_hours || null,
      actual_cost: workOrder?.actual_cost || null,
      priority: workOrder?.priority || 1,
      assigned_to: workOrder?.assigned_to || null,
    },
  });

  const onSubmit = async (data: WorkOrderFormValues) => {
    try {
      if (isEditing) {
        await updateWorkOrder(workOrder.id, data);
      } else {
        await createWorkOrder(data);
      }
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error saving work order:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Work Order
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Work Order' : 'Create New Work Order'}</DialogTitle>
        </DialogHeader>
        <WorkOrderForm 
          form={form} 
          onSubmit={onSubmit} 
          isEditing={isEditing} 
          onCancel={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
};

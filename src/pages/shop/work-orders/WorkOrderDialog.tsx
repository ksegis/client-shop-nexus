
import { useState, useEffect } from 'react';
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
import { WorkOrder, WorkOrderLineItem, WorkOrderFormValues, WorkOrderStatus } from './types';
import { Plus, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Schema for form validation aligned with WorkOrderFormValues type
export const workOrderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled'] as const),
  customer_id: z.string().min(1, 'Customer is required'),
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  estimated_hours: z.number().nullable().optional(),
  estimated_cost: z.number().nullable().optional(),
  actual_hours: z.number().nullable().optional(),
  actual_cost: z.number().nullable().optional(),
  priority: z.number().default(1),
  assigned_to: z.string().nullable().optional(),
  lineItems: z.array(z.any()).optional(),
});

interface WorkOrderDialogProps {
  workOrder?: WorkOrder;
}

export const WorkOrderDialog = ({ workOrder }: WorkOrderDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lineItems, setLineItems] = useState<WorkOrderLineItem[]>([]);
  const { createWorkOrder, updateWorkOrder, getWorkOrderLineItems } = useWorkOrders();
  const { toast } = useToast();
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
      lineItems: [],
    },
  });

  // Load line items if editing
  useEffect(() => {
    const fetchLineItems = async () => {
      if (isEditing && workOrder) {
        try {
          const items = await getWorkOrderLineItems(workOrder.id);
          setLineItems(items);
        } catch (error) {
          console.error("Error fetching line items:", error);
        }
      }
    };

    if (open && isEditing) {
      fetchLineItems();
    }
  }, [open, isEditing, workOrder, getWorkOrderLineItems]);

  const handleLineItemsChange = (items: WorkOrderLineItem[]) => {
    setLineItems(items);
  };

  const onSubmit = async (data: WorkOrderFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Form submitted with data:", data);
      console.log("Line items:", lineItems);
      
      if (isEditing && workOrder) {
        await updateWorkOrder(workOrder.id, data as unknown as Partial<WorkOrder>, lineItems);
        toast({
          title: "Success",
          description: "Work order updated successfully",
        });
      } else {
        await createWorkOrder(data as unknown as Partial<WorkOrder>, lineItems);
        toast({
          title: "Success",
          description: "Work order created successfully",
        });
      }
      
      setOpen(false);
      form.reset();
      setLineItems([]);
    } catch (error) {
      console.error('Error saving work order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} work order. Please try again.`,
      });
    } finally {
      setIsSubmitting(false);
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
      <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Work Order' : 'Create New Work Order'}</DialogTitle>
        </DialogHeader>
        <WorkOrderForm 
          form={form} 
          onSubmit={onSubmit} 
          isEditing={isEditing} 
          onCancel={() => setOpen(false)}
          isSubmitting={isSubmitting}
          lineItems={lineItems}
          onLineItemsChange={handleLineItemsChange}
        />
      </DialogContent>
    </Dialog>
  );
};

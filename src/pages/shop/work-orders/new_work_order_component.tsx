import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { WorkOrderForm } from './WorkOrderForm';
import { useWorkOrders } from './WorkOrdersContext';
import { WorkOrderLineItem, WorkOrderFormValues } from './types';
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

export const NewWorkOrder = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lineItems, setLineItems] = useState<WorkOrderLineItem[]>([]);
  const { createWorkOrder } = useWorkOrders();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'pending',
      customer_id: '',
      vehicle_id: '',
      estimated_hours: null,
      estimated_cost: null,
      actual_hours: null,
      actual_cost: null,
      priority: 1,
      assigned_to: null,
      lineItems: [],
    },
  });

  const handleLineItemsChange = (items: WorkOrderLineItem[]) => {
    setLineItems(items);
  };

  const onSubmit = async (data: WorkOrderFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Creating new work order with data:", data);
      console.log("Line items:", lineItems);
      
      await createWorkOrder(data as unknown as Partial<WorkOrder>, lineItems);
      
      toast({
        title: "Success",
        description: "Work order created successfully",
      });
      
      // Navigate back to work orders list
      navigate('/shop/work-orders');
    } catch (error) {
      console.error('Error creating work order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create work order. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/shop/work-orders');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={handleCancel}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Work Orders
        </Button>
        <h1 className="text-3xl font-bold">Create New Work Order</h1>
        <p className="text-muted-foreground">
          Fill in the information below to create a new work order.
        </p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <WorkOrderForm 
          form={form} 
          onSubmit={onSubmit} 
          isEditing={false} 
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          lineItems={lineItems}
          onLineItemsChange={handleLineItemsChange}
        />
      </div>
    </div>
  );
};


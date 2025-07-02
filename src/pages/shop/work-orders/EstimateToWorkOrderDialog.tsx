
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { WorkOrderForm } from './WorkOrderForm';
import { WorkOrderFormValues, WorkOrderLineItem, WorkOrderStatus } from './types';
import { useWorkOrderCrud } from './hooks/useWorkOrderCrud';

const workOrderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  customer_id: z.string().min(1, "Customer is required"),
  vehicle_id: z.string().min(1, "Vehicle is required"),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled'] as const).default("pending"),
  priority: z.coerce.number().min(1).max(5).default(1),
  estimated_hours: z.coerce.number().optional(),
  estimated_cost: z.coerce.number().optional(),
  actual_hours: z.coerce.number().optional(),
  actual_cost: z.coerce.number().optional(),
});

interface EstimateToWorkOrderDialogProps {
  open: boolean;
  onClose: () => void;
  estimateId: string;
}

export const EstimateToWorkOrderDialog = ({ open, onClose, estimateId }: EstimateToWorkOrderDialogProps) => {
  const { toast } = useToast();
  const { createWorkOrder } = useWorkOrderCrud(async () => {
    // Return a Promise to satisfy the type requirement
    return Promise.resolve();
  });
  const [loading, setLoading] = useState(false);
  const [lineItems, setLineItems] = useState<WorkOrderLineItem[]>([]);
  const [estimateData, setEstimateData] = useState<any>(null);

  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      title: "",
      description: "",
      customer_id: "",
      vehicle_id: "",
      status: "pending" as WorkOrderStatus,
      priority: 1,
      estimated_hours: undefined,
      estimated_cost: undefined,
      actual_hours: undefined,
      actual_cost: undefined,
    }
  });

  // Fetch estimate data when dialog opens
  useEffect(() => {
    if (open && estimateId) {
      fetchEstimateData();
    }
  }, [open, estimateId]);

  const fetchEstimateData = async () => {
    setLoading(true);
    try {
      // Fetch estimate and its items
      const { data: estimate, error } = await supabase
        .from('estimates')
        .select(`
          *,
          profiles:customer_id (first_name, last_name)
        `)
        .eq('id', estimateId)
        .single();

      if (error) throw error;
      setEstimateData(estimate);

      // Set form values based on estimate
      form.setValue('title', `Work Order for ${estimate.title}`);
      form.setValue('description', estimate.description || '');
      form.setValue('customer_id', estimate.customer_id);
      form.setValue('vehicle_id', estimate.vehicle_id);
      form.setValue('estimated_cost', estimate.total_amount);

      // Use line_items from the estimates table (JSON column)
      if (estimate.line_items && Array.isArray(estimate.line_items)) {
        const workOrderItems = estimate.line_items.map((item: any) => ({
          description: item.description || '',
          quantity: item.quantity || 1,
          price: item.price || 0,
          part_number: item.part_number || '',
          vendor: item.vendor || '',
        }));
        setLineItems(workOrderItems);
      }
    } catch (error) {
      console.error('Error fetching estimate data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load estimate data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: WorkOrderFormValues) => {
    try {
      // Create work order with reference to estimate
      const workOrderData = {
        ...data,
        estimate_id: estimateId, // Reference to the source estimate
      };

      // Create work order and its line items
      await createWorkOrder(workOrderData as any, lineItems);

      toast({
        title: "Success",
        description: "Work order created from estimate",
      });

      onClose();
    } catch (error) {
      console.error('Error creating work order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create work order",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Work Order from Estimate</DialogTitle>
          <DialogDescription>
            Create a new work order based on this estimate. You can modify details as needed.
          </DialogDescription>
        </DialogHeader>

        {estimateData && (
          <div className="bg-muted/30 p-3 rounded-md mb-4">
            <div className="text-sm">
              <span className="font-medium">Source Estimate:</span> {estimateData.title}
            </div>
            <div className="text-sm">
              <span className="font-medium">Customer:</span> {estimateData.profiles?.first_name} {estimateData.profiles?.last_name}
            </div>
            <div className="text-sm">
              <span className="font-medium">Amount:</span> ${estimateData.total_amount.toFixed(2)}
            </div>
          </div>
        )}

        <WorkOrderForm
          form={form}
          onSubmit={handleSubmit}
          isEditing={false}
          onCancel={onClose}
          isSubmitting={loading}
          lineItems={lineItems}
          onLineItemsChange={setLineItems}
        />
      </DialogContent>
    </Dialog>
  );
};

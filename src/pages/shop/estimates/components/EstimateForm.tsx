
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Estimate } from "../EstimatesContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { estimateSchema, EstimateFormValues, LineItemValues } from "../schemas/estimateSchema";

import { CustomerVehicleFields } from "./CustomerVehicleFields";
import { EstimateDetailsFields } from "./EstimateDetailsFields";
import { LineItemsSection } from "./LineItems/LineItemsSection";
import { AmountStatusFields } from "./AmountStatusFields";
import { FormActions } from "./FormActions";

interface EstimateFormProps {
  estimate?: Estimate;
  onSubmit: (values: EstimateFormValues) => Promise<void>;
  onCancel: () => void;
  mode: "create" | "edit";
}

export function EstimateForm({ estimate, onSubmit, onCancel, mode }: EstimateFormProps) {
  const [lineItems, setLineItems] = useState<LineItemValues[]>([]);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [showItemResults, setShowItemResults] = useState(false);
  
  // Initialize form with react-hook-form
  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      customer_id: estimate?.customer_id || "",
      vehicle_id: estimate?.vehicle_id || "",
      title: estimate?.title || "",
      description: estimate?.description || "",
      total_amount: estimate?.total_amount || 0,
      status: estimate?.status || "pending",
    },
  });

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("role", "customer");

      if (error) {
        console.error("Error fetching customers:", error);
        return [];
      }

      return data || [];
    },
  });

  // Fetch vehicles for the selected customer
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles", form.watch("customer_id")],
    queryFn: async () => {
      const customerId = form.watch("customer_id");
      if (!customerId) return [];

      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make, model, year")
        .eq("owner_id", customerId);

      if (error) {
        console.error("Error fetching vehicles:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!form.watch("customer_id"),
  });

  // Fetch vendors for dropdown
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data } = await supabase
        .from('inventory')
        .select('supplier')
        .not('supplier', 'is', null);
      
      // Get unique suppliers
      const uniqueSuppliers = [...new Set(data?.map(item => item.supplier))];
      return uniqueSuppliers.map(supplier => ({ name: supplier })) || [];
    },
  });

  // Fetch inventory items based on search term
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory', itemSearchTerm],
    queryFn: async () => {
      if (!itemSearchTerm || itemSearchTerm.length < 2) return [];
      
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .or(`name.ilike.%${itemSearchTerm}%,description.ilike.%${itemSearchTerm}%,sku.ilike.%${itemSearchTerm}%`);
      
      return data || [];
    },
    enabled: itemSearchTerm.length >= 2,
  });

  // Initialize form values when estimate changes
  useEffect(() => {
    if (estimate) {
      form.reset({
        customer_id: estimate.customer_id,
        vehicle_id: estimate.vehicle_id,
        title: estimate.title,
        description: estimate.description || "",
        total_amount: estimate.total_amount,
        status: estimate.status,
      });

      // Initialize line items if they exist
      if (estimate.line_items && estimate.line_items.length > 0) {
        setLineItems(estimate.line_items);
      }
    }
  }, [estimate, form]);

  // Update total amount when line items change
  useEffect(() => {
    if (lineItems.length > 0) {
      const newTotal = lineItems.reduce((sum, item) => {
        return sum + (item.quantity * item.price);
      }, 0);
      form.setValue("total_amount", newTotal);
    }
  }, [lineItems, form]);

  // Handle form submission
  const handleSubmit = (values: EstimateFormValues) => {
    const formData = {
      ...values,
      line_items: lineItems,
    };
    onSubmit(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <CustomerVehicleFields 
          form={form} 
          customers={customers} 
          vehicles={vehicles} 
          mode={mode} 
        />

        <EstimateDetailsFields form={form} />

        <LineItemsSection 
          lineItems={lineItems}
          setLineItems={setLineItems}
          vendors={vendors}
          itemSearchTerm={itemSearchTerm}
          setItemSearchTerm={setItemSearchTerm}
          inventoryItems={inventoryItems}
          showItemResults={showItemResults}
          setShowItemResults={setShowItemResults}
          selectedItemIndex={selectedItemIndex}
          setSelectedItemIndex={setSelectedItemIndex}
        />

        <AmountStatusFields form={form} />

        <FormActions onCancel={onCancel} mode={mode} />
      </form>
    </Form>
  );
}

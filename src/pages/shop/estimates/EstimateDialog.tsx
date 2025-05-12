import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEstimates } from "./EstimatesContext";
import { Estimate, EstimateStatus, LineItem } from "./types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash, Save } from "lucide-react";

// Line item schema for validation
const lineItemSchema = z.object({
  part_number: z.string().optional(),
  description: z.string().min(1, { message: "Description is required" }),
  quantity: z.coerce.number().min(1, { message: "Quantity must be at least 1" }),
  price: z.coerce.number().min(0, { message: "Price must be positive" }),
  vendor: z.string().optional(),
});

const formSchema = z.object({
  customer_id: z.string().min(1, { message: "Customer is required" }),
  vehicle_id: z.string().min(1, { message: "Vehicle is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  total_amount: z.coerce.number().min(0, { message: "Amount must be positive" }),
  status: z.enum(["pending", "approved", "declined", "completed"]),
  line_items: z.array(lineItemSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function EstimateDialog({ estimate, open, onClose }: { estimate?: Estimate; open: boolean; onClose: () => void }) {
  const { createEstimate, updateEstimate } = useEstimates();
  const isEditing = !!estimate;
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [showItemResults, setShowItemResults] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: estimate?.customer_id || "",
      vehicle_id: estimate?.vehicle_id || "",
      title: estimate?.title || "",
      description: estimate?.description || "",
      total_amount: estimate?.total_amount || 0,
      status: estimate?.status || "pending",
      line_items: [],
    },
  });

  // Reset form when the dialog opens or estimate changes
  useEffect(() => {
    if (open) {
      form.reset({
        customer_id: estimate?.customer_id || "",
        vehicle_id: estimate?.vehicle_id || "",
        title: estimate?.title || "",
        description: estimate?.description || "",
        total_amount: estimate?.total_amount || 0,
        status: estimate?.status || "pending",
      });
      // Reset line items
      setLineItems([]);
    }
  }, [open, estimate, form]);

  // Update total amount when line items change
  useEffect(() => {
    if (lineItems.length > 0) {
      const newTotal = lineItems.reduce((sum, item) => {
        return sum + (item.quantity * item.price);
      }, 0);
      form.setValue("total_amount", newTotal);
    }
  }, [lineItems, form]);

  // Fetch customers for the dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('role', 'customer');
      return data || [];
    },
  });

  // Fetch vehicles for the dropdown
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', form.watch('customer_id')],
    queryFn: async () => {
      const customerId = form.watch('customer_id');
      if (!customerId) return [];
      
      const { data } = await supabase
        .from('vehicles')
        .select('id, make, model, year')
        .eq('owner_id', customerId);
      return data || [];
    },
    enabled: !!form.watch('customer_id'),
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

  const handleItemSearch = (value: string, index: number) => {
    setItemSearchTerm(value);
    setSelectedItemIndex(index);
    setShowItemResults(true);
  };

  const handleSelectInventoryItem = (item: any) => {
    if (selectedItemIndex !== null) {
      const updatedItems = [...lineItems];
      updatedItems[selectedItemIndex] = {
        ...updatedItems[selectedItemIndex],
        part_number: item.sku || '',
        description: item.name,
        price: item.price || 0,
        vendor: item.supplier || ''
      };
      setLineItems(updatedItems);
      setShowItemResults(false);
      setItemSearchTerm("");
    }
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, price: 0, part_number: "", vendor: "" }
    ]);
  };

  const removeLineItem = (index: number) => {
    const updatedItems = lineItems.filter((_, i) => i !== index);
    setLineItems(updatedItems);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setLineItems(updatedItems);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const formData = {
        ...values,
        line_items: lineItems,
      };

      if (isEditing && estimate) {
        await updateEstimate(estimate.id, {
          title: values.title,
          description: values.description,
          total_amount: values.total_amount,
          status: values.status as EstimateStatus,
        });
      } else {
        await createEstimate({
          customer_id: values.customer_id,
          vehicle_id: values.vehicle_id,
          title: values.title,
          description: values.description,
          total_amount: values.total_amount,
          status: values.status as EstimateStatus,
        });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save estimate:", error);
    }
  };

  const saveAsDraft = async () => {
    try {
      const values = form.getValues();
      
      // Validate required fields for draft
      if (!values.customer_id || !values.vehicle_id || !values.title) {
        // Set specific field errors
        if (!values.customer_id) form.setError("customer_id", { message: "Customer is required" });
        if (!values.vehicle_id) form.setError("vehicle_id", { message: "Vehicle is required" });
        if (!values.title) form.setError("title", { message: "Title is required" });
        return;
      }
      
      const formData = {
        customer_id: values.customer_id,
        vehicle_id: values.vehicle_id,
        title: values.title,
        description: values.description || "",
        total_amount: values.total_amount || 0,
        status: "pending" as EstimateStatus, // Always save as pending for draft
        line_items: lineItems
      };
      
      if (isEditing && estimate) {
        await updateEstimate(estimate.id, {
          title: formData.title,
          description: formData.description,
          total_amount: formData.total_amount,
          status: "pending",
        });
      } else {
        await createEstimate(formData);
      }
      
      onClose();
    } catch (error) {
      console.error("Failed to save draft estimate:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Estimate" : "Create New Estimate"}</DialogTitle>
          <DialogDescription>
            Fill out the details below to {isEditing ? "edit the" : "create a new"} estimate.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isEditing || !form.watch('customer_id')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Estimate title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Estimate description"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Line Items Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Line Items</h3>
                <Button 
                  type="button" 
                  onClick={addLineItem}
                  size="sm" 
                  className="h-8"
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Item
                </Button>
              </div>
              
              {lineItems.length > 0 ? (
                <div className="border rounded-md">
                  <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 font-medium text-sm">
                    <div className="col-span-2">Part #</div>
                    <div className="col-span-4">Description</div>
                    <div className="col-span-1">Qty</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-2">Vendor</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-3 border-t">
                      {/* Part Number */}
                      <div className="col-span-2">
                        <Input 
                          value={item.part_number || ''} 
                          onChange={(e) => updateLineItem(index, 'part_number', e.target.value)}
                          placeholder="Part #"
                        />
                      </div>
                      
                      {/* Description with search */}
                      <div className="col-span-4 relative">
                        <Popover open={showItemResults && selectedItemIndex === index}>
                          <PopoverTrigger asChild>
                            <div>
                              <Input 
                                value={item.description} 
                                onChange={(e) => {
                                  updateLineItem(index, 'description', e.target.value);
                                  handleItemSearch(e.target.value, index);
                                }}
                                placeholder="Description"
                                className="w-full"
                              />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-96 p-0 max-h-[200px] overflow-y-auto">
                            {inventoryItems.length > 0 ? (
                              <div className="py-2">
                                {inventoryItems.map((invItem) => (
                                  <div 
                                    key={invItem.id} 
                                    className="px-4 py-2 hover:bg-accent cursor-pointer"
                                    onClick={() => handleSelectInventoryItem(invItem)}
                                  >
                                    <div className="font-medium">{invItem.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {invItem.sku && `SKU: ${invItem.sku}`}
                                      {invItem.supplier && ` • Vendor: ${invItem.supplier}`}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                No matching items found
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-1">
                        <Input 
                          type="number" 
                          min="1" 
                          value={item.quantity} 
                          onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                        />
                      </div>

                      {/* Price */}
                      <div className="col-span-2">
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          value={item.price} 
                          onChange={(e) => updateLineItem(index, 'price', Number(e.target.value))}
                        />
                      </div>

                      {/* Vendor */}
                      <div className="col-span-2">
                        <Select
                          value={item.vendor || ''}
                          onValueChange={(value) => updateLineItem(index, 'vendor', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select vendor" />
                          </SelectTrigger>
                          <SelectContent>
                            {vendors.map((vendor, i) => (
                              <SelectItem key={i} value={vendor.name || ''}>
                                {vendor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Remove button */}
                      <div className="col-span-1 flex items-center justify-end">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => removeLineItem(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-md p-8 text-center text-muted-foreground">
                  No items added. Click "Add Item" to add items to this estimate.
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 flex-wrap justify-end sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={saveAsDraft}
                className="flex gap-2 items-center"
              >
                <Save className="h-4 w-4" />
                Save as Draft
              </Button>
              <Button type="submit">
                {isEditing ? "Update Estimate" : "Create Estimate"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default EstimateDialog;

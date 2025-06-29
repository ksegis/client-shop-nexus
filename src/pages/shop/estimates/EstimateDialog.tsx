import { useState, useEffect } from "react";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, Trash, Save, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Line item schema for validation
const lineItemSchema = z.object({
  part_number: z.string().optional(),
  description: z.string().min(1, { message: "Description is required" }),
  quantity: z.coerce.number().min(1, { message: "Quantity must be at least 1" }),
  price: z.coerce.number().min(0, { message: "Price must be positive" }),
  vendor: z.string().optional(),
});

// Vehicle schema for the add vehicle form
const vehicleSchema = z.object({
  make: z.string().min(1, { message: "Make is required" }),
  model: z.string().min(1, { message: "Model is required" }),
  year: z.coerce.number().int().min(1900, { message: "Please enter a valid year" }).max(new Date().getFullYear() + 1, { message: "Year cannot be in the future" }),
  color: z.string().optional(),
  license_plate: z.string().optional(),
  vin: z.string().optional(),
  vehicle_type: z.enum(["car", "truck", "motorcycle", "other"]).default("car"),
});

const formSchema = z.object({
  customer_id: z.string().min(1, { message: "Customer is required" }),
  vehicle_id: z.string().min(1, { message: "Vehicle is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  total_amount: z.coerce.number().min(0, { message: "Amount must be positive" }),
  status: z.enum(["draft", "pending", "approved", "declined", "completed"]),
  line_items: z.array(lineItemSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;
type VehicleFormValues = z.infer<typeof vehicleSchema>;

// Inventory Search Popover Component
const InventorySearchPopover = ({
  children,
  isOpen,
  onClose,
  results,
  onSelect,
  searchTerm
}: {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  results: any[];
  onSelect: (item: any) => void;
  searchTerm: string;
}) => {
  return (
    <Popover open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[400px]" align="start">
        <Command>
          <CommandInput 
            placeholder="Search inventory..." 
            value={searchTerm}
            readOnly
          />
          <CommandList>
            <CommandEmpty>No results found</CommandEmpty>
            <CommandGroup>
              {results.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.sku || ''}-${item.name}`}
                  onSelect={() => onSelect(item)}
                >
                  <div className="w-full flex flex-col">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">${(item.price || 0).toFixed(2)}</span>
                    </div>
                    {item.sku && (
                      <span className="text-xs text-muted-foreground">
                        SKU: {item.sku}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export function EstimateDialog({ estimate, open, onClose }: { estimate?: Estimate; open: boolean; onClose: () => void }) {
  const { createEstimate, updateEstimate } = useEstimates();
  const isEditing = !!estimate;
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const { toast } = useToast();

  // Inventory search state
  const [activeSearchField, setActiveSearchField] = useState<{ type: 'part_number' | 'description'; index: number | null } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

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

  const vehicleForm = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      license_plate: "",
      vin: "",
      vehicle_type: "car",
    }
  });

  // Reset form when the dialog opens or estimate changes
  useEffect(() => {
    if (open) {
      // Debug logging to see what's in the estimate object
      console.log("EstimateDialog opened with estimate:", estimate);
      console.log("Estimate line_items:", estimate?.line_items);
      console.log("Estimate status:", estimate?.status);
      
      form.reset({
        customer_id: estimate?.customer_id || "",
        vehicle_id: estimate?.vehicle_id || "",
        title: estimate?.title || "",
        description: estimate?.description || "",
        total_amount: estimate?.total_amount || 0,
        status: estimate?.status || "pending",
      });
      
      // Load existing line items if editing an estimate
      if (estimate && estimate.line_items) {
        console.log("Loading line items:", estimate.line_items);
        setLineItems(estimate.line_items);
      } else {
        console.log("No line items found, setting empty array");
        setLineItems([]);
      }
      
      setShowAddVehicle(false);
      setActiveSearchField(null);
      setSearchTerm("");
      setSearchResults([]);
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
  const { data: vehicles = [], refetch: refetchVehicles } = useQuery({
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

  // Fetch vendors for dropdown - Filter out empty/null vendors
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data } = await supabase
        .from('inventory')
        .select('supplier')
        .not('supplier', 'is', null)
        .neq('supplier', ''); // Also exclude empty strings
      
      // Get unique suppliers and filter out any null/empty values
      const uniqueSuppliers = [...new Set(data?.map(item => item.supplier))]
        .filter(supplier => supplier && supplier.trim() !== ''); // Filter out null, undefined, and empty strings
      
      return uniqueSuppliers.map(supplier => ({ name: supplier })) || [];
    },
  });

  // Inventory search functionality
  const performInventorySearch = async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .or(`name.ilike.%${term}%,description.ilike.%${term}%,sku.ilike.%${term}%`)
        .limit(10);
      
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching inventory:', error);
      setSearchResults([]);
    }
  };

  const handleSearchClick = (type: 'part_number' | 'description', index: number | null, term: string) => {
    if (index === -1) {
      // Close search
      setActiveSearchField(null);
      setSearchTerm("");
      setSearchResults([]);
      return;
    }

    setActiveSearchField({ type, index });
    setSearchTerm(term);
    performInventorySearch(term);
  };

  const handleInventoryItemSelect = (item: any, index: number | null) => {
    if (index === null) {
      // This is for a new item being added
      const updatedItems = [...lineItems];
      const lastIndex = updatedItems.length - 1;
      if (lastIndex >= 0) {
        updatedItems[lastIndex] = {
          ...updatedItems[lastIndex],
          part_number: item.sku || '',
          description: item.name || '',
          price: item.price || 0,
          vendor: item.supplier || ''
        };
        setLineItems(updatedItems);
      }
    } else {
      // This is for an existing item
      const updatedItems = [...lineItems];
      updatedItems[index] = {
        ...updatedItems[index],
        part_number: item.sku || '',
        description: item.name || '',
        price: item.price || 0,
        vendor: item.supplier || ''
      };
      setLineItems(updatedItems);
    }

    // Close search
    setActiveSearchField(null);
    setSearchTerm("");
    setSearchResults([]);
  };

  // Handle customer selection
  const handleCustomerChange = async (customerId: string) => {
    form.setValue('customer_id', customerId);
    
    // Find the selected customer
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer);
    
    // Reset vehicle selection since we changed customers
    form.setValue('vehicle_id', '');

    // Wait for vehicles to load after customer change
    await refetchVehicles();
  };

  // Handle add vehicle submission
  const handleAddVehicle = async (data: VehicleFormValues) => {
    try {
      const customerId = form.getValues('customer_id');
      if (!customerId) {
        toast({
          title: "Error",
          description: "Please select a customer before adding a vehicle",
          variant: "destructive",
        });
        return;
      }

      const vehicleData = {
        owner_id: customerId,
        make: data.make,
        model: data.model,
        year: data.year,
        color: data.color || null,
        license_plate: data.license_plate || null,
        vin: data.vin || null,
        vehicle_type: data.vehicle_type
      };

      const { data: newVehicle, error } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Vehicle added",
        description: `${data.year} ${data.make} ${data.model} added successfully`,
      });

      // Refresh vehicles list
      await refetchVehicles();
      
      // Select the new vehicle
      if (newVehicle) {
        form.setValue('vehicle_id', newVehicle.id);
      }
      
      // Close the add vehicle form
      setShowAddVehicle(false);
      vehicleForm.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add vehicle",
        variant: "destructive",
      });
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

    // If updating part_number or description, trigger search
    if (field === 'part_number' || field === 'description') {
      if (value && value.length >= 2) {
        handleSearchClick(field, index, value);
      }
    }
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
          line_items: lineItems, // Include line items when updating estimates
        });
      } else {
        // For new estimates, default to pending status (ready for customer)
        await createEstimate({
          customer_id: values.customer_id,
          vehicle_id: values.vehicle_id,
          title: values.title,
          description: values.description,
          total_amount: values.total_amount,
          status: "pending" as EstimateStatus, // Default to pending for formal estimates
          line_items: lineItems, // Include line items for pending estimates
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
        status: "draft" as EstimateStatus,
        line_items: lineItems
      };
      
      if (isEditing && estimate) {
        await updateEstimate(estimate.id, {
          title: formData.title,
          description: formData.description,
          total_amount: formData.total_amount,
          status: "draft",
          line_items: lineItems, // Include line items when updating to draft
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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
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
                      onValueChange={handleCustomerChange} 
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
                    <div className="flex gap-2">
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isEditing || !form.watch('customer_id')}
                      >
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a vehicle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicles.length > 0 ? (
                            vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="py-2 px-2 text-sm text-muted-foreground">
                              No vehicles found
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      {!isEditing && form.watch('customer_id') && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddVehicle(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {showAddVehicle && (
              <div className="border rounded p-4 space-y-4 bg-muted/30">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-medium">Add New Vehicle</h3>
                  <Button
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowAddVehicle(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Make</label>
                    <Input 
                      {...vehicleForm.register('make')} 
                      placeholder="Make" 
                      className="mt-1"
                    />
                    {vehicleForm.formState.errors.make && (
                      <p className="text-sm font-medium text-destructive mt-1">
                        {vehicleForm.formState.errors.make.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Model</label>
                    <Input 
                      {...vehicleForm.register('model')} 
                      placeholder="Model" 
                      className="mt-1"
                    />
                    {vehicleForm.formState.errors.model && (
                      <p className="text-sm font-medium text-destructive mt-1">
                        {vehicleForm.formState.errors.model.message}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Year</label>
                    <Input 
                      type="number" 
                      {...vehicleForm.register('year', { valueAsNumber: true })} 
                      placeholder="Year" 
                      className="mt-1"
                    />
                    {vehicleForm.formState.errors.year && (
                      <p className="text-sm font-medium text-destructive mt-1">
                        {vehicleForm.formState.errors.year.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Color</label>
                    <Input 
                      {...vehicleForm.register('color')} 
                      placeholder="Color" 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select 
                      onValueChange={(value) => vehicleForm.setValue('vehicle_type', value as any)}
                      defaultValue={vehicleForm.getValues('vehicle_type')}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="car">Car</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="motorcycle">Motorcycle</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">License Plate</label>
                    <Input 
                      {...vehicleForm.register('license_plate')} 
                      placeholder="License Plate" 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">VIN</label>
                    <Input 
                      {...vehicleForm.register('vin')} 
                      placeholder="VIN" 
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => vehicleForm.handleSubmit(handleAddVehicle)()}
                  >
                    Add Vehicle
                  </Button>
                </div>
              </div>
            )}
            
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

            {/* Line Items Section with Enhanced Search */}
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
                      {/* Part Number with Search */}
                      <div className="col-span-2">
                        <div className="relative flex items-center">
                          <Input 
                            value={item.part_number || ''} 
                            onChange={(e) => updateLineItem(index, 'part_number', e.target.value)}
                            placeholder="Part #"
                            className="pr-8"
                          />
                          <InventorySearchPopover
                            isOpen={activeSearchField?.type === 'part_number' && activeSearchField.index === index}
                            onClose={() => handleSearchClick('part_number', -1, '')}
                            results={searchResults}
                            onSelect={(item) => handleInventoryItemSelect(item, index)}
                            searchTerm={searchTerm}
                          >
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="sm" 
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                              onClick={() => handleSearchClick('part_number', index, item.part_number || '')}
                            >
                              <Search className="h-3 w-3" />
                            </Button>
                          </InventorySearchPopover>
                        </div>
                      </div>
                      
                      {/* Description with Search */}
                      <div className="col-span-4">
                        <div className="relative flex items-center">
                          <Input 
                            value={item.description} 
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            placeholder="Description"
                            className="pr-8"
                          />
                          <InventorySearchPopover
                            isOpen={activeSearchField?.type === 'description' && activeSearchField.index === index}
                            onClose={() => handleSearchClick('description', -1, '')}
                            results={searchResults}
                            onSelect={(item) => handleInventoryItemSelect(item, index)}
                            searchTerm={searchTerm}
                          >
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="sm" 
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                              onClick={() => handleSearchClick('description', index, item.description || '')}
                            >
                              <Search className="h-3 w-3" />
                            </Button>
                          </InventorySearchPopover>
                        </div>
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
                            {vendors.length > 0 ? (
                              vendors.map((vendor, i) => (
                                <SelectItem key={i} value={vendor.name}>
                                  {vendor.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-vendor" disabled>
                                No vendors available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Remove button */}
                      <div className="col-span-1 flex items-center justify-end">
                        <Button 
                          type="button"
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
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
                className="flex items-center gap-2"
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

// Add default export to fix import error
export default EstimateDialog;


import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { PartOrderItem, Part } from "@/types/parts";

const formSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  customerEmail: z.string().email("Valid email is required"),
  validDays: z.number().int().positive("Must be a positive number"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PartQuotationFormProps {
  items: (PartOrderItem & { part: Part })[];
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  onRemoveItem: (partId: string) => void;
  isSubmitting: boolean;
}

export function PartQuotationForm({ 
  items, 
  onSubmit, 
  onCancel,
  onRemoveItem,
  isSubmitting 
}: PartQuotationFormProps) {
  const [subtotalWithTax, setSubtotalWithTax] = useState<number>(0);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      validDays: 7,
      notes: "",
    },
  });

  // Calculate totals
  const subtotal = items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0);
  
  const coreChargesTotal = items.reduce((sum, item) => 
    sum + ((item.core_charge || 0) * item.quantity), 0);
    
  const taxRate = 0.07; // 7% tax rate
  const salesTax = subtotal * taxRate;
  const total = subtotal + coreChargesTotal + salesTax;
  
  const handleSubmit = (data: FormValues) => {
    if (items.length === 0) {
      toast({
        title: "No items in quotation",
        description: "Please add at least one item to the quotation",
        variant: "destructive"
      });
      return;
    }
    
    onSubmit({
      ...data,
      validDays: Number(data.validDays)
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter customer name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="customerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Email</FormLabel>
                <FormControl>
                  <Input placeholder="customer@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Quotation Items</h3>
          
          {items.length === 0 ? (
            <div className="text-center py-8 border rounded-md border-dashed">
              <p className="text-muted-foreground">No items in quotation</p>
              <p className="text-sm text-muted-foreground mt-1">Add items from the parts catalog</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted text-xs">
                  <tr>
                    <th className="text-left p-2">Part</th>
                    <th className="text-center p-2">Qty</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-right p-2">Core</th>
                    <th className="text-right p-2">Total</th>
                    <th className="w-8 p-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => {
                    const itemTotal = item.price * item.quantity;
                    const coreCharge = (item.core_charge || 0) * item.quantity;
                    return (
                      <tr key={item.part_id} className="text-sm">
                        <td className="p-2">
                          <div>{item.part.name}</div>
                          <div className="text-xs text-muted-foreground">{item.part.sku}</div>
                        </td>
                        <td className="text-center p-2">{item.quantity}</td>
                        <td className="text-right p-2">${item.price.toFixed(2)}</td>
                        <td className="text-right p-2">
                          {item.core_charge ? `$${item.core_charge.toFixed(2)}` : "—"}
                        </td>
                        <td className="text-right p-2 font-medium">
                          ${(itemTotal + coreCharge).toFixed(2)}
                        </td>
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onRemoveItem(item.part_id)}
                            type="button"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-4 flex flex-col gap-2 items-end text-sm">
            <div className="flex w-48 justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex w-48 justify-between">
              <span>Core Charges:</span>
              <span>${coreChargesTotal.toFixed(2)}</span>
            </div>
            <div className="flex w-48 justify-between">
              <span>Tax ({(taxRate * 100).toFixed(0)}%):</span>
              <span>${salesTax.toFixed(2)}</span>
            </div>
            <div className="flex w-48 justify-between font-medium border-t pt-1">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="validDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid For (Days)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    max="30" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 7)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional notes or terms for this quotation" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || items.length === 0}>
            {isSubmitting ? "Generating..." : "Generate Quotation"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

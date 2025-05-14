
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpecialOrderFormData } from '@/hooks/parts/useSpecialOrder';

const formSchema = z.object({
  partName: z.string().min(2, "Part name is required"),
  description: z.string().min(10, "Please provide a detailed description"),
  manufacturer: z.string().optional(),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  customerNotes: z.string().optional(),
  urgency: z.enum(["normal", "rush", "emergency"]),
  targetPrice: z.number().optional(),
});

interface SpecialOrderFormProps {
  onSubmit: (data: SpecialOrderFormData) => void;
  isSubmitting: boolean;
}

export function SpecialOrderForm({ onSubmit, isSubmitting }: SpecialOrderFormProps) {
  const form = useForm<SpecialOrderFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partName: "",
      description: "",
      manufacturer: "",
      quantity: 1,
      customerNotes: "",
      urgency: "normal",
      targetPrice: undefined,
    },
  });

  const handleSubmit = (data: SpecialOrderFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="partName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Part Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter part name or number" {...field} />
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
                  placeholder="Please describe the part in detail (size, specifications, etc.)" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manufacturer (if known)</FormLabel>
                <FormControl>
                  <Input placeholder="Manufacturer name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="urgency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Urgency</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="rush">Rush</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Price (optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    placeholder="$ Amount" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="customerNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional information that might help us find the right part" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Submitting..." : "Request Special Order"}
        </Button>
      </form>
    </Form>
  );
}
